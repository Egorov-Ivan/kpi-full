<?php
header('Content-Type: application/json; charset=utf-8');

// ==================== НАСТРОЙКА ПРОКСИ ====================
// ВСТАВЬТЕ СВОИ ДАННЫЕ ПРОКСИ СЮДА:
$proxyHost = '82.146.55.167';
$proxyPort = 31267;
$proxyUser = '';      // Если без логина - оставьте ''
$proxyPass = '';      // Если без пароля - оставьте ''
$proxyType = 'http';  // 'http' или 'socks5' (НЕ 'https'!)

// Собираем URL прокси (без авторизации в URL, так правильнее для cURL)
$proxyUrl = $proxyHost . ':' . $proxyPort;

// ==================== КОНФИГУРАЦИЯ ====================
$botToken ='8541381384:AAHWdSH5kiGB3fxXjTftAL-14o38Pu4kfrU';
$benzigToken = '166505488e486efa91e411cb05f7886a';

// ==================== ФУНКЦИИ ====================

// Функция для создания сессии cURL с прокси
function getCurlWithProxy($url) {
    global $proxyHost, $proxyPort, $proxyUser, $proxyPass, $proxyType, $proxyUrl;
    
    $ch = curl_init($url);
    
    // Настройка прокси
    if (!empty($proxyHost) && !empty($proxyPort)) {
        curl_setopt($ch, CURLOPT_PROXY, $proxyUrl);
        
        // Тип прокси
        if ($proxyType === 'socks5') {
            curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5);
        } else {
            curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
        }
        
        // Если есть логин/пароль
        if (!empty($proxyUser) && !empty($proxyPass)) {
            curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxyUser . ':' . $proxyPass);
        }
    }
    
    return $ch;
}

function sendMessage($chatId, $text) {
    global $botToken;
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    
    $data = [
        'chat_id'    => $chatId,
        'text'       => $text,
        'parse_mode' => 'Markdown'
    ];
    
    $ch = getCurlWithProxy($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Логирование ошибок
    if ($error) {
        error_log("cURL ошибка при отправке в Telegram: " . $error);
    }
    if ($httpCode !== 200) {
        error_log("Telegram вернул код: " . $httpCode . " Ответ: " . $response);
    }
    
    return $response;
}

function formatMoney($amount) {
    if ($amount === null || $amount === 0) return '—';
    return number_format($amount, 2, ',', ' ') . ' ₽';
}

function getBenzigoBalances() {
    global $benzigToken;
    
    $ch = getCurlWithProxy('https://api.benzigo.ru/agregators/balance/');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'accessToken: ' . $benzigToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Benzigo API ошибка. Код: " . $httpCode);
        return [];
    }
    return json_decode($response, true) ?: [];
}

function findBalance($balances, $key) {
    foreach ($balances as $item) {
        if ($item['agregator'] === $key) {
            return (float) ($item['balance'] ?? 0);
        }
    }
    return 0;
}

function getTatneftBalance($client) {
    $cacheFile = __DIR__ . '/../cache/tatneft_' . $client . '.json';
    if (file_exists($cacheFile)) {
        $cache = json_decode(file_get_contents($cacheFile), true);
        return $cache['current']['balance'] ?? null;
    }
    return null;
}

// ==================== ОБРАБОТКА ВХОДЯЩЕГО ЗАПРОСА ====================

// Читаем входящий запрос от Telegram
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['message']['text'])) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

$message = $input['message'];
$text = $message['text'] ?? '';
$chatId = $message['chat']['id'] ?? null;

if (!$chatId || !str_starts_with($text, '/start')) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

// ==================== СБОР ДАННЫХ ====================
$time = date('H:i');

// Все поставщики из Benzigo API
$balances = getBenzigoBalances();

// Роснефть
$rnFaeton = findBalance($balances, 'РН ( Фаэтон )');
$rnMonblan = findBalance($balances, 'РН');
$rnMsg = "*Роснефть*\n" .
         "Фаэтон: " . formatMoney($rnFaeton) . "\n" .
         "Монблан: " . formatMoney($rnMonblan);

// Лукойл
$lukoilFaeton = findBalance($balances, 'Лукойл ( Фаэтон )');
$lukoilMonblan = findBalance($balances, 'Лукойл');
$lukoilMsg = "*Лукойл*\n" .
             "Фаэтон: " . formatMoney($lukoilFaeton) . "\n" .
             "Монблан: " . formatMoney($lukoilMonblan);

// Natcar
$natcarFaeton = findBalance($balances, '1 ( Фаэтон )');
$natcarMonblan = findBalance($balances, '1');
$natcarMsg = "*Natcar*\n" .
             "Фаэтон: " . formatMoney($natcarFaeton) . "\n" .
             "Монблан: " . formatMoney($natcarMonblan);

// ППР (Мультикарта)
$pprFaeton = findBalance($balances, 'Мультикарта ( Фаэтон )');
$pprMonblan = findBalance($balances, 'Мультикарта');
$pprMsg = "*ППР*\n" .
          "Фаэтон: " . formatMoney($pprFaeton) . "\n" .
          "Монблан: " . formatMoney($pprMonblan);

// Татнефть (из кэша)
$tnFaeton = getTatneftBalance('faeton');
$tnMonblan = getTatneftBalance('montblanc');
$tnMsg = "*Татнефть*\n" .
         "Фаэтон: " . formatMoney($tnFaeton) . "\n" .
         "Монблан: " . formatMoney($tnMonblan);

// ==================== ОТПРАВКА ====================
$msg = "💰 *Балансы на {$time}*\n\n" .
       "{$rnMsg}\n\n" .
       "{$lukoilMsg}\n\n" .
       "{$tnMsg}\n\n" .
       "{$natcarMsg}\n\n" .
       "{$pprMsg}";

sendMessage($chatId, $msg);

http_response_code(200);
echo json_encode(['success' => true]);