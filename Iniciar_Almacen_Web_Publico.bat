@echo off
title Sistema Almacen de Consumibles - Servidor Web Publico (Acceso Global)
color 0B

echo =======================================================================
echo     SISTEMA DE ALMACEN DE CONSUMIBLES TI - PUBLICACION WEB GLOBAL
echo =======================================================================
echo.
echo  [1] Abriendo tunel seguro de internet usando OpenSSH nativo de Windows...
echo.
echo  -----------------------------------------------------------------------
echo  ¡IMPORTANTE! Copia el enlace HTTPS que aparece abajo (ej. https://...lhr.life)
echo  y abrelo en el navegador de tu celular desde cualquier parte del mundo.
echo  -----------------------------------------------------------------------
echo.
echo  Credenciales de Acceso:
echo  Usuario:    admin
echo  Contrasena: admin123
echo =======================================================================
echo.

ssh -o StrictHostKeyChecking=no -R 80:localhost:80 nokey@localhost.run

pause
