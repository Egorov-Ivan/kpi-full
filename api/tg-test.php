<?php
$ch = curl_init('https://api.telegram.org/bot8541381384:AAEhl3oS5s2eO-NUNNvL7RyCZV0YEZRw2EM/getMe');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$r = curl_exec($ch);
curl_close($ch);
echo $r;