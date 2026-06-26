<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

// Очищаем дубликаты
$mysqli->query("TRUNCATE TABLE kpi_client_statuses");

// Укоротим колонки
$mysqli->query("ALTER TABLE kpi_client_statuses MODIFY client_name VARCHAR(250) NOT NULL");
$mysqli->query("ALTER TABLE kpi_client_statuses MODIFY manager_name VARCHAR(250) NOT NULL");

// Добавляем UNIQUE KEY
$sql = "ALTER TABLE kpi_client_statuses ADD UNIQUE KEY unique_client_month (client_name(100), manager_name(100), year, month)";
if ($mysqli->query($sql)) {
    echo json_encode(['success' => true, 'message' => 'UNIQUE KEY добавлен, таблица очищена']);
} else {
    echo json_encode(['success' => false, 'error' => $mysqli->error]);
}