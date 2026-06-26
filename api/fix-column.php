<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

$sql = "ALTER TABLE kpi_settings MODIFY COLUMN `value` LONGTEXT NOT NULL";
if ($mysqli->query($sql)) {
    echo json_encode(['success' => true, 'message' => 'Колонка изменена']);
} else {
    echo json_encode(['success' => false, 'error' => $mysqli->error]);
}