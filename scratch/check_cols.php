<?php
$rows = json_decode(file_get_contents(__DIR__ . '/log_rows.json'), true);

$colsUsed = [];
for ($i = 0; $i < count($rows); $i++) {
    foreach ($rows[$i] as $col => $val) {
        if (trim($val) !== '') {
            $colsUsed[$col] = ($colsUsed[$col] ?? 0) + 1;
        }
    }
}

echo "Columns used in LOG sheet:\n";
print_r($colsUsed);
