<?php
header('Content-Type: text/plain; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8mb4");

$files = ['client_first_dates', 'kpi_received_clients', 'kpi_settings', 'kpi_vat_details'];

foreach ($files as $table) {
    $csv = file_get_contents(__DIR__ . '/../' . $table . '.csv');
    $lines = explode("\n", trim($csv));
    $count = 0;
    
    foreach ($lines as $line) {
        $values = explode("\t", $line);
        $escaped = [];
        foreach ($values as $v) {
            $escaped[] = "'" . $mysqli->real_escape_string($v) . "'";
        }
        $sql = "INSERT IGNORE INTO $table VALUES (" . implode(",", $escaped) . ")";
        if ($mysqli->query($sql)) {
            $count++;
        }
    }
    echo "$table: $count строк\n";
}

echo "✅ Готово!";
$mysqli->close();