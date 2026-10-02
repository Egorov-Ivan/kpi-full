<?php
// api/proxy/expenses.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =========================================================
   ВХОДНЫЕ ПАРАМЕТРЫ
   ========================================================= */

$supplier = $_GET['supplier'] ?? null;

if (!$supplier) {
    http_response_code(400);
    echo json_encode(['error' => 'Параметр supplier обязателен'], JSON_UNESCAPED_UNICODE);
    exit;
}

$dateStart = $_GET['dateStart'] ?? date('d-m-Y', strtotime('-30 days'));
$dateEnd   = $_GET['dateEnd'] ?? null;
$field     = $_GET['field'] ?? 'sumPos';
$token     = '166505488e486efa91e411cb05f7886a';

/* =========================================================
   КЭШ
   ========================================================= */

$cacheDir  = __DIR__ . '/../../../cache';
$cacheTtl  = 60;                                  // сек
$noCache   = !empty($_GET['nocache']);

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0775, true);
}

// Ключ кэша зависит от всех параметров запроса
$cacheKey  = md5($supplier . '|' . $dateStart . '|' . ($dateEnd ?? '') . '|' . $field);
$cacheFile = $cacheDir . '/expenses-' . $cacheKey . '.json';

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
   ЗАПРОС К ВНЕШНЕМУ API
   ========================================================= */

$postBody = ['dateStart' => $dateStart];

$ch = curl_init('https://api.benzigo.ru/transactions/listADR/');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postBody));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'accessToken: ' . $token,
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$response = curl_exec($ch);
$err      = curl_error($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'error'   => 'upstream_failed',
        'message' => $err,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response;
    exit;
}

$data         = json_decode($response, true);
$transactions = $data['transactions'] ?? [];

/* =========================================================
   ФИЛЬТРАЦИЯ ПО SUPPLIER (если не all)
   ========================================================= */

if ($supplier !== 'all') {
    $transactions = array_filter($transactions, function ($tx) use ($supplier) {
        if (!is_array($tx)) return false;
        return ($tx['agregator'] ?? '') === $supplier;
    });
}

/* =========================================================
   ФИЛЬТРАЦИЯ ПО ДАТЕ ОКОНЧАНИЯ
   ========================================================= */

if ($dateEnd) {
    $endParts = explode('-', $dateEnd);
    $endDate  = $endParts[2] . '-' . $endParts[1] . '-' . $endParts[0];

    $transactions = array_filter($transactions, function ($tx) use ($endDate) {
        if (!is_array($tx)) return false;
        $txDate = substr($tx['date'] ?? '', 0, 10);
        return $txDate <= $endDate;
    });
}

/* =========================================================
   ГРУППИРОВКА ПО ДНЯМ (общая)
   ========================================================= */

$dailyValues = [];
$totalValue  = 0;
$lastDate    = null;

foreach ($transactions as $tx) {
    if (!is_array($tx)) continue;

    $date  = substr($tx['date'] ?? '', 0, 10);
    $value = floatval($tx[$field] ?? 0);

    if (!isset($dailyValues[$date])) {
        $dailyValues[$date] = 0;
    }
    $dailyValues[$date] += $value;
    $totalValue += $value;

    if (!$lastDate || ($tx['date'] ?? '') > $lastDate) {
        $lastDate = $tx['date'];
    }
}

ksort($dailyValues);

$chartData = [];
foreach ($dailyValues as $date => $value) {
    $chartData[] = [$date, round($value, 2)];
}

/* =========================================================
   ГРУППИРОВКА ПО АГРЕГАТОРАМ (breakdown)
   ---------------------------------------------------------
   Ключ — значение agregator из внешнего API,
   например "Мультикарта", "Мультикарта ( Фаэтон )", "Лукойл"...
   ========================================================= */

$byAgregator = [];

foreach ($transactions as $tx) {
    if (!is_array($tx)) continue;

    $agregator = $tx['agregator'] ?? null;
    if ($agregator === null || $agregator === '') continue;

    $date  = substr($tx['date'] ?? '', 0, 10);
    $value = floatval($tx[$field] ?? 0);

    if (!isset($byAgregator[$agregator])) {
        $byAgregator[$agregator] = [
            'total' => 0.0,
            'daily' => [],
        ];
    }

    $byAgregator[$agregator]['total'] += $value;

    if (!isset($byAgregator[$agregator]['daily'][$date])) {
        $byAgregator[$agregator]['daily'][$date] = 0.0;
    }
    $byAgregator[$agregator]['daily'][$date] += $value;
}

$breakdown = [];
foreach ($byAgregator as $agregator => $info) {
    ksort($info['daily']);

    $chart = [];
    foreach ($info['daily'] as $date => $value) {
        $chart[] = [$date, round($value, 2)];
    }

    $breakdown[$agregator] = [
        'total'     => round($info['total'], 2),
        'chartData' => $chart,
    ];
}

/* =========================================================
   ОТВЕТ
   ========================================================= */

$result = [
    'supplier'    => $supplier,
    'field'       => $field,
    'totalValue'  => round($totalValue, 2),
    'lastUpdated' => $lastDate,
    'count'       => count($transactions),
    'chartData'   => $chartData,
    'breakdown'   => $breakdown,   // ← новое поле
];

$payload = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Кэшируем только успешный ответ
@file_put_contents($cacheFile, $payload, LOCK_EX);

header('X-Cache: MISS');
http_response_code(200);
echo $payload;