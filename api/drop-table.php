<?php
header('Content-Type: application/json; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

$table = $_GET['table'] ?? '';

if (!$table) {
    // Показываем список доступных таблиц
    $result = $mysqli->query("SHOW TABLES");
    $tables = [];
    while ($row = $result->fetch_row()) {
        $tables[] = $row[0];
    }
    echo json_encode(['success' => true, 'tables' => $tables, 'usage' => '?table=имя_таблицы']);
    exit;
}

// Список таблиц, которые можно очищать
$allowed = [
    'client_first_dates',
    'kpi_approvals', 
    'kpi_client_statuses', 
    'kpi_manager_settings', 
    'kpi_received_clients', 
    'kpi_settings', 
    'kpi_vat_details'
];

if (!in_array($table, $allowed)) {
    echo json_encode(['success' => false, 'error' => "Таблица '$table' не разрешена для очистки"]);
    exit;
}

$result = $mysqli->query("TRUNCATE TABLE `$table`");

if ($result) {
    echo json_encode(['success' => true, 'message' => "Таблица '$table' очищена"]);
} else {
    echo json_encode(['success' => false, 'error' => $mysqli->error]);
}