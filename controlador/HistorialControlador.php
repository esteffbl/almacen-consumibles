<?php
/**
 * CONTROLADOR: HistorialControlador
 * Endpoint REST API para consulta y registro de kárdex
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../modelo/HistorialMovimiento.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $historial = HistorialMovimiento::obtenerHistorial();
    echo json_encode($historial !== false ? $historial : []);
} elseif ($metodo === 'POST') {
    $datos = json_decode(file_get_contents("php://input"), true);
    if (HistorialMovimiento::registrar($datos)) {
        echo json_encode(["exito" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error al registrar movimiento."]);
    }
}
?>
