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

// supplier → agregator
$supplierMap = [
    'rncard' => 'РН',
    'licard' => 'ЛК',
    'natcar' => 'НК',
];

$agregator = $supplierMap[$supplier] ?? $supplier;
$token = '166505488e486efa91e411cb05f7886a';

$ch = curl_init('https://api.benzigo.ru/transactions/listADR/');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
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
$transactions = is_array($data) ? $data : ($data['data'] ?? $data['transactions'] ?? []);

// Фильтруем по агрегатору
$filtered = array_filter($transactions, function ($tx) use ($agregator) {
    return ($tx['agregator'] ?? '') === $agregator;
});

// Группируем расходы (sumforclient) по дням
$dailyExpenses = [];
$totalExpenses = 0;
$lastDate = null;

foreach ($filtered as $tx) {
    $date = substr($tx['date'] ?? '', 0, 10);
    $expense = floatval($tx['sumforclient'] ?? 0);

    if (!isset($dailyExpenses[$date])) {
        $dailyExpenses[$date] = 0;
    }
    $dailyExpenses[$date] += $expense;
    $totalExpenses += $expense;

    if (!$lastDate || ($tx['date'] ?? '') > $lastDate) {
        $lastDate = $tx['date'];
    }
}

ksort($dailyExpenses);

// Формируем для Highcharts: [[date, amount], ...]
$chartData = [];
foreach ($dailyExpenses as $date => $expense) {
    $chartData[] = [$date, round($expense, 2)];
}

http_response_code(200);
echo json_encode([
    'supplier'      => $supplier,
    'agregator'     => $agregator,
    'totalExpenses' => round($totalExpenses, 2),
    'lastUpdated'   => $lastDate,
    'count'         => count($filtered),
    'chartData'     => $chartData
], JSON_UNESCAPED_UNICODE);