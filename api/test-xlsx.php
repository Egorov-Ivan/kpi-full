<?php
// api/test-xlsx.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'Файл не загружен', 'code' => $_FILES['file']['error'] ?? 'no file']);
        exit;
    }
    
    $tmpFile = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    echo json_encode([
        'success' => true,
        'file_name' => $fileName,
        'file_size' => filesize($tmpFile),
        'extension' => $ext,
        'rows' => []
    ]);
    
    try {
        if ($ext === 'xlsx') {
            $rows = parseXlsx($tmpFile);
        } elseif ($ext === 'csv') {
            $content = file_get_contents($tmpFile);
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1251');
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
            'first_row' => $rows[1] ?? [],
            'second_row' => $rows[2] ?? [],
            'last_row' => end($rows) ?? []
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
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
        pre { background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; }
        input, button { padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🧪 Тест парсера XLSX</h1>
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="file" accept=".xlsx,.csv">
        <button type="submit">Загрузить и протестировать</button>
    </form>
    
    <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
    <div class="result">
        <h3>Результат:</h3>
        <pre><?php echo htmlspecialchars($response ?? '', ENT_QUOTES, 'UTF-8'); ?></pre>
    </div>
    <?php endif; ?>
</body>
</html>

<?php
function parseXlsx($file) {
    $zip = new ZipArchive();
    if ($zip->open($file) !== true) {
        throw new Exception('Не удалось открыть XLSX (не ZIP-архив)');
    }
    
    // Покажем что внутри ZIP
    $files = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $files[] = $zip->getNameIndex($i);
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
        // Ищем любой sheet*.xml
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (strpos($name, 'sheet') !== false && strpos($name, '.xml') !== false) {
                $sheetXml = $zip->getFromName($name);
                break;
            }
        }
    }
    
    if (!$sheetXml) {
        $zip->close();
        throw new Exception('Не найден лист. Файлы в архиве: ' . implode(', ', $files));
    }
    
    $sxml = simplexml_load_string($sheetXml);
    
    $rows = [];
    foreach ($sxml->sheetData->row as $row) {
        $rowData = [];
        $prevCol = 0;
        
        foreach ($row->c as $cell) {
            $value = (string)$cell->v;
            $type = (string)$cell['t'];
            
            // Определяем колонку
            $col = $prevCol;
            $ref = (string)$cell['r'];
            if ($ref) {
                $col = preg_replace('/[0-9]/', '', $ref);
                $col = ord($col) - 65; // A=0, B=1, ...
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
            
            $prevCol = $col + 1;
        }
        
        $rows[] = $rowData;
    }
    
    $zip->close();
    return $rows;
}