<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

$result = $mysqli->query("SELECT client, manager_name, month FROM kpi_received_clients ORDER BY created_at DESC");

$clients = [];
while ($row = $result->fetch_assoc()) {
    $clients[] = [
        'client' => $row['client'],
        'manager_name' => $row['manager_name'],
        'month' => $row['month']
    ];
}

echo json_encode(['success' => true, 'clients' => $clients]);