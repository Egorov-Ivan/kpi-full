<?php
header('Content-Type: application/json; charset=utf-8');

$file = $_GET['file'] ?? '';
if (!$file || !file_exists(__DIR__ . '/../' . $file)) {
    echo json_encode(['error' => 'Файл не найден']);
    exit;
}

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$data = json_decode(file_get_contents(__DIR__ . '/../' . $file), true);

foreach ($data as $table => $rows) {
    $mysqli->query("TRUNCATE TABLE `$table`");
    foreach ($rows as $row) {
        $keys = array_keys($row);
        $values = array_values($row);
        $placeholders = array_fill(0, count($values), '?');
        
        $sql = "INSERT INTO `$table` (`" . implode('`, `', $keys) . "`) VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $mysqli->prepare($sql);
        $types = str_repeat('s', count($values));
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
    }
}

echo json_encode(['success' => true, 'message' => 'Восстановлено из ' . $file]);