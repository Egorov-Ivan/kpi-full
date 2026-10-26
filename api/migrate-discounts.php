<?php
// migrate-discounts.php
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
<title>Миграция: скидки и стелла</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; background: #f5f5f5; max-width: 900px; }
  h1 { color: #1976D2; }
  h2 { color: #333; margin-top: 30px; }
  pre { background:#263238; color:#ECEFF1; padding:14px; border-radius:6px; overflow-x:auto; font-size:13px; }
  .warn { margin-top:30px; padding:15px; background:#FFF3E0; border-left:4px solid #FF9800; font-weight:bold; }
  table { border-collapse:collapse; width:100%; background:#fff; font-size:13px; margin-top:10px; }
  th { background:#1976D2; color:#fff; padding:8px; text-align:left; }
  td { padding:8px; border-bottom:1px solid #eee; }
</style>
</head><body>
<h1>🔧 Миграция: sum_stella, sum_for_us, скидки</h1>";

// ---------- 1. Проверка таблицы ----------
$checkTable = $mysqli->query("SHOW TABLES LIKE 'kpi_vat_details'");
if ($checkTable->num_rows === 0) {
    out("❌ Таблица kpi_vat_details не найдена. Миграция невозможна.", "#F44336");
    echo "</body></html>"; exit;
}
out("✅ Таблица kpi_vat_details найдена.", "#4CAF50");

// ---------- 2. Структура ДО ----------
echo "<h2>📋 Структура ДО миграции</h2><pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-30s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 3. Добавляем колонки ----------
$columns = [
    [
        'name'  => 'sum_stella',
        'sql'   => "ALTER TABLE kpi_vat_details 
                    ADD COLUMN sum_stella DECIMAL(15,2) DEFAULT NULL AFTER sum_for_client",
        'desc'  => 'Сумма стеллы (базовая закупочная)',
        'color' => '#4CAF50',
    ],
    [
        'name'  => 'sum_for_us',
        'sql'   => "ALTER TABLE kpi_vat_details 
                    ADD COLUMN sum_for_us DECIMAL(15,2) DEFAULT NULL AFTER sum_stella",
        'desc'  => 'Сумма для нас (наша закупка)',
        'color' => '#4CAF50',
    ],
    [
        'name'  => 'average_incoming_discount',
        'sql'   => "ALTER TABLE kpi_vat_details 
                    ADD COLUMN average_incoming_discount DECIMAL(10,4) DEFAULT NULL AFTER sum_for_us",
        'desc'  => 'Средневзвешенная скидка для нас, %',
        'color' => '#4CAF50',
    ],
    [
        'name'  => 'average_outgoing_discount',
        'sql'   => "ALTER TABLE kpi_vat_details 
                    ADD COLUMN average_outgoing_discount DECIMAL(10,4) DEFAULT NULL AFTER average_incoming_discount",
        'desc'  => 'Средневзвешенная скидка для клиента, %',
        'color' => '#4CAF50',
    ],
];

foreach ($columns as $col) {
    $hasColumn = $mysqli->query("SHOW COLUMNS FROM kpi_vat_details LIKE '{$col['name']}'");
    if ($hasColumn->num_rows > 0) {
        out("ℹ️ Колонка {$col['name']} уже существует — пропускаем.", "#FF9800");
    } else {
        if ($mysqli->query($col['sql'])) {
            out("✅ Колонка {$col['name']} добавлена. {$col['desc']}.", $col['color']);
        } else {
            out("❌ Ошибка добавления {$col['name']}: " . $mysqli->error, "#F44336");
            echo "</body></html>"; exit;
        }
    }
}

// ---------- 4. Структура ПОСЛЕ ----------
echo "<h2>📋 Структура ПОСЛЕ миграции</h2><pre>";
$res = $mysqli->query("DESCRIBE kpi_vat_details");
while ($r = $res->fetch_assoc()) {
    printf("%-30s %-20s %-8s %-6s %s\n",
        $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
}
echo "</pre>";

// ---------- 5. Статистика ----------
echo "<h2>📊 Статистика</h2>";
$stats = $mysqli->query("
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN sum_stella IS NULL THEN 1 ELSE 0 END)                    AS без_стеллы,
        SUM(CASE WHEN sum_for_us IS NULL THEN 1 ELSE 0 END)                    AS без_нашей,
        SUM(CASE WHEN average_incoming_discount IS NULL THEN 1 ELSE 0 END)     AS без_вх_скидки,
        SUM(CASE WHEN average_outgoing_discount IS NULL THEN 1 ELSE 0 END)     AS без_исх_скидки
    FROM kpi_vat_details
");
$s = $stats->fetch_assoc();
out("Всего записей: {$s['total']}", "#1976D2");
out("Без sum_stella (старые): {$s['без_стеллы']}", "#FF9800");
out("Без sum_for_us (старые): {$s['без_нашей']}", "#FF9800");
out("Без average_incoming_discount: {$s['без_вх_скидки']}", "#FF9800");
out("Без average_outgoing_discount: {$s['без_исх_скидки']}", "#FF9800");

// ---------- 6. Пример записей ----------
echo "<h2>🔍 Пример последних 5 записей</h2>";
$sample = $mysqli->query("
    SELECT 
        manager_name, client_name, issuer_name,
        total_profit, sum_for_client, sum_stella, sum_for_us,
        average_incoming_discount, average_outgoing_discount,
        year, month
    FROM kpi_vat_details 
    ORDER BY id DESC 
    LIMIT 5
");
if ($sample && $sample->num_rows > 0) {
    echo "<table>";
    echo "<tr>
            <th>Менеджер</th>
            <th>Клиент</th>
            <th>Эмитент</th>
            <th>Прибыль</th>
            <th>Для клиента</th>
            <th>Стелла</th>
            <th>Для нас</th>
            <th>Ск. вх.</th>
            <th>Ск. исх.</th>
          </tr>";
    while ($r = $sample->fetch_assoc()) {
        $fmt = fn($v) => $v === null 
            ? "<i style='color:#999;'>NULL</i>" 
            : number_format((float)$v, 2, '.', ' ');

        echo "<tr>";
        echo "<td>" . htmlspecialchars($r['manager_name']) . "</td>";
        echo "<td>" . htmlspecialchars($r['client_name']) . "</td>";
        echo "<td>" . htmlspecialchars($r['issuer_name']) . "</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['total_profit']) . "</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['sum_for_client']) . "</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['sum_stella']) . "</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['sum_for_us']) . "</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['average_incoming_discount']) . "%</td>";
        echo "<td style='text-align:right;'>" . $fmt($r['average_outgoing_discount']) . "%</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    out("Таблица пустая.", "#FF9800");
}

echo "<div class='warn'>
⚠️ НЕ ЗАБУДЬТЕ УДАЛИТЬ ЭТОТ ФАЙЛ (migrate-discounts.php) ПОСЛЕ ВЫПОЛНЕНИЯ!
</div>";

echo "</body></html>";