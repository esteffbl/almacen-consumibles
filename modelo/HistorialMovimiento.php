<?php
/**
 * CLASE MODELO: HistorialMovimiento
 * Maneja el registro de movimientos e inspecciones de inventario
 */

require_once __DIR__ . '/../configuracion/conexion.php';

class HistorialMovimiento {

    public static function obtenerHistorial() {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("SELECT * FROM movimientos_historial ORDER BY fecha_hora DESC LIMIT 200");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function registrar($datos) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $sql = "INSERT INTO movimientos_historial (item_id, item_nombre, tipo_operacion, cambio, stock_resultante, notas)
                VALUES (:item_id, :item_nombre, :tipo_operacion, :cambio, :stock_resultante, :notas)";

        $stmt = $db->prepare($sql);
        return $stmt->execute([
            ':item_id' => $datos['item_id'],
            ':item_nombre' => $datos['item_nombre'],
            ':tipo_operacion' => $datos['tipo_operacion'],
            ':cambio' => $datos['cambio'],
            ':stock_resultante' => $datos['stock_resultante'],
            ':notas' => $datos['notas'] ?? ''
        ]);
    }
}
?>
