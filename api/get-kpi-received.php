<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "ПАРОЛЬ", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

$result = $mysqli->query("SELECT * FROM kpi_received_clients");
$clients = [];
while ($row = $result->fetch_assoc()) {
    $clients[] = $row['client_name'];
}

echo json_encode(['success' => true, 'clients' => $clients]);