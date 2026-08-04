<?php
$rows = json_decode(file_get_contents(__DIR__ . '/log_rows.json'), true);
echo "Total rows: " . count($rows) . "\n\n";

$movementTypes = [];
$sampleMovements = [];

for ($i = 1; $i < count($rows); $i++) {
    $r = $rows[$i];
    $tipo = isset($r['F']) ? trim($r['F']) : '';
    if ($tipo !== '') {
        $movementTypes[$tipo] = ($movementTypes[$tipo] ?? 0) + 1;
    }
    if ($tipo !== 'ENTRADA INICIAL' && $tipo !== '') {
        $sampleMovements[] = [
            'row' => $i,
            'ruta' => $r['A'] ?? '',
            'desc' => $r['B'] ?? '',
            'marca' => $r['C'] ?? '',
            'modelo' => $r['D'] ?? '',
            'obs' => $r['E'] ?? '',
            'tipo' => $r['F'] ?? '',
            'cant' => $r['G'] ?? '',
            'solic' => $r['H'] ?? '',
            'fecha' => $r['I'] ?? ''
        ];
    }
}

echo "Movement types summary:\n";
print_r($movementTypes);

echo "\nSample non-initial movements (total " . count($sampleMovements) . "):\n";
for ($j = 0; $j < min(20, count($sampleMovements)); $j++) {
    print_r($sampleMovements[$j]);
}
