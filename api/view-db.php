<?php
// api/view-db.php
header('Content-Type: text/html; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");
$mysqli->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

// Получаем список таблиц
$tables_result = $mysqli->query("SHOW TABLES");
$tables = [];
while ($row = $tables_result->fetch_row()) {
    $tables[] = $row[0];
}

echo "<!DOCTYPE html>
<html lang='ru'>
<head>
    <meta charset='UTF-8'>
    <title>Просмотр БД</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h2 { color: #333; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        th { background: #1976D2; color: white; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
        tr:hover { background: #f0f7ff; }
        .tables-list { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .tables-list a { color: #1976D2; text-decoration: none; margin-right: 15px; font-weight: bold; }
        .tables-list a:hover { text-decoration: underline; }
    </style>
</head>
<body>
<h1>📊 Просмотр базы данных</h1>";

echo "<div class='tables-list'><strong>Таблицы:</strong> ";
foreach ($tables as $table) {
    echo "<a href='#table-{$table}'>$table</a> ";
}
echo "</div>";

foreach ($tables as $table) {
    echo "<h2 id='table-{$table}'>📋 $table</h2>";
    
    $result = $mysqli->query("SELECT * FROM `$table`");
    
    if ($result && $result->num_rows > 0) {
        echo "<table>";
        
        // Заголовки
        echo "<tr>";
        $fields = $result->fetch_fields();
        foreach ($fields as $field) {
            echo "<th>" . htmlspecialchars($field->name) . "</th>";
        }
        echo "</tr>";
        
        // Данные
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            foreach ($row as $value) {
                $display = $value !== null ? htmlspecialchars($value) : '<i>NULL</i>';
                echo "<td>$display</td>";
            }
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p style='color: #999;'>Таблица пустая</p>";
    }
}

echo "</body></html>";