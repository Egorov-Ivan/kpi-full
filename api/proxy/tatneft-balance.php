<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$ftpConfig = [
    'montblanc' => [
        'server'   => 'ftp.benzigo.ru',
        'username' => 'benzigo_robot',
        'password' => 'rI8jS6kE3h',
        'work'     => '/prod/inbound',
        'outbound' => '/prod/outbound',
        'archive'  => '/prod/outbound/archive',
        'error'    => '/prod/outbound/error',
    ],
    'faeton' => [
        'server'   => 'ftp.benzigo.ru',
        'username' => 'tatneft_faeton',
        'password' => 'fV7hU3iY9m',
        'work'     => '/inbound',
        'outbound' => '/outbound',
        'archive'  => '/outbound/archive',
        'error'    => '/outbound/error',
    ]
];

$cacheDir = __DIR__ . '/../../cache';
if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

function getCache($client) {
    global $cacheDir;
    $file = "$cacheDir/tatneft_$client.json";
    return file_exists($file) ? json_decode(file_get_contents($file), true) : ['current' => null, 'history' => []];
}

function setCache($client, $data) {
    global $cacheDir;
    $file = "$cacheDir/tatneft_$client.json";
    $cache = getCache($client);
    $snapshot = ['balance' => $data['balance'], 'forecast' => $data['forecast'], 'received_at' => date('c')];
    $cache['current'] = $snapshot;
    $cache['history'][] = $snapshot;
    $cache['history'] = array_values(array_filter($cache['history'], fn($e) => strtotime($e['received_at']) >= time() - 86400));
    file_put_contents($file, json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function updateBalance($client, $config) {
    $conn = @ftp_connect($config['server'], 21, 10);
    if (!$conn || !@ftp_login($conn, $config['username'], $config['password'])) return ['error' => 'FTP failed'];
    ftp_pasv($conn, true);

    $task = time();
    $date = date('Y-m-d');
    $filename = "IN_{$task}_{$date}.xml";
    $xml = '<card_task><card_number>NONE</card_number><task_type>GET_BALANCE</task_type></card_task>';
    $tmpFile = tempnam(sys_get_temp_dir(), 'tn_');
    file_put_contents($tmpFile, $xml);
    if (!@ftp_put($conn, $config['work'] . '/' . $filename, $tmpFile, FTP_ASCII)) { unlink($tmpFile); ftp_close($conn); return ['error' => 'Upload failed']; }
    unlink($tmpFile);

    $pattern = "OUT_{$task}_{$date}_balance.xml";
    $start = time();
    while ((time() - $start) < 120) {
        $files = @ftp_nlist($conn, $config['outbound']);
        if ($files) foreach ($files as $f) if (basename($f) === $pattern) {
            $tmp = tempnam(sys_get_temp_dir(), 'tnr_');
            if (@ftp_get($conn, $tmp, $config['outbound'] . '/' . basename($f), FTP_ASCII)) {
                $xml = simplexml_load_string(file_get_contents($tmp)); unlink($tmp);
                if ($xml) {
                    $bal = (float)$xml->balance; $fc = (string)$xml->end_of_funds_forecast;
                    @ftp_rename($conn, $config['outbound'] . '/' . basename($f), $config['archive'] . '/' . basename($f));
                    ftp_close($conn);
                    setCache($client, ['balance' => $bal, 'forecast' => $fc]);
                    return ['status' => 'done', 'balance' => $bal, 'forecast' => $fc];
                }
                @ftp_rename($conn, $config['outbound'] . '/' . basename($f), $config['error'] . '/' . basename($f));
            }
            ftp_close($conn);
            return ['error' => 'Parse failed'];
        }
        sleep(3);
    }
    ftp_close($conn);
    return ['error' => 'Timeout'];
}

$action = $_GET['action'] ?? 'cached';

if ($action === 'cron') {
    $res = [];
    foreach (['montblanc', 'faeton'] as $c) $res[$c] = updateBalance($c, $ftpConfig[$c]);
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
} else {
    $res = [];
    foreach (['montblanc', 'faeton'] as $c) $res[$c] = getCache($c);
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
}