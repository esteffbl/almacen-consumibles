<?php
/**
 * MÓDULO DE ENVÍO DE REPORTES Y NOTIFICACIONES
 */

require_once __DIR__ . '/../configuracion/config.php';

function enviarReporteAlmacen($destinatario, $asunto, $mensaje) {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Almacen TI <no-reply@empresa.com>" . "\r\n";

    return mail($destinatario, $asunto, $mensaje, $headers);
}

if (basename(__FILE__) == basename($_SERVER["SCRIPT_FILENAME"])) {
    echo json_encode(["status" => "Modulo de notificaciones listo"]);
}
?>
