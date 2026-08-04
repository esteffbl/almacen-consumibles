<?php
/**
 * ALERTA AUTOMÁTICA DE STOCK BAJO
 */

require_once __DIR__ . '/../modelo/Consumible.php';

$consumibles = Consumible::obtenerTodos();
$alertas = [];

if ($consumibles) {
    foreach ($consumibles as $c) {
        if ($c['stock'] <= $c['min_stock']) {
            $alertas[] = "CRÍTICO: " . $c['item'] . " tiene stock " . $c['stock'] . " (Mínimo: " . $c['min_stock'] . ")";
        }
    }
}

header("Content-Type: application/json");
echo json_encode([
    "total_alertas" => count($alertas),
    "alertas" => $alertas
]);
?>
