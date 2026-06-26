<?php
header('Content-Type: text/plain; charset=utf-8');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8mb4");

$result = $mysqli->query("SELECT client_name, manager_name, status FROM kpi_client_statuses LIMIT 3");
while ($row = $result->fetch_assoc()) {
    echo "client: " . $row['client_name'] . "\n";
    echo "manager: " . $row['manager_name'] . "\n";
    echo "status: " . $row['status'] . "\n";
    echo "client HEX: " . bin2hex($row['client_name']) . "\n";
    echo "---\n";
}