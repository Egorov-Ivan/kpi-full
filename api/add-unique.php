<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "Правильный", "u2192811_workbenzigo");

$sql = "ALTER TABLE kpi_received_clients ADD UNIQUE KEY unique_client (client)";
if ($mysqli->query($sql)) {
    echo json_encode(['success' => true, 'message' => 'UNIQUE KEY добавлен']);
} else {
    // Если уже существует — тоже ок
    if (strpos($mysqli->error, 'Duplicate key') !== false) {
        echo json_encode(['success' => true, 'message' => 'UNIQUE KEY уже существует']);
    } else {
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
    }
}