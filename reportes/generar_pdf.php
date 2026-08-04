<?php
/**
 * MÓDULO GENERADOR DE REPORTES PDF IMPRESOS DE ALMACÉN
 */

require_once __DIR__ . '/../configuracion/config.php';
require_once __DIR__ . '/../modelo/Consumible.php';

$items = Consumible::obtenerTodos();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte General de Almacén</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2 { text-align: center; color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body onload="window.print()">
    <h2>ALMACÉN TI - REPORTE OFICIAL DE INVENTARIO</h2>
    <p>Fecha de impresión: <?php echo date('d/m/Y H:i'); ?></p>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Consumible</th>
                <th>Categoría</th>
                <th>Entrada Ini.</th>
                <th>Entradas</th>
                <th>Salidas</th>
                <th>Stock</th>
                <th>Ubicación</th>
            </tr>
        </thead>
        <tbody>
            <?php if ($items): foreach ($items as $i): ?>
            <tr>
                <td>#<?php echo $i['id']; ?></td>
                <td><?php echo htmlspecialchars($i['item']); ?></td>
                <td><?php echo htmlspecialchars($i['categoria']); ?></td>
                <td><?php echo $i['entrada_inicial']; ?></td>
                <td><?php echo $i['entrada']; ?></td>
                <td><?php echo $i['salida']; ?></td>
                <td><strong><?php echo $i['stock']; ?></strong></td>
                <td><?php echo htmlspecialchars($i['ubicacion']); ?></td>
            </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</body>
</html>
