<?php
// api/proxy/replenishments.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =========================================================
   НАСТРОЙКИ
   ========================================================= */

$spreadsheetId = '1h0TjIdFyMZlBjEmVKDaqbbd1e6LwwLuBRKqpHIkAW1c';           // ID Google-таблицы из URL
$sheetName     = 'Топливо';       // имя вкладки внизу таблицы
$headerRows    = 1;               // «Внешний получатель | Остаток к Оплате»

// Путь к ключу сервисного аккаунта (вне public — защищён .htaccess)
$credsPath = __DIR__ . '/../../../secrets/service_account.json';

// Кэш в корне проекта
$cacheDir       = __DIR__ . '/../../../cache';
$cacheFile      = $cacheDir . '/replenishments.json';
$tokenCacheFile = $cacheDir . '/google_token.json';
$cacheTtl       = 60;             // сек

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0775, true);
}

/* =========================================================
   КЭШ ОТВЕТА
   ========================================================= */

$noCache = !empty($_GET['nocache']);
if (
    !$noCache &&
    is_file($cacheFile) &&
    (time() - filemtime($cacheFile)) < $cacheTtl
) {
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

/* =========================================================
   JWT → ACCESS TOKEN (с кэшем токена)
   ========================================================= */

function getAccessToken(string $credsPath, string $tokenCacheFile): string
{
    $scope = 'https://www.googleapis.com/auth/spreadsheets.readonly';

    // Проверяем кэш токена
    if (is_file($tokenCacheFile)) {
        $cached = json_decode((string)@file_get_contents($tokenCacheFile), true);
        if (
            is_array($cached) &&
            ($cached['expires_at'] ?? 0) > time() + 60 &&
            ($cached['scope'] ?? '') === $scope
        ) {
            return (string)$cached['access_token'];
        }
    }

    if (!is_file($credsPath)) {
        throw new RuntimeException("Файл ключа не найден: $credsPath");
    }

    $creds = json_decode((string)file_get_contents($credsPath), true);
    if (!is_array($creds) || empty($creds['client_email']) || empty($creds['private_key'])) {
        throw new RuntimeException('service_account.json не парсится или пустой');
    }

    $privateKey = str_replace('\\n', "\n", $creds['private_key']);

    $now    = time();
    $b64url = static fn(string $data): string =>
        rtrim(strtr(base64_encode($data), '+/', '-_'), '=');

    $header = ['alg' => 'RS256', 'typ' => 'JWT'];
    $claims = [
        'iss'   => $creds['client_email'],
        'scope' => $scope,
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ];

    $signingInput = $b64url(json_encode($header, JSON_UNESCAPED_SLASHES))
                  . '.' . $b64url(json_encode($claims, JSON_UNESCAPED_SLASHES));

    $signature = '';
    if (!openssl_sign($signingInput, $signature, $privateKey, 'SHA256')) {
        throw new RuntimeException('openssl_sign: ' . openssl_error_string());
    }

    $jwt = $signingInput . '.' . $b64url($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt,
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($resp === false) {
        throw new RuntimeException("curl (token): $err");
    }
    if ($code !== 200) {
        throw new RuntimeException("token endpoint HTTP $code: $resp");
    }

    $data = json_decode((string)$resp, true);
    if (!is_array($data) || empty($data['access_token'])) {
        throw new RuntimeException('token endpoint: пустой ответ');
    }

    @file_put_contents($tokenCacheFile, json_encode([
        'access_token' => $data['access_token'],
        'expires_at'   => time() + (int)($data['expires_in'] ?? 3600),
        'scope'        => $scope,
    ]), LOCK_EX);

    return (string)$data['access_token'];
}

/* =========================================================
   ПАРСЕРЫ
   ========================================================= */

/**
 * "600 000,00 ₽" → 600000.0
 */
function parseAmount($raw): ?float
{
    if ($raw === null || $raw === '') return null;

    $s = (string)$raw;
    $s = str_replace(["\xC2\xA0", ' '], '', $s);          // nbsp + пробел
    $s = str_replace(['₽', 'руб', 'RUB', 'rub'], '', $s);
    $s = str_replace(',', '.', $s);
    $s = preg_replace('/[^0-9.\-]/', '', $s) ?? '';

    if ($s === '' || $s === '-' || $s === '.') return null;

    return (float)$s;
}

/**
 * Карта префиксов отображаемого имени → supplier.key.
 * Должна совпадать с frontend: suppliers[].label / labels.
 */
function getSupplierKeyMap(): array
{
    return [
        'ППР'      => 'Мультикарта',
        'Лукойл'   => 'Лукойл',
        'Роснефть' => 'РН',
        'Татнефть' => 'ТН',
        'Natcar'   => '1',
    ];
}

/**
 * Карта суффиксов → client.id.
 */
function getClientIdMap(): array
{
    return [
        'Монблан' => 'montblanc',
        'Фаэтон'  => 'faeton',
        'АС'      => 'as',
    ];
}

/**
 * "Natcar Монблан" → ['1', 'montblanc'] или null, если не распознали.
 */
function parsePairName(string $name): ?array
{
    $name = trim($name);
    if ($name === '') return null;

    // Убираем возможные хвостовые скобки типа " ( Фаэтон )"
    $name = preg_replace('/\s*\(.*?\)\s*$/u', '', $name);

    $clientMap   = getClientIdMap();
    $supplierMap = getSupplierKeyMap();

    // Ищем самый длинный суффикс клиента
    $clientId     = null;
    $clientSuffix = '';
    foreach ($clientMap as $suffix => $id) {
        $suffixLen = mb_strlen($suffix);
        if (
            mb_substr($name, -$suffixLen) === $suffix &&
            $suffixLen > mb_strlen($clientSuffix)
        ) {
            $clientSuffix = $suffix;
            $clientId     = $id;
        }
    }
    if ($clientId === null) return null;

    // Отрезаем суффикс → префикс поставщика
    $prefix = trim(mb_substr($name, 0, mb_strlen($name) - mb_strlen($clientSuffix)));
    if ($prefix === '') return null;

    if (isset($supplierMap[$prefix])) {
        return [$supplierMap[$prefix], $clientId];
    }

    // Незнакомый префикс — вернём как есть, попадёт в ответ как есть
    return [$prefix, $clientId];
}

/* =========================================================
   ОСНОВНАЯ ЛОГИКА
   ========================================================= */

try {
    $token = getAccessToken($credsPath, $tokenCacheFile);

    // Читаем G:H, начиная со строки после заголовка
    $range = $sheetName . '!G' . ($headerRows + 1) . ':H';
    $url   = sprintf(
        'https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s?majorDimension=ROWS',
        rawurlencode($spreadsheetId),
        rawurlencode($range)
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($resp === false) {
        throw new RuntimeException("curl (sheets): $err");
    }
    if ($code !== 200) {
        throw new RuntimeException("sheets endpoint HTTP $code: $resp");
    }

    $data = json_decode((string)$resp, true);
    $rows = $data['values'] ?? [];

    $aggregated = [];
    $rowErrors  = [];

    foreach ($rows as $i => $row) {
        $rowNumber = $headerRows + 1 + $i;

        $rawPairName = $row[0] ?? null;   // G — «Natcar Монблан»
        $rawAmount   = $row[1] ?? null;   // H — «600 000,00 ₽»

        // Пустая строка — пропускаем
        if (
            ($rawPairName === null || $rawPairName === '') &&
            ($rawAmount   === null || $rawAmount   === '')
        ) {
            continue;
        }

        $amount = parseAmount($rawAmount);
        $parsed = parsePairName((string)$rawPairName);

        if ($parsed === null || $amount === null) {
            $rowErrors[] = [
                'row'    => $rowNumber,
                'name'   => $rawPairName,
                'amount' => $rawAmount,
                'reason' => $parsed === null
                    ? 'unknown_pair_name'
                    : 'invalid_amount',
            ];
            continue;
        }

        [$supplier, $client] = $parsed;
        $pairKey = $supplier . '::' . $client;

        if (!isset($aggregated[$pairKey])) {
            $aggregated[$pairKey] = [
                'pairKey'     => $pairKey,
                'supplierKey' => $supplier,
                'clientId'    => $client,
                'total'       => 0.0,
                'updatedAt'   => null,   // даты в G:H нет
                'entries'     => [],     // история не собирается
            ];
        }

        $aggregated[$pairKey]['total'] += $amount;
    }

    // Округление до копеек
    foreach ($aggregated as &$item) {
        $item['total'] = round($item['total'], 2);
    }
    unset($item);

    $result = [
        'updated_at' => date('c'),
        'items'      => array_values($aggregated),
        'errors'     => $rowErrors,
    ];

    $payload = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Кэшируем только «чистый» успешный ответ
    @file_put_contents($cacheFile, $payload, LOCK_EX);

    header('X-Cache: MISS');
    echo $payload;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'replenishments_failed',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}