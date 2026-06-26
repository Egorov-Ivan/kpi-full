<?php
// api/kpi-vat.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");
$mysqli->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

// GET — получить данные
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $year = $_GET['year'] ?? '';
    $month = $_GET['month'] ?? '';
    $manager = $_GET['manager'] ?? '';
    
    if (!$year || !$month) {
        http_response_code(400);
        echo json_encode(['error' => 'year и month обязательны']);
        exit;
    }
    
    $sql = "SELECT * FROM kpi_vat_details WHERE year = ? AND month = ?";
    $params = [$year, $month];
    $types = "ss";
    
    if ($manager) {
        $sql .= " AND manager_name = ?";
        $params[] = $manager;
        $types .= "s";
    }
    
    $sql .= " ORDER BY manager_name, total_profit DESC";
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    // Считаем summary по менеджерам
    $summaryMap = [];
    foreach ($data as $row) {
        $mgr = $row['manager_name'];
        if (!isset($summaryMap[$mgr])) {
            $summaryMap[$mgr] = ['manager' => $mgr, 'totalKpiVat' => 0];
        }
        $summaryMap[$mgr]['totalKpiVat'] += floatval($row['kpi_vat']);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'summary' => array_values($summaryMap)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST — загрузить файл
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Файл не загружен']);
        exit;
    }
    
    $year = $_POST['year'] ?? '';
    $month = $_POST['month'] ?? '';
    $manager = $_POST['manager'] ?? '';
    
    if (!$year || !$month) {
        http_response_code(400);
        echo json_encode(['error' => 'year и month обязательны']);
        exit;
    }
    
    $tmpFile = $_FILES['file']['tmp_name'];
    
    $content = file_get_contents($tmpFile);
    $content = ltrim($content, "\xEF\xBB\xBF");
    
    if (!mb_check_encoding($content, 'UTF-8')) {
        $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1251');
    }
    if (!mb_check_encoding($content, 'UTF-8')) {
        $content = mb_convert_encoding($content, 'UTF-8', 'CP1251');
    }
    
    $lines = array_map('trim', explode("\n", $content));
    $lines = array_filter($lines);
    
    if (count($lines) < 2) {
        http_response_code(400);
        echo json_encode(['error' => 'Файл пустой']);
        exit;
    }
    
    $firstLine = $lines[0];
    $delimiter = (substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';
    
    $headers = str_getcsv(array_shift($lines), $delimiter);
    $headers = array_map(function($h) { return $h ? trim($h, '"\' ') : ''; }, $headers);
    
    $col_manager = false;
    $col_client = false;
    $col_sumForUs = false;
    $col_sumForClient = false;
    $col_date = false;
    $col_ourEntity = false;
    
    // Точное совпадение
    foreach ($headers as $index => $header) {
        if (!$header) continue;
        $hl = mb_strtolower(trim($header), 'UTF-8');
        
        if ($hl === 'менеджер' && $col_manager === false) $col_manager = $index;
        if (($hl === 'юр.лицо клиента' || $hl === 'юридическое лицо клиента') && $col_client === false) $col_client = $index;
        if ($hl === 'сумма для нас' && $col_sumForUs === false) $col_sumForUs = $index;
        if ($hl === 'сумма для клиента' && $col_sumForClient === false) $col_sumForClient = $index;
        if ($hl === 'дата' && $col_date === false) $col_date = $index;
        if ($hl === 'наше юр.лицо' && $col_ourEntity === false) $col_ourEntity = $index;
    }
    
    // Если не нашли дату по точному совпадению — ищем по подстроке "дата", но НЕ "дата и время"
    if ($col_date === false) {
        foreach ($headers as $index => $header) {
            if (!$header) continue;
            $hl = mb_strtolower(trim($header), 'UTF-8');
            if ($hl === 'дата' && $col_date === false) $col_date = $index;
        }
    }
    
    if ($col_manager === false || $col_client === false || $col_sumForUs === false) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Не найдены обязательные колонки',
            'found_columns' => $headers,
            'col_manager' => $col_manager,
            'col_client' => $col_client,
            'col_sumForUs' => $col_sumForUs,
            'col_date' => $col_date,
            'col_ourEntity' => $col_ourEntity
        ]);
        exit;
    }
    
    // Удаляем старые данные
    if (!$manager) {
        $stmt = $mysqli->prepare("DELETE FROM kpi_vat_details WHERE year = ? AND month = ?");
        $stmt->bind_param("ss", $year, $month);
        $stmt->execute();
    }
    
    $insert_sql = "INSERT INTO kpi_vat_details 
                   (manager_name, client_name, total_profit, transactions_count, kpi_vat, rate, client_age_months, first_transaction_date, year, month) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $insert_stmt = $mysqli->prepare($insert_sql);
    
    $inserted = 0;
    $skippedNoFaeton = 0;
    $skippedWrongDate = 0;
    $seenClients = [];
    $firstDates = [];
    
    // Первый проход: собираем первые даты
    foreach ($lines as $line) {
        $row = str_getcsv($line, $delimiter);
        
        $ourEntity = $col_ourEntity !== false ? trim($row[$col_ourEntity] ?? '') : '';
        $ourEntityClean = str_replace('"', '', $ourEntity);
        if (mb_stripos($ourEntityClean, 'фаэтон') === false) {
            $skippedNoFaeton++;
            continue;
        }
        
        $managerName = trim($row[$col_manager] ?? '', '"\' ');
        $clientName = trim($row[$col_client] ?? '', '"\' ');
        $clientName = str_replace('"', '', $clientName); // Убираем кавычки
        
        if (empty($managerName) || empty($clientName)) continue;
        if ($manager && $managerName !== $manager) continue;
        
        $dateStr = $col_date !== false ? trim($row[$col_date] ?? '') : '';
        $date = parseDate($dateStr);
        
        if (!$date) {
            $skippedWrongDate++;
            continue;
        }
        
        $rowYear = $date->format('Y');
        $rowMonth = $date->format('m');
        
        if ($rowYear != $year || $rowMonth != $month) continue;
        
        $clientKey = $managerName . '|' . $clientName;
        if (!isset($firstDates[$clientKey]) || $date < $firstDates[$clientKey]) {
            $firstDates[$clientKey] = $date;
        }
    }
    
    // Второй проход: считаем суммы
    foreach ($lines as $line) {
        $row = str_getcsv($line, $delimiter);
        
        $ourEntity = $col_ourEntity !== false ? trim($row[$col_ourEntity] ?? '') : '';
        $ourEntityClean = str_replace('"', '', $ourEntity);
        if (mb_stripos($ourEntityClean, 'фаэтон') === false) continue;
        
        $managerName = trim($row[$col_manager] ?? '', '"\' ');
        $clientName = trim($row[$col_client] ?? '', '"\' ');
        $clientName = str_replace('"', '', $clientName); // Убираем кавычки
        
        if (empty($managerName) || empty($clientName)) continue;
        if ($manager && $managerName !== $manager) continue;
        
        $dateStr = $col_date !== false ? trim($row[$col_date] ?? '') : '';
        $date = parseDate($dateStr);
        if (!$date) continue;
        
        $rowYear = $date->format('Y');
        $rowMonth = $date->format('m');
        if ($rowYear != $year || $rowMonth != $month) continue;
        
        $sumForUs = parseFloat($row[$col_sumForUs] ?? '0');
        $sumForClient = parseFloat($row[$col_sumForClient] ?? '0');
        $totalProfit = $sumForClient - $sumForUs;
        
        $clientKey = $managerName . '|' . $clientName;
        if (!isset($seenClients[$clientKey])) {
            $seenClients[$clientKey] = [
                'totalProfit' => 0,
                'count' => 0,
                'firstDate' => $firstDates[$clientKey] ?? null
            ];
        }
        
        $seenClients[$clientKey]['totalProfit'] += $totalProfit;
        $seenClients[$clientKey]['count']++;
    }
    
    $calcDate = new DateTime("$year-$month-01");
    
    foreach ($seenClients as $clientKey => $data) {
        [$managerName, $clientName] = explode('|', $clientKey, 2);
        
        $totalProfit = $data['totalProfit'];
        $transactionsCount = $data['count'];
        $firstDate = $data['firstDate'];
        
        $ageMonths = 0;
        if ($firstDate) {
            $interval = $calcDate->diff($firstDate);
            $ageMonths = $interval->m + $interval->y * 12;
        }
        
        $rate = $ageMonths < 3 ? 0.25 : 0.025;
        $kpiVat = $totalProfit * $rate;
        $firstDateStr = $firstDate ? $firstDate->format('Y-m-d') : null;
        
        $insert_stmt->bind_param("ssdiddisss",
            $managerName, $clientName, $totalProfit, $transactionsCount,
            $kpiVat, $rate, $ageMonths, $firstDateStr, $year, $month
        );
        
        if ($insert_stmt->execute()) $inserted++;
    }
    
    echo json_encode([
        'success' => true,
        'inserted' => $inserted,
        'skipped_no_faeton' => $skippedNoFaeton,
        'skipped_wrong_date' => $skippedWrongDate,
        'col_date_found' => $col_date !== false,
        'message' => "Загружено $inserted записей"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// DELETE
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $year = $_GET['year'] ?? '';
    $month = $_GET['month'] ?? '';
    
    if (!$year || !$month) {
        http_response_code(400);
        echo json_encode(['error' => 'year и month обязательны']);
        exit;
    }
    
    $stmt = $mysqli->prepare("DELETE FROM kpi_vat_details WHERE year = ? AND month = ?");
    $stmt->bind_param("ss", $year, $month);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Данные удалены']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

function parseFloat($value) {
    if (empty($value)) return 0;
    $clean = str_replace([' ', "\xC2\xA0"], '', trim($value));
    $clean = str_replace(',', '.', $clean);
    return floatval($clean);
}

function parseDate($dateStr) {
    if (empty($dateStr)) return null;
    $clean = trim($dateStr);
    
    if (preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/', $clean, $m)) {
        return new DateTime("{$m[3]}-{$m[2]}-{$m[1]} {$m[4]}:{$m[5]}:{$m[6]}");
    }
    if (preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})/', $clean, $m)) {
        return new DateTime("{$m[3]}-{$m[2]}-{$m[1]}");
    }
    if (is_numeric($clean) && $clean > 40000 && $clean < 100000) {
        return new DateTime('@' . (($clean - 25569) * 86400));
    }
    try {
        return new DateTime($clean);
    } catch (Exception $e) {
        return null;
    }
}