<?php
header('Content-Type: application/json; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

$tables = ['kpi_vat_details', 'kpi_client_statuses', 'kpi_manager_settings', 'kpi_approvals', 'kpi_settings'];
$backup = [];

foreach ($tables as $table) {
    $result = $mysqli->query("SELECT * FROM `$table`");
    $backup[$table] = $result->fetch_all(MYSQLI_ASSOC);
}

// Сохраняем в файл
$filename = __DIR__ . '/../backup_' . date('Y-m-d_H-i-s') . '.json';
file_put_contents($filename, json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Бэкап создан: ' . basename($filename),
    'tables' => array_keys($backup),
    'rows' => array_map('count', $backup)
]);