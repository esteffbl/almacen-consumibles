# 📦 Sistema Enterprise de Almacén de Consumibles TI & Equipos Serializados

Aplicación Web completa para la gestión de inventario, rastreo físico de equipos por **Número de Serial, Marca y Modelo**, escaneo e impresión masiva de etiquetas con **Códigos QR**, e integración a **Base de Datos MySQL**.

---

## 📂 Estructura del Programa (Arquitectura MVC)

```text
consumibles/
│
├── config/
│   └── database.js               # Conexión MySQL (Host, User, Password, Database)
│
├── database/
│   └── schema.sql                # Script MySQL completo (Tablas: consumibles, equipos_serializados, historial)
│
├── public/                       # Frontend Web (HTML5, CSS3, JavaScript)
│   ├── index.html                # Interfaz principal de la plataforma
│   ├── css/
│   │   └── styles.css            # Estilos Enterprise Light Theme
│   └── js/
│       ├── data.js               # Datos de respaldo (94 ítems + Equipos Serializados)
│       └── app.js                # Lógica del cliente, escáner QR y operaciones
│
├── server.js                     # Servidor Node.js / Express backend con REST API MySQL
├── package.json                  # Dependencias del proyecto
└── Iniciar_Almacen.bat           # Ejecutable en 1-clic para Windows
```

---

## 🗄️ Configuración de la Base de Datos MySQL (XAMPP / phpMyAdmin)

1. Abre el panel de control de **XAMPP** e inicia el servicio **MySQL**.
2. Entra a phpMyAdmin en tu navegador (`http://localhost/phpmyadmin`).
3. Haz clic en la pestaña **Importar** y selecciona el archivo:
   `consumibles/database/schema.sql`
4. Haz clic en **Continuar**. Se creará automáticamente la base de datos `almacen_consumibles` con las 3 tablas pre-pobladas:
   - `consumibles` (Los 94 artículos con Entradas, Salidas y Stock Final).
   - `equipos_serializados` (Fichas físicas de equipos por Serial, Marca y Modelo).
   - `movimientos_historial` (Kárdex y auditoría de movimientos).

---

## 🚀 Cómo Iniciar el Programa

### Opción 1: Ejecución Directa en 1-Clic
Haz doble clic sobre el archivo **`Iniciar_Almacen.bat`** en la carpeta `consumibles`.

### Opción 2: Abrir en el Navegador
Abre directamente el archivo **`public/index.html`** en Chrome, Edge o Firefox.
