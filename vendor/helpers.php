<?php
/**
 * FUNCIONES AUXILIARES DE AYUDA (HELPERS)
 */

function sanitizarInput($string) {
    return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
}

function responderJson($data, $codigoEstado = 200) {
    http_response_code($codigoEstado);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit();
}
?>
