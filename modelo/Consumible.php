<?php
/**
 * CLASE MODELO: Consumible
 * Maneja las consultas a la tabla 'consumibles' en MySQL
 */

require_once __DIR__ . '/../configuracion/conexion.php';

class Consumible {
    
    public static function obtenerTodos() {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("SELECT * FROM consumibles ORDER BY CAST(id AS UNSIGNED) ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function obtenerPorId($id) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("SELECT * FROM consumibles WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public static function guardar($datos) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $sql = "INSERT INTO consumibles (id, item, categoria, entrada_inicial, entrada, salida, stock, min_stock, ubicacion)
                VALUES (:id, :item, :categoria, :entrada_inicial, :entrada, :salida, :stock, :min_stock, :ubicacion)
                ON DUPLICATE KEY UPDATE
                    item = VALUES(item),
                    categoria = VALUES(categoria),
                    entrada_inicial = VALUES(entrada_inicial),
                    entrada = VALUES(entrada),
                    salida = VALUES(salida),
                    stock = VALUES(stock),
                    min_stock = VALUES(min_stock),
                    ubicacion = VALUES(ubicacion)";

        $stmt = $db->prepare($sql);
        return $stmt->execute([
            ':id' => $datos['id'],
            ':item' => $datos['item'],
            ':categoria' => $datos['categoria'] ?? 'Consumibles Generales',
            ':entrada_inicial' => $datos['entrada_inicial'] ?? 0,
            ':entrada' => $datos['entrada'] ?? 0,
            ':salida' => $datos['salida'] ?? 0,
            ':stock' => $datos['stock'],
            ':min_stock' => $datos['min_stock'] ?? 3,
            ':ubicacion' => $datos['ubicacion'] ?? 'Almacén Principal'
        ]);
    }

    public static function eliminar($id) {
        $db = Conexion::obtenerConexion();
        if (!$db) return false;

        $stmt = $db->prepare("DELETE FROM consumibles WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
?>
