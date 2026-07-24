<?php
// api/test-xlsx.php

function parseXlsx($file) {
    $zip = new ZipArchive();
    if ($zip->open($file) !== true) {
        throw new Exception('Не удалось открыть XLSX (не ZIP-архив)');
    }
    
    // Читаем Shared Strings
    $sharedStrings = [];
    $ssPaths = ['xl/sharedStrings.xml', 'xl/SharedStrings.xml'];
    foreach ($ssPaths as $path) {
        if ($ssXml = $zip->getFromName($path)) {
            $sxml = simplexml_load_string($ssXml);
            foreach ($sxml->si as $si) {
                $text = '';
                if (isset($si->t)) {
                    $text = (string)$si->t;
                } elseif (isset($si->r)) {
                    foreach ($si->r as $r) {
                        $text .= (string)$r->t;
                    }
                }
                $sharedStrings[] = $text;
            }
            break;
        }
    }
    
    // Ищем лист
    $sheetXml = null;
    $sheetPaths = [
        'xl/worksheets/sheet1.xml',
        'xl/worksheets/sheet.xml',
        'xl/worksheet/sheet1.xml'
    ];
    foreach ($sheetPaths as $path) {
        $sheetXml = $zip->getFromName($path);
        if ($sheetXml) break;
    }
    
    if (!$sheetXml) {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (strpos($name, 'sheet') !== false && strpos($name, '.xml') !== false) {
                $sheetXml = $zip->getFromName($name);
                break;
            }
        }
    }
    
    if (!$sheetXml) {
        $files = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $files[] = $zip->getNameIndex($i);
        }
        $zip->close();
        throw new Exception('Не найден лист. Файлы в архиве: ' . implode(', ', $files));
    }
    
    $sxml = simplexml_load_string($sheetXml);
    
    $rows = [];
    foreach ($sxml->sheetData->row as $row) {
        $rowData = [];
        
        foreach ($row->c as $cell) {
            $value = (string)$cell->v;
            $type = (string)$cell['t'];
            $ref = (string)$cell['r'];
            
            // Определяем номер колонки
            $col = 0;
            if ($ref) {
                $colLetter = preg_replace('/[0-9]/', '', $ref);
                $col = 0;
                for ($j = 0; $j < strlen($colLetter); $j++) {
                    $col = $col * 26 + (ord($colLetter[$j]) - 64);
                }
                $col--;
            }
            
            // Заполняем пропущенные колонки
            while (count($rowData) < $col) {
                $rowData[] = '';
            }
            
            if ($type === 's' && isset($sharedStrings[(int)$value])) {
                $rowData[] = $sharedStrings[(int)$value];
            } elseif ($type === 'inlineStr') {
                $rowData[] = (string)$cell->is->t;
            } else {
                $rowData[] = $value;
            }
        }
        
        if (!empty($rowData)) {
            $rows[] = $rowData;
        }
    }
    
    $zip->close();
    return $rows;
}

// Основная логика
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'Файл не загружен', 'code' => $_FILES['file']['error'] ?? 'no file']);
        exit;
    }
    
    $tmpFile = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    try {
        if ($ext === 'xlsx') {
            $rows = parseXlsx($tmpFile);
        } elseif ($ext === 'csv') {
            $content = file_get_contents($tmpFile);
            if (!mb_check_encoding($content, 'UTF-8')) {
                $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1251');
            }
            $lines = explode("\n", $content);
            $rows = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (!empty($line)) {
                    $rows[] = str_getcsv($line, ';');
                }
            }
        } else {
            echo json_encode(['error' => 'Поддерживаются только .xlsx и .csv']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'file_name' => $fileName,
            'extension' => $ext,
            'total_rows' => count($rows),
            'headers' => $rows[0] ?? [],
            'first_data_row' => $rows[1] ?? [],
            'second_data_row' => $rows[2] ?? [],
            'last_data_row' => end($rows) ?? [],
            'sample_10_rows' => array_slice($rows, 0, 10)
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Если GET — показываем форму
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Тест XLSX парсера</title>
    <style>
        body { font-family: Arial; max-width: 900px; margin: 20px auto; padding: 20px; }
        h1 { color: #333; }
        .result { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
        pre { background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
        input, button { padding: 10px; margin: 10px 0; }
        button { background: #1976D2; color: white; border: none; cursor: pointer; border-radius: 4px; }
        button:hover { background: #1565C0; }
    </style>
</head>
<body>
    <h1>🧪 Тест парсера XLSX</h1>
    <p>Загрузите файл .xlsx или .csv для проверки парсера</p>
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="file" accept=".xlsx,.csv" required>
        <button type="submit">Загрузить и протестировать</button>
    </form>
</body>
</html>