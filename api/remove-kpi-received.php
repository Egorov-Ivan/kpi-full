<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "Правильный", "u2192811_workbenzigo");

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['client'])) {
    http_response_code(400);
    echo json_encode(['error' => 'client required']);
    exit;
}

$stmt = $mysqli->prepare("DELETE FROM kpi_received_clients WHERE client = ?");
$stmt->bind_param("s", $data['client']);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => "KPI разрешён для {$data['client']}"]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $stmt->error]);
}