<?php
// Для запуска из командной строки: php tatneft-request.php montblanc
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
        'work'     => '/prod/inbound'
    ],
    'faeton' => [
        'server'   => 'ftp.benzigo.ru',
        'username' => 'tatneft_faeton',
        'password' => 'fV7hU3iY9m',
        'work'     => '/inbound'
    ]
];

if (!isset($ftpConfig[$client])) {
    echo json_encode(['error' => 'Invalid client']);
    exit(1);
}

$config = $ftpConfig[$client];

// ==================== ПАПКА ДЛЯ ЗАДАНИЙ ====================
$tasksDir = __DIR__ . '/../../cache/tatneft_tasks';
if (!is_dir($tasksDir)) mkdir($tasksDir, 0755, true);

// ==================== ПОДКЛЮЧЕНИЕ К FTP ====================
$conn = @ftp_connect($config['server'], 21, 10);
if (!$conn) {
    echo json_encode(['error' => 'FTP connection failed']);
    exit(1);
}

if (!@ftp_login($conn, $config['username'], $config['password'])) {
    ftp_close($conn);
    echo json_encode(['error' => 'FTP login failed']);
    exit(1);
}

ftp_pasv($conn, true);

// ==================== ОТПРАВКА ФАЙЛА ====================
$task = time();
$date = date('Y-m-d');
$filename = "IN_{$task}_{$date}.xml";

$xml = '<card_task>
  <card_number>NONE</card_number>
  <task_type>GET_BALANCE</task_type>
</card_task>';

$tmpFile = tempnam(sys_get_temp_dir(), 'tatneft_');
file_put_contents($tmpFile, $xml);

$result = @ftp_put($conn, $config['work'] . '/' . $filename, $tmpFile, FTP_ASCII);
unlink($tmpFile);

// ==================== ОТКЛЮЧЕНИЕ ОТ FTP ====================
ftp_close($conn);

if (!$result) {
    echo json_encode(['error' => 'Failed to upload file', 'client' => $client]);
    exit(1);
}

// ==================== СОХРАНЕНИЕ ЗАДАНИЯ ====================
$taskData = [
    'client'   => $client,
    'task'     => $task,
    'date'     => $date,
    'filename' => $filename,
    'sent_at'  => date('c')
];

file_put_contents("{$tasksDir}/{$client}.json", json_encode($taskData, JSON_UNESCAPED_UNICODE));

echo json_encode(['status' => 'sent', 'client' => $client, 'task' => $task], JSON_UNESCAPED_UNICODE);