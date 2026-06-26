<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8mb4");

// Меняем кодировку колонки status
$sql = "ALTER TABLE kpi_client_statuses MODIFY COLUMN status VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'НЕТ'";
if ($mysqli->query($sql)) {
    // Обновляем существующие записи
    $mysqli->query("UPDATE kpi_client_statuses SET status = 'НЕТ' WHERE status = 'ÐÐ•Ð¢' OR status = '' OR status IS NULL");
    echo json_encode(['success' => true, 'message' => 'Кодировка исправлена, статусы обновлены']);
} else {
    echo json_encode(['success' => false, 'error' => $mysqli->error]);
}