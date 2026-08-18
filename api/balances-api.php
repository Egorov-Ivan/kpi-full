<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$benzigToken = '166505488e486efa91e411cb05f7886a';

function getBenzigoBalances() {
    global $benzigToken;
    $ch = curl_init('https://api.benzigo.ru/agregators/balance/');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'accessToken: ' . $benzigToken]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $r = curl_exec($ch); curl_close($ch);
    $d = json_decode($r, true);
    return $d['balances'] ?? [];
}

function findBalance($b, $k) { foreach ($b as $i) if ($i['agregator'] === $k) return (float)($i['balance'] ?? 0); return 0; }

function getTatneftBalance($c) {
    $f = __DIR__ . '/../../cache/tatneft_' . $c . '.json';
    if (file_exists($f)) { $d = json_decode(file_get_contents($f), true); return $d['current']['balance'] ?? null; }
    return null;
}

$balances = getBenzigoBalances();

echo json_encode([
    'time' => date('H:i'),
    'balances' => [
        'Роснефть' => ['montblanc' => findBalance($balances, 'РН'), 'faeton' => findBalance($balances, 'РН ( Фаэтон )')],
        'Лукойл'   => ['montblanc' => findBalance($balances, 'Лукойл'), 'faeton' => findBalance($balances, 'Лукойл ( Фаэтон )')],
        'Natcar'   => ['montblanc' => findBalance($balances, '1'), 'faeton' => findBalance($balances, '1 ( Фаэтон )')],
        'ППР'      => ['montblanc' => findBalance($balances, 'Мультикарта'), 'faeton' => findBalance($balances, 'Мультикарта ( Фаэтон )')],
        'Татнефть' => ['montblanc' => getTatneftBalance('montblanc'), 'faeton' => getTatneftBalance('faeton')],
    ]
], JSON_UNESCAPED_UNICODE);