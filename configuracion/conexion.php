<?php
/**
 * MÓDULO DE CONEXIÓN A BASE DE DATOS MYSQL (XAMPP / MARIADB)
 * Sistema de Gestión de Almacén e Inventario de Consumibles
 */

class Conexion {
    private static $host = "localhost";
    private static $db_name = "inventario";
    private static $alt_db_name = "almacen_db";
    private static $username = "root";
    private static $password = "";
    private static $puerto = "3306";
    private static $conexion = null;

    public static function obtenerConexion() {
        if (self::$conexion === null) {
            $opciones = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            try {
                self::$conexion = new PDO(
                    "mysql:host=" . self::$host . ";port=" . self::$puerto . ";dbname=" . self::$db_name,
                    self::$username,
                    self::$password,
                    $opciones
                );
            } catch (PDOException $e) {
                try {
                    self::$conexion = new PDO(
                        "mysql:host=" . self::$host . ";port=" . self::$puerto . ";dbname=" . self::$alt_db_name,
                        self::$username,
                        self::$password,
                        $opciones
                    );
                } catch (PDOException $e2) {
                    return null;
                }
            }
        }
        return self::$conexion;
    }
}
?>
