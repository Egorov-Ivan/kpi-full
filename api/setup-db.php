<?php
header('Content-Type: application/json; charset=utf-8');

$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");
$mysqli->set_charset("utf8");

// Создание таблиц
$queries = [
    "CREATE TABLE IF NOT EXISTS client_first_dates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL UNIQUE,
        first_transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS kpi_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(255) NOT NULL UNIQUE,
        value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS kpi_received_clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client VARCHAR(500) NOT NULL,
        manager_name VARCHAR(500) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    )",
    "CREATE TABLE IF NOT EXISTS kpi_vat_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        total_profit DECIMAL(15,2) DEFAULT 0,
        transactions_count INT DEFAULT 0,
        kpi_vat DECIMAL(15,2) DEFAULT 0,
        rate DECIMAL(5,4) DEFAULT 0,
        client_age_months INT DEFAULT 0,
        first_transaction_date DATE,
        year INT NOT NULL,
        month VARCHAR(2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

foreach ($queries as $sql) {
    if ($mysqli->query($sql)) {
        echo "OK: " . substr($sql, 0, 50) . "...\n";
    } else {
        echo "ERROR: " . $mysqli->error . "\n";
    }
}

echo "\nAll tables created!";
$mysqli->close();