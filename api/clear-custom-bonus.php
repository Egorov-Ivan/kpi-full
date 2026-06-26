<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

// Удаляем битые данные из kpi_settings
$mysqli->query("DELETE FROM kpi_settings WHERE `key` = 'customBonusStatus'");

// Очищаем kpi_client_statuses
$mysqli->query("TRUNCATE TABLE kpi_client_statuses");

echo json_encode(['success' => true, 'message' => 'customBonusStatus очищен, таблица kpi_client_statuses очищена']);ы