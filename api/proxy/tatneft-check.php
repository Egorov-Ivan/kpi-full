<?php
// Для запуска из командной строки: php tatneft-check.php montblanc
$client = $argv[1] ?? $_GET['client'] ?? null;

if (!$client) {
    echo json_encode(['error' => 'Client is required']);
    exit(1);
}

// ==================== КОНФИГУРАЦИЯ FTP ====================
$ftpConfig = [
    'montblanc' => [
        'server'   => 'ftp.benzigo.ru',
        'username' => 'benzigo_robot',
        'password' => 'rI8jS6kE3h',
        'outbound' => '/prod/outbound',
        'archive'  => '/prod/outbound/archive',
        'error'    => '/prod/outbound/error'
    ],
    'faeton' => [
        'server'   => 'ftp.benzigo.ru',
        'username' => 'tatneft_faeton',
        'password' => 'fV7hU3iY9m',
        'outbound' => '/outbound',
        'archive'  => '/outbound/archive',
        'error'    => '/outbound/error'
    ]
];

if (!isset($ftpConfig[$client])) {
    echo json_encode(['error' => 'Invalid client']);
    exit(1);
}

$config = $ftpConfig[$client];

// ==================== ПАПКИ ====================
$cacheDir = __DIR__ . '/../../cache';
$tasksDir = "{$cacheDir}/tatneft_tasks";

if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

// ==================== ПРОВЕРКА НАЛИЧИЯ ЗАДАНИЯ ====================
$taskFile = "{$tasksDir}/{$client}.json";
if (!file_exists($taskFile)) {
    exit(0);
}

$taskData = json_decode(file_get_contents($taskFile), true);
$pattern = "OUT_{$taskData['task']}_{$taskData['date']}_balance.xml";

// ==================== ПОДКЛЮЧЕНИЕ К FTP ====================
$conn = @ftp_connect($config['server'], 21, 10);
if (!$conn) {
    echo json_encode(['error' => 'FTP connection failed', 'client' => $client]);
    exit(1);
}

if (!@ftp_login($conn, $config['username'], $config['password'])) {
    ftp_close($conn);
    echo json_encode(['error' => 'FTP login failed', 'client' => $client]);
    exit(1);
}

ftp_pasv($conn, true);

// ==================== ПОИСК ОТВЕТА ====================
$files = @ftp_nlist($conn, $config['outbound']);
$found = false;
$xmlContent = null;
$parseError = false;

if ($files) {
    foreach ($files as $file) {
        $basename = basename($file);
        
        if ($basename === $pattern) {
            $tmpFile = tempnam(sys_get_temp_dir(), 'tatneft_resp_');
            
            if (@ftp_get($conn, $tmpFile, $config['outbound'] . '/' . $basename, FTP_ASCII)) {
                $xmlContent = file_get_contents($tmpFile);
                unlink($tmpFile);
                
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($xmlContent);
                
                if ($xml !== false) {
                    @ftp_rename($conn, $config['outbound'] . '/' . $basename, $config['archive'] . '/' . $basename);
                    $found = true;
                } else {
                    @ftp_rename($conn, $config['outbound'] . '/' . $basename, $config['error'] . '/' . $basename);
                    $parseError = true;
                }
            }
            
            break;
        }
    }
}

// ==================== ОТКЛЮЧЕНИЕ ОТ FTP ====================
ftp_close($conn);

// ==================== ОБРАБОТКА ПОСЛЕ ОТКЛЮЧЕНИЯ ====================
if ($parseError) {
    unlink($taskFile);
    echo json_encode(['status' => 'error', 'error' => 'Failed to parse XML', 'client' => $client]);
    exit(1);
}

if (!$found) {
    exit(0);
}

$xml = simplexml_load_string($xmlContent);
$balance = (float) $xml->balance;
$forecast = (string) $xml->end_of_funds_forecast;

// Сохраняем в кэш
$cacheFile = "{$cacheDir}/tatneft_{$client}.json";
$cache = file_exists($cacheFile) ? json_decode(file_get_contents($cacheFile), true) : ['current' => null, 'history' => []];

$snapshot = [
    'balance'     => $balance,
    'forecast'    => $forecast,
    'received_at' => date('c')
];

$cache['current'] = $snapshot;
$cache['history'][] = $snapshot;

$cutoff = time() - 86400;
$cache['history'] = array_values(array_filter($cache['history'], function($entry) use ($cutoff) {
    return strtotime($entry['received_at']) >= $cutoff;
}));

file_put_contents($cacheFile, json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

unlink($taskFile);

echo json_encode([
    'status'   => 'done',
    'client'   => $client,
    'balance'  => $balance,
    'forecast' => $forecast
], JSON_UNESCAPED_UNICODE);