<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==================== КОНФИГУРАЦИЯ FTP ====================
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

// ==================== КЭШ С ИСТОРИЕЙ ====================
$cacheDir = __DIR__ . '/../../cache';
if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

function getCache($client) {
    global $cacheDir;
    $file = "$cacheDir/tatneft_$client.json";
    if (file_exists($file)) {
        return json_decode(file_get_contents($file), true);
    }
    return ['current' => null, 'history' => []];
}

function setCache($client, $data) {
    global $cacheDir;
    $file = "$cacheDir/tatneft_$client.json";
    
    $cache = getCache($client);
    
    // Новый снапшот
    $snapshot = [
        'balance'     => $data['balance'],
        'forecast'    => $data['forecast'],
        'received_at' => date('c')
    ];
    
    // Обновляем текущий
    $cache['current'] = $snapshot;
    
    // Добавляем в историю
    $cache['history'][] = $snapshot;
    
    // Оставляем только записи за последние 24 часа
    $cutoff = time() - 86400;
    $cache['history'] = array_filter($cache['history'], function($entry) use ($cutoff) {
        return strtotime($entry['received_at']) >= $cutoff;
    });
    
    // Переиндексируем массив
    $cache['history'] = array_values($cache['history']);
    
    file_put_contents($file, json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

// ==================== РАБОТА С FTP ====================
function ftpConnect($config) {
    $conn = @ftp_connect($config['server'], 21, 10);
    if (!$conn) return ['error' => 'FTP connection failed'];
    if (!@ftp_login($conn, $config['username'], $config['password'])) {
        ftp_close($conn);
        return ['error' => 'FTP login failed'];
    }
    ftp_pasv($conn, true);
    return $conn;
}

function placeRequest($conn, $config) {
    $timestamp = time();
    $date = date('Y-m-d');
    $filename = "IN_{$timestamp}_{$date}.xml";

    $xml = '<card_task>
  <card_number>NONE</card_number>
  <task_type>GET_BALANCE</task_type>
</card_task>';

    $tmpFile = tempnam(sys_get_temp_dir(), 'tatneft_');
    file_put_contents($tmpFile, $xml);

    $result = @ftp_put($conn, $config['work'] . '/' . $filename, $tmpFile, FTP_ASCII);
    unlink($tmpFile);

    if (!$result) return ['error' => 'Failed to upload request file'];

    return [
        'status'   => 'pending',
        'task'     => $timestamp,
        'filename' => $filename
    ];
}

function waitForResponse($conn, $config, $task, $timeout = 120) {
    $date = date('Y-m-d');
    $pattern = "OUT_{$task}_{$date}_balance.xml";
    $startTime = time();

    while ((time() - $startTime) < $timeout) {
        $files = @ftp_nlist($conn, $config['outbound']);
        if ($files === false) {
            sleep(3);
            continue;
        }

        foreach ($files as $file) {
            $basename = basename($file);
            if ($basename === $pattern) {
                $tmpFile = tempnam(sys_get_temp_dir(), 'tatneft_resp_');
                if (!@ftp_get($conn, $tmpFile, $config['outbound'] . '/' . $basename, FTP_ASCII)) {
                    unlink($tmpFile);
                    return ['status' => 'error', 'error' => 'Failed to download response'];
                }

                $xmlContent = file_get_contents($tmpFile);
                unlink($tmpFile);

                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($xmlContent);
                if ($xml === false) {
                    @ftp_rename($conn, $config['outbound'] . '/' . $basename, $config['error'] . '/' . $basename);
                    return ['status' => 'error', 'error' => 'Failed to parse XML'];
                }

                $balance = (float) $xml->balance;
                $forecast = (string) $xml->end_of_funds_forecast;

                @ftp_rename($conn, $config['outbound'] . '/' . $basename, $config['archive'] . '/' . $basename);

                return [
                    'status'   => 'done',
                    'balance'  => $balance,
                    'forecast' => $forecast
                ];
            }
        }

        sleep(3);
    }

    return ['status' => 'timeout', 'error' => 'Response not received within timeout'];
}

function updateBalance($client, $config) {
    $conn = ftpConnect($config);
    if (is_array($conn) && isset($conn['error'])) return $conn;

    $request = placeRequest($conn, $config);
    if (isset($request['error'])) {
        ftp_close($conn);
        return $request;
    }

    $result = waitForResponse($conn, $config, $request['task'], 120);
    ftp_close($conn);

    if ($result['status'] === 'done') {
        setCache($client, [
            'balance'  => $result['balance'],
            'forecast' => $result['forecast']
        ]);
    }

    return $result;
}

// ==================== ОБРАБОТКА ЗАПРОСОВ ====================
$action = $_GET['action'] ?? 'cached';

if ($action === 'cron') {
    $results = [];
    foreach (['montblanc', 'faeton'] as $client) {
        $results[$client] = updateBalance($client, $ftpConfig[$client]);
    }
    echo json_encode($results, JSON_UNESCAPED_UNICODE);

} elseif ($action === 'cached') {
    $response = [];
    foreach (['montblanc', 'faeton'] as $client) {
        $cache = getCache($client);
        $response[$client] = $cache ?: ['current' => null, 'history' => []];
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
}