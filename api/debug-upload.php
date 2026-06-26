<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tmpFile = $_FILES['file']['tmp_name'];
    $content = file_get_contents($tmpFile);
    
    // Первые 500 символов в HEX
    $hex = bin2hex(substr($content, 0, 100));
    
    // Первые 200 символов как есть
    $preview = substr($content, 0, 200);
    
    // Пробуем разные кодировки
    $asUtf8 = mb_convert_encoding($preview, 'UTF-8', 'Windows-1251');
    $asCp1251 = mb_convert_encoding($preview, 'UTF-8', 'CP1251');
    
    echo json_encode([
        'success' => true,
        'hex_first_100' => $hex,
        'raw_preview' => $preview,
        'as_utf8_from_1251' => $asUtf8,
        'as_utf8_from_cp1251' => $asCp1251,
        'is_utf8' => mb_check_encoding($content, 'UTF-8') ? 'yes' : 'no'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
<form method="POST" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">Загрузить</button>
</form>