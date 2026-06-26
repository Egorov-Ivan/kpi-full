<?php
header('Content-Type: application/json; charset=utf-8');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8mb4");

$tables = ['kpi_client_statuses', 'kpi_manager_settings', 'kpi_vat_details', 'kpi_approvals'];

foreach ($tables as $table) {
    $result = $mysqli->query("SELECT * FROM `$table`");
    while ($row = $result->fetch_assoc()) {
        $updates = [];
        foreach ($row as $key => $value) {
            if (is_string($value) && !mb_check_encoding($value, 'UTF-8')) {
                $fixed = mb_convert_encoding($value, 'UTF-8', 'Windows-1251');
                $updates[] = "`$key` = '" . $mysqli->real_escape_string($fixed) . "'";
            }
        }
        if (!empty($updates)) {
            $sql = "UPDATE `$table` SET " . implode(', ', $updates) . " WHERE id = {$row['id']}";
            $mysqli->query($sql);
        }
    }
    echo "Таблица $table обработана\n";
}

echo json_encode(['success' => true, 'message' => 'Кодировка исправлена']);