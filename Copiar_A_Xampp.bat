@echo off
title Sincronizar Almacen Consumibles -> XAMPP htdocs
color 0A
echo =======================================================================
echo          SINCRONIZANDO ALMACEN DE CONSUMIBLES A XAMPP HTDOCS
echo =======================================================================
echo.

if not exist "C:\xampp\htdocs" (
    echo [ERROR] No se encontro la carpeta C:\xampp\htdocs.
    pause
    exit
)

echo [1] Copiando archivos actualizados a C:\xampp\htdocs\consumibles...
xcopy "%~dp0*" "C:\xampp\htdocs\consumibles\" /E /Y /I /Q

echo.
echo [EXITO] Archivos sincronizados correctamente en C:\xampp\htdocs\consumibles!
echo.
echo Puedes abrir la aplicacion en:
echo 1. Node.js (Servidor Local): http://localhost:3000
echo 2. Apache / XAMPP (PHP):     http://localhost/consumibles/vistas/index.php
echo.
pause
