<?php
header('Content-Type: application/json');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

$sqls = [
    "CREATE TABLE IF NOT EXISTS kpi_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_id VARCHAR(50) NOT NULL,
        year VARCHAR(4) NOT NULL,
        month VARCHAR(2) NOT NULL,
        approved TINYINT(1) DEFAULT 0,ы
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_approval (manager_id, year, month)
    )",
    
    "CREATE TABLE IF NOT EXISTS kpi_client_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(500) NOT NULL,
        manager_name VARCHAR(500) NOT NULL,
        year VARCHAR(4) NOT NULL,
        month VARCHAR(2) NOT NULL,
        status ENUM('ДА', 'БЫЛ', 'НЕТ') NOT NULL DEFAULT 'ДА',
        bonus_month VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_client_status (client_name, manager_name, year, month)
    )",
    
    "CREATE TABLE IF NOT EXISTS kpi_manager_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_id VARCHAR(50) NOT NULL,
        year VARCHAR(4) NOT NULL,
        month VARCHAR(2) NOT NULL,
        rate_maintenance DECIMAL(5,4) DEFAULT 0.0015,
        rate_kpi DECIMAL(5,4) DEFAULT 0.015,
        kpi_vat DECIMAL(10,2) DEFAULT 0,
        kpi_no_vat DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_manager_month (manager_id, year, month)
    )"
];

$results = [];
foreach ($sqls as $sql) {
    if ($mysqli->query($sql)) {
        $results[] = "OK";
    } else {
        $results[] = $mysqli->error;
    }
}

echo json_encode(['success' => true, 'results' => $results]);