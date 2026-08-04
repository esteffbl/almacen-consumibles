<?php
require_once __DIR__ . '/../configuracion/config.php';
require_once __DIR__ . '/../configuracion/conexion.php';
require_once __DIR__ . '/../modelo/Consumible.php';
require_once __DIR__ . '/../modelo/EquipoSerial.php';

$dbConsumibles = Consumible::obtenerTodos();
$dbSerials = EquipoSerial::obtenerTodos();
?>
<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Inventory Pro - Almacén de Consumibles TI</title>
    
    <!-- Fonts & Web Libraries -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

    <!-- Custom Enterprise CSS -->
    <link rel="stylesheet" href="estilos/styles.css">

    <!-- PWA Manifest & Offline Support -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#2563eb">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').catch(() => {});
        });
      }
    </script>
</head>
<body>
    <script>
        // Evita el parpadeo de la pantalla de login si el usuario ya inició sesión
        if (!localStorage.getItem('qr_app_user')) {
            document.documentElement.classList.add('show-login-initially');
        }
    </script>

    <!-- Login Screen Overlay -->
    <div id="login-screen" class="login-overlay">
        <div class="login-card">

            <div class="login-header">
                <div class="login-logo">
                    <i data-lucide="shield-check"></i>
                </div>
                <h2>Acceso al Sistema</h2>
                <p>Almacén de Consumibles TI & Equipos</p>
            </div>
            
            <form id="login-form">
                <div id="login-error-msg" class="login-error hidden"></div>
                <div class="form-group">
                    <label for="login-username"><i data-lucide="user"></i> Usuario</label>
                    <input type="text" id="login-username" class="form-control" placeholder="Ej. admin" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="login-password"><i data-lucide="lock"></i> Contraseña</label>
                    <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-login-submit">
                    <i data-lucide="log-in"></i> Iniciar Sesión
                </button>
            </form>

            <div class="login-footer">
                <small><i data-lucide="globe"></i> Acceso Web Seguro (Red Local & Internet)</small>
                <div class="demo-credentials">
                    <span>Usuario: <strong>admin</strong> | Clave: <strong>admin123</strong></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Top Navigation Header -->
    <header class="app-header no-print">
        <div class="header-container">
            <div class="brand">
                <div class="logo-icon">
                    <i data-lucide="box"></i>
                </div>
                <div class="brand-text">
                    <h1>Almacén TI</h1>
                    <span>Gestión de Consumibles & Equipos</span>
                </div>
            </div>

            <!-- Header Quick Stats -->
            <div class="header-stats">
                <div class="stat-pill">
                    <i data-lucide="box"></i>
                    <div>
                        <span id="stat-total-items">94</span>
                        <small>Ítems</small>
                    </div>
                </div>
                <div class="stat-pill">
                    <i data-lucide="layers"></i>
                    <div>
                        <span id="stat-total-stock">0</span>
                        <small>Stock Total</small>
                    </div>
                </div>
                <div class="stat-pill warning" id="pill-low-stock">
                    <i data-lucide="alert-triangle"></i>
                    <div>
                        <span id="stat-low-stock">0</span>
                        <small>Stock Bajo</small>
                    </div>
                </div>
            </div>

            <!-- Action Controls -->
            <div class="header-actions">
                <div class="user-badge" id="user-badge">
                    <i data-lucide="user-check"></i> <span id="current-user-name">Admin</span>
                </div>
                <button class="btn btn-icon btn-outline" id="btn-theme-toggle" title="Cambiar Tema (Oscuro/Claro)">
                    <i data-lucide="moon" id="icon-theme"></i>
                </button>
                <button class="btn btn-outline btn-sm" id="btn-export-excel" title="Exportar Excel Oficial">
                    <i data-lucide="file-spreadsheet"></i> Exportar
                </button>
                <button class="btn btn-danger btn-sm" id="btn-logout" title="Cerrar Sesión">
                    <i data-lucide="log-out"></i> Salir
                </button>
            </div>
        </div>



        <!-- Navigation Tabs -->
        <nav class="app-tabs">
            <button class="tab-btn active" data-tab="tab-inventory">
                <i data-lucide="layout-grid"></i> Inventario & Control
            </button>
            <button class="tab-btn" data-tab="tab-serials">
                <i data-lucide="cpu"></i> Equipos en Almacén (Seriales)
                <span class="badge badge-accent" id="badge-serials-count">0</span>
            </button>
            <button class="tab-btn" data-tab="tab-report">
                <i data-lucide="file-spreadsheet"></i> Reporte Oficial Excel
            </button>
            <button class="tab-btn" data-tab="tab-qr-labels">
                <i data-lucide="printer"></i> Etiquetas QR & Impresión
                <span class="badge badge-accent" id="badge-selected-count">0</span>
            </button>
            <button class="tab-btn" data-tab="tab-history">
                <i data-lucide="history"></i> Movimientos
            </button>
        </nav>
    </header>

    <!-- Main Content Container -->
    <main class="app-content">

        <!-- TAB 1: INVENTORY & STOCK CONTROL -->
        <section id="tab-inventory" class="tab-content active no-print">
            <div class="toolbar-card">
                <div class="search-box">
                    <i data-lucide="search"></i>
                    <input type="text" id="input-search" placeholder="Buscar consumible por nombre, ID o ubicación...">
                    <button class="clear-search-btn" id="btn-clear-search" style="display:none;">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="filter-controls">
                    <select id="select-category" class="custom-select">
                        <option value="ALL">Todas las Categorías</option>
                    </select>

                    <select id="select-stock-filter" class="custom-select">
                        <option value="ALL">Todos los Estados</option>
                        <option value="LOW">🚨 Stock Bajo / Alerta</option>
                        <option value="NORMAL">✅ Stock Normal</option>
                        <option value="OUT">❌ Agotado</option>
                    </select>

                    <button class="btn btn-emerald" id="btn-scan-qr-inventory" title="Escanear Sticker QR del Sistema">
                        <i data-lucide="qr-code"></i> Escanear QR Sticker
                    </button>

                    <button class="btn btn-primary" id="btn-new-item">
                        <i data-lucide="plus"></i> Nuevo Consumible
                    </button>

                    <button class="btn btn-secondary" id="btn-print-inventory-list">
                        <i data-lucide="printer"></i> Imprimir Lista
                    </button>

                    <div class="view-toggle">
                        <button class="view-btn active" id="btn-view-cards" title="Vista de Tarjetas">
                            <i data-lucide="grid"></i>
                        </button>
                        <button class="view-btn" id="btn-view-table" title="Vista de Tabla">
                            <i data-lucide="list"></i>
                        </button>
                    </div>

                </div>
            </div>

            <div class="printable-inventory-header" style="display: none; text-align: center; margin-bottom: 15px;">
                <img src="Imagen1.jpg" alt="Logo Pequiven" style="max-width: 100%; height: auto; max-height: 70px; margin: 0 auto 10px auto; display: block;">
                <h2 style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; color: #000000;">INVENTARIO GENERAL DE ALMACEN DE CONSUMIBLES TI</h2>
            </div>

            <div class="bulk-action-bar hidden" id="bulk-action-bar">
                <div class="bulk-info">
                    <span id="bulk-selected-text">0 ítems seleccionados</span>
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-sm btn-secondary" id="btn-select-all">Seleccionar Todos</button>
                    <button class="btn btn-sm btn-outline" id="btn-deselect-all">Deseleccionar</button>
                </div>
            </div>

            <div class="inventory-grid" id="inventory-container"></div>

            <div class="inventory-table-container hidden" id="inventory-table-wrapper">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th width="40"><input type="checkbox" id="chk-select-all-table"></th>
                            <th width="60">Ruta</th>
                            <th>Consumible / Descripción</th>
                            <th>Categoría</th>
                            <th>Ent. Inicial</th>
                            <th>Entradas</th>
                            <th>Salidas</th>
                            <th>Inv. Final</th>
                            <th>Estado</th>
                            <th width="120" class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-table-body"></tbody>
                </table>
            </div>

            <div class="empty-state hidden" id="empty-inventory-state">
                <i data-lucide="package-x"></i>
                <h3>No se encontraron consumibles</h3>
                <p>Intenta cambiar los términos de búsqueda o filtros aplicados.</p>
                <button class="btn btn-secondary" id="btn-reset-filters">Restablecer Filtros</button>
            </div>
        </section>

        <!-- TAB EQUIPOS EN ALMACÉN POR SERIAL -->
        <section id="tab-serials" class="tab-content no-print">
            <div class="toolbar-card">
                <div class="search-box">
                    <i data-lucide="search"></i>
                    <input type="text" id="input-search-serial" placeholder="Buscar por Serial (SN-XXX), Marca, Modelo o Ubicación en Almacén...">
                    <button class="clear-search-btn" id="btn-clear-search-serial" style="display:none;">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="filter-controls">
                    <select id="select-serial-status" class="custom-select">
                        <option value="ALL">Todos los Estados</option>
                        <option value="Disponible">🟢 En Almacén (Disponible)</option>
                        <option value="Mantenimiento">🔴 En Revisión / Mantenimiento</option>
                    </select>

                    <button class="btn btn-success" id="btn-scan-serial-tab">
                        <i data-lucide="scan"></i> Escanear para Registrar Serial
                    </button>

                    <button class="btn btn-primary" id="btn-new-serial-item">
                        <i data-lucide="plus-circle"></i> Manual: Registrar Serial
                    </button>
                </div>
            </div>

            <div class="inventory-table-container">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th width="160">Número de Serial</th>
                            <th>Consumible / Equipo</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Ubicación en Almacén</th>
                            <th>Estado</th>
                            <th>Fecha Reg.</th>
                            <th width="120" class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="serials-table-body"></tbody>
                </table>
            </div>

            <div class="empty-state hidden" id="empty-serials-state">
                <i data-lucide="cpu"></i>
                <h3>No hay seriales registrados en almacén</h3>
                <p>Usa el botón <strong>"Escanear para Registrar Serial"</strong> o <strong>"+ Manual"</strong> para agregar los seriales reales de los equipos en almacén.</p>
            </div>
        </section>

        <!-- TAB REPORTE OFICIAL EN PANTALLA -->
        <section id="tab-report" class="tab-content no-print">
            <div class="toolbar-card" style="align-items: center; justify-content: space-between;">
                <div>
                    <h2><i data-lucide="file-spreadsheet"></i> Vista Previa del Reporte Oficial de Almacén</h2>
                    <p style="font-size:0.85rem; color:var(--text-muted);">Genera automáticamente el correlativo semanal de cada viernes (ej: N° 18 del 07/08/2026).</p>
                </div>

                <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                        <label for="report-number-input" style="font-size:0.8rem; font-weight:700;">N° Reporte:</label>
                        <input type="number" id="report-number-input" value="18" min="1" style="width:75px; padding:0.45rem; font-weight:bold; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
                    </div>

                    <div style="display:flex; align-items:center; gap:0.4rem;">
                        <label for="report-date-input" style="font-size:0.8rem; font-weight:700;">Viernes de Cierre:</label>
                        <input type="date" id="report-date-input" style="padding:0.45rem; font-weight:bold; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-main);">
                    </div>

                    <button class="btn btn-success btn-lg" id="btn-download-report-excel">
                        <i data-lucide="file-spreadsheet"></i> Descargar Excel N° <span id="lbl-report-num-btn">18</span> (.XLS)
                    </button>
                </div>
            </div>

            <div class="official-excel-sheet-preview">
                <div class="excel-header-banner-img">
                    <img src="Imagen1.jpg" alt="Imagen Cabecera Oficial Pequiven / Hidrocarburos" style="max-width:100%; height:auto; display:block; margin: 0 auto 1.5rem auto;">
                </div>

                <div class="excel-title-block">
                    <h1>INVENTARIO</h1>
                    <h2>RESUMEN DE INVENTARIO DE EQUIPOS HERRAMIENTAS REPUESTOS Y CONSUMIBLES</h2>
                    <p class="excel-date" id="official-report-date">7/8/2026</p>
                </div>

                <div class="excel-table-wrapper">
                    <table class="official-excel-table">
                        <thead>
                            <tr>
                                <th width="70">RUTA</th>
                                <th>CONSUMIBLES</th>
                                <th width="150" class="text-center">ENTRADA INICIAL</th>
                                <th width="120" class="text-center">ENTRADA</th>
                                <th width="120" class="text-center">SALIDA</th>
                                <th width="180" class="text-center">INVENTARIO FINAL</th>
                            </tr>
                        </thead>
                        <tbody id="official-report-table-body">
                            <!-- Rendered dynamically matching image 2 -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- TAB 2: GENERADOR & DISEÑADOR DE ETIQUETAS QR -->
        <section id="tab-qr-labels" class="tab-content">
            <div class="labels-layout">
                <aside class="labels-sidebar no-print">
                    <div class="sidebar-card">
                        <h3><i data-lucide="sliders"></i> Configuración de Etiqueta</h3>
                        
                        <div class="form-group">
                            <label>Tamaño de Etiqueta Adhesiva</label>
                            <select id="select-label-style" class="custom-select">
                                <option value="standard">Estándar Almacén (160px width)</option>
                                <option value="compact">Compacta (130px width)</option>
                                <option value="sticker-small">Sticker 50x30 mm (Mini)</option>
                                <option value="sticker-medium">Sticker 70x45 mm (Mediana)</option>
                                <option value="sticker-large">Sticker 100x60 mm (Detallada)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Columnas por Hoja de Impresión</label>
                            <select id="select-grid-cols" class="custom-select">
                                <option value="cols-4">4 Columnas (24 a 32 por hoja)</option>
                                <option value="cols-3" selected>3 Columnas (15 a 18 por hoja)</option>
                                <option value="cols-2">2 Columnas (8 a 10 por hoja)</option>
                                <option value="cols-1">1 Columna (Tiras de etiquetas)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Elementos Visibles en la Etiqueta</label>
                            <div class="checkbox-group">
                                <label class="custom-checkbox">
                                    <input type="checkbox" id="chk-show-title" checked>
                                    <span>Nombre del Consumible</span>
                                </label>
                                <label class="custom-checkbox">
                                    <input type="checkbox" id="chk-show-id" checked>
                                    <span>Código / ID de Ruta</span>
                                </label>
                                <label class="custom-checkbox">
                                    <input type="checkbox" id="chk-show-category" checked>
                                    <span>Categoría</span>
                                </label>
                                <label class="custom-checkbox">
                                    <input type="checkbox" id="chk-show-location" checked>
                                    <span>Ubicación Física</span>
                                </label>
                                <label class="custom-checkbox">
                                    <input type="checkbox" id="chk-show-border" checked>
                                    <span>Borde para corte</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Formato de Contenido del QR</label>
                            <select id="select-qr-payload-type" class="custom-select">
                                <option value="json" selected>JSON Completo (ID + Nombre)</option>
                                <option value="id-only">Solo ID / Código (ej: "17")</option>
                                <option value="formatted">Texto Completo Format (ID: 17 - TÓNER HP 26A)</option>
                            </select>
                        </div>

                        <div class="sidebar-divider"></div>

                        <div class="selection-summary">
                            <div class="summary-text">
                                <strong id="print-queue-count">94</strong> de <span id="print-queue-total">94</span> consumibles listos
                            </div>
                            <div class="quick-select-btns">
                                <button class="btn btn-sm btn-outline" id="btn-select-all-print">Seleccionar Todos</button>
                                <button class="btn btn-sm btn-outline" id="btn-clear-print">Limpiar Selección</button>
                            </div>
                        </div>

                        <div class="print-actions">
                            <button class="btn btn-primary btn-block btn-lg" id="btn-trigger-print">
                                <i data-lucide="qr-code"></i> IMPRIMIR ETIQUETAS QR
                            </button>
                            <button class="btn btn-block btn-lg" id="btn-trigger-print-list" style="margin-top: 0.5rem; background-color: #059669; color: #ffffff; border: none; font-weight: 700;">
                                <i data-lucide="printer"></i> IMPRIMIR LISTA DE INVENTARIO
                            </button>
                            <small class="help-text">💡 Tip: Configura "Sin márgenes" y la escala al 100% en la ventana de impresión.</small>
                        </div>
                    </div>
                </aside>

                <div class="labels-preview-area">
                    <div class="print-header-banner no-print">
                        <h2><i data-lucide="eye"></i> Vista Previa de Impresión de Etiquetas QR</h2>
                        <p>Los códigos son generados dinámicamente listos para escáneres ópticos e inteligentes.</p>
                    </div>

                    <div class="qr-print-grid cols-3 standard" id="qr-print-container"></div>
                </div>
            </div>
        </section>

        <!-- TAB 4: HISTORIAL DE MOVIMIENTOS -->
        <section id="tab-history" class="tab-content no-print">
            <div class="history-card">
                <div class="card-header-flex">
                    <div>
                        <h2><i data-lucide="history"></i> Registro de Movimientos de Stock</h2>
                        <p>Historial en tiempo real de entradas, salidas y modificaciones de inventario</p>
                    </div>
                    <button class="btn btn-outline btn-sm" id="btn-clear-history">
                        <i data-lucide="trash-2"></i> Limpiar Historial
                    </button>
                </div>

                <div class="table-responsive">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Fecha & Hora</th>
                                <th>ID / Serial</th>
                                <th>Consumible / Equipo</th>
                                <th>Tipo Operación</th>
                                <th>Cambio</th>
                                <th>Stock Resultante</th>
                                <th>Notas / Detalles</th>
                            </tr>
                        </thead>
                        <tbody id="history-table-body"></tbody>
                    </table>
                </div>

                <div class="empty-state hidden" id="empty-history-state">
                    <i data-lucide="clock"></i>
                    <h3>Sin movimientos registrados</h3>
                    <p>Los ajustes de inventario que realices aparecerán registrados aquí.</p>
                </div>
            </div>
        </section>

    </main>

    <!-- MODAL: CREAR / EDITAR CONSUMIBLE -->
    <div class="modal-overlay hidden" id="modal-item">
        <div class="modal-container">
            <div class="modal-header">
                <h3 id="modal-title">Nuevo Consumible</h3>
                <button class="btn-close-modal" id="btn-close-item-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <form id="form-item">
                <input type="hidden" id="form-original-id">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group col-4">
                            <label for="form-id">Ruta / ID *</label>
                            <input type="text" id="form-id" required placeholder="Ej: 96">
                        </div>
                        <div class="form-group col-8">
                            <label for="form-item-name">Nombre del Consumible *</label>
                            <input type="text" id="form-item-name" required placeholder="Ej: CABLE THUNDERBOLT 4">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="form-category">Categoría</label>
                            <input type="text" id="form-category" list="category-list" required placeholder="Selecciona o escribe...">
                            <datalist id="category-list">
                                <option value="Equipos & Laptops">
                                <option value="Almacenamiento & RAM">
                                <option value="Periféricos & Accesorios">
                                <option value="Impresión & Tóner">
                                <option value="Redes, Cableado & Fibra">
                                <option value="Energía & Iluminación">
                                <option value="Herramientas & Consumibles">
                            </datalist>
                        </div>
                        <div class="form-group col-6">
                            <label for="form-ubicacion">Ubicación Física en Almacén</label>
                            <input type="text" id="form-ubicacion" placeholder="Ej: Estante A-5, Caja 12">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-3">
                            <label for="form-entrada-inicial">Ent. Inicial</label>
                            <input type="number" id="form-entrada-inicial" min="0" value="0">
                        </div>
                        <div class="form-group col-3">
                            <label for="form-entrada">Entradas</label>
                            <input type="number" id="form-entrada" min="0" value="0">
                        </div>
                        <div class="form-group col-3">
                            <label for="form-salida">Salidas</label>
                            <input type="number" id="form-salida" min="0" value="0">
                        </div>
                        <div class="form-group col-3">
                            <label for="form-stock">Stock Final *</label>
                            <input type="number" id="form-stock" min="0" required value="0" readonly style="background: var(--bg-primary); font-weight: bold;">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="form-min-stock">Stock Mínimo (Alerta)</label>
                            <input type="number" id="form-min-stock" min="0" required value="3">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btn-cancel-item-modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Consumible</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL: REGISTRAR ENTRADA / SALIDA DE CONSUMIBLE -->
    <div class="modal-overlay hidden" id="modal-movement">
        <div class="modal-container">
            <div class="modal-header">
                <h3 id="movement-modal-title"><i data-lucide="arrow-left-right"></i> Registrar Movimiento</h3>
                <button class="btn-close-modal" id="btn-close-movement-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <form id="form-movement">
                <input type="hidden" id="movement-item-id">
                <div class="modal-body">
                    <div class="item-summary-box text-center" style="margin-bottom: 1.1rem; background: var(--bg-primary); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 id="movement-item-title" style="margin:0; font-size: 1.05rem;">Consumible</h4>
                        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; justify-content: center; gap: 0.8rem; flex-wrap: wrap;">
                            <span id="movement-item-id-badge">Ruta: #0</span>
                            <span>Inicial: <strong id="movement-item-initial">0</strong></span>
                            <span>Entradas: <strong id="movement-item-in" style="color:var(--accent-emerald);">0</strong></span>
                            <span>Salidas: <strong id="movement-item-out" style="color:var(--accent-rose);">0</strong></span>
                            <span>Stock Actual: <strong id="movement-item-stock" style="color:var(--accent-primary);">0</strong></span>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="movement-type">Tipo de Movimiento *</label>
                            <select id="movement-type" class="custom-select" required>
                                <option value="ENTRADA">📥 ENTRADA (+ Ingreso a Almacén)</option>
                                <option value="SALIDA">📤 SALIDA (- Despacho / Egreso)</option>
                            </select>
                        </div>
                        <div class="form-group col-6">
                            <label for="movement-qty">Cantidad de Unidades *</label>
                            <input type="number" id="movement-qty" min="1" value="1" required placeholder="Ej: 5">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="movement-person">Solicitante / Recibido Por / Entregado A *</label>
                            <select id="movement-person" class="custom-select" required>
                                <option value="ANDRES CAMPOS" data-cargo="ESPECIALISTA DE INFRAESTRUCTURA Y RADIOTELECOMUNICACIONES">ANDRES CAMPOS</option>
                                <option value="BALDASSARE CLEMENTI" data-cargo="ANALISTA DE SOPORTE USUARIO" selected>BALDASSARE CLEMENTI</option>
                                <option value="DAYANA PEREZ" data-cargo="COORDINADORA GESTIÓN DE USUARIOS">DAYANA PEREZ</option>
                                <option value="ESTEFANY BRUZUAL" data-cargo="ANALISTA DE RECURSOS DE TI">ESTEFANY BRUZUAL</option>
                                <option value="GREGORY GONZALEZ" data-cargo="ESPECIALISTA DE REDES DE DATOS">GREGORY GONZALEZ</option>
                                <option value="HUMBERTO NOLASCO" data-cargo="ESPECIALISTAS DE GESTION DE USUARIOS">HUMBERTO NOLASCO</option>
                                <option value="RAUL FARFAN" data-cargo="ANALISTA DE SOPORTE USUARIO">RAUL FARFAN</option>
                                <option value="RICHARD ROJAS" data-cargo="SUPERVISOR DE SOPORTE USUARIO">RICHARD ROJAS</option>
                                <option value="ROBERT MORALES" data-cargo="ANALISTA DE SOPORTE USUARIO">ROBERT MORALES</option>
                                <option value="RONAL VEGAS" data-cargo="ESPECIALISA DE SOFTWARE">RONAL VEGAS</option>
                                <option value="WILMER DIAZ" data-cargo="GERENTE TI">WILMER DIAZ</option>
                                <option value="YIVINITZZA GONZALEZ" data-cargo="SUPERVISORA DE RECURSOS DE TI">YIVINITZZA GONZALEZ</option>
                            </select>
                        </div>
                        <div class="form-group col-6">
                            <label for="movement-cargo">Cargo del Solicitante</label>
                            <input type="text" id="movement-cargo" readonly style="background: var(--bg-primary); font-weight: 600;" value="ANALISTA DE SOPORTE USUARIO">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="movement-dept">Gerencia / Área Destino</label>
                            <input type="text" id="movement-dept" list="dept-list" placeholder="Ej: GERENCIA DE TI" value="GERENCIA DE TI">
                            <datalist id="dept-list">
                                <option value="GERENCIA DE TI">
                                <option value="Soporte Técnico">
                                <option value="Infraestructura & Redes">
                                <option value="Sistemas & Telecomunicaciones">
                                <option value="Recursos Humanos">
                                <option value="Administración & Finanzas">
                                <option value="Planta / Operaciones">
                            </datalist>
                        </div>
                        <div class="form-group col-6">
                            <label for="movement-analista">Analista AIT Responsable *</label>
                            <select id="movement-analista" class="custom-select">
                                <option value="ANDRES CAMPOS">ANDRES CAMPOS</option>
                                <option value="BALDASSARE CLEMENTI">BALDASSARE CLEMENTI</option>
                                <option value="DAYANA PEREZ">DAYANA PEREZ</option>
                                <option value="ESTEFANY BRUZUAL" selected>ESTEFANY BRUZUAL</option>
                                <option value="GREGORY GONZALEZ">GREGORY GONZALEZ</option>
                                <option value="HUMBERTO NOLASCO">HUMBERTO NOLASCO</option>
                                <option value="RAUL FARFAN">RAUL FARFAN</option>
                                <option value="RICHARD ROJAS">RICHARD ROJAS</option>
                                <option value="ROBERT MORALES">ROBERT MORALES</option>
                                <option value="RONAL VEGAS">RONAL VEGAS</option>
                                <option value="WILMER DIAZ">WILMER DIAZ</option>
                                <option value="YIVINITZZA GONZALEZ">YIVINITZZA GONZALEZ</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-4">
                            <label for="movement-marca">Marca</label>
                            <input type="text" id="movement-marca" value="S/M" placeholder="Ej: S/M, LENOVO, HP">
                        </div>
                        <div class="form-group col-4">
                            <label for="movement-modelo">Modelo</label>
                            <input type="text" id="movement-modelo" value="S/M" placeholder="Ej: S/M, RICOH IM4000">
                        </div>
                        <div class="form-group col-4">
                            <label for="movement-ref">N° Vale / Ticket</label>
                            <input type="text" id="movement-ref" placeholder="Ej: Vale #045, Ticket #1092">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="movement-notes">Motivo / Observaciones</label>
                            <input type="text" id="movement-notes" placeholder="Ej: SUMINISTRO PARA IMPRESORA DE PALMICHAL">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btn-cancel-movement-modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-movement">
                        <i data-lucide="file-text"></i> Guardar y Generar Planilla
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL: PLANILLA OFICIAL PEQUIVEN (COMPROBANTE DE ENTRADA / SALIDA - IMPRESIÓN Y PDF) -->
    <div class="modal-overlay hidden" id="modal-planilla-oficial">
        <div class="modal-container" style="max-width: 820px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 1.5rem;">
            <div class="modal-header no-print" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h3 id="planilla-modal-title" style="margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="file-text"></i> Planilla Oficial Pequiven
                </h3>
                <button class="btn-close-modal" id="btn-close-planilla-modal" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">
                    <i data-lucide="x"></i>
                </button>
            </div>
            
            <div class="modal-body" style="padding: 0; display: flex; justify-content: center; background: #ffffff;">
                <div class="printable-planilla-pequiven" id="printable-planilla-content" style="width: 100%; max-width: 750px; background: #ffffff; color: #000000; font-family: Arial, sans-serif; font-size: 12px; padding: 15px; box-sizing: border-box;">
                    
                    <!-- 1. MEMBRETE / BANNER IMAGEN -->
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img src="Imagen1.jpg" alt="Pequiven logo" style="max-width: 100%; height: auto; max-height: 75px; display: block; margin: 0 auto;">
                    </div>

                    <!-- 2. TITULO PRINCIPAL -->
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 id="plan-doc-title" style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; color: #000000;">ENTREGA DE CONSUMIBLES</h2>
                    </div>

                    <!-- 3. TABLA 1: DATOS DEL SOLICITANTE -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 15px; font-size: 11px;">
                        <tbody>
                            <tr>
                                <td style="width: 50%; background-color: #FCE4D6; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 5px; color: #000000;">Solicitante</td>
                                <td style="width: 50%; background-color: #FCE4D6; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 5px; color: #000000;">CARGO</td>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-weight: bold; font-size: 12px; border: 1px solid #000000; padding: 8px; color: #000000;" id="plan-solicitante-nombre">BALDASSARE CLEMENTI</td>
                                <td style="text-align: center; font-weight: bold; font-size: 12px; border: 1px solid #000000; padding: 8px; color: #000000;" id="plan-solicitante-cargo">ANALISTA DE SOPORTE USUARIO</td>
                            </tr>
                            <tr>
                                <td style="background-color: #FCE4D6; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 5px; color: #000000;">GERENCIA</td>
                                <td style="background-color: #FCE4D6; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 5px; color: #000000;">MOTIVO</td>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-weight: bold; font-size: 12px; border: 1px solid #000000; padding: 12px 8px; color: #000000;" id="plan-solicitante-gerencia">GERENCIA DE TI</td>
                                <td style="text-align: center; font-weight: bold; font-size: 12px; border: 1px solid #000000; padding: 12px 8px; color: #000000;" id="plan-solicitante-motivo">SUMINISTRO PARA IMPRESORA DE PALMICHAL.</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 4. TABLA 2: DATOS DE EQUIPOS Y HERRAMIENTAS -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 15px; font-size: 11px;">
                        <thead>
                            <tr>
                                <th colspan="5" style="background-color: #FCE4D6; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 6px; text-transform: uppercase; color: #000000;">DATOS DE EQUIPOS Y HERRAMIENTAS</th>
                            </tr>
                            <tr>
                                <th style="width: 30%; border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; color: #000000;">DESCRIPCION</th>
                                <th style="width: 15%; border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; color: #000000;">MARCA</th>
                                <th style="width: 15%; border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; color: #000000;">MODELO</th>
                                <th style="width: 25%; border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; color: #000000;">OBSERVACIONES</th>
                                <th style="width: 15%; border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; color: #000000;">CANTIDAD</th>
                            </tr>
                        </thead>
                        <tbody id="plan-items-table-body">
                            <tr>
                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; color: #000000;" id="plan-item-desc">TONER IMPRESORA RICOH IM4000</td>
                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; color: #000000;" id="plan-item-marca">S/M</td>
                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; color: #000000;" id="plan-item-modelo">S/M</td>
                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; color: #000000;" id="plan-item-obs">s/o</td>
                                <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; color: #000000;" id="plan-item-cant">1</td>
                            </tr>
                            <tr><td style="border: 1px solid #000000; height: 22px;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td></tr>
                            <tr><td style="border: 1px solid #000000; height: 22px;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td></tr>
                            <tr><td style="border: 1px solid #000000; height: 22px;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td></tr>
                            <tr><td style="border: 1px solid #000000; height: 22px;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td></tr>
                            <tr><td style="border: 1px solid #000000; height: 22px;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td><td style="border: 1px solid #000000;">&nbsp;</td></tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" style="border: 1px solid #000000; padding: 6px 12px; text-align: right; font-weight: bold; font-size: 12px; color: #000000;">TOTAL</td>
                                <td style="border: 1px solid #000000; padding: 6px; text-align: center; font-weight: bold; font-size: 12px; color: #000000;" id="plan-item-total">1</td>
                            </tr>
                        </tfoot>
                    </table>

                    <!-- 5. TABLA 3: PIE DE FIRMAS -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 11px;">
                        <tbody>
                            <tr>
                                <td style="width: 35%; background-color: #FCE4D6; font-weight: bold; border: 1px solid #000000; padding: 5px; color: #000000;">CONTROL DE RESURSOS TECNOLOGICOS:</td>
                                <td style="width: 65%; background-color: #FCE4D6; font-weight: bold; border: 1px solid #000000; padding: 5px; color: #000000;" colspan="2">FIRMA DEL SOLICITANTE:</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 8px; vertical-align: top; color: #000000;">
                                    <div style="margin-bottom: 4px;"><strong>NOMBRE:</strong> ESTEFANY BRUZUAL</div>
                                    <div style="margin-bottom: 4px;"><strong>FECHA:</strong> <span class="plan-fecha-actual">03/08/2026</span></div>
                                    <div><strong>FIRMA:</strong> ____________________</div>
                                </td>
                                <td style="width: 35%; border: 1px solid #000000; padding: 8px; vertical-align: top; color: #000000;">
                                    <div style="margin-bottom: 4px;"><strong>NOMBRE:</strong> <span id="plan-firma-solic-nombre">BALDASSARE CLEMENTI</span></div>
                                    <div style="margin-bottom: 4px;"><strong>FECHA:</strong> <span class="plan-fecha-actual">03/08/2026</span></div>
                                    <div><strong>FIRMA:</strong> ____________________</div>
                                </td>
                                <td style="width: 30%; border: 1px solid #000000; padding: 8px; vertical-align: top; color: #000000;">
                                    <div><strong>Observacion:</strong></div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>

            <div class="modal-footer no-print" style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-secondary" id="btn-cancel-planilla-modal">Cerrar</button>
                <button type="button" class="btn btn-primary" id="btn-print-planilla">
                    <i data-lucide="printer"></i> Imprimir / Guardar en PDF
                </button>
            </div>
        </div>
    </div>


    <!-- MODAL: AJUSTE RÁPIDO DE STOCK -->
    <div class="modal-overlay hidden" id="modal-stock-adjust">
        <div class="modal-container modal-sm">
            <div class="modal-header">
                <h3>Ajuste de Stock</h3>
                <button class="btn-close-modal" id="btn-close-stock-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <div class="item-summary-box">
                    <h4 id="adjust-item-title">Consumible</h4>
                    <span id="adjust-item-id">ID: #0</span>
                </div>
                
                <div class="stock-adjuster-control">
                    <button class="btn btn-circle btn-danger" id="btn-decrement-stock">-</button>
                    <input type="number" id="adjust-stock-value" class="stock-input-lg" min="0" value="0">
                    <button class="btn btn-circle btn-success" id="btn-increment-stock">+</button>
                </div>

                <div class="form-group mt-3">
                    <label for="adjust-notes">Motivo / Nota del Movimiento</label>
                    <input type="text" id="adjust-notes" placeholder="Ej: Despacho a Soporte Técnico, Compra mensual">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="btn-cancel-stock-modal">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-stock-adjust">Guardar Ajuste</button>
            </div>
        </div>
    </div>

    <!-- MODAL: CREAR / EDITAR SERIAL EN ALMACÉN -->
    <div class="modal-overlay hidden" id="modal-serial-item">
        <div class="modal-container">
            <div class="modal-header">
                <h3 id="modal-serial-title">Registrar Serial en Almacén</h3>
                <button class="btn-close-modal" id="btn-close-serial-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <form id="form-serial-item">
                <input type="hidden" id="form-serial-original">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="form-serial-code">Número de Serial (Único) *</label>
                            <div class="input-with-button">
                                <input type="text" id="form-serial-code" required placeholder="Ej: SN-982138-AB">
                                <button type="button" class="btn btn-outline" id="btn-scan-serial-modal" title="Escanear Código de Barras o Serial de la Caja con la Cámara">
                                    <i data-lucide="camera"></i> Escanear
                                </button>
                            </div>
                        </div>
                        <div class="form-group col-6">
                            <label for="form-serial-itemid">Consumible / Equipo *</label>
                            <select id="form-serial-itemid" class="custom-select" required></select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="form-serial-marca">Marca (Fabricante)</label>
                            <input type="text" id="form-serial-marca" placeholder="Ej: Lenovo, HP, Cisco, Epson">
                        </div>
                        <div class="form-group col-6">
                            <label for="form-serial-modelo">Modelo Específico</label>
                            <input type="text" id="form-serial-modelo" placeholder="Ej: ThinkCentre M720q, ProDesk 400">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-6">
                            <label for="form-serial-ubicacion">Ubicación en Almacén</label>
                            <input type="text" id="form-serial-ubicacion" placeholder="Ej: Estante A-1, Caja 3">
                        </div>
                        <div class="form-group col-6">
                            <label for="form-serial-estado">Estado en Almacén</label>
                            <select id="form-serial-estado" class="custom-select">
                                <option value="Disponible">🟢 En Almacén (Disponible)</option>
                                <option value="Mantenimiento">🔴 En Revisión / Mantenimiento</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btn-cancel-serial-modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Serial en Almacén</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL: ESCÁNER DE CÁMARA & LECTOR DE BARRAS -->
    <div class="modal-overlay hidden" id="modal-camera-scanner">
        <div class="modal-container" style="max-width: 550px;">
            <div class="modal-header">
                <h3 id="modal-camera-scanner-title"><i data-lucide="scan"></i> Escáner de Código QR / Serial</h3>
                <button class="btn-close-modal" id="btn-close-camera-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <p id="modal-camera-scanner-desc" style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">
                    Apunta la cámara al código QR o código de barras del equipo.
                </p>
                <div class="camera-container" style="position:relative; width:100%; min-height:220px; background:#000; border-radius:10px; overflow:hidden;">
                    <div id="modal-qr-reader-viewport"></div>
                    <div class="camera-placeholder" id="modal-camera-placeholder" style="padding: 2rem; color: #fff;">
                        <i data-lucide="camera" style="width:48px; height:48px; margin-bottom:0.5rem; opacity:0.7;"></i>
                        <p>Iniciando cámara...</p>
                    </div>
                </div>
                <div class="camera-controls hidden mt-2" id="modal-camera-controls" style="margin-top:0.75rem;">
                    <button class="btn btn-danger btn-sm" id="btn-modal-stop-camera">
                        <i data-lucide="square"></i> Detener Cámara
                    </button>
                </div>
                <div class="manual-scanner-box mt-3" style="border-top:1px dashed var(--border-color); padding-top:1rem; margin-top:1rem;">
                    <label for="input-modal-manual-scan" style="font-size:0.85rem; font-weight:600; display:block; text-align:left; margin-bottom:0.4rem;">
                        O ingresa código manualmente / Lector USB:
                    </label>
                    <div class="input-with-button">
                        <input type="text" id="input-modal-manual-scan" placeholder="Escanea o escribe serial o ID...">
                        <button class="btn btn-primary" id="btn-modal-manual-scan">
                            <i data-lucide="arrow-right"></i> Procesar
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btn-cancel-camera-modal">Cerrar Escáner</button>
            </div>
        </div>
    </div>

    <!-- MODAL: SELECCIÓN DE ACCIÓN TRAS ESCANEAR QR STICKER -->
    <div class="modal-overlay hidden" id="modal-scan-action-choice">
        <div class="modal-container" style="max-width: 480px;">
            <div class="modal-header">
                <h3><i data-lucide="qr-code"></i> Sticker QR Escaneado</h3>
                <button class="btn-close-modal" id="btn-close-scan-choice-modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <div class="item-summary-box" style="padding:1rem; background:var(--bg-secondary); border-radius:10px; margin-bottom:1.2rem;">
                    <span class="badge badge-accent" id="scan-choice-item-id">ID: #0</span>
                    <h3 id="scan-choice-item-title" style="margin:0.5rem 0; font-size:1.2rem; color:var(--text-main);">Nombre Consumible</h3>
                    <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">
                        Stock Actual en Almacén: <strong id="scan-choice-item-stock" style="font-size:1.1rem; color:var(--accent-primary);">0</strong> unidades
                    </p>
                </div>

                <p style="font-weight:600; margin-bottom:1rem;">¿Qué operación deseas realizar con este consumible?</p>

                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    <button class="btn btn-emerald btn-lg btn-block" id="btn-choice-entrada" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; font-size:1.05rem;">
                        <i data-lucide="arrow-down-left"></i> 🟢 REGISTRAR ENTRADA (+ Ingreso)
                    </button>
                    <button class="btn btn-rose btn-lg btn-block" id="btn-choice-salida" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; font-size:1.05rem;">
                        <i data-lucide="arrow-up-right"></i> 🔴 REGISTRAR SALIDA (- Despacho)
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btn-cancel-scan-choice-modal">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- Scripts de la aplicación -->
    <script>
        window.MYSQL_CONSUMIBLES = <?php echo json_encode($dbConsumibles ?: []); ?>;
        window.MYSQL_SERIALS = <?php echo json_encode($dbSerials ?: []); ?>;
    </script>
    <script src="js/imagen1_base64.js"></script>
    <script src="js/data.js"></script>
    <script src="js/data_history.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
