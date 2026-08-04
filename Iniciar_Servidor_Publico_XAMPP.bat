@echo off
title Abrir Almacen en Telefono (Desde cualquier red / Datos Moviles)
color 0B

echo =======================================================================
echo     ACCESO AL ALMACEN DESDE TELEFONO O CUALQUIER RED (INTERNET / 4G)
echo =======================================================================
echo.
echo  Si tu telefono NO esta conectado al mismo Wi-Fi que la PC,
echo  este script genera un ENLACE PUBLICO SEGURO (HTTPS) usando el SSH de Windows.
echo.
echo  [1] Abriendo tunel seguro de internet en puerto 80 (XAMPP Apache)...
echo  -----------------------------------------------------------------------
echo  ¡IMPORTANTE! Copia el enlace HTTPS que aparece abajo (ej. https://...lhr.life)
echo  y abrelo en el navegador de tu celular desde cualquier parte del mundo.
echo  -----------------------------------------------------------------------
echo.
echo  Credenciales por Defecto en el Celular:
echo  Usuario:    admin
echo  Contrasena: admin123
echo =======================================================================
echo.

ssh -o StrictHostKeyChecking=no -R 80:localhost:80 nokey@localhost.run

echo.
echo =======================================================================
echo  Si el tunel anterior cerro, intentando enlace secundario...
echo =======================================================================
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:80 qr@serveo.net

pause
