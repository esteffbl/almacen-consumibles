<?php
/**
 * CLASE MODELO: EquipoSerial
 * Maneja el seguimiento de equipos físicos individuales por Número de Serial
 */

require_once __DIR__ . '/../configuracion/conexion.php';

class EquipoSerial {

    public static function obtenerTodos() {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("SELECT * FROM equipos_serializados ORDER BY created_at DESC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function obtenerPorSerial($serial) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("SELECT * FROM equipos_serializados WHERE serial = ?");
        $stmt->execute([$serial]);
        return $stmt->fetch();
    }

    public static function guardar($datos) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $sql = "INSERT INTO equipos_serializados (serial, item_id, tipo, marca, modelo, estado, asignado_a, ubicacion)
                VALUES (:serial, :item_id, :tipo, :marca, :modelo, :estado, :asignado_a, :ubicacion)
                ON DUPLICATE KEY UPDATE
                    tipo = VALUES(tipo),
                    marca = VALUES(marca),
                    modelo = VALUES(modelo),
                    estado = VALUES(estado),
                    asignado_a = VALUES(asignado_a),
                    ubicacion = VALUES(ubicacion)";

        $stmt = $db->prepare($sql);
        return $stmt->execute([
            ':serial' => $datos['serial'],
            ':item_id' => $datos['item_id'] ?? null,
            ':tipo' => $datos['tipo'],
            ':marca' => $datos['marca'] ?? '',
            ':modelo' => $datos['modelo'] ?? '',
            ':estado' => $datos['estado'] ?? 'Disponible',
            ':asignado_a' => $datos['asignado_a'] ?? '-',
            ':ubicacion' => $datos['ubicacion'] ?? 'Almacén Principal'
        ]);
    }

    public static function eliminar($serial) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("DELETE FROM equipos_serializados WHERE serial = ?");
        return $stmt->execute([$serial]);
    }
}
?>
