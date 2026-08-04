<?php
/**
 * AUTOLOAD DE CLASES Y MODELOS PHP
 */

spl_autoload_register(function ($clase) {
    $directorios = [
        __DIR__ . '/../modelo/',
        __DIR__ . '/../controlador/',
        __DIR__ . '/../configuracion/'
    ];

    foreach ($directorios as $dir) {
        $archivo = $dir . $clase . '.php';
        if (file_exists($archivo)) {
            require_once $archivo;
            return;
        }
    }
});

require_once __DIR__ . '/helpers.php';
?>
