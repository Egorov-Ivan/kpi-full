<?php
header('Content-Type: application/json; charset=utf-8');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8mb4");

$tables = ['kpi_client_statuses', 'kpi_vat_details', 'kpi_approvals', 'kpi_manager_settings'];

foreach ($tables as $table) {
    echo "Обрабатываю $table...\n";
    
    $result = $mysqli->query("SELECT * FROM `$table`");
    while ($row = $result->fetch_assoc()) {
        $updates = [];
        foreach ($row as $key => $value) {
            if (is_string($value) && !empty($value)) {
                // Пробуем исправить двойную кодировку
                // Если строка валидна в UTF-8, но содержит кракозябры — перекодируем
                if (mb_check_encoding($value, 'UTF-8')) {
                    // Конвертируем UTF-8 → Latin-1 → UTF-8 (фикс двойной кодировки)
                    $fixed = utf8_encode(utf8_decode($value));
                    if ($fixed !== $value) {
                        $updates[$key] = $fixed;
                    }
                }
            }
        }
        
        if (!empty($updates)) {
            $sets = [];
            foreach ($updates as $k => $v) {
                $sets[] = "`$k` = '" . $mysqli->real_escape_string($v) . "'";
            }
            $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = {$row['id']}";
            $mysqli->query($sql);
        }
    }
    echo "OK\n";
}

echo "\nГОТОВО";