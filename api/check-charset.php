<?php
header('Content-Type: text/plain; charset=utf-8');
$mysqli = new mysqli("localhost", "u2192811_workbenzigo", "aO7xM3vR5shY8lL6", "u2192811_workbenzigo");

$result = $mysqli->query("SHOW CREATE TABLE kpi_client_statuses");
$row = $result->fetch_assoc();
echo $row['Create Table'];