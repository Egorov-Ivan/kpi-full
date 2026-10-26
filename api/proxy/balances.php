<?php
// api/proxy/balances.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$token = '166505488e486efa91e411cb05f7886a';

$ch = curl_init('https://api.benzigo.ru/agregators/balance/');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'accessToken: ' . $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// ── Таймауты ──
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);  // на подключение
curl_setopt($ch, CURLOPT_TIMEOUT, 5);         // на весь запрос

$response = curl_exec($ch);

// ── Обработка таймаута / сетевой ошибки ──
if ($response === false) {
    $err = curl_errno($ch);
    curl_close($ch);

    if ($err === CURLE_OPERATION_TIMEDOUT) {
        http_response_code(504); // Gateway Timeout
        echo json_encode(['error' => 'Upstream timeout'], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(502); // Bad Gateway
        echo json_encode(['error' => 'Upstream connection error'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response;
    exit;
}

$data = json_decode($response, true);
$balances = $data['balances'] ?? $data;

$result = [
    'updated_at' => date('c'),
    'balances'   => $balances
];

http_response_code(200);
echo json_encode($result, JSON_UNESCAPED_UNICODE);