<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8mb4");

// GET — загрузить настройки
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $settings = [];
    
    $result = $mysqli->query("SELECT `key`, `value` FROM kpi_settings ORDER BY `key`");
    while ($row = $result->fetch_assoc()) {
        $decoded = json_decode($row['value'], true);
        $settings[$row['key']] = $decoded ?: $row['value'];
    }
    
    $selectedYear = $settings['selectedYear'] ?? date('Y');
    $selectedMonth = $settings['selectedMonth'] ?? date('m');
    
    $approvedManagers = [];
    $result = $mysqli->query("SELECT manager_id, year, month, approved FROM kpi_approvals");
    while ($row = $result->fetch_assoc()) {
        $key = "{$row['year']}-{$row['month']}";
        if (!isset($approvedManagers[$key])) $approvedManagers[$key] = [];
        $approvedManagers[$key][$row['manager_id']] = (bool)$row['approved'];
    }
    if (!empty($approvedManagers)) {
        $settings['approvedManagers'] = $approvedManagers;
    }
    
    $customBonusStatus = [];
    $result = $mysqli->query("SELECT client_name, manager_name, year, month, status, bonus_month FROM kpi_client_statuses");
    while ($row = $result->fetch_assoc()) {
        $key = "{$row['year']}-{$row['month']}";
        if (!isset($customBonusStatus[$key])) $customBonusStatus[$key] = [];
        $clientKey = $row['client_name'] . '_' . $row['manager_name'];
        $customBonusStatus[$key][$clientKey] = [
            'status' => $row['status'] ?: 'НЕТ',
            'bonusMonth' => $row['bonus_month']
        ];
    }
    if (!empty($customBonusStatus)) {
        $settings['customBonusStatus'] = $customBonusStatus;
    }
    
    $result = $mysqli->query("SELECT * FROM kpi_manager_settings WHERE year = '$selectedYear' AND month = '$selectedMonth'");
    $selectedRate = [];
    $selectedKpiRate = [];
    $manualKpiVat = [];
    $managerKpiValues = [];
    
    while ($row = $result->fetch_assoc()) {
        $mid = $row['manager_id'];
        $monthKey = "{$row['year']}-{$row['month']}";
        
        $selectedRate[$mid] = (float)$row['rate_maintenance'];
        $selectedKpiRate[$mid] = (float)$row['rate_kpi'];
        $managerKpiValues[$mid] = (float)$row['kpi_no_vat'];
        $manualKpiVat[$mid] = (float)$row['kpi_vat'];
        
        if (!isset($manualKpiVat[$monthKey])) $manualKpiVat[$monthKey] = [];
        $manualKpiVat[$monthKey][$mid] = (float)$row['kpi_vat'];
    }
    
    if (!empty($selectedRate)) $settings['selectedRate'] = $selectedRate;
    if (!empty($selectedKpiRate)) $settings['selectedKpiRate'] = $selectedKpiRate;
    if (!empty($manualKpiVat)) $settings['manualKpiVat'] = $manualKpiVat;
    if (!empty($managerKpiValues)) $settings['managerKpiValues'] = $managerKpiValues;
    
    echo json_encode([
        'success' => true, 
        'settings' => $settings,
        'lastUpdate' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// PUT — пакетное сохранение
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['settings']) || !is_array($data['settings'])) {
        http_response_code(400);
        echo json_encode(['error' => 'settings object is required']);
        exit;
    }
    
    $success = true;
    $settings = $data['settings'];
    $currentYear = $settings['selectedYear'] ?? date('Y');
    $currentMonth = $settings['selectedMonth'] ?? date('m');
    
    foreach ($settings as $key => $value) {
        // 1. approvedManagers → kpi_approvals
        if ($key === 'approvedManagers') {
            foreach ($value as $monthKey => $managers) {
                if (is_array($managers)) {
                    [$year, $month] = explode('-', $monthKey);
                    foreach ($managers as $managerId => $approved) {
                        $stmt = $mysqli->prepare("INSERT INTO kpi_approvals (manager_id, year, month, approved) 
                                                  VALUES (?, ?, ?, ?) 
                                                  ON DUPLICATE KEY UPDATE approved = VALUES(approved)");
                        $app = $approved ? 1 : 0;
                        $stmt->bind_param("sssi", $managerId, $year, $month, $app);
                        if (!$stmt->execute()) $success = false;
                    }
                }
            }
            continue;
        }
        
        // 2. customBonusStatus → kpi_client_statuses
        if ($key === 'customBonusStatus') {
            foreach ($value as $monthKey => $clients) {
                if (is_array($clients)) {
                    [$year, $month] = explode('-', $monthKey);
                    foreach ($clients as $clientKey => $statusData) {
                        $lastUnderscore = strrpos($clientKey, '_');
                        $clientName = substr($clientKey, 0, $lastUnderscore);
                        $managerName = substr($clientKey, $lastUnderscore + 1);
                        
                        $stmt = $mysqli->prepare("INSERT INTO kpi_client_statuses (client_name, manager_name, year, month, status, bonus_month) 
                                                  VALUES (?, ?, ?, ?, ?, ?) 
                                                  ON DUPLICATE KEY UPDATE status = VALUES(status), bonus_month = VALUES(bonus_month)");
                        $status = $statusData['status'] ?? 'ДА';
                        $bonusMonth = $statusData['bonusMonth'] ?? null;
                        $stmt->bind_param("ssssss", $clientName, $managerName, $year, $month, $status, $bonusMonth);
                        if (!$stmt->execute()) $success = false;
                    }
                }
            }
            continue;
        }
        
        // 3. manualKpiVat → kpi_manager_settings
        if ($key === 'manualKpiVat') {
            foreach ($value as $managerId => $val) {
                // Если вложенный объект за текущий месяц — берём значения оттуда
                if (is_array($val) && $managerId === "$currentYear-$currentMonth") {
                    foreach ($val as $mid => $v) {
                        if (!is_array($v) && is_numeric($v)) {
                            if (!saveManagerSetting($mysqli, $mid, $currentYear, $currentMonth, 'kpi_vat', (float)$v)) {
                                $success = false;
                            }
                        }
                    }
                    continue;
                }
                
                // Обычное числовое значение
                if (!is_array($val) && is_numeric($val)) {
                    if (!saveManagerSetting($mysqli, $managerId, $currentYear, $currentMonth, 'kpi_vat', (float)$val)) {
                        $success = false;
                    }
                }
            }
            continue;
        }
        
        // 4. selectedRate, selectedKpiRate, managerKpiValues → kpi_manager_settings
        if (in_array($key, ['selectedRate', 'selectedKpiRate', 'managerKpiValues'])) {
            $fieldMap = [
                'selectedRate' => 'rate_maintenance',
                'selectedKpiRate' => 'rate_kpi',
                'managerKpiValues' => 'kpi_no_vat'
            ];
            $field = $fieldMap[$key];
            
            foreach ($value as $managerId => $val) {
                if (is_array($val)) continue;
                if (!saveManagerSetting($mysqli, $managerId, $currentYear, $currentMonth, $field, (float)$val)) {
                    $success = false;
                }
            }
            continue;
        }
        
        // 5. Остальное → kpi_settings
        $valueStr = is_array($value) || is_object($value) 
            ? json_encode($value, JSON_UNESCAPED_UNICODE) 
            : $value;
        
        $stmt = $mysqli->prepare("INSERT INTO kpi_settings (`key`, `value`) VALUES (?, ?) 
                                  ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
        $stmt->bind_param("ss", $key, $valueStr);
        if (!$stmt->execute()) $success = false;
    }
    
    echo json_encode(['success' => $success]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

function saveManagerSetting($mysqli, $managerId, $year, $month, $field, $value) {
    $check = $mysqli->query("SELECT * FROM kpi_manager_settings WHERE manager_id = '$managerId' AND year = '$year' AND month = '$month'");
    $exists = $check->fetch_assoc();
    
    $rate_m = $exists['rate_maintenance'] ?? 0.0015;
    $rate_k = $exists['rate_kpi'] ?? 0.015;
    $vat = $exists['kpi_vat'] ?? 0;
    $no_vat = $exists['kpi_no_vat'] ?? 0;
    
    if ($field === 'kpi_vat') $vat = $value;
    if ($field === 'kpi_no_vat') $no_vat = $value;
    if ($field === 'rate_maintenance') $rate_m = $value;
    if ($field === 'rate_kpi') $rate_k = $value;
    
    $stmt = $mysqli->prepare("INSERT INTO kpi_manager_settings (manager_id, year, month, rate_maintenance, rate_kpi, kpi_vat, kpi_no_vat) 
                              VALUES (?, ?, ?, ?, ?, ?, ?) 
                              ON DUPLICATE KEY UPDATE {$field} = VALUES({$field})");
    $stmt->bind_param("sssdddd", $managerId, $year, $month, $rate_m, $rate_k, $vat, $no_vat);
    return $stmt->execute();
}