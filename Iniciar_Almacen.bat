@echo off
title Sistema Almacen de Consumibles - Control e Impresion QR
color 0A

echo =======================================================================
echo          SISTEMA DE ALMACEN DE CONSUMIBLES Y EQUIPOS SERIALIZADOS
echo =======================================================================
echo.
echo [1] Iniciando servidor web Node.js en puerto 3000...
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js detectado. Iniciando en http://localhost:3000 ...
    start "" "http://localhost:3000"
    node server.js
) else (
    echo [INFO] Node.js no instalado. Abriendo frontend standalone...
    start "" "%~dp0public\index.html"
)

pause

