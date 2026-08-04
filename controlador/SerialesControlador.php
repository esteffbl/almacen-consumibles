<?php
/**
 * CONTROLADOR: SerialesControlador
 * Endpoint REST API para la gestión de equipos por serial
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../modelo/EquipoSerial.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $seriales = EquipoSerial::obtenerTodos();
        if ($seriales !== false) {
            echo json_encode($seriales);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error de conexión."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (EquipoSerial::guardar($datos)) {
            echo json_encode(["exito" => true, "mensaje" => "Equipo serializado guardado."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar el equipo."]);
        }
        break;

    case 'DELETE':
        $serial = $_GET['serial'] ?? null;
        if ($serial && EquipoSerial::eliminar($serial)) {
            echo json_encode(["exito" => true, "mensaje" => "Equipo eliminado."]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Serial requerido."]);
        }
        break;
}
?>
