<?php
/**
 * CONTROLADOR: ConsumiblesControlador
 * Endpoint REST API de procesamiento para inventario general
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../modelo/Consumible.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $consumibles = Consumible::obtenerTodos();
        if ($consumibles !== false) {
            echo json_encode($consumibles);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo conectar a la base de datos MySQL."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (Consumible::guardar($datos)) {
            echo json_encode(["exito" => true, "mensaje" => "Consumible guardado."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar consumible."]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id && Consumible::eliminar($id)) {
            echo json_encode(["exito" => true, "mensaje" => "Consumible eliminado."]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID requerido."]);
        }
        break;
}
?>
