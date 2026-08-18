<?php
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

function fm($a) { return $a ? number_format($a, 0, ',', ' ') . ' ₽' : '—'; }
function fb($b, $k) { foreach ($b as $i) if ($i['agregator'] === $k) return (float)($i['balance'] ?? 0); return 0; }
function getTN($c) {
    $f = __DIR__ . '/../../cache/tatneft_' . $c . '.json';
    if (file_exists($f)) { $d = json_decode(file_get_contents($f), true); return $d['current']['balance'] ?? null; }
    return null;
}

$b = getBenzigoBalances();
$msg = "Балансы на " . date('H:i') . "\n";
$msg .= "Роснефть Монблан: " . fm(fb($b, 'РН')) . "\n";
$msg .= "Роснефть Фаэтон: " . fm(fb($b, 'РН ( Фаэтон )')) . "\n";
$msg .= "Лукойл Монблан: " . fm(fb($b, 'Лукойл')) . "\n";
$msg .= "Лукойл Фаэтон: " . fm(fb($b, 'Лукойл ( Фаэтон )')) . "\n";
$msg .= "Natcar Монблан: " . fm(fb($b, '1')) . "\n";
$msg .= "Natcar Фаэтон: " . fm(fb($b, '1 ( Фаэтон )')) . "\n";
$msg .= "ППР Монблан: " . fm(fb($b, 'Мультикарта')) . "\n";
$msg .= "ППР Фаэтон: " . fm(fb($b, 'Мультикарта ( Фаэтон )')) . "\n";
$msg .= "Татнефть Монблан: " . fm(getTN('montblanc')) . "\n";
$msg .= "Татнефть Фаэтон: " . fm(getTN('faeton'));

$data = [
    'notification_name' => 'Балансы',
    'virtual_phone_number' => '100',
    'notification_time' => date('Y-m-d H:i:s'),
    'contact_phone_number' => '200',
    'direction' => 'out',
    'sms_id' => 'balance' . time(),
    'message' => $msg
];

$ch = curl_init('https://com.adr-group.ru/api_sms/hs/api/v1/receive_sms');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$r = curl_exec($ch);
curl_close($ch);

echo $r;