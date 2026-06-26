<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("UPDATE kpi_client_statuses SET status = 'НЕТ' WHERE status = '' OR status IS NULL");
echo json_encode(['success' => true, 'message' => 'Статусы обновлены на НЕТ']);