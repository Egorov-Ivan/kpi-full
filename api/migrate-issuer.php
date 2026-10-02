<?php
// api/migrate-issuer.php
// ⚠️ ВРЕМЕННЫЙ ФАЙЛ — УДАЛИТЬ ПОСЛЕ ВЫПОЛНЕНИЯ МИГРАЦИИ!

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
<title>Миграция kpi_vat_details</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; background: #f5f5f5; max-width: 900px; }
  h1 { color: #1976D2; }
  .ok   { border-left-color: #4CAF50; }
  .warn { border-left-color: #FF9800; }
  .err  { border-left-color: #F44336; }
  pre { background:#263238; color:#ECEFF1; padding:14px; border-radius:6px; overflow-x:auto; font-size:13px; }
</style>
</head><body>
<h1>🔧 Миграция таблицы kpi_vat_details</h1>";

// ---------- 1. Проверяем, существует ли таблица ----------
$checkTable = $mysqli->query("SHOW TABLES LIKE 'kpi_vat_details'");
if ($checkTable->num_rows === 0) {
    out("❌ Таблица kpi_vat_details не найдена. Миграция невозможна.", "#F44336");
    echo "</body></html>";
    exit;
}
out("✅ Таблица kpi_vat_details найдена.", "#4CAF50");

// ---------- 2. Показываем текущую структуру ----------
echo "<h2>📋 Структура ДО миграции</h2>";
echo "<pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-25s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 3. Добавляем колонку issuer_name ----------
$hasColumn = $mysqli->query("SHOW COLUMNS FROM kpi_vat_details LIKE 'issuer_name'");
if ($hasColumn->num_rows > 0) {
    out("ℹ️ Колонка issuer_name уже существует — пропускаем ALTER.", "#FF9800");
} else {
    $sql = "ALTER TABLE kpi_vat_details 
            ADD COLUMN issuer_name VARCHAR(255) DEFAULT NULL AFTER client_name";
    if ($mysqli->query($sql)) {
        out("✅ Колонка issuer_name добавлена.", "#4CAF50");
    } else {
        out("❌ Ошибка добавления колонки: " . $mysqli->error, "#F44336");
        echo "</body></html>";
        exit;
    }
}

// ---------- 4. Добавляем индекс ----------
$hasIndex = $mysqli->query("SHOW INDEX FROM kpi_vat_details WHERE Key_name = 'idx_kpi_vat_issuer'");
if ($hasIndex && $hasIndex->num_rows > 0) {
    out("ℹ️ Индекс idx_kpi_vat_issuer уже существует — пропускаем CREATE INDEX.", "#FF9800");
} else {
    $sql = "CREATE INDEX idx_kpi_vat_issuer ON kpi_vat_details(issuer_name)";
    if ($mysqli->query($sql)) {
        out("✅ Индекс idx_kpi_vat_issuer создан.", "#4CAF50");
    } else {
        out("⚠️ Ошибка создания индекса: " . $mysqli->error, "#FF9800");
    }
}

// ---------- 5. Показываем структуру ПОСЛЕ ----------
echo "<h2>📋 Структура ПОСЛЕ миграции</h2>";
echo "<pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-25s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 6. Статистика ----------
echo "<h2>📊 Статистика</h2>";
$stats = $mysqli->query("
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN issuer_name IS NULL THEN 1 ELSE 0 END) AS без_эмитента,
        SUM(CASE WHEN issuer_name IS NOT NULL AND issuer_name != '' THEN 1 ELSE 0 END) AS с_эмитентом
    FROM kpi_vat_details
");
$s = $stats->fetch_assoc();
out("Всего записей: {$s['total']}", "#1976D2");
out("Без эмитента (старые): {$s['без_эмитента']}", "#FF9800");
out("С эмитентом (новые): {$s['с_эмитентом']}", "#4CAF50");

// ---------- 7. Пример записей ----------
echo "<h2>🔍 Пример записей</h2>";
$sample = $mysqli->query("
    SELECT manager_name, client_name, issuer_name, total_profit, kpi_vat, year, month 
    FROM kpi_vat_details 
    ORDER BY id DESC 
    LIMIT 5
");
if ($sample && $sample->num_rows > 0) {
    echo "<table style='border-collapse:collapse;width:100%;background:#fff;'>";
    echo "<tr style='background:#1976D2;color:#fff;'>";
    echo "<th style='padding:8px;text-align:left;'>Менеджер</th>";
    echo "<th style='padding:8px;text-align:left;'>Клиент</th>";
    echo "<th style='padding:8px;text-align:left;'>Эмитент</th>";
    echo "<th style='padding:8px;text-align:right;'>Прибыль</th>";
    echo "<th style='padding:8px;text-align:right;'>KPI</th>";
    echo "<th style='padding:8px;text-align:center;'>Период</th>";
    echo "</tr>";
    while ($r = $sample->fetch_assoc()) {
        echo "<tr>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($r['manager_name']) . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($r['client_name']) . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;'>" 
             . ($r['issuer_name'] === null 
                ? "<i style='color:#999;'>NULL</i>" 
                : htmlspecialchars($r['issuer_name'])) 
             . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>" . number_format($r['total_profit'], 2, '.', ' ') . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>" . number_format($r['kpi_vat'], 2, '.', ' ') . "</td>";
        echo "<td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>" . $r['year'] . "-" . $r['month'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    out("Таблица пустая.", "#FF9800");
}

echo "<div style='margin-top:30px;padding:15px;background:#FFF3E0;border-left:4px solid #FF9800;font-weight:bold;'>
⚠️ НЕ ЗАБУДЬТЕ УДАЛИТЬ ЭТОТ ФАЙЛ (migrate-issuer.php) ПОСЛЕ ВЫПОЛНЕНИЯ!
</div>";

echo "</body></html>";