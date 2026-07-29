<?php
header('Content-Type: application/json; charset=utf-8');

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

// ==================== КОНФИГУРАЦИЯ ====================
$botToken = getenv('TELEGRAM_BOT_TOKEN');
$benzigToken = '166505488e486efa91e411cb05f7886a';

// ==================== ФУНКЦИИ ====================
function sendMessage($chatId, $text) {
    global $botToken;
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    
    $data = [
        'chat_id'    => $chatId,
        'text'       => $text,
        'parse_mode' => 'Markdown'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

function formatMoney($amount) {
    if ($amount === null || $amount === 0) return '—';
    return number_format($amount, 2, ',', ' ') . ' ₽';
}

function getBenzigoBalances() {
    global $benzigToken;
    
    $ch = curl_init('https://api.benzigo.ru/agregators/balance/');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'accessToken: ' . $benzigToken
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) return [];
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