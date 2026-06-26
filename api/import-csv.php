<?php
header('Content-Type: text/plain; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "ПАРОЛЬ", "u2192811_workbenzigo");
$mysqli->query("SET NAMES utf8");

$files = ['client_first_dates', 'kpi_received_clients', 'kpi_settings', 'kpi_vat_details'];

foreach ($files as $table) {
    $csv = file_get_contents(__DIR__ . '/../' . $table . '.csv');
    $lines = explode("\n", trim($csv));
    
    foreach ($lines as $line) {
        $values = explode("\t", $line);
        $values = array_map(function($v) { return "'" . $mysqli->real_escape_string($v) . "'"; }, $values);
        $sql = "INSERT IGNORE INTO $table VALUES (" . implode(",", $values) . ")";
        $mysqli->query($sql);
    }
    echo "$table: " . count($lines) . " строк\n";
}

echo "✅ Готово!";
$mysqli->close();