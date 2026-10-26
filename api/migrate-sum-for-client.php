<?php
// migrate-sum-for-client.php
// ⚠️ ВРЕМЕННЫЙ ФАЙЛ — УДАЛИТЬ ПОСЛЕ ВЫПОЛНЕНИЯ!

header('Content-Type: text/html; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");
$mysqli->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

if ($mysqli->connect_error) {
    die("❌ Ошибка подключения: " . $mysqli->connect_error);
}

function out($msg, $color = '#333') {
    echo "<div style='padding:6px 10px;margin:4px 0;background:#fff;border-left:4px solid {$color};font-family:monospace;font-size:14px;'>"
       . htmlspecialchars($msg, ENT_QUOTES, 'UTF-8')
       . "</div>";
}

echo "<!DOCTYPE html><html lang='ru'><head><meta charset='UTF-8'>
<title>Миграция: sum_for_client</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; background: #f5f5f5; max-width: 900px; }
  h1 { color: #1976D2; }
  h2 { color: #333; margin-top: 30px; }
  pre { background:#263238; color:#ECEFF1; padding:14px; border-radius:6px; overflow-x:auto; font-size:13px; }
  .warn { margin-top:30px; padding:15px; background:#FFF3E0; border-left:4px solid #FF9800; font-weight:bold; }
</style>
</head><body>
<h1>🔧 Миграция: добавление колонки sum_for_client</h1>";

// ---------- 1. Проверяем таблицу ----------
$checkTable = $mysqli->query("SHOW TABLES LIKE 'kpi_vat_details'");
if ($checkTable->num_rows === 0) {
    out("❌ Таблица kpi_vat_details не найдена. Миграция невозможна.", "#F44336");
    echo "</body></html>";
    exit;
}
out("✅ Таблица kpi_vat_details найдена.", "#4CAF50");

// ---------- 2. Структура ДО ----------
echo "<h2>📋 Структура ДО миграции</h2><pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-25s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 3. Добавляем колонку sum_for_client ----------
$hasColumn = $mysqli->query("SHOW COLUMNS FROM kpi_vat_details LIKE 'sum_for_client'");
if ($hasColumn->num_rows > 0) {
    out("ℹ️ Колонка sum_for_client уже существует — пропускаем ALTER.", "#FF9800");
} else {
    $sql = "ALTER TABLE kpi_vat_details 
            ADD COLUMN sum_for_client DECIMAL(15,2) DEFAULT NULL AFTER total_profit";
    if ($mysqli->query($sql)) {
        out("✅ Колонка sum_for_client добавлена (DECIMAL(15,2), nullable).", "#4CAF50");
    } else {
        out("❌ Ошибка добавления колонки: " . $mysqli->error, "#F44336");
        echo "</body></html>";
        exit;
    }
}

// ---------- 4. Структура ПОСЛЕ ----------
echo "<h2>📋 Структура ПОСЛЕ миграции</h2><pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-25s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 5. Статистика ----------
echo "<h2>📊 Статистика</h2>";
$stats = $mysqli->query("
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN sum_for_client IS NULL THEN 1 ELSE 0 END) AS без_поля,
        SUM(CASE WHEN sum_for_client IS NOT NULL THEN 1 ELSE 0 END) AS с_полем
    FROM kpi_vat_details
");
$s = $stats->fetch_assoc();
out("Всего записей: {$s['total']}", "#1976D2");
out("Без sum_for_client (старые): {$s['без_поля']}", "#FF9800");
out("С sum_for_client (новые): {$s['с_полем']}", "#4CAF50");

// ---------- 6. Пример записей ----------
echo "<h2>🔍 Пример последних 5 записей</h2>";
$sample = $mysqli->query("
    SELECT manager_name, client_name, issuer_name, total_profit, sum_for_client, year, month 
    FROM kpi_vat_details 
    ORDER BY id DESC 
    LIMIT 5
");
if ($sample && $sample->num_rows > 0) {
    echo "<table style='border-collapse:collapse;width:100%;background:#fff;font-size:13px;'>";
    echo "<tr style='background:#1976D2;color:#fff;'>";
    echo "<th style='padding:8px;text-align:left;'>Менеджер</th>";
    echo "<th style='padding:8px;text-align:left;'>Клиент</th>";
    echo "<th style='padding:8px;text-align:left;'>Эмитент</th>";
    echo "<th style='padding:8px;text-align:right;'>Прибыль</th>";
    echo "<th style='padding:8px;text-align:right;'>sum_for_client</th>";
    echo "<th style='padding:8px;text-align:center;'>Период</th>";
    echo "</tr>";
    while ($r = $sample->fetch_assoc()) {
        echo "<tr>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($r['manager_name']) . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($r['client_name']) . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($r['issuer_name']) . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>" . number_format($r['total_profit'], 2, '.', ' ') . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>" 
             . ($r['sum_for_client'] === null 
                ? "<i style='color:#999;'>NULL</i>" 
                : number_format($r['sum_for_client'], 2, '.', ' ')) 
             . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>" . $r['year'] . "-" . $r['month'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    out("Таблица пустая.", "#FF9800");
}

echo "<div class='warn'>
⚠️ НЕ ЗАБУДЬТЕ УДАЛИТЬ ЭТОТ ФАЙЛ (migrate-sum-for-client.php) ПОСЛЕ ВЫПОЛНЕНИЯ!
</div>";

echo "</body></html>";