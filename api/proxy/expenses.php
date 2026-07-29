<?php
// api/proxy/expenses.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supplier = $_GET['supplier'] ?? null;

if (!$supplier) {
    http_response_code(400);
    echo json_encode(['error' => 'Параметр supplier обязателен'], JSON_UNESCAPED_UNICODE);
    exit;
}

$dateStart = $_GET['dateStart'] ?? date('d-m-Y', strtotime('-30 days'));
$dateEnd = $_GET['dateEnd'] ?? null;
$field = $_GET['field'] ?? 'sumPos';
$token = '166505488e486efa91e411cb05f7886a';

$postBody = ['dateStart' => $dateStart];

$ch = curl_init('https://api.benzigo.ru/transactions/listADR/');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postBody));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'accessToken: ' . $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response;
    exit;
}

$data = json_decode($response, true);
$transactions = $data['transactions'] ?? [];

if ($supplier !== 'all') {
    $transactions = array_filter($transactions, function ($tx) use ($supplier) {
        if (!is_array($tx)) return false;
        return ($tx['agregator'] ?? '') === $supplier;
    });
}

if ($dateEnd) {
    $endParts = explode('-', $dateEnd);
    $endDate = $endParts[2] . '-' . $endParts[1] . '-' . $endParts[0];
    
    $transactions = array_filter($transactions, function ($tx) use ($endDate) {
        if (!is_array($tx)) return false;
        $txDate = substr($tx['date'] ?? '', 0, 10);
        return $txDate <= $endDate;
    });
}

// Группировка по дням
$dailyValues = [];
$totalValue = 0;
$lastDate = null;

foreach ($transactions as $tx) {
    if (!is_array($tx)) continue;

    $date = substr($tx['date'] ?? '', 0, 10);
    $value = floatval($tx[$field] ?? 0);

    if (!isset($dailyValues[$date])) {
        $dailyValues[$date] = 0;
    }
    $dailyValues[$date] += $value;
    $totalValue += $value;

    if (!$lastDate || ($tx['date'] ?? '') > $lastDate) {
        $lastDate = $tx['date'];
    }
}

ksort($dailyValues);

$chartData = [];
foreach ($dailyValues as $date => $value) {
    $chartData[] = [$date, round($value, 2)];
}

http_response_code(200);
echo json_encode([
    'supplier'    => $supplier,
    'field'       => $field,
    'totalValue'  => round($totalValue, 2),
    'lastUpdated' => $lastDate,
    'count'       => count($transactions),
    'chartData'   => $chartData
], JSON_UNESCAPED_UNICODE);