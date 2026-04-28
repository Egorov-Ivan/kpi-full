<?php
// src/Controllers/KpiVatController.php
// Обработчик загрузки Excel и расчёта KPI VAT

namespace App\Controllers;

use PhpOffice\PhpSpreadsheet\IOFactory;

class KpiVatController
{
    private $db; // Ваше подключение к БД
    private $clientsFirstTransaction = []; // Кэш дат первых транзакций клиентов
    
    public function __construct($db)
    {
        $this->db = $db;
    }
    
    /**
     * Загрузка файла и расчёт KPI VAT
     */
    public function uploadAndCalculate()
    {
        try {
            // Проверяем загруженный файл
            if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception('Файл не загружен или произошла ошибка загрузки');
            }
            
            $filePath = $_FILES['excel_file']['tmp_name'];
            $year = $_POST['year'] ?? date('Y');
            $month = $_POST['month'] ?? date('m');
            $managerName = $_POST['manager_name'] ?? null; // Опционально: фильтр по менеджеру
            
            // Читаем Excel
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getSheetByName('Транзакции');
            
            if (!$worksheet) {
                // Пробуем первый лист
                $worksheet = $spreadsheet->getActiveSheet();
            }
            
            $rows = $worksheet->toArray();
            
            // Первая строка — заголовки
            $headers = array_shift($rows);
            
            // Ищем индексы нужных колонок
            $columnIndexes = $this->findColumnIndexes($headers);
            
            // Обрабатываем данные
            $managerKpiData = $this->processTransactions($rows, $columnIndexes, $year, $month, $managerName);
            
            // Сохраняем результаты
            $savedId = $this->saveResults($managerKpiData, $year, $month);
            
            return [
                'success' => true,
                'id' => $savedId,
                'data' => $managerKpiData,
                'summary' => $this->getSummary($managerKpiData)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Находит индексы нужных колонок в заголовках
     */
    private function findColumnIndexes($headers)
    {
        $indexes = [
            'manager' => null,        // Менеджер
            'sumForUs' => null,       // Сумма для нас
            'sumForClient' => null,   // Сумма для клиента
            'operation' => null,      // Операция
            'client' => null,         // Юр.лицо клиента
            'date' => null,           // Дата и время записи в CRM
        ];
        
        foreach ($headers as $index => $header) {
            $headerClean = trim(mb_strtolower($header));
            
            if (mb_strpos($headerClean, 'менеджер') !== false) {
                $indexes['manager'] = $index;
            }
            if (mb_strpos($headerClean, 'сумма для нас') !== false) {
                $indexes['sumForUs'] = $index;
            }
            if (mb_strpos($headerClean, 'сумма для клиента') !== false) {
                $indexes['sumForClient'] = $index;
            }
            if (mb_strpos($headerClean, 'операция') !== false) {
                $indexes['operation'] = $index;
            }
            if (mb_strpos($headerClean, 'юр.лицо клиента') !== false || mb_strpos($headerClean, 'юридическое лицо клиента') !== false) {
                $indexes['client'] = $index;
            }
            if (mb_strpos($headerClean, 'дата и время записи') !== false) {
                $indexes['date'] = $index;
            }
        }
        
        // Проверяем, что все индексы найдены
        foreach ($indexes as $key => $value) {
            if ($value === null) {
                throw new \Exception("Не найдена колонка: {$key}");
            }
        }
        
        return $indexes;
    }
    
    /**
     * Обрабатывает транзакции и рассчитывает KPI
     */
    private function processTransactions($rows, $columnIndexes, $year, $month, $filterManager = null)
    {
        $managerClients = []; // Менеджер -> Клиент -> Данные
        
        foreach ($rows as $row) {
            // Пропускаем пустые строки
            if (empty($row[$columnIndexes['manager']])) continue;
            
            $manager = trim($row[$columnIndexes['manager']]);
            
            // Если задан фильтр по менеджеру — пропускаем других
            if ($filterManager && $manager !== $filterManager) continue;
            
            $client = trim($row[$columnIndexes['client']]);
            $operation = trim($row[$columnIndexes['operation']]);
            $sumForUs = floatval($row[$columnIndexes['sumForUs']]);
            $sumForClient = floatval($row[$columnIndexes['sumForClient']]);
            $dateStr = trim($row[$columnIndexes['date']]);
            
            // Проверяем, что дата в нужном месяце
            $date = \DateTime::createFromFormat('Y-m-d H:i:s', $dateStr);
            if (!$date) {
                $date = \DateTime::createFromFormat('d.m.Y H:i:s', $dateStr);
            }
            if (!$date) continue;
            
            if ($date->format('Y') != $year || $date->format('m') != $month) continue;
            
            // Инициализируем структуру данных
            if (!isset($managerClients[$manager])) {
                $managerClients[$manager] = [];
            }
            if (!isset($managerClients[$manager][$client])) {
                $managerClients[$manager][$client] = [
                    'client' => $client,
                    'totalProfit' => 0,          // Общая прибыль
                    'transactionsCount' => 0,    // Количество пополнений
                    'debetsCount' => 0,          // Только дебетовые операции
                    'firstTransactionDate' => null, // Дата первой транзакции
                    'monthTransactions' => [],   // Для отладки
                ];
            }
            
            $clientData = &$managerClients[$manager][$client];
            
            // Запоминаем первую дату транзакции для определения "возраста" клиента
            if ($clientData['firstTransactionDate'] === null || $date < $clientData['firstTransactionDate']) {
                $clientData['firstTransactionDate'] = clone $date;
            }
            
            // Рассчитываем прибыль по операции
            if ($operation === 'Дебет') {
                // Дебет: положительная прибыль
                // Формула: Сумма для нас - Сумма для клиента
                $profit = $sumForUs - $sumForClient;
                $clientData['totalProfit'] += $profit;
                $clientData['debetsCount']++;
            } elseif ($operation === 'Возврат') {
                // Возврат: вычитаем из прибыли
                // Возврат обычно отрицательный в Сумма для нас
                // Но мы просто вычитаем абсолютную разницу
                $profit = $sumForUs - $sumForClient;
                $clientData['totalProfit'] += $profit; // profit будет отрицательным
            }
            
            $clientData['transactionsCount']++;
            $clientData['monthTransactions'][] = [
                'date' => $date->format('Y-m-d H:i:s'),
                'operation' => $operation,
                'sumForUs' => $sumForUs,
                'sumForClient' => $sumForClient,
                'profit' => $profit ?? ($sumForUs - $sumForClient)
            ];
        }
        
        // Рассчитываем KPI для каждого клиента
        foreach ($managerClients as $manager => &$clients) {
            foreach ($clients as $client => &$data) {
                // Определяем возраст клиента (месяцы с первой транзакции)
                $clientAgeMonths = $this->getClientAgeMonths($client, $data['firstTransactionDate'], $year, $month);
                
                // Ставка: 25% для первых 3 месяцев, 2.5% после
                $rate = $clientAgeMonths < 3 ? 0.25 : 0.025;
                
                // KPI VAT = Прибыль * Ставка
                $data['kpiVat'] = $data['totalProfit'] * $rate;
                $data['rate'] = $rate;
                $data['clientAgeMonths'] = $clientAgeMonths;
            }
        }
        
        return $managerClients;
    }
    
    /**
     * Определяет "возраст" клиента в месяцах
     * Возвращает количество полных месяцев с первой транзакции
     */
    private function getClientAgeMonths($clientName, $firstDate, $year, $month)
    {
        // Сначала проверяем в БД, может у клиента были транзакции раньше
        // чем в загруженном файле
        $globalFirstDate = $this->getClientFirstTransactionDate($clientName);
        
        if ($globalFirstDate && $globalFirstDate < $firstDate) {
            $firstDate = $globalFirstDate;
        }
        
        // Создаём дату первого числа расчётного месяца
        $calculationDate = new \DateTime("{$year}-{$month}-01");
        
        // Разница в месяцах
        $interval = $firstDate->diff($calculationDate);
        $months = $interval->y * 12 + $interval->m;
        
        return $months;
    }
    
    /**
     * Получает дату первой транзакции клиента из БД
     */
    private function getClientFirstTransactionDate($clientName)
    {
        // Кэшируем запрос
        if (isset($this->clientsFirstTransaction[$clientName])) {
            return $this->clientsFirstTransaction[$clientName];
        }
        
        // Запрос к вашей БД
        $stmt = $this->db->prepare(
            "SELECT MIN(transaction_date) as first_date 
             FROM transactions 
             WHERE client_name = :client"
        );
        $stmt->execute(['client' => $clientName]);
        $result = $stmt->fetch();
        
        if ($result && $result['first_date']) {
            $this->clientsFirstTransaction[$clientName] = new \DateTime($result['first_date']);
        } else {
            $this->clientsFirstTransaction[$clientName] = null;
        }
        
        return $this->clientsFirstTransaction[$clientName];
    }
    
    /**
     * Сохраняет результаты в таблицу manualKpiVat
     */
    private function saveResults($managerKpiData, $year, $month)
    {
        // Очищаем предыдущие данные за этот период
        $stmt = $this->db->prepare(
            "DELETE FROM manualKpiVat WHERE year = :year AND month = :month"
        );
        $stmt->execute(['year' => $year, 'month' => $month]);
        
        $insertStmt = $this->db->prepare(
            "INSERT INTO manualKpiVat 
             (manager_name, client_name, total_profit, transactions_count, 
              kpi_vat, rate, client_age_months, first_transaction_date, 
              year, month, created_at) 
             VALUES 
             (:manager, :client, :profit, :tx_count, 
              :kpi_vat, :rate, :age_months, :first_date, 
              :year, :month, NOW())"
        );
        
        foreach ($managerKpiData as $manager => $clients) {
            foreach ($clients as $client => $data) {
                $insertStmt->execute([
                    'manager' => $manager,
                    'client' => $client,
                    'profit' => $data['totalProfit'],
                    'tx_count' => $data['transactionsCount'],
                    'kpi_vat' => $data['kpiVat'],
                    'rate' => $data['rate'],
                    'age_months' => $data['clientAgeMonths'],
                    'first_date' => $data['firstTransactionDate'] ? $data['firstTransactionDate']->format('Y-m-d') : null,
                    'year' => $year,
                    'month' => $month
                ]);
            }
        }
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Получает сводку по всем менеджерам
     */
    private function getSummary($managerKpiData)
    {
        $summary = [];
        
        foreach ($managerKpiData as $manager => $clients) {
            $totalProfit = 0;
            $totalKpi = 0;
            $totalTransactions = 0;
            
            foreach ($clients as $client => $data) {
                $totalProfit += $data['totalProfit'];
                $totalKpi += $data['kpiVat'];
                $totalTransactions += $data['transactionsCount'];
            }
            
            $summary[] = [
                'manager' => $manager,
                'clientsCount' => count($clients),
                'totalProfit' => $totalProfit,
                'totalKpiVat' => $totalKpi,
                'totalTransactions' => $totalTransactions
            ];
        }
        
        return $summary;
    }
    
    /**
     * Получает сохранённые данные для отображения
     */
    public function getSavedData($year, $month, $managerName = null)
    {
        $sql = "SELECT * FROM manualKpiVat WHERE year = :year AND month = :month";
        $params = ['year' => $year, 'month' => $month];
        
        if ($managerName) {
            $sql .= " AND manager_name = :manager";
            $params['manager'] = $managerName;
        }
        
        $sql .= " ORDER BY manager_name, kpi_vat DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
}