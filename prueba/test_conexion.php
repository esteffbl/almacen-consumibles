<?php
/**
 * SCRIPT DE PRUEBA DE CONEXIÓN A BASE DE DATOS MYSQL
 */

require_once __DIR__ . '/../configuracion/conexion.php';

echo "<h3>Prueba de Conexión a MySQL</h3>";

$db = Conexion::obtenerConexion();

if ($db) {
    echo "<p style='color:green;'>✅ Conexión exitosa a la base de datos 'almacen_consumibles'.</p>";
} else {
    echo "<p style='color:red;'>⚠️ No se pudo conectar a MySQL. Asegúrate de iniciar MySQL en XAMPP.</p>";
}
?>
