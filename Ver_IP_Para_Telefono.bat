@echo off
title Direcciones IP para ingresar desde el Telefono
color 0A

echo =======================================================================
echo     DIRECCIONES DE ACCESO AL ALMACEN PARA TU TELEFONO CELULAR
echo =======================================================================
echo.
echo  Si tu telefono esta en la misma red Wi-Fi o conectado a la PC,
echo  ingresa cualquiera de los siguientes enlaces en el navegador de tu celular:
echo.
echo  -----------------------------------------------------------------------

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    echo   👉 http://%%a/consumibles
)

echo  -----------------------------------------------------------------------
echo.
echo  Credenciales de Inicio de Sesion:
echo  Usuario:    admin
echo  Contrasena: admin123
echo =======================================================================
echo.
pause
