<?php
// Generar versión 100% Autónoma e Instalable para Teléfono Móvil (Sin PC, Sin Internet, Sin XAMPP)

$css = file_get_contents(__DIR__ . '/../vistas/estilos/styles.css');
$dataJs = file_get_contents(__DIR__ . '/../vistas/js/data.js');
$dataHistoryJs = file_get_contents(__DIR__ . '/../vistas/js/data_history.js');
$appJs = file_get_contents(__DIR__ . '/../vistas/js/app.js');
$imagenBase64 = file_get_contents(__DIR__ . '/../vistas/js/imagen1_base64.js');

// HTML base
$htmlContent = <<<HTML
<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Almacén TI - App Móvil Autónoma</title>
    
    <!-- PWA Meta Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#2563eb">
    
    <!-- Librerías de iconos y QR -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

    <style>
    {$css}
    </style>
</head>
<body>
HTML;

// Extraer el contenido del body de index.php
$indexPhp = file_get_contents(__DIR__ . '/../vistas/index.php');
if (preg_match('/<body[^>]*>(.*?)<\/body>/s', $indexPhp, $matches)) {
    $bodyContent = $matches[1];
    // Quitar script tags de index.php para reordenar
    $bodyContent = preg_replace('/<script[^>]*>.*?<\/script>/s', '', $bodyContent);
    $htmlContent .= $bodyContent;
}

$htmlContent .= <<<HTML

    <script>
    {$imagenBase64}
    </script>
    <script>
    {$dataJs}
    </script>
    <script>
    {$dataHistoryJs}
    </script>
    <script>
    {$appJs}
    </script>
</body>
</html>
HTML;

file_put_contents(__DIR__ . '/../Almacen_App_Movil_Autonoma.html', $htmlContent);
file_put_contents(__DIR__ . '/../public/Almacen_App_Movil_Autonoma.html', $htmlContent);
echo "App Móvil Autónoma generada con éxito en Almacen_App_Movil_Autonoma.html!\n";
