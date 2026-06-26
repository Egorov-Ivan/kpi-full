<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "Правильный", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['client']) || !isset($data['managerName']) || !isset($data['month'])) {
    http_response_code(400);
    echo json_encode(['error' => 'client, managerName, and month are required']);
    exit;
}

$client = $data['client'];
$managerName = $data['managerName'];
$month = $data['month'];

// В MySQL нет ON CONFLICT, используем INSERT ... ON DUPLICATE KEY UPDATE
// Но для этого нужен UNIQUE KEY на client

$stmt = $mysqli->prepare("INSERT INTO kpi_received_clients (client, manager_name, month) 
                          VALUES (?, ?, ?) 
                          ON DUPLICATE KEY UPDATE manager_name = VALUES(manager_name), month = VALUES(month)");
$stmt->bind_param("sss", $client, $managerName, $month);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => "KPI зафиксирован: $client → $managerName ($month)"
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $stmt->error]);
}