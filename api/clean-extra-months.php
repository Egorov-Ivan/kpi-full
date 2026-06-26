<?php
header('Content-Type: application/json; charset=utf-8');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

// Удаляем все записи кроме апреля 2026
$result = $mysqli->query("DELETE FROM kpi_manager_settings WHERE NOT (year = '2026' AND month = '04')");
$deleted = $mysqli->affected_rows;

echo json_encode([
    'success' => true, 
    'message' => "Удалено $deleted записей из kpi_manager_settings (оставлены только апрель 2026)",
    'deleted' => $deleted
]);