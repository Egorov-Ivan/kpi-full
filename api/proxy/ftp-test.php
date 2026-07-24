<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$conn = @ftp_connect('ftp.benzigo.ru', 21, 10);
if (!$conn) {
    die('FTP connection failed');
}
echo "Connected\n";

if (!@ftp_login($conn, 'benzigo_robot', 'rI8jS6kE3h')) {
    ftp_close($conn);
    die('FTP login failed');
}
echo "Logged in\n";

ftp_pasv($conn, true);
echo "Passive mode\n";

// Проверим список файлов
$files = ftp_nlist($conn, '/prod/inbound');
if ($files === false) {
    echo "Cannot list /prod/inbound\n";
} else {
    echo "Files in /prod/inbound:\n";
    print_r($files);
}

ftp_close($conn);
echo "Done";