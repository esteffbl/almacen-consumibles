/**
 * QR INVENTORY PRO - ALMACÉN DE CONSUMIBLES & EQUIPOS SERIALIZADOS
 * Engine de aplicación de inventario pura de almacén con módulo completo de Entradas y Salidas
 */

const PERSONA_CARGOS = {
  "ANDRES CAMPOS": "ESPECIALISTA DE INFRAESTRUCTURA Y RADIOTELECOMUNICACIONES",
  "DAYANA PEREZ": "COORDINADORA GESTIÓN DE USUARIOS",
  "ESTEFANY BRUZUAL": "ANALISTA DE RECURSOS DE TI",
  "GREGORY GONZALEZ": "ESPECIALISTA DE REDES DE DATOS",
  "HUMBERTO NOLASCO": "ESPECIALISTAS DE GESTION DE USUARIOS",
  "RAUL FARFAN": "ANALISTA DE SOPORTE USUARIO",
  "RICHARD ROJAS": "SUPERVISOR DE SOPORTE USUARIO",
  "ROBERT MORALES": "ANALISTA DE SOPORTE USUARIO",
  "RONAL VEGAS": "ESPECIALISA DE SOFTWARE",
  "WILMER DIAZ": "GERENTE TI",
  "YIVINITZZA GONZALEZ": "SUPERVISORA DE RECURSOS DE TI",
  "BALDASSARE CLEMENTI": "ANALISTA DE SOPORTE USUARIO"
};

const state = {
  items: [],
  serials: [],
  selectedIds: new Set(),
  currentView: 'cards',
  activeTab: 'tab-inventory',
  searchTerm: '',
  categoryFilter: 'ALL',
  stockFilter: 'ALL',
  searchSerialTerm: '',
  serialStatusFilter: 'ALL',
  history: (function() {
    const saved = localStorage.getItem('qr_inventory_history');
    if (saved && saved !== '[]') {
      try { return JSON.parse(saved); } catch(e){}
    }
    return typeof initialHistoryLog !== 'undefined' ? [...initialHistoryLog] : [];
  })(),
  labelConfig: {
    style: 'standard',
    cols: 'cols-3',
    showTitle: true,
    showId: true,
    showCategory: true,
    showLocation: true,
    showBorder: true,
    payloadType: 'json'
  },
  html5QrScanner: null,
  modalHtml5QrScanner: null,
  modalScannerMode: 'INVENTORY',
  scannedChoiceItem: null,
  activeItemForStock: null,
  activeSerialForStock: null
};

document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  initAuth();
  loadData();
  localStorage.setItem('qr_inventory_theme', 'light');
  applyTheme('light');
  setupCategoriesDropdown();
  setupEventListeners();
  renderAll();
});

function initAuth() {
  const loginForm = document.getElementById('login-form');
  const btnLogout = document.getElementById('btn-logout');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const errorMsg = document.getElementById('login-error-msg');
      const btnSubmit = document.getElementById('btn-login-submit');

      const usuario = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!usuario || !password) return;

      if (btnSubmit) btnSubmit.disabled = true;
      if (errorMsg) {
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('qr_app_user', JSON.stringify(data.user));
          checkUserSession();
          if (usernameInput) usernameInput.value = '';
          if (passwordInput) passwordInput.value = '';
        } else {
          if (errorMsg) {
            errorMsg.textContent = data.message || 'Usuario o contraseña incorrectos';
            errorMsg.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (usuario === 'admin' && password === 'admin123') {
          const userObj = { usuario: 'admin', nombre: 'Administrador Principal', rol: 'Admin' };
          localStorage.setItem('qr_app_user', JSON.stringify(userObj));
          checkUserSession();
          if (usernameInput) usernameInput.value = '';
          if (passwordInput) passwordInput.value = '';
        } else {
          if (errorMsg) {
            errorMsg.textContent = 'Usuario o contraseña incorrectos. (Prueba: admin / admin123)';
            errorMsg.classList.remove('hidden');
          }
        }
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('qr_app_user');
      checkUserSession();
    });
  }

  checkUserSession();
}

function checkUserSession() {
  const loginScreen = document.getElementById('login-screen');
  const userBadgeName = document.getElementById('current-user-name');
  const savedUser = localStorage.getItem('qr_app_user');

  if (savedUser) {
    try {
      const userObj = JSON.parse(savedUser);
      if (userBadgeName) userBadgeName.textContent = userObj.nombre || userObj.usuario;
      if (loginScreen) {
        loginScreen.classList.remove('active');
        document.documentElement.classList.remove('show-login-initially');
      }
    } catch (e) {
      if (loginScreen) loginScreen.classList.add('active');
    }
  } else {
    if (loginScreen) loginScreen.classList.add('active');
  }
}



function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function loadData() {
  if (window.MYSQL_CONSUMIBLES && window.MYSQL_CONSUMIBLES.length > 0) {
    state.items = window.MYSQL_CONSUMIBLES.map(i => ({
      id: String(i.id),
      item: i.item,
      categoria: i.categoria || 'Consumibles Generales',
      entradaInicial: Number(i.entrada_inicial || 0),
      entrada: Number(i.entrada || 0),
      salida: Number(i.salida || 0),
      stock: Number(i.stock || 0),
      minStock: Number(i.min_stock || 3),
      ubicacion: i.ubicacion || 'Almacén Principal'
    }));
  } else {
    const savedData = localStorage.getItem('qr_inventory_data');
    const savedVersion = localStorage.getItem('qr_inventory_version');
    const OFFICIAL_VERSION = '2026_08_04_v16_sync_excel';

    if (savedData && savedVersion === OFFICIAL_VERSION) {
      try {
        state.items = JSON.parse(savedData);
      } catch (e) {
        state.items = typeof initialConsumibles !== 'undefined' ? [...initialConsumibles] : [];
      }
    } else {
      state.items = typeof initialConsumibles !== 'undefined' ? [...initialConsumibles] : [];
      localStorage.setItem('qr_inventory_version', OFFICIAL_VERSION);
      saveData();
    }
  }

  if (window.MYSQL_SERIALS && window.MYSQL_SERIALS.length > 0) {
    state.serials = window.MYSQL_SERIALS.map(s => ({
      serial: s.serial,
      itemId: String(s.item_id || ''),
      tipo: s.tipo || 'Equipo',
      marca: s.marca || '',
      modelo: s.modelo || '',
      estado: s.estado || 'Disponible',
      ubicacion: s.ubicacion || 'Almacén Principal',
      fechaRegistro: s.fecha_registro || new Date().toISOString().slice(0, 10)
    }));
  } else {
    const savedSerials = localStorage.getItem('qr_inventory_serials');
    if (savedSerials) {
      try {
        state.serials = JSON.parse(savedSerials);
      } catch (e) {
        state.serials = typeof initialSerializedEquipos !== 'undefined' ? [...initialSerializedEquipos] : [];
      }
    } else {
      state.serials = typeof initialSerializedEquipos !== 'undefined' ? [...initialSerializedEquipos] : [];
      saveSerials();
    }
  }
  
  if ((!state.history || state.history.length === 0) && typeof initialHistoryLog !== 'undefined') {
    state.history = [...initialHistoryLog];
    saveHistory();
  }

  state.selectedIds = new Set(state.items.map(i => i.id));
}

function saveData() {
  localStorage.setItem('qr_inventory_data', JSON.stringify(state.items));
  saveSerials();
  updateStatsHeader();
}

function saveSerials() {
  localStorage.setItem('qr_inventory_serials', JSON.stringify(state.serials));
  const badgeSerials = document.getElementById('badge-serials-count');
  if (badgeSerials) badgeSerials.textContent = state.serials.length;
}

function saveHistory() {
  localStorage.setItem('qr_inventory_history', JSON.stringify(state.history));
}

function updateStatsHeader() {
  const totalItems = state.items.length;
  const totalStock = state.items.reduce((acc, item) => acc + Number(item.stock || 0), 0);
  const lowStockCount = state.items.filter(item => Number(item.stock) <= Number(item.minStock)).length;

  const elTotalItems = document.getElementById('stat-total-items');
  const elTotalStock = document.getElementById('stat-total-stock');
  const elLowStock = document.getElementById('stat-low-stock');

  if (elTotalItems) elTotalItems.textContent = totalItems;
  if (elTotalStock) elTotalStock.textContent = totalStock;
  if (elLowStock) elLowStock.textContent = lowStockCount;

  const pillLowStock = document.getElementById('pill-low-stock');
  if (pillLowStock) {
    if (lowStockCount > 0) {
      pillLowStock.classList.add('warning');
    } else {
      pillLowStock.classList.remove('warning');
    }
  }
}

function setupCategoriesDropdown() {
  const selectCat = document.getElementById('select-category');
  if (!selectCat) return;

  const categories = Array.from(new Set(state.items.map(i => i.categoria))).sort();

  selectCat.innerHTML = '<option value="ALL">Todas las Categorías</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    selectCat.appendChild(opt);
  });
}

function setupItemSelectForSerials() {
  const selectItem = document.getElementById('form-serial-itemid');
  if (!selectItem) return;

  selectItem.innerHTML = state.items.map(i => `
    <option value="${i.id}">Ruta #${i.id} - ${escapeHtml(i.item)} (Stock: ${i.stock})</option>
  `).join('');
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('qr_inventory_theme', theme);

  const themeIcon = document.getElementById('icon-theme');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    initLucideIcons();
  }
}

function setupEventListeners() {
  document.getElementById('btn-scan-serial-modal')?.addEventListener('click', () => {
    openCameraScannerModal('SERIAL');
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });


  // Cambio automático de cargo al seleccionar Solicitante
  document.getElementById('movement-person')?.addEventListener('change', (e) => {
    const personName = e.target.value;
    const cargoInput = document.getElementById('movement-cargo');
    if (cargoInput && PERSONA_CARGOS[personName]) {
      cargoInput.value = PERSONA_CARGOS[personName];
    }
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      switchTab(targetTab);
    });
  });

  document.getElementById('btn-print-inventory-list')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-trigger-print-list')?.addEventListener('click', () => {
    window.print();
  });

  const searchInput = document.getElementById('input-search');
  const btnClearSearch = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.toLowerCase().trim();
      if (btnClearSearch) btnClearSearch.style.display = state.searchTerm ? 'block' : 'none';
      renderInventory();
    });

    btnClearSearch?.addEventListener('click', () => {
      searchInput.value = '';
      state.searchTerm = '';
      btnClearSearch.style.display = 'none';
      renderInventory();
    });
  }

  document.getElementById('select-category')?.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    renderInventory();
  });

  document.getElementById('select-stock-filter')?.addEventListener('change', (e) => {
    state.stockFilter = e.target.value;
    renderInventory();
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.searchTerm = '';
    state.categoryFilter = 'ALL';
    state.stockFilter = 'ALL';
    if (document.getElementById('select-category')) document.getElementById('select-category').value = 'ALL';
    if (document.getElementById('select-stock-filter')) document.getElementById('select-stock-filter').value = 'ALL';
    if (btnClearSearch) btnClearSearch.style.display = 'none';
    renderInventory();
  });

  const searchSerialInput = document.getElementById('input-search-serial');
  const btnClearSerialSearch = document.getElementById('btn-clear-search-serial');

  if (searchSerialInput) {
    searchSerialInput.addEventListener('input', (e) => {
      state.searchSerialTerm = e.target.value.toLowerCase().trim();
      if (btnClearSerialSearch) btnClearSerialSearch.style.display = state.searchSerialTerm ? 'block' : 'none';
      renderSerials();
    });

    btnClearSerialSearch?.addEventListener('click', () => {
      searchSerialInput.value = '';
      state.searchSerialTerm = '';
      btnClearSerialSearch.style.display = 'none';
      renderSerials();
    });
  }

  document.getElementById('select-serial-status')?.addEventListener('change', (e) => {
    state.serialStatusFilter = e.target.value;
    renderSerials();
  });

  document.getElementById('btn-view-cards')?.addEventListener('click', () => setViewMode('cards'));
  document.getElementById('btn-view-table')?.addEventListener('click', () => setViewMode('table'));

  document.getElementById('btn-select-all')?.addEventListener('click', selectAllItems);
  document.getElementById('btn-deselect-all')?.addEventListener('click', deselectAllItems);
  document.getElementById('btn-go-to-print')?.addEventListener('click', () => switchTab('tab-qr-labels'));
  document.getElementById('btn-select-all-print')?.addEventListener('click', selectAllItems);
  document.getElementById('btn-clear-print')?.addEventListener('click', deselectAllItems);

  document.getElementById('report-number-input')?.addEventListener('input', (e) => {
    const lbl = document.getElementById('lbl-report-num-btn');
    if (lbl) lbl.textContent = e.target.value || '18';
  });

  document.getElementById('report-date-input')?.addEventListener('change', () => {
    renderOfficialReport();
  });

  document.getElementById('select-label-style')?.addEventListener('change', (e) => {
    state.labelConfig.style = e.target.value;
    renderQRLabels();
  });

  document.getElementById('select-grid-cols')?.addEventListener('change', (e) => {
    state.labelConfig.cols = e.target.value;
    renderQRLabels();
  });

  document.getElementById('chk-show-title')?.addEventListener('change', (e) => {
    state.labelConfig.showTitle = e.target.checked;
    renderQRLabels();
  });

  document.getElementById('chk-show-id')?.addEventListener('change', (e) => {
    state.labelConfig.showId = e.target.checked;
    renderQRLabels();
  });

  document.getElementById('chk-show-category')?.addEventListener('change', (e) => {
    state.labelConfig.showCategory = e.target.checked;
    renderQRLabels();
  });

  document.getElementById('chk-show-location')?.addEventListener('change', (e) => {
    state.labelConfig.showLocation = e.target.checked;
    renderQRLabels();
  });

  document.getElementById('chk-show-border')?.addEventListener('change', (e) => {
    state.labelConfig.showBorder = e.target.checked;
    renderQRLabels();
  });

  document.getElementById('select-qr-payload-type')?.addEventListener('change', (e) => {
    state.labelConfig.payloadType = e.target.value;
    renderQRLabels();
  });

  document.getElementById('btn-trigger-print')?.addEventListener('click', () => window.print());
  document.getElementById('btn-export-excel')?.addEventListener('click', exportToOfficialExcel);
  document.getElementById('btn-download-report-excel')?.addEventListener('click', exportToOfficialExcel);

  // Formulario Consumible (Creación / Edición)
  document.getElementById('btn-new-item')?.addEventListener('click', () => openItemModal());
  document.getElementById('btn-close-item-modal')?.addEventListener('click', closeItemModal);
  document.getElementById('btn-cancel-item-modal')?.addEventListener('click', closeItemModal);
  document.getElementById('form-item')?.addEventListener('submit', handleSaveItem);

  // Formulario Movimientos (Entradas / Salidas)
  document.getElementById('btn-close-movement-modal')?.addEventListener('click', closeMovementModal);
  document.getElementById('btn-cancel-movement-modal')?.addEventListener('click', closeMovementModal);
  document.getElementById('form-movement')?.addEventListener('submit', handleSaveMovement);

  // Modal Planilla Oficial
  document.getElementById('btn-close-planilla-modal')?.addEventListener('click', closePlanillaModal);
  document.getElementById('btn-cancel-planilla-modal')?.addEventListener('click', closePlanillaModal);
  document.getElementById('btn-print-planilla')?.addEventListener('click', () => window.print());

  // Auto cálculo de stock al modificar contadores en modal consumibles
  ['form-entrada-inicial', 'form-entrada', 'form-salida'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateFormStock);
  });

  // Modal Seriales
  document.getElementById('btn-new-serial-item')?.addEventListener('click', () => openSerialModal());
  document.getElementById('btn-close-serial-modal')?.addEventListener('click', closeSerialModal);
  document.getElementById('btn-cancel-serial-modal')?.addEventListener('click', closeSerialModal);
  document.getElementById('form-serial-item')?.addEventListener('submit', handleSaveSerial);
  document.getElementById('form-serial-itemid')?.addEventListener('change', (e) => autoFillMarcaModeloFromItem(e.target.value));

  // Botones de las 3 opciones de escáner en módulo de Seriales
  document.getElementById('btn-scan-serial-photo-tab')?.addEventListener('click', () => {
    document.getElementById('input-file-ocr-label')?.click();
  });
  document.getElementById('btn-scan-serial-photo')?.addEventListener('click', () => {
    document.getElementById('input-file-ocr-label')?.click();
  });
  document.getElementById('btn-scan-serial-barcode')?.addEventListener('click', () => {
    openCameraScannerModal('BARCODE');
  });

  document.getElementById('input-file-ocr-label')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processLabelImageOCR(e.target.files[0]);
    }
  });

  // Selector interno dentro del Modal de Escáner
  document.getElementById('btn-scanner-mode-barcode')?.addEventListener('click', () => {
    switchScannerSubMode('BARCODE');
  });
  document.getElementById('btn-scanner-mode-qr')?.addEventListener('click', () => {
    switchScannerSubMode('QR');
  });
  document.getElementById('btn-scanner-mode-photo')?.addEventListener('click', () => {
    closeCameraScannerModal();
    document.getElementById('input-file-ocr-label')?.click();
  });

  // Modal Ajuste Rápido de Stock
  document.getElementById('btn-close-stock-modal')?.addEventListener('click', closeStockModal);
  document.getElementById('btn-cancel-stock-modal')?.addEventListener('click', closeStockModal);
  document.getElementById('btn-decrement-stock')?.addEventListener('click', () => modifyStockValue(-1));
  document.getElementById('btn-increment-stock')?.addEventListener('click', () => modifyStockValue(1));
  document.getElementById('btn-save-stock-adjust')?.addEventListener('click', saveStockAdjustment);

  // Escáneres Integrados en Módulos (Inventario y Seriales)
  document.getElementById('btn-scan-qr-inventory')?.addEventListener('click', () => openCameraScannerModal('INVENTORY'));
  document.getElementById('btn-scan-serial-tab')?.addEventListener('click', () => openCameraScannerModal('SERIAL'));

  // Modales de Escáner y Selección de Acción
  document.getElementById('btn-close-camera-modal')?.addEventListener('click', closeCameraScannerModal);
  document.getElementById('btn-cancel-camera-modal')?.addEventListener('click', closeCameraScannerModal);
  document.getElementById('btn-modal-stop-camera')?.addEventListener('click', stopModalCameraScanner);
  document.getElementById('btn-modal-manual-scan')?.addEventListener('click', handleModalManualScan);
  document.getElementById('input-modal-manual-scan')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleModalManualScan();
  });

  document.getElementById('btn-close-scan-choice-modal')?.addEventListener('click', closeScanChoiceModal);
  document.getElementById('btn-cancel-scan-choice-modal')?.addEventListener('click', closeScanChoiceModal);
  document.getElementById('btn-choice-entrada')?.addEventListener('click', () => {
    const item = state.scannedChoiceItem;
    closeScanChoiceModal();
    if (item) openMovementModal(item.id, 'ENTRADA');
  });
  document.getElementById('btn-choice-salida')?.addEventListener('click', () => {
    const item = state.scannedChoiceItem;
    closeScanChoiceModal();
    if (item) openMovementModal(item.id, 'SALIDA');
  });

  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const scanId = e.currentTarget.dataset.scanId;
      const manualInput = document.getElementById('input-manual-scan');
      if (manualInput) manualInput.value = scanId;
      handleManualScanInput();
    });
  });

  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (confirm('¿Estás seguro de borrar el historial de movimientos?')) {
      state.history = [];
      saveHistory();
      renderHistory();
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === tabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  if (tabId === 'tab-serials') {
    renderSerials();
  } else if (tabId === 'tab-report') {
    renderOfficialReport();
  } else if (tabId === 'tab-qr-labels') {
    renderQRLabels();
  } else if (tabId === 'tab-history') {
    renderHistory();
  }

  initLucideIcons();
}

function setViewMode(mode) {
  state.currentView = mode;
  document.getElementById('btn-view-cards')?.classList.toggle('active', mode === 'cards');
  document.getElementById('btn-view-table')?.classList.toggle('active', mode === 'table');
  
  document.getElementById('inventory-container')?.classList.toggle('hidden', mode !== 'cards');
  document.getElementById('inventory-table-wrapper')?.classList.toggle('hidden', mode !== 'table');
}

function getFilteredItems() {
  return state.items.filter(item => {
    const matchesSearch = !state.searchTerm || 
      item.item.toLowerCase().includes(state.searchTerm) ||
      item.id.toLowerCase().includes(state.searchTerm) ||
      (item.ubicacion && item.ubicacion.toLowerCase().includes(state.searchTerm));

    const matchesCategory = state.categoryFilter === 'ALL' || item.categoria === state.categoryFilter;

    let matchesStock = true;
    const stock = Number(item.stock);
    const minStock = Number(item.minStock || 3);

    if (state.stockFilter === 'LOW') {
      matchesStock = stock <= minStock && stock > 0;
    } else if (state.stockFilter === 'NORMAL') {
      matchesStock = stock > minStock;
    } else if (state.stockFilter === 'OUT') {
      matchesStock = stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });
}

function renderAll() {
  renderInventory();
  renderSerials();
  renderOfficialReport();
  renderQRLabels();
  updateStatsHeader();
}

function renderInventory() {
  const filtered = getFilteredItems();
  const container = document.getElementById('inventory-container');
  const tableBody = document.getElementById('inventory-table-body');
  const emptyState = document.getElementById('empty-inventory-state');

  if (!container || !tableBody) return;

  if (filtered.length === 0) {
    container.innerHTML = '';
    tableBody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  container.innerHTML = filtered.map(item => {
    const isSelected = state.selectedIds.has(item.id);
    const stockNum = Number(item.stock);
    const minStock = Number(item.minStock || 3);
    
    let stockBadgeClass = 'badge-success';
    let stockLabel = 'Stock Normal';
    if (stockNum === 0) {
      stockBadgeClass = 'badge-danger';
      stockLabel = 'Agotado';
    } else if (stockNum <= minStock) {
      stockBadgeClass = 'badge-warning';
      stockLabel = 'Stock Bajo';
    }

    return `
      <div class="item-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
        <div class="item-card-top">
          <span class="item-id-badge">Ruta: #${item.id}</span>
          <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
        </div>
        <div class="item-card-center">
          <h3 class="item-title">${escapeHtml(item.item)}</h3>
          <span class="item-category">${escapeHtml(item.categoria || 'Consumibles')}</span>
          <div class="item-location" style="margin-top: 0.5rem; font-size: 0.78rem; display:flex; gap:0.6rem;">
            <span><i data-lucide="arrow-down-left" style="color:var(--accent-cyan); width:13px;"></i> Ini: <strong>${item.entradaInicial || 0}</strong></span>
            <span><i data-lucide="plus-circle" style="color:var(--accent-emerald); width:13px;"></i> Ent: <strong>${item.entrada || 0}</strong></span>
            <span><i data-lucide="minus-circle" style="color:var(--accent-rose); width:13px;"></i> Sal: <strong>${item.salida || 0}</strong></span>
          </div>
        </div>
        <div class="item-card-bottom">
          <div class="stock-info">
            <span class="stock-num">${item.stock}</span>
            <small style="font-size:0.7rem; color:var(--text-muted);">Inventario Final</small>
            <span class="badge ${stockBadgeClass}" style="margin-top:2px;">${stockLabel}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-icon btn-sm" onclick="openMovementModal('${item.id}', 'ENTRADA')" title="Registrar Entrada / Ingreso (+)">
              <i data-lucide="plus-circle" style="color:var(--accent-emerald);"></i>
            </button>
            <button class="btn btn-icon btn-sm" onclick="openMovementModal('${item.id}', 'SALIDA')" title="Registrar Salida / Despacho (-)">
              <i data-lucide="minus-circle" style="color:var(--accent-rose);"></i>
            </button>
            <button class="btn btn-icon btn-sm" onclick="openItemModal('${item.id}')" title="Editar Consumible">
              <i data-lucide="edit"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  tableBody.innerHTML = filtered.map(item => {
    const isSelected = state.selectedIds.has(item.id);
    const stockNum = Number(item.stock);
    const minStock = Number(item.minStock || 3);

    let stockBadgeClass = 'badge-success';
    let stockLabel = 'Stock Normal';
    if (stockNum === 0) {
      stockBadgeClass = 'badge-danger';
      stockLabel = 'Agotado';
    } else if (stockNum <= minStock) {
      stockBadgeClass = 'badge-warning';
      stockLabel = 'Stock Bajo';
    }

    return `
      <tr>
        <td>
          <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
        </td>
        <td><strong>#${item.id}</strong></td>
        <td>${escapeHtml(item.item)}</td>
        <td><span class="item-category">${escapeHtml(item.categoria)}</span></td>
        <td>${item.entradaInicial || 0}</td>
        <td><span style="color: var(--accent-emerald); font-weight:600;">+${item.entrada || 0}</span></td>
        <td><span style="color: var(--accent-rose); font-weight:600;">-${item.salida || 0}</span></td>
        <td><strong style="font-size:1.05rem;">${item.stock}</strong></td>
        <td><span class="badge ${stockBadgeClass}">${stockLabel}</span></td>
        <td class="text-right">
          <button class="btn btn-icon btn-sm" onclick="openMovementModal('${item.id}', 'ENTRADA')" title="Registrar Entrada (+)">
            <i data-lucide="plus-circle" style="color:var(--accent-emerald);"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="openMovementModal('${item.id}', 'SALIDA')" title="Registrar Salida (-)">
            <i data-lucide="minus-circle" style="color:var(--accent-rose);"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="openItemModal('${item.id}')" title="Editar">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="deleteItem('${item.id}')" title="Eliminar">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.item-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        state.selectedIds.add(id);
      } else {
        state.selectedIds.delete(id);
      }
      updateSelectionUI();
    });
  });

  updateSelectionUI();
  initLucideIcons();
}

/* ----------------------------------------------------------------------------
 * MÓDULO ESPECIALIZADO DE ENTRADAS Y SALIDAS PEQUIVEN (PLANILLA OFICIAL IMPRESA)
 * ---------------------------------------------------------------------------- */

function openMovementModal(itemId, defaultType = 'ENTRADA') {
  const item = state.items.find(i => String(i.id) === String(itemId));
  if (!item) return;

  state.activeItemForStock = item;
  
  const elId = document.getElementById('movement-item-id');
  document.getElementById('movement-item-id').value = item.id;
  if (document.getElementById('movement-history-index')) {
    document.getElementById('movement-history-index').value = -1;
  }

  const titleEl = document.getElementById('movement-item-title');
  if (titleEl) titleEl.textContent = item.item;

  const badgeEl = document.getElementById('movement-item-id-badge');
  if (badgeEl) badgeEl.textContent = `Ruta: #${item.id}`;

  const initEl = document.getElementById('movement-item-initial');
  if (initEl) initEl.textContent = item.entradaInicial || 0;

  const inEl = document.getElementById('movement-item-in');
  if (inEl) inEl.textContent = item.entrada || 0;

  const outEl = document.getElementById('movement-item-out');
  if (outEl) outEl.textContent = item.salida || 0;

  const stockEl = document.getElementById('movement-item-stock');
  if (stockEl) stockEl.textContent = item.stock || 0;

  const selectType = document.getElementById('movement-type');
  if (selectType) selectType.value = defaultType;

  const qtyInput = document.getElementById('movement-qty');
  if (qtyInput) qtyInput.value = 1;

  const defaultPerson = 'BALDASSARE CLEMENTI';
  if (document.getElementById('movement-person')) document.getElementById('movement-person').value = defaultPerson;
  if (document.getElementById('movement-cargo')) document.getElementById('movement-cargo').value = PERSONA_CARGOS[defaultPerson] || 'ANALISTA DE SOPORTE USUARIO';
  if (document.getElementById('movement-dept')) document.getElementById('movement-dept').value = 'GERENCIA DE TI';
  if (document.getElementById('movement-analista')) document.getElementById('movement-analista').value = 'ESTEFANY BRUZUAL';
  if (document.getElementById('movement-marca')) document.getElementById('movement-marca').value = 'S/M';
  if (document.getElementById('movement-modelo')) document.getElementById('movement-modelo').value = 'S/M';
  if (document.getElementById('movement-ref')) document.getElementById('movement-ref').value = '';
  if (document.getElementById('movement-motivo')) document.getElementById('movement-motivo').value = 'SUMINISTRO DE CONSUMIBLES';
  if (document.getElementById('movement-notes')) document.getElementById('movement-notes').value = 's/o';

  const modalTitle = document.getElementById('movement-modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = defaultType === 'ENTRADA' 
      ? '<i data-lucide="arrow-down-left" style="color:var(--accent-emerald);"></i> Registrar Entrada (+ Ingreso)'
      : '<i data-lucide="arrow-up-right" style="color:var(--accent-rose);"></i> Registrar Salida (- Despacho)';
  }

  document.getElementById('modal-movement')?.classList.remove('hidden');
  initLucideIcons();
}

function closeMovementModal() {
  document.getElementById('modal-movement')?.classList.add('hidden');
  state.activeItemForStock = null;
}

function handleSaveMovement(e) {
  e.preventDefault();
  const itemId = document.getElementById('movement-item-id').value;
  const historyIndex = parseInt(document.getElementById('movement-history-index')?.value, 10);
  const item = state.items.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const type = document.getElementById('movement-type').value;
  const qty = parseInt(document.getElementById('movement-qty').value, 10) || 0;
  const person = document.getElementById('movement-person').value.trim() || 'BALDASSARE CLEMENTI';
  const cargo = document.getElementById('movement-cargo')?.value.trim() || PERSONA_CARGOS[person] || 'ANALISTA DE SOPORTE USUARIO';
  const dept = document.getElementById('movement-dept').value.trim() || 'GERENCIA DE TI';
  const analista = document.getElementById('movement-analista')?.value || 'ESTEFANY BRUZUAL';
  const marca = document.getElementById('movement-marca').value.trim() || 'S/M';
  const modelo = document.getElementById('movement-modelo').value.trim() || 'S/M';
  const ref = document.getElementById('movement-ref').value.trim();
  const motivo = document.getElementById('movement-motivo')?.value.trim() || 'SUMINISTRO DE CONSUMIBLES';
  const notes = document.getElementById('movement-notes')?.value.trim() || 's/o';

  if (qty <= 0) {
    alert('La cantidad ingresada debe ser mayor a 0.');
    return;
  }

  let ini = Number(item.entradaInicial || 0);
  let ent = Number(item.entrada || 0);
  let sal = Number(item.salida || 0);

  if (historyIndex >= 0 && state.history[historyIndex]) {
    const oldRec = state.history[historyIndex];
    const oldDetail = oldRec.detail || {};
    const oldType = oldDetail.type || (oldRec.type.includes('Salida') ? 'SALIDA' : 'ENTRADA');
    const oldQty = oldDetail.qty || Math.abs(parseInt(oldRec.change, 10) || 0);

    if (oldType === 'ENTRADA') {
      ent = Math.max(0, ent - oldQty);
    } else {
      sal = Math.max(0, sal - oldQty);
    }
  }

  const currentStockTemp = Math.max(0, ini + ent - sal);
  if (type === 'SALIDA' && qty > currentStockTemp) {
    alert(`❌ No puedes despachar ${qty} unidad(es). El stock disponible de "${item.item}" es de ${currentStockTemp} unidad(es).`);
    return;
  }

  if (type === 'ENTRADA') {
    ent += qty;
  } else {
    sal += qty;
  }

  const newStock = Math.max(0, ini + ent - sal);
  item.entrada = ent;
  item.salida = sal;
  item.stock = newStock;

  const detailObj = {
    person, cargo, dept, analista, marca, modelo, ref, motivo, notes, qty, type,
    itemName: item.item
  };

  const metaStr = `${type} | Motivo: ${motivo} | ${person} (${cargo}) | ${dept} | Ref: ${ref || 'S/N'}`;
  const opLabel = type === 'ENTRADA' ? 'Entrada (+)' : 'Salida (-)';
  const delta = type === 'ENTRADA' ? qty : -qty;

  if (historyIndex >= 0 && state.history[historyIndex]) {
    state.history[historyIndex].type = opLabel;
    state.history[historyIndex].change = delta > 0 ? `+${delta}` : `${delta}`;
    state.history[historyIndex].finalStock = item.stock;
    state.history[historyIndex].notes = metaStr;
    state.history[historyIndex].detail = detailObj;
    saveHistory();
  } else {
    logMovement(item.id, item.item, opLabel, delta, item.stock, metaStr, detailObj);
  }

  saveData();
  renderAll();
  closeMovementModal();

  openPlanillaModal(detailObj);
}

function openPlanillaModal(data) {
  const modal = document.getElementById('modal-planilla-oficial');
  if (!modal) return;

  const logoData = (typeof HEADER_LOGO_BASE64 !== 'undefined' && HEADER_LOGO_BASE64) ? HEADER_LOGO_BASE64 : (window.HEADER_LOGO_BASE64 || '');
  const imgLogo = document.querySelector('#printable-planilla-content img') || document.getElementById('plan-header-logo-img');
  if (imgLogo && logoData) {
    imgLogo.src = logoData;
  }

  const isEntrada = data.type === 'ENTRADA';
  const docTitle = document.getElementById('plan-doc-title');
  if (docTitle) {
    docTitle.textContent = isEntrada ? 'ENTRADA DE CONSUMIBLES' : 'ENTREGA DE CONSUMIBLES';
  }

  const solicNombre = data.person || 'BALDASSARE CLEMENTI';
  const solicCargo = data.cargo || PERSONA_CARGOS[solicNombre] || 'ANALISTA DE SOPORTE USUARIO';

  if (document.getElementById('plan-solicitante-nombre')) document.getElementById('plan-solicitante-nombre').textContent = solicNombre;
  if (document.getElementById('plan-solicitante-cargo')) document.getElementById('plan-solicitante-cargo').textContent = solicCargo;
  if (document.getElementById('plan-solicitante-gerencia')) document.getElementById('plan-solicitante-gerencia').textContent = data.dept || 'GERENCIA DE TI';
  if (document.getElementById('plan-solicitante-motivo')) document.getElementById('plan-solicitante-motivo').textContent = data.motivo || data.notes || 'SUMINISTRO DE CONSUMIBLES';

  if (document.getElementById('plan-item-desc')) document.getElementById('plan-item-desc').textContent = data.itemName || 'TONER IMPRESORA RICOH IM4000';
  if (document.getElementById('plan-item-marca')) document.getElementById('plan-item-marca').textContent = data.marca || 'S/M';
  if (document.getElementById('plan-item-modelo')) document.getElementById('plan-item-modelo').textContent = data.modelo || 'S/M';
  if (document.getElementById('plan-item-obs')) document.getElementById('plan-item-obs').textContent = data.notes || (data.ref ? `Doc: ${data.ref}` : 's/o');
  if (document.getElementById('plan-item-cant')) document.getElementById('plan-item-cant').textContent = data.qty || 1;
  if (document.getElementById('plan-item-total')) document.getElementById('plan-item-total').textContent = data.qty || 1;

  if (document.getElementById('plan-footer-obs')) document.getElementById('plan-footer-obs').textContent = data.notes || 's/o';

  if (document.getElementById('plan-firma-solic-nombre')) document.getElementById('plan-firma-solic-nombre').textContent = solicNombre;

  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  document.querySelectorAll('.plan-fecha-actual').forEach(el => el.textContent = fechaStr);

  const selectAnalista = document.getElementById('select-analista-ait');
  if (selectAnalista && data.analista) {
    selectAnalista.value = data.analista;
  }

  modal.classList.remove('hidden');
  initLucideIcons();
}

function closePlanillaModal() {
  document.getElementById('modal-planilla-oficial')?.classList.add('hidden');
}

function renderHistory() {
  const tableBody = document.getElementById('history-table-body');
  const emptyState = document.getElementById('empty-history-state');
  if (!tableBody) return;

  if (state.history.length === 0) {
    tableBody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  tableBody.innerHTML = state.history.map((h, idx) => {
    const formattedDate = new Date(h.timestamp).toLocaleString();
    let badgeClass = 'badge-success';
    if (h.type.includes('Salida') || h.type.includes('Eliminación')) {
      badgeClass = 'badge-danger';
    } else if (h.type.includes('Edición') || h.type.includes('Serial')) {
      badgeClass = 'badge-warning';
    }

    return `
      <tr>
        <td><small style="color: var(--text-muted);">${formattedDate}</small></td>
        <td><strong>#${h.id}</strong></td>
        <td>${escapeHtml(h.item)}</td>
        <td><span class="badge ${badgeClass}">${h.type}</span></td>
        <td><strong>${h.change}</strong></td>
        <td>${h.finalStock}</td>
        <td><small>${escapeHtml(h.notes || '-')}</small></td>
        <td class="text-right">
          <div style="display:flex; justify-content:flex-end; gap:0.35rem; align-items:center;">
            <button type="button" class="btn btn-icon btn-sm" onclick="verPlanillaFromHistoryIndex(${idx})" title="Ver / Imprimir Planilla" style="background:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; padding: 4px 8px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:3px;">
              <i data-lucide="file-text"></i> 📄 Planilla
            </button>
            <button type="button" class="btn btn-icon btn-sm" onclick="editarMovimientoFromHistoryIndex(${idx})" title="Editar este movimiento" style="background:#fffbeb; border:1px solid #fde68a; color:#d97706; padding: 4px 8px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:3px;">
              <i data-lucide="pencil"></i> ✏️ Editar
            </button>
            <button type="button" class="btn btn-icon btn-sm" onclick="eliminarMovimientoFromHistoryIndex(${idx})" title="Eliminar este movimiento" style="background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding: 4px 8px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:3px;">
              <i data-lucide="trash-2"></i> 🗑️ Borrar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucideIcons();
}

function verPlanillaFromHistoryIndex(idx) {
  const h = state.history[idx];
  if (!h) return;

  const detailData = h.detail || {
    person: 'BALDASSARE CLEMENTI',
    cargo: PERSONA_CARGOS['BALDASSARE CLEMENTI'] || 'ANALISTA DE SOPORTE USUARIO',
    dept: 'GERENCIA DE TI',
    analista: 'ESTEFANY BRUZUAL',
    marca: 'S/M',
    modelo: 'S/M',
    ref: '',
    motivo: h.notes || 'SUMINISTRO DE CONSUMIBLES',
    notes: 's/o',
    qty: Math.abs(parseInt(h.change, 10) || 1),
    type: h.type.includes('Salida') ? 'SALIDA' : 'ENTRADA',
    itemName: h.item
  };

  openPlanillaModal(detailData);
}

function editarMovimientoFromHistoryIndex(idx) {
  const h = state.history[idx];
  if (!h) return;

  const item = state.items.find(i => String(i.id) === String(h.id));
  if (!item) {
    alert(`No se encontró el consumible asociado a este movimiento (ID: #${h.id}).`);
    return;
  }

  state.activeItemForStock = item;
  document.getElementById('movement-item-id').value = item.id;
  if (document.getElementById('movement-history-index')) {
    document.getElementById('movement-history-index').value = idx;
  }

  const titleEl = document.getElementById('movement-item-title');
  if (titleEl) titleEl.textContent = item.item;

  const badgeEl = document.getElementById('movement-item-id-badge');
  if (badgeEl) badgeEl.textContent = `Ruta: #${item.id}`;

  const initEl = document.getElementById('movement-item-initial');
  if (initEl) initEl.textContent = item.entradaInicial || 0;

  const inEl = document.getElementById('movement-item-in');
  if (inEl) inEl.textContent = item.entrada || 0;

  const outEl = document.getElementById('movement-item-out');
  if (outEl) outEl.textContent = item.salida || 0;

  const stockEl = document.getElementById('movement-item-stock');
  if (stockEl) stockEl.textContent = item.stock || 0;

  const detail = h.detail || {
    person: 'BALDASSARE CLEMENTI',
    cargo: PERSONA_CARGOS['BALDASSARE CLEMENTI'] || 'ANALISTA DE SOPORTE USUARIO',
    dept: 'GERENCIA DE TI',
    analista: 'ESTEFANY BRUZUAL',
    marca: 'S/M',
    modelo: 'S/M',
    ref: '',
    motivo: 'SUMINISTRO DE CONSUMIBLES',
    notes: 's/o',
    qty: Math.abs(parseInt(h.change, 10) || 1),
    type: h.type.includes('Salida') ? 'SALIDA' : 'ENTRADA'
  };

  const selectType = document.getElementById('movement-type');
  if (selectType) selectType.value = detail.type || (h.type.includes('Salida') ? 'SALIDA' : 'ENTRADA');

  const qtyInput = document.getElementById('movement-qty');
  if (qtyInput) qtyInput.value = detail.qty || Math.abs(parseInt(h.change, 10) || 1);

  if (document.getElementById('movement-person')) document.getElementById('movement-person').value = detail.person || 'BALDASSARE CLEMENTI';
  if (document.getElementById('movement-cargo')) document.getElementById('movement-cargo').value = detail.cargo || PERSONA_CARGOS[detail.person] || 'ANALISTA DE SOPORTE USUARIO';
  if (document.getElementById('movement-dept')) document.getElementById('movement-dept').value = detail.dept || 'GERENCIA DE TI';
  if (document.getElementById('movement-analista')) document.getElementById('movement-analista').value = detail.analista || 'ESTEFANY BRUZUAL';
  if (document.getElementById('movement-marca')) document.getElementById('movement-marca').value = detail.marca || 'S/M';
  if (document.getElementById('movement-modelo')) document.getElementById('movement-modelo').value = detail.modelo || 'S/M';
  if (document.getElementById('movement-ref')) document.getElementById('movement-ref').value = detail.ref || '';
  if (document.getElementById('movement-motivo')) document.getElementById('movement-motivo').value = detail.motivo || 'SUMINISTRO DE CONSUMIBLES';
  if (document.getElementById('movement-notes')) document.getElementById('movement-notes').value = detail.notes || 's/o';

  const modalTitle = document.getElementById('movement-modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = '<i data-lucide="edit" style="color:#f59e0b;"></i> Editar Movimiento de Inventario';
  }

  document.getElementById('modal-movement')?.classList.remove('hidden');
  initLucideIcons();
}

function eliminarMovimientoFromHistoryIndex(idx) {
  const h = state.history[idx];
  if (!h) return;

  if (!confirm(`¿Estás seguro de eliminar este registro de movimiento del historial?\n\n• Consumible: #${h.id} - ${h.item}\n• Cambio: ${h.change}\n• Detalle: ${h.notes || '-'}`)) {
    return;
  }

  const revertStock = confirm(`¿Deseas también revertir el cambio de stock de este movimiento en el inventario?\n\n(Aceptar = Revertir stock de "${h.item}" | Cancelar = Eliminar solo el registro del historial)`);

  if (revertStock) {
    const item = state.items.find(i => String(i.id) === String(h.id));
    if (item) {
      const detail = h.detail || {};
      const type = detail.type || (h.type.includes('Salida') ? 'SALIDA' : 'ENTRADA');
      const qty = detail.qty || Math.abs(parseInt(h.change, 10) || 0);

      let ini = Number(item.entradaInicial || 0);
      let ent = Number(item.entrada || 0);
      let sal = Number(item.salida || 0);

      if (type === 'ENTRADA') {
        ent = Math.max(0, ent - qty);
      } else {
        sal = Math.max(0, sal - qty);
      }

      item.entrada = ent;
      item.salida = sal;
      item.stock = Math.max(0, ini + ent - sal);
      saveData();
    }
  }

  state.history.splice(idx, 1);
  saveHistory();
  renderAll();
}

function calculateFormStock() {
  const ini = parseInt(document.getElementById('form-entrada-inicial')?.value, 10) || 0;
  const ent = parseInt(document.getElementById('form-entrada')?.value, 10) || 0;
  const sal = parseInt(document.getElementById('form-salida')?.value, 10) || 0;
  const finalStock = Math.max(0, ini + ent - sal);
  const stockInput = document.getElementById('form-stock');
  if (stockInput) stockInput.value = finalStock;
}

function openItemModal(itemId = null) {
  const modal = document.getElementById('modal-item');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('form-item');
  
  if (itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    title.textContent = 'Editar Consumible';
    document.getElementById('form-original-id').value = item.id;
    document.getElementById('form-id').value = item.id;
    document.getElementById('form-item-name').value = item.item;
    document.getElementById('form-category').value = item.categoria || '';
    document.getElementById('form-ubicacion').value = item.ubicacion || '';
    
    if (document.getElementById('form-entrada-inicial')) document.getElementById('form-entrada-inicial').value = item.entradaInicial || 0;
    if (document.getElementById('form-entrada')) document.getElementById('form-entrada').value = item.entrada || 0;
    if (document.getElementById('form-salida')) document.getElementById('form-salida').value = item.salida || 0;
    
    document.getElementById('form-stock').value = item.stock || 0;
    document.getElementById('form-min-stock').value = item.minStock || 3;
  } else {
    title.textContent = 'Nuevo Consumible';
    form.reset();
    document.getElementById('form-original-id').value = '';
    const maxId = Math.max(...state.items.map(i => parseInt(i.id) || 0), 0);
    document.getElementById('form-id').value = String(maxId + 1);
    
    if (document.getElementById('form-entrada-inicial')) document.getElementById('form-entrada-inicial').value = 0;
    if (document.getElementById('form-entrada')) document.getElementById('form-entrada').value = 0;
    if (document.getElementById('form-salida')) document.getElementById('form-salida').value = 0;
    if (document.getElementById('form-stock')) document.getElementById('form-stock').value = 0;
  }

  modal?.classList.remove('hidden');
}

function closeItemModal() {
  document.getElementById('modal-item')?.classList.add('hidden');
}

function handleSaveItem(e) {
  e.preventDefault();
  const origId = document.getElementById('form-original-id').value;
  const newId = document.getElementById('form-id').value.trim();
  const name = document.getElementById('form-item-name').value.trim();
  const cat = document.getElementById('form-category').value.trim() || 'Consumibles Generales';
  const ubi = document.getElementById('form-ubicacion').value.trim() || 'Almacén Principal';
  
  const ini = parseInt(document.getElementById('form-entrada-inicial')?.value, 10) || 0;
  const ent = parseInt(document.getElementById('form-entrada')?.value, 10) || 0;
  const sal = parseInt(document.getElementById('form-salida')?.value, 10) || 0;
  const stock = Math.max(0, ini + ent - sal);
  const minStock = parseInt(document.getElementById('form-min-stock').value, 10) || 3;

  if (!newId || !name) {
    alert('Por favor completa el ID y el nombre del consumible.');
    return;
  }

  if (origId) {
    const index = state.items.findIndex(i => i.id === origId);
    if (index !== -1) {
      state.items[index] = {
        ...state.items[index],
        id: newId,
        item: name,
        categoria: cat,
        ubicacion: ubi,
        entradaInicial: ini,
        entrada: ent,
        salida: sal,
        stock: stock,
        minStock: minStock
      };
      logMovement(newId, name, 'Edición', 0, stock, 'Modificación manual de datos del consumible');
    }
  } else {
    if (state.items.some(i => i.id === newId)) {
      alert(`El ID ${newId} ya existe en el inventario.`);
      return;
    }
    state.items.push({
      id: newId,
      item: name,
      categoria: cat,
      ubicacion: ubi,
      entradaInicial: stock,
      entrada: 0,
      salida: 0,
      stock: stock,
      minStock: minStock
    });
    state.selectedIds.add(newId);
    logMovement(newId, name, 'Creación', stock, stock, 'Alta de nuevo consumible');
  }

  saveData();
  setupCategoriesDropdown();
  renderAll();
  closeItemModal();
}

function deleteItem(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  if (confirm(`¿Estás seguro de eliminar "${item.item}" (ID: ${id}) del inventario?`)) {
    state.items = state.items.filter(i => i.id !== id);
    state.selectedIds.delete(id);
    logMovement(id, item.item, 'Eliminación', -item.stock, 0, 'Consumible eliminado');
    saveData();
    renderAll();
  }
}

function getFilteredSerials() {
  return state.serials.filter(eq => {
    const matchesSearch = !state.searchSerialTerm ||
      eq.serial.toLowerCase().includes(state.searchSerialTerm) ||
      (eq.tipo && eq.tipo.toLowerCase().includes(state.searchSerialTerm)) ||
      (eq.marca && eq.marca.toLowerCase().includes(state.searchSerialTerm)) ||
      (eq.modelo && eq.modelo.toLowerCase().includes(state.searchSerialTerm)) ||
      (eq.ubicacion && eq.ubicacion.toLowerCase().includes(state.searchSerialTerm));

    const matchesStatus = state.serialStatusFilter === 'ALL' || eq.estado === state.serialStatusFilter;
    return matchesSearch && matchesStatus;
  });
}

function renderSerials() {
  const tableBody = document.getElementById('serials-table-body');
  const emptyState = document.getElementById('empty-serials-state');
  if (!tableBody) return;

  const filtered = getFilteredSerials();

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  tableBody.innerHTML = filtered.map(eq => {
    let badgeClass = 'badge-success';
    let statusLabel = 'En Almacén';
    if (eq.estado === 'Mantenimiento') {
      badgeClass = 'badge-danger';
      statusLabel = 'En Revisión';
    }

    return `
      <tr>
        <td><strong style="font-family: monospace; font-size: 0.95rem; color: var(--accent-primary);">${escapeHtml(eq.serial)}</strong></td>
        <td><strong>${escapeHtml(eq.tipo || 'Equipo')}</strong></td>
        <td>${escapeHtml(eq.marca || '-')}</td>
        <td>${escapeHtml(eq.modelo || '-')}</td>
        <td><i data-lucide="map-pin" style="width:13px; color:var(--text-muted);"></i> ${escapeHtml(eq.ubicacion || 'Almacén Principal')}</td>
        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td><small style="color:var(--text-muted);">${eq.fechaRegistro || '-'}</small></td>
        <td class="text-right">
          <button class="btn btn-icon btn-sm" onclick="openSerialModal('${eq.serial}')" title="Editar Serial">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="deleteSerial('${eq.serial}')" title="Eliminar Serial">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  saveSerials();
  initLucideIcons();
}

function preprocessImageCanvas(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          const contrast = 1.3;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

          for (let i = 0; i < data.length; i += 4) {
            let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            gray = factor * (gray - 128) + 128;
            if (gray < 0) gray = 0;
            if (gray > 255) gray = 255;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (err) {
          console.warn("No se pudo aplicar contraste en canvas:", err);
        }

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.92);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function parseLabelText(rawText) {
  if (!rawText) return { serial: '', brand: '', model: '' };

  let cleanedText = rawText
    .replace(/(\r\n|\r|\n)+/g, '\n')
    .replace(/[iI]nput\s*:[^\n]+/gi, '')
    .replace(/made\s*in\s*[a-z\s]+/gi, '');

  const lines = cleanedText.split('\n').map(l => l.trim()).filter(Boolean);
  const fullUpper = cleanedText.toUpperCase();

  let serial = '';
  let brand = '';
  let model = '';

  // 1. DETECCIÓN DE MARCA
  const brandDefinitions = [
    { name: 'HP', regex: /\b(HP|HEWLETT\s*[-]?\s*PACKARD)\b/i },
    { name: 'DELL', regex: /\bDELL\b/i },
    { name: 'LENOVO', regex: /\bLENOVO\b/i },
    { name: 'CISCO', regex: /\bCISCO\b/i },
    { name: 'RICOH', regex: /\bRICOH\b/i },
    { name: 'EPSON', regex: /\bEPSON\b/i },
    { name: 'CANON', regex: /\bCANON\b/i },
    { name: 'SAMSUNG', regex: /\bSAMSUNG\b/i },
    { name: 'LG', regex: /\bLG\b/i },
    { name: 'BROTHER', regex: /\bBROTHER\b/i },
    { name: 'ZEBRA', regex: /\bZEBRA\b/i },
    { name: 'DAHUA', regex: /\bDAHUA\b/i },
    { name: 'HIKVISION', regex: /\bHIKVISION\b/i },
    { name: 'UBIQUITI', regex: /\bUBIQUITI\b/i },
    { name: 'FORTINET', regex: /\bFORTINET\b/i },
    { name: 'MIKROTIK', regex: /\bMIKROTIK\b/i },
    { name: 'TRIPP LITE', regex: /\b(TRIPP\s*[-]?\s*LITE|TRIPPLITE)\b/i },
    { name: 'APC', regex: /\bAPC\b/i },
    { name: 'KYOCERA', regex: /\bKYOCERA\b/i },
    { name: 'LEXMARK', regex: /\bLEXMARK\b/i },
    { name: 'XEROX', regex: /\bXEROX\b/i },
    { name: 'LOGITECH', regex: /\bLOGITECH\b/i },
    { name: 'ACER', regex: /\bACER\b/i },
    { name: 'ASUS', regex: /\bASUS\b/i },
    { name: 'TOSHIBA', regex: /\bTOSHIBA\b/i },
    { name: 'SONY', regex: /\bSONY\b/i },
    { name: 'PANASONIC', regex: /\bPANASONIC\b/i },
    { name: 'HUAWEI', regex: /\bHUAWEI\b/i },
    { name: 'TP-LINK', regex: /\b(TP\s*[-]?\s*LINK|TPLINK)\b/i },
    { name: 'D-LINK', regex: /\b(D\s*[-]?\s*LINK|DLINK)\b/i },
    { name: 'INTEL', regex: /\bINTEL\b/i },
    { name: 'AMD', regex: /\bAMD\b/i },
    { name: 'NVIDIA', regex: /\bNVIDIA\b/i },
    { name: 'COMPAQ', regex: /\bCOMPAQ\b/i },
    { name: 'KINGSTON', regex: /\bKINGSTON\b/i }
  ];

  for (const bDef of brandDefinitions) {
    if (bDef.regex.test(fullUpper)) {
      brand = bDef.name;
      break;
    }
  }

  // 2. DETECCIÓN DE SERIAL
  const serialPatterns = [
    /(?:SERVICE\s*TAG(?:\s*\(S\/N\))?|ST#?|S\/N\s*\/ST)\s*[:=.\-\s]+\s*([A-Z0-9]{5,15})/i,
    /(?:SERIAL\s*(?:NO|NUM|NUMBER|\.)*|S\/N|S\/N\.|SN|SER\.?\s*NO|N\/S|NO\.?\s*SERIE|N°?\s*SERIE|SERNO|SER|TAG|CÓDIGO)\s*[:=.\-\s]+\s*([A-Z0-9\-_]{5,25})/i,
    /(?:\(21\)|21)\s*([A-Z0-9\-_]{6,20})/i,
    /\bS\/N\s*([A-Z0-9\-_]{6,20})/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pat of serialPatterns) {
      const match = line.match(pat);
      if (match && match[1]) {
        let val = match[1].replace(/[^A-Z0-9\-_]/gi, '').toUpperCase();
        if (val.length >= 5 && !/^(MONITOR|PRODUCT|OPTION|SPARE|MODEL|HEWLETT|PACKARD|CHINA|REVISION|SERVICE|SERIAL)$/i.test(val)) {
          serial = val;
          break;
        }
      }
    }
    if (serial) break;

    if (/(?:SERIAL\s*(?:NO|NUMBER)?|S\/N|SN|SERVICE\s*TAG|ST#?)\s*[:=.\-]*$/i.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const matchNext = nextLine.match(/^([A-Z0-9\-_]{5,25})$/i);
      if (matchNext) {
        serial = matchNext[1].toUpperCase();
        break;
      }
    }
  }

  // Patrones específicos de seriales por fabricante
  if (!serial) {
    const hpMatch = fullUpper.match(/\b([52][A-Z0-9]{9}|CND[A-Z0-9]{7}|CNU[A-Z0-9]{7}|MXL[A-Z0-9]{7}|JP[A-Z0-9]{8})\b/);
    if (hpMatch) serial = hpMatch[1];
  }

  if (!serial) {
    const dellMatch = fullUpper.match(/\b([B-Z0-9]{7})\b/);
    if (dellMatch && brand === 'DELL' && !/^(BATTERY|ADAPTER|MONITOR)$/.test(dellMatch[1])) {
      serial = dellMatch[1];
    }
  }

  if (!serial) {
    const ciscoMatch = fullUpper.match(/\b(FOC[A-Z0-9]{8}|FCW[A-Z0-9]{8}|SAD[A-Z0-9]{8})\b/);
    if (ciscoMatch) serial = ciscoMatch[1];
  }

  if (!serial) {
    const noiseWords = ['MONITOR', 'COMPAQ', 'PRODUCT', 'OPTION', 'SPARE', 'MODEL', 'HEWLETT', 'PACKARD', 'CHINA', 'REVISION', 'PEQUIVEN', 'INVENTARIO', 'ALMACEN', 'PORTATIL', 'DESKTOP', 'LATITUDE', 'OPTIPLEX', 'PRODESK', 'THINKCENTRE', 'ECOTANK', 'LASERJET', 'INPUT', 'OUTPUT', 'SERIAL'];
    for (const line of lines) {
      const tokens = line.split(/\s+/);
      for (const token of tokens) {
        const cleanedToken = token.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanedToken.length >= 7 && cleanedToken.length <= 18 && /\d/.test(cleanedToken) && /[A-Z]/.test(cleanedToken)) {
          if (!noiseWords.some(w => cleanedToken.includes(w))) {
            serial = cleanedToken;
            break;
          }
        }
      }
      if (serial) break;
    }
  }

  // 3. DETECCIÓN DE MODELO
  const modelPatterns = [
    /(?:MODELO?|MODEL\s*(?:NO|NUM|NUMBER|\.)*|M\/N|MN|TYPE|TIPO|PRODUCT\s*(?:NAME|NO|\.)*|PRODUCTO)\s*[:=.\-\s]+\s*([A-Z0-9\s\-_/]{3,30})/i,
    /(?:P\/N|PART\s*(?:NO|NUM|NUMBER|\.)*)\s*[:=.\-\s]+\s*([A-Z0-9\s\-_/]{3,25})/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of modelPatterns) {
      const match = line.match(pat);
      if (match && match[1]) {
        let val = match[1].trim();
        val = val.replace(/(?:MONITOR|LCD|PRODUCT|CHINA|MADE IN|INPUT|OUTPUT|SERIES|REGULATORY).*/gi, '').trim();
        if (val.length >= 2 && !/^(MONITOR|LCD|PRODUCT|CHINA)$/i.test(val)) {
          model = val;
          break;
        }
      }
    }
    if (model) break;

    if (/(?:MODELO?|MODEL\s*(?:NO|NUMBER)?|M\/N|PRODUCT\s*NAME)\s*[:=.\-]*$/i.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.length >= 2 && nextLine.length <= 30) {
        model = nextLine.replace(/(?:MONITOR|LCD|CHINA).*/gi, '').trim();
        break;
      }
    }
  }

  if (!model) {
    const modelFamilies = [
      'PRODESK', 'ELITEDESK', 'ELITEBOOK', 'PROBOOK', 'THINKCENTRE', 'THINKPAD',
      'THINKSTATION', 'LATITUDE', 'OPTIPLEX', 'PRECISION', 'VOSTRO', 'INSPIRON',
      'POWEREDGE', 'CATALYST', 'LASERJET', 'DESKJET', 'OFFICEJET', 'ECOTANK',
      'SMART-UPS', 'SMARTUPS', 'IM 4000', 'IM4000', 'IM C300', 'IMC300',
      'IDEAPAD', 'YOGA', 'LEGION', 'PAVILION', 'ZBOOK', 'OMEN'
    ];

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      for (const family of modelFamilies) {
        if (upperLine.includes(family)) {
          const idx = upperLine.indexOf(family);
          let extracted = line.substring(idx).trim();
          extracted = extracted.replace(/(?:S\/N|SN|SERIAL|INPUT|OUTPUT|MADE IN|CHINA).*/gi, '').trim();
          if (extracted) {
            model = extracted;
            break;
          }
        }
      }
      if (model) break;
    }
  }

  if (serial) serial = serial.toUpperCase().trim();
  if (brand) brand = brand.toUpperCase().trim();
  if (model) model = model.toUpperCase().trim();

  return { serial, brand, model };
}

async function processLabelImageOCR(file) {
  if (!file) return;

  const alertToast = document.createElement('div');
  alertToast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:var(--accent-primary,#2563eb);color:#fff;padding:14px 22px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:600;font-size:0.95rem;display:flex;align-items:center;gap:10px;';
  alertToast.innerHTML = `<span>⏳</span> <span>Optimizando foto y leyendo etiqueta con IA (Serial, Marca y Modelo)...</span>`;
  document.body.appendChild(alertToast);

  try {
    const preprocessedBlob = await preprocessImageCanvas(file);
    let rawText = '';

    if (typeof Tesseract !== 'undefined') {
      const result = await Tesseract.recognize(preprocessedBlob, 'eng');
      rawText = result.data ? result.data.text || '' : '';
    }

    alertToast.remove();

    const parsed = parseLabelText(rawText);

    openSerialModal(parsed.serial || null);

    const codeInput = document.getElementById('form-serial-code');
    const marcaInput = document.getElementById('form-serial-marca');
    const modeloInput = document.getElementById('form-serial-modelo');

    if (parsed.serial && codeInput) codeInput.value = parsed.serial;
    if (parsed.brand && marcaInput) marcaInput.value = parsed.brand;
    if (parsed.model && modeloInput) modeloInput.value = parsed.model;

    if (parsed.serial || parsed.brand || parsed.model) {
      alert(`✅ Foto de Etiqueta Leída Exitosamente:\n\n• Serial: ${parsed.serial || 'No detectado'}\n• Marca: ${parsed.brand || 'No detectada'}\n• Modelo: ${parsed.model || 'No detectado'}`);
    } else {
      alert('ℹ️ Se procesó la foto pero no se identificó el texto del serial/marca/modelo. Por favor escríbelos manualmente en el formulario.');
    }
  } catch (err) {
    console.error("Error al procesar la foto de la etiqueta:", err);
    if (alertToast) alertToast.remove();
    alert('Error al leer la foto. Ingresa los datos manualmente.');
  }
}

function parseBrandAndModel(itemName) {
  if (!itemName) return { brand: 'S/M', model: 'S/M' };

  const knownBrands = [
    'HP', 'HEWLETT PACKARD', 'LENOVO', 'DELL', 'CISCO', 'RICOH', 'EPSON',
    'CANON', 'KINGSTON', 'SAMSUNG', 'LG', 'TP-LINK', 'TPLINK', 'HIKVISION',
    'APC', 'KYOCERA', 'LEXMARK', 'XEROX', 'LOGITECH', 'ZEBRA', 'COMPAQ',
    'BROTHER', 'PANASONIC', 'SONY', 'ACER', 'ASUS', 'INTEL', 'AMD', 'NVIDIA',
    'DAHUA', 'UBIQUITI', 'FORTINET', 'MIKROTIK', 'TRIPP-LITE', 'TRIPPLITE'
  ];

  const cleanName = itemName.trim();
  const uppercaseName = cleanName.toUpperCase();

  let foundBrand = '';
  for (const b of knownBrands) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(uppercaseName)) {
      foundBrand = b === 'HEWLETT PACKARD' ? 'HP' : b;
      break;
    }
  }

  if (!foundBrand) {
    const parts = cleanName.split(/\s+/);
    if (parts.length > 0 && parts[0].length <= 15) {
      foundBrand = parts[0];
    }
  }

  let modelStr = cleanName;
  const commonPrefixes = [
    /^MONITOR\s+/i, /^PC\s+/i, /^LAPTOP\s+/i, /^IMPRESORA\s+/i, /^EQUIPO\s+/i,
    /^SWITCH\s+/i, /^ROUTER\s+/i, /^SERVIDOR\s+/i, /^SCANNER\s+/i, /^TECLADO\s+/i,
    /^RATON\s+/i, /^MOUSE\s+/i, /^DISCO\s+/i, /^MEMORIA\s+/i, /^TONER\s+/i, /^TÓNER\s+/i
  ];

  commonPrefixes.forEach(p => {
    modelStr = modelStr.replace(p, '');
  });

  if (foundBrand) {
    const brandRegex = new RegExp(`^${foundBrand}\\s+`, 'i');
    modelStr = modelStr.replace(brandRegex, '');
  }

  return {
    brand: foundBrand || 'S/M',
    model: modelStr.trim() || cleanName
  };
}

function autoFillMarcaModeloFromItem(itemId) {
  const matchedItem = state.items.find(i => String(i.id) === String(itemId));
  if (matchedItem) {
    const parsed = parseBrandAndModel(matchedItem.item);
    const marcaInput = document.getElementById('form-serial-marca');
    const modeloInput = document.getElementById('form-serial-modelo');
    if (marcaInput) marcaInput.value = parsed.brand;
    if (modeloInput) modeloInput.value = parsed.model;
  }
}

function openSerialModal(serialCode = null) {
  setupItemSelectForSerials();
  const modal = document.getElementById('modal-serial-item');
  const title = document.getElementById('modal-serial-title');
  const form = document.getElementById('form-serial-item');

  if (serialCode) {
    const eq = state.serials.find(s => s.serial === serialCode);
    if (eq) {
      title.textContent = 'Editar Serial en Almacén';
      document.getElementById('form-serial-original').value = eq.serial;
      document.getElementById('form-serial-code').value = eq.serial;
      document.getElementById('form-serial-itemid').value = eq.itemId || (state.items[0] ? state.items[0].id : '1');
      document.getElementById('form-serial-marca').value = eq.marca || '';
      document.getElementById('form-serial-modelo').value = eq.modelo || '';
      document.getElementById('form-serial-estado').value = eq.estado || 'Disponible';
    } else {
      title.textContent = 'Registrar Nuevo Serial en Almacén';
      if (form) form.reset();
      document.getElementById('form-serial-original').value = '';
      document.getElementById('form-serial-code').value = serialCode;
      const selectedId = document.getElementById('form-serial-itemid')?.value || (state.items[0] ? state.items[0].id : '');
      if (selectedId) autoFillMarcaModeloFromItem(selectedId);
    }
  } else {
    title.textContent = 'Registrar Nuevo Serial en Almacén';
    if (form) form.reset();
    document.getElementById('form-serial-original').value = '';
    document.getElementById('form-serial-code').value = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const selectedId = document.getElementById('form-serial-itemid')?.value || (state.items[0] ? state.items[0].id : '');
    if (selectedId) autoFillMarcaModeloFromItem(selectedId);
  }

  modal?.classList.remove('hidden');
}

function closeSerialModal() {
  document.getElementById('modal-serial-item')?.classList.add('hidden');
}

function handleSaveSerial(e) {
  e.preventDefault();
  const origSerial = document.getElementById('form-serial-original').value;
  const newSerial = document.getElementById('form-serial-code').value.trim();
  const itemId = document.getElementById('form-serial-itemid').value;
  let marca = document.getElementById('form-serial-marca').value.trim();
  let modelo = document.getElementById('form-serial-modelo').value.trim();
  const estado = document.getElementById('form-serial-estado').value;

  const matchedItem = state.items.find(i => String(i.id) === String(itemId));
  const itemType = matchedItem ? matchedItem.item : 'Equipo';
  const ubi = matchedItem ? (matchedItem.ubicacion || 'Almacén Principal') : 'Almacén Principal';

  if (!marca || !modelo) {
    if (matchedItem) {
      const parsed = parseBrandAndModel(matchedItem.item);
      if (!marca) marca = parsed.brand;
      if (!modelo) modelo = parsed.model;
    }
  }

  if (!newSerial) {
    alert('El número de serial es obligatorio.');
    return;
  }

  if (origSerial) {
    const idx = state.serials.findIndex(s => s.serial === origSerial);
    if (idx !== -1) {
      state.serials[idx] = {
        serial: newSerial,
        itemId: itemId,
        tipo: itemType,
        marca: marca || 'S/M',
        modelo: modelo || 'S/M',
        estado: estado,
        ubicacion: ubi,
        fechaRegistro: state.serials[idx].fechaRegistro || new Date().toISOString().slice(0, 10)
      };
    }
  } else {
    if (state.serials.some(s => s.serial === newSerial)) {
      alert(`El serial ${newSerial} ya está registrado.`);
      return;
    }
    state.serials.push({
      serial: newSerial,
      itemId: itemId,
      tipo: itemType,
      marca: marca || 'S/M',
      modelo: modelo || 'S/M',
      estado: estado,
      ubicacion: ubi,
      fechaRegistro: new Date().toISOString().slice(0, 10)
    });

    logMovement(itemId, `${itemType} (SN: ${newSerial})`, 'Registro Serial', 1, matchedItem ? matchedItem.stock : 1, `Registro de serial ${marca} ${modelo} en almacén`);
  }

  closeSerialModal();
  saveSerials();
  renderSerials();
}

function deleteSerial(serialCode) {
  if (confirm(`¿Estás seguro de eliminar el equipo con serial ${serialCode}?`)) {
    state.serials = state.serials.filter(s => s.serial !== serialCode);
    saveSerials();
    renderSerials();
  }
}

function updateSelectionUI() {
  const count = state.selectedIds.size;
  const badgeSel = document.getElementById('badge-selected-count');
  const printCount = document.getElementById('print-queue-count');
  const printTotal = document.getElementById('print-queue-total');
  
  if (badgeSel) badgeSel.textContent = count;
  if (printCount) printCount.textContent = count;
  if (printTotal) printTotal.textContent = state.items.length;
  
  const bulkBar = document.getElementById('bulk-action-bar');
  const bulkText = document.getElementById('bulk-selected-text');

  if (count > 0) {
    bulkBar?.classList.remove('hidden');
    if (bulkText) bulkText.textContent = `${count} consumible(s) seleccionado(s)`;
  } else {
    bulkBar?.classList.add('hidden');
  }
}

function selectAllItems() {
  state.selectedIds = new Set(state.items.map(i => i.id));
  renderInventory();
  renderQRLabels();
}

function deselectAllItems() {
  state.selectedIds.clear();
  renderInventory();
  renderQRLabels();
}

function renderQRLabels() {
  const container = document.getElementById('qr-print-container');
  if (!container) return;

  const selectedItems = state.items.filter(i => state.selectedIds.has(i.id));
  container.className = `qr-print-grid ${state.labelConfig.cols} ${state.labelConfig.style}`;

  if (selectedItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <i data-lucide="qr-code" style="width: 48px; height: 48px; color: #999;"></i>
        <h3 style="color: #666; margin-top: 1rem;">No hay consumibles seleccionados</h3>
        <p style="color: #888;">Selecciona consumibles desde la pestaña "Inventario" o haz clic en "Seleccionar Todos".</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  container.innerHTML = '';

  selectedItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'qr-card-print';
    if (!state.labelConfig.showBorder) card.style.border = 'none';

    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-image-holder';
    card.appendChild(qrDiv);

    let payloadText = '';
    if (state.labelConfig.payloadType === 'json') {
      payloadText = JSON.stringify({ id: item.id, item: item.item });
    } else if (state.labelConfig.payloadType === 'id-only') {
      payloadText = String(item.id);
    } else {
      payloadText = `ID: ${item.id} - ${item.item}`;
    }

    let qrSize = 90;
    if (state.labelConfig.cols === 'cols-4') {
      qrSize = 75;
    } else if (state.labelConfig.cols === 'cols-3') {
      qrSize = 90;
    } else if (state.labelConfig.cols === 'cols-2') {
      qrSize = 110;
    } else if (state.labelConfig.cols === 'cols-1') {
      qrSize = 125;
    }

    if (state.labelConfig.style === 'compact' || state.labelConfig.style === 'sticker-small') {
      qrSize = Math.min(qrSize, 70);
    } else if (state.labelConfig.style === 'sticker-large') {
      qrSize = Math.max(qrSize, 120);
    }

    qrDiv.innerHTML = '';
    try {
      new QRCode(qrDiv, {
        text: payloadText,
        width: qrSize,
        height: qrSize,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch (qrErr) {
      qrDiv.innerHTML = '';
      try {
        new QRCode(qrDiv, {
          text: String(item.id),
          width: qrSize,
          height: qrSize,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch(e) {
        qrDiv.innerHTML = `<div style="font-size:10px;color:#888;padding:4px;">ID:${item.id}</div>`;
      }
    }

    // Limpiar canvas huérfanos y mantener solo 1 imagen final
    const canvases = qrDiv.querySelectorAll('canvas');
    canvases.forEach(c => c.remove());
    const imgs = qrDiv.querySelectorAll('img');
    if (imgs.length > 1) {
      for (let k = 0; k < imgs.length - 1; k++) {
        imgs[k].remove();
      }
    }

    if (state.labelConfig.showTitle) {
      const title = document.createElement('div');
      title.className = 'print-title';
      title.innerText = item.item;
      card.appendChild(title);
    }

    if (state.labelConfig.showId || state.labelConfig.showLocation) {
      const meta = document.createElement('div');
      meta.className = 'print-meta';
      const metaParts = [];
      if (state.labelConfig.showId) metaParts.push(`Ruta ID: ${item.id}`);
      if (state.labelConfig.showLocation && item.ubicacion) metaParts.push(item.ubicacion);
      meta.innerText = metaParts.join(' | ');
      card.appendChild(meta);
    }

    if (state.labelConfig.showCategory && item.categoria) {
      const cat = document.createElement('div');
      cat.className = 'print-meta';
      cat.style.fontSize = '9px';
      cat.innerText = item.categoria;
      card.appendChild(cat);
    }

    container.appendChild(card);
  });
}

function openStockAdjustModal(id) {
  openMovementModal(id, 'ENTRADA');
}

function closeStockModal() {
  closeMovementModal();
}

function modifyStockValue(delta) {
  const input = document.getElementById('adjust-stock-value');
  if (!input) return;
  let current = parseInt(input.value, 10) || 0;
  current = Math.max(0, current + delta);
  input.value = current;
}

function saveStockAdjustment() {
  if (!state.activeItemForStock) return;

  const item = state.activeItemForStock;
  const newStock = parseInt(document.getElementById('adjust-stock-value').value, 10) || 0;
  const notes = document.getElementById('adjust-notes').value.trim() || 'Ajuste directo de stock';
  const diff = newStock - Number(item.stock);

  if (diff === 0) {
    closeStockModal();
    return;
  }

  const opType = diff > 0 ? 'Entrada (+)' : 'Salida (-)';
  if (diff > 0) {
    item.entrada = (item.entrada || 0) + diff;
  } else {
    item.salida = (item.salida || 0) + Math.abs(diff);
  }
  item.stock = newStock;

  logMovement(item.id, item.item, opType, diff, newStock, notes);
  saveData();
  renderAll();
  closeStockModal();
}

// --- MODAL CAMERA SCANNER (QR & SERIALES) ---
function switchScannerSubMode(subMode) {
  const btnBarcode = document.getElementById('btn-scanner-mode-barcode');
  const btnQr = document.getElementById('btn-scanner-mode-qr');
  const btnPhoto = document.getElementById('btn-scanner-mode-photo');

  if (btnBarcode) {
    btnBarcode.className = subMode === 'BARCODE' ? 'btn btn-sm btn-success active' : 'btn btn-sm btn-outline';
  }
  if (btnQr) {
    btnQr.className = subMode === 'QR' ? 'btn btn-sm btn-success active' : 'btn btn-sm btn-outline';
  }
  if (btnPhoto) {
    btnPhoto.className = subMode === 'PHOTO' ? 'btn btn-sm btn-primary active' : 'btn btn-sm btn-outline';
  }

  if (subMode === 'BARCODE') {
    openCameraScannerModal('BARCODE');
  } else if (subMode === 'QR') {
    openCameraScannerModal('QR');
  } else if (subMode === 'PHOTO') {
    closeCameraScannerModal();
    document.getElementById('input-file-ocr-label')?.click();
  }
}

function openCameraScannerModal(mode = 'INVENTORY') {
  state.modalScannerMode = mode;
  const modal = document.getElementById('modal-camera-scanner');
  if (!modal) return;

  const titleEl = document.getElementById('modal-camera-scanner-title');
  const descEl = document.getElementById('modal-camera-scanner-desc');
  const btnBarcode = document.getElementById('btn-scanner-mode-barcode');
  const btnQr = document.getElementById('btn-scanner-mode-qr');

  if (mode === 'INVENTORY') {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="qr-code"></i> Escáner de Stickers QR (Inventario & Control)';
    if (descEl) descEl.textContent = 'Apunta la cámara al sticker QR del sistema para registrar una Entrada o Salida de consumible.';
    if (btnQr) btnQr.className = 'btn btn-sm btn-success active';
    if (btnBarcode) btnBarcode.className = 'btn btn-sm btn-outline';
  } else if (mode === 'BARCODE') {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="barcode"></i> Escáner de Código de Barras (Equipos & Cajas)';
    if (descEl) descEl.textContent = 'Apunta la cámara al código de barras del equipo o caja para capturar el serial.';
    if (btnBarcode) btnBarcode.className = 'btn btn-sm btn-success active';
    if (btnQr) btnQr.className = 'btn btn-sm btn-outline';
  } else if (mode === 'QR') {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="qr-code"></i> Escáner de Código QR (Equipos & Cajas)';
    if (descEl) descEl.textContent = 'Apunta la cámara al código QR impreso en el equipo o caja.';
    if (btnQr) btnQr.className = 'btn btn-sm btn-success active';
    if (btnBarcode) btnBarcode.className = 'btn btn-sm btn-outline';
  } else {
    if (titleEl) titleEl.innerHTML = '<i data-lucide="scan"></i> Escáner de Seriales (Barras, QR o Foto)';
    if (descEl) descEl.textContent = 'Selecciona la opción deseada (Código de Barras, Código QR o Foto de Etiqueta).';
  }

  const inputManual = document.getElementById('input-modal-manual-scan');
  if (inputManual) inputManual.value = '';

  modal.classList.remove('hidden');
  initLucideIcons();
  startModalCameraScanner();
}

function closeCameraScannerModal() {
  stopModalCameraScanner();
  const modal = document.getElementById('modal-camera-scanner');
  if (modal) modal.classList.add('hidden');
}

async function startModalCameraScanner() {
  const placeholder = document.getElementById('modal-camera-placeholder');
  const controls = document.getElementById('modal-camera-controls');

  if (placeholder) placeholder.classList.remove('hidden');
  if (controls) controls.classList.add('hidden');

  try {
    if (state.modalHtml5QrScanner) {
      try {
        await state.modalHtml5QrScanner.stop();
        state.modalHtml5QrScanner.clear();
      } catch (e) {}
    }

    const formatsToSupport = typeof Html5QrcodeSupportedFormats !== 'undefined' ? [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR
    ] : undefined;

    const scannerOptions = { verbose: false };
    if (formatsToSupport) {
      scannerOptions.formatsToSupport = formatsToSupport;
    }

    state.modalHtml5QrScanner = new Html5Qrcode("modal-qr-reader-viewport", scannerOptions);

    const config = {
      fps: 20,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const boxWidth = Math.min(280, Math.floor(viewfinderWidth * 0.85));
        const boxHeight = Math.min(160, Math.floor(viewfinderHeight * 0.55));
        return { width: Math.max(boxWidth, 150), height: Math.max(boxHeight, 100) };
      },
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    const onScanSuccess = (decodedText) => {
      stopModalCameraScanner();
      handleModalScanResult(decodedText);
    };

    const fixVideoStyles = () => {
      if (placeholder) placeholder.classList.add('hidden');
      if (controls) controls.classList.remove('hidden');
      setTimeout(() => {
        const videoEl = document.querySelector('#modal-qr-reader-viewport video');
        if (videoEl) {
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('autoplay', 'true');
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.minHeight = '240px';
          videoEl.style.objectFit = 'cover';
          videoEl.style.display = 'block';
          videoEl.play().catch(() => {});
        }
      }, 100);
    };

    try {
      await state.modalHtml5QrScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        () => {}
      );
      fixVideoStyles();
    } catch (envErr) {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')) || devices[devices.length - 1];
        await state.modalHtml5QrScanner.start(
          backCamera.id,
          config,
          onScanSuccess,
          () => {}
        );
        fixVideoStyles();
      } else {
        throw envErr;
      }
    }
  } catch (err) {
    console.warn("Error al iniciar cámara modal: ", err);
    if (placeholder) placeholder.innerHTML = `<i data-lucide="camera-off" style="width:48px;height:48px;opacity:0.6;margin-bottom:0.5rem;"></i><p>Permite el acceso a la cámara o usa el ingreso manual de código abajo</p>`;
    initLucideIcons();
  }
}

function stopModalCameraScanner() {
  if (state.modalHtml5QrScanner) {
    state.modalHtml5QrScanner.stop().then(() => {
      state.modalHtml5QrScanner.clear();
      state.modalHtml5QrScanner = null;
    }).catch(err => console.error(err));
  }
  const placeholder = document.getElementById('modal-camera-placeholder');
  const controls = document.getElementById('modal-camera-controls');
  if (placeholder) placeholder.classList.remove('hidden');
  if (controls) controls.classList.add('hidden');
}

function handleModalManualScan() {
  const input = document.getElementById('input-modal-manual-scan');
  const val = input ? input.value.trim() : '';
  if (!val) {
    alert('Por favor ingresa o escanea un código de serial o ID.');
    return;
  }
  closeCameraScannerModal();
  handleModalScanResult(val);
}

function handleModalScanResult(scannedContent) {
  const cleanStr = scannedContent.trim();
  if (!cleanStr) return;

  if (state.modalScannerMode === 'SERIAL') {
    // Escaneo de seriales de equipos en almacén
    let matchedSerial = null;
    try {
      const parsed = JSON.parse(cleanStr);
      if (parsed && parsed.serial) matchedSerial = parsed.serial;
    } catch (e) {}

    if (!matchedSerial) matchedSerial = cleanStr;

    const eq = state.serials.find(s => s.serial.toLowerCase() === matchedSerial.toLowerCase());
    if (eq) {
      openSerialModal(eq.serial);
    } else {
      if (confirm(`El serial "${matchedSerial}" no está registrado en el almacén.\n\n¿Deseas registrar un nuevo equipo con este serial ahora mismo?`)) {
        openSerialModal(null);
        const codeInput = document.getElementById('form-serial-code');
        if (codeInput) codeInput.value = matchedSerial;
      }
    }
  } else {
    // Escaneo de stickers QR para Inventario & Control
    let matchedItemId = null;
    try {
      const parsed = JSON.parse(cleanStr);
      if (parsed && parsed.id) matchedItemId = String(parsed.id);
    } catch (e) {
      const match = cleanStr.match(/(?:ID:\s*|^)(\d+)/i);
      if (match) {
        matchedItemId = match[1];
      } else {
        matchedItemId = cleanStr;
      }
    }

    const item = state.items.find(i => String(i.id) === String(matchedItemId));
    if (item) {
      state.scannedChoiceItem = item;
      const elId = document.getElementById('scan-choice-item-id');
      const elTitle = document.getElementById('scan-choice-item-title');
      const elStock = document.getElementById('scan-choice-item-stock');

      if (elId) elId.textContent = `ID: #${item.id}`;
      if (elTitle) elTitle.textContent = item.item;
      if (elStock) elStock.textContent = item.stock || 0;

      const choiceModal = document.getElementById('modal-scan-action-choice');
      if (choiceModal) choiceModal.classList.remove('hidden');
      initLucideIcons();
    } else {
      alert(`❌ No se encontró ningún consumible con el ID o código escaneado: "${cleanStr}"`);
    }
  }
}

function closeScanChoiceModal() {
  const modal = document.getElementById('modal-scan-action-choice');
  if (modal) modal.classList.add('hidden');
  state.scannedChoiceItem = null;
}

async function startCameraScanner() {
  const placeholder = document.getElementById('camera-placeholder');
  const controls = document.getElementById('camera-controls');

  if (placeholder) placeholder.classList.add('hidden');
  if (controls) controls.classList.remove('hidden');

  try {
    if (state.html5QrScanner) {
      try {
        await state.html5QrScanner.stop();
        state.html5QrScanner.clear();
      } catch (e) {}
    }

    state.html5QrScanner = new Html5Qrcode("qr-reader-viewport");

    const config = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.max(150, Math.floor(minEdge * 0.75));
        return { width: qrboxSize, height: qrboxSize };
      },
      aspectRatio: 1.0
    };

    try {
      await state.html5QrScanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScanResult(decodedText);
          stopCameraScanner();
        },
        () => {}
      );
    } catch (envErr) {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')) || devices[devices.length - 1];
        await state.html5QrScanner.start(
          backCamera.id,
          config,
          (decodedText) => {
            handleScanResult(decodedText);
            stopCameraScanner();
          },
          () => {}
        );
      } else {
        throw envErr;
      }
    }
  } catch (err) {
    alert("Permiso de cámara: Permite el acceso a la cámara en el navegador de tu celular. Detalle: " + (err.message || err));
    stopCameraScanner();
  }
}


function stopCameraScanner() {
  if (state.html5QrScanner) {
    state.html5QrScanner.stop().then(() => {
      state.html5QrScanner.clear();
      state.html5QrScanner = null;
    }).catch(err => console.error(err));
  }
  document.getElementById('camera-placeholder')?.classList.remove('hidden');
  document.getElementById('camera-controls')?.classList.add('hidden');
}

function openSerialModalWithCode(code) {
  openSerialModal(null);
  if (code) {
    document.getElementById('form-serial-code').value = code;
  }
}

function handleManualScanInput() {
  const rawInput = document.getElementById('input-manual-scan').value.trim();
  if (!rawInput) {
    alert('Ingresa un ID, Serial o código de barras escaneado.');
    return;
  }
  handleScanResult(rawInput);
}

function handleScanResult(scannedContent) {
  const cleanStr = scannedContent.trim();
  let matchedSerial = null;
  let matchedItemId = null;

  try {
    const parsed = JSON.parse(cleanStr);
    if (parsed) {
      if (parsed.serial) matchedSerial = parsed.serial;
      if (parsed.id) matchedItemId = String(parsed.id);
    }
  } catch (e) {
    const foundSerial = state.serials.find(s => s.serial.toLowerCase() === cleanStr.toLowerCase());
    if (foundSerial) {
      matchedSerial = foundSerial.serial;
    } else {
      matchedItemId = cleanStr.replace(/[^0-9]/g, '') || cleanStr;
    }
  }

  const resultCard = document.getElementById('scanned-result-card');
  const actionsContainer = document.getElementById('scanned-actions-container');
  const qrThumb = document.getElementById('scanned-qr-preview');

  if (matchedSerial) {
    const eq = state.serials.find(s => s.serial.toLowerCase() === matchedSerial.toLowerCase());
    if (eq) {
      state.activeSerialForStock = eq;
      state.activeItemForStock = state.items.find(i => i.id === eq.itemId);

      resultCard?.classList.remove('hidden');

      document.getElementById('scanned-status-badge').className = 'badge badge-success';
      document.getElementById('scanned-status-badge').textContent = '✓ Serial Registrado en Almacén';
      document.getElementById('scanned-item-id').textContent = `SERIAL: ${eq.serial}`;
      document.getElementById('scanned-item-title').textContent = `${eq.tipo} - ${eq.marca} ${eq.modelo}`;
      document.getElementById('scanned-item-cat').textContent = `Estado: ${eq.estado}`;
      document.getElementById('scanned-item-loc').textContent = eq.ubicacion || 'Almacén Principal';
      document.getElementById('scan-timestamp').textContent = new Date().toLocaleTimeString();

      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <div style="display:flex; gap:0.5rem; width:100%; justify-content:flex-end;">
            <button class="btn btn-secondary" onclick="openSerialModal('${eq.serial}')">
              <i data-lucide="edit"></i> Editar Serial
            </button>
            <button class="btn btn-primary" onclick="switchTab('tab-serials')">
              <i data-lucide="cpu"></i> Ver en Almacén
            </button>
          </div>
        `;
      }

      if (qrThumb) {
        qrThumb.innerHTML = '';
        new QRCode(qrThumb, {
          text: JSON.stringify({ serial: eq.serial, tipo: eq.tipo, marca: eq.marca, modelo: eq.modelo }),
          width: 70,
          height: 70
        });
      }

      initLucideIcons();
      resultCard?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  const item = state.items.find(i => String(i.id) === String(matchedItemId));
  if (item) {
    state.activeSerialForStock = null;
    state.activeItemForStock = item;

    resultCard?.classList.remove('hidden');

    document.getElementById('scanned-status-badge').className = 'badge badge-success';
    document.getElementById('scanned-status-badge').textContent = '✓ Consumible Encontrado';
    document.getElementById('scanned-item-id').textContent = `Ruta ID: #${item.id}`;
    document.getElementById('scanned-item-title').textContent = item.item;
    document.getElementById('scanned-item-cat').textContent = item.categoria || 'Consumibles';
    document.getElementById('scanned-item-loc').textContent = item.ubicacion || 'Almacén Principal';
    document.getElementById('scan-timestamp').textContent = new Date().toLocaleTimeString();

    if (actionsContainer) {
      actionsContainer.innerHTML = `
        <div class="stock-display">
            <small>Stock en Almacén</small>
            <div class="big-stock-num">${item.stock}</div>
        </div>
        <div class="stock-quick-actions" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn btn-emerald btn-lg" onclick="openMovementModal('${item.id}', 'ENTRADA')">
                <i data-lucide="plus-circle"></i> Entrada (+)
            </button>
            <button class="btn btn-rose btn-lg" onclick="openMovementModal('${item.id}', 'SALIDA')">
                <i data-lucide="minus-circle"></i> Salida (-)
            </button>
            <button class="btn btn-outline" onclick="openSerialModalWithCode('${cleanStr}')">
                <i data-lucide="cpu"></i> Registrar Serial
            </button>
        </div>
      `;
    }

    if (qrThumb) {
      qrThumb.innerHTML = '';
      new QRCode(qrThumb, {
        text: JSON.stringify({ id: item.id, item: item.item }),
        width: 70,
        height: 70
      });
    }

    initLucideIcons();
    resultCard?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  resultCard?.classList.remove('hidden');
  document.getElementById('scanned-status-badge').className = 'badge badge-warning';
  document.getElementById('scanned-status-badge').textContent = '✨ Nuevo Código Escaneado';
  document.getElementById('scanned-item-id').textContent = `CÓDIGO: ${cleanStr}`;
  document.getElementById('scanned-item-title').textContent = `Equipo / Serial no registrado aún`;
  document.getElementById('scanned-item-cat').textContent = `Acción Sugerida`;
  document.getElementById('scanned-item-loc').textContent = `Por asignar`;
  document.getElementById('scan-timestamp').textContent = new Date().toLocaleTimeString();

  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <div style="display:flex; gap:0.5rem; width:100%; justify-content:flex-end;">
        <button class="btn btn-primary" onclick="openSerialModalWithCode('${cleanStr}')">
          <i data-lucide="plus"></i> Dar de Alta con Serial: ${cleanStr}
        </button>
      </div>
    `;
  }

  if (qrThumb) {
    qrThumb.innerHTML = '';
    new QRCode(qrThumb, {
      text: cleanStr,
      width: 70,
      height: 70
    });
  }

  initLucideIcons();
  resultCard?.scrollIntoView({ behavior: 'smooth' });
}

function handleScannedStockChange(delta) {
  if (!state.activeItemForStock) return;

  const item = state.activeItemForStock;
  if (delta > 0) {
    openMovementModal(item.id, 'ENTRADA');
  } else {
    openMovementModal(item.id, 'SALIDA');
  }
}

function logMovement(id, itemName, type, change, finalStock, notes = '', detailObj = null) {
  const record = {
    timestamp: new Date().toISOString(),
    id: id,
    item: itemName,
    type: type,
    change: change > 0 ? `+${change}` : `${change}`,
    finalStock: finalStock,
    notes: notes,
    detail: detailObj
  };

  state.history.unshift(record);
  if (state.history.length > 5000) state.history.pop();
  saveHistory();
}

function renderHistory() {
  const tableBody = document.getElementById('history-table-body');
  const emptyState = document.getElementById('empty-history-state');
  if (!tableBody) return;

  if (state.history.length === 0) {
    tableBody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  tableBody.innerHTML = state.history.map((h, idx) => {
    const formattedDate = new Date(h.timestamp).toLocaleString();
    let badgeClass = 'badge-success';
    if (h.type.includes('Salida') || h.type.includes('Eliminación')) {
      badgeClass = 'badge-danger';
    } else if (h.type.includes('Edición') || h.type.includes('Serial')) {
      badgeClass = 'badge-warning';
    }

    return `
      <tr>
        <td><small style="color: var(--text-muted);">${formattedDate}</small></td>
        <td><strong>#${h.id}</strong></td>
        <td>${escapeHtml(h.item)}</td>
        <td><span class="badge ${badgeClass}">${h.type}</span></td>
        <td><strong>${h.change}</strong></td>
        <td>${h.finalStock}</td>
        <td>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
            <small>${escapeHtml(h.notes || '-')}</small>
            <button class="btn btn-icon btn-sm" onclick="verPlanillaFromHistoryIndex(${idx})" title="Ver / Imprimir Planilla Oficial Pequiven">
              <i data-lucide="file-text" style="color:var(--accent-primary);"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucideIcons();
}

function verPlanillaFromHistoryIndex(idx) {
  const h = state.history[idx];
  if (!h) return;

  const detailData = h.detail || {
    person: 'BALDASSARE CLEMENTI',
    cargo: PERSONA_CARGOS['BALDASSARE CLEMENTI'] || 'ANALISTA DE SOPORTE USUARIO',
    dept: 'GERENCIA DE TI',
    analista: 'ESTEFANY BRUZUAL',
    marca: 'S/M',
    modelo: 'S/M',
    ref: '',
    notes: h.notes || 'SUMINISTRO DE CONSUMIBLES',
    qty: Math.abs(parseInt(h.change, 10) || 1),
    type: h.type.includes('Salida') ? 'SALIDA' : 'ENTRADA',
    itemName: h.item
  };

  openPlanillaModal(detailData);
}

function renderOfficialReport() {
  const tableBody = document.getElementById('official-report-table-body');
  const previewContainer = document.getElementById('official-report-preview-container');

  const reportNum = document.getElementById('report-number-input')?.value || '18';
  const reportDateInput = document.getElementById('report-date-input')?.value;
  
  let formattedDate = '31/7/2026';
  if (reportDateInput) {
    const [y, m, d] = reportDateInput.split('-');
    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
  }

  const dateSpan = document.getElementById('official-report-date');
  if (dateSpan) dateSpan.textContent = formattedDate;

  const lblNumBtn = document.getElementById('lbl-report-num-btn');
  if (lblNumBtn) lblNumBtn.textContent = reportNum;

  const sortedItems = [...state.items].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));

  let rowsHtml = '';
  let totalInicial = 0;
  let totalEntradas = 0;
  let totalSalidas = 0;
  let totalFinal = 0;

  sortedItems.forEach(item => {
    const ini = Number(item.entradaInicial || 0);
    const ent = Number(item.entrada || 0);
    const sal = Number(item.salida || 0);
    const stk = Number(item.stock || 0);

    totalInicial += ini;
    totalEntradas += ent;
    totalSalidas += sal;
    totalFinal += stk;

    const isZero = stk === 0;
    const rowClass = isZero ? 'stock-zero-row' : '';
    const stockCellClass = isZero ? 'cell-stock' : 'cell-stock-normal';

    rowsHtml += `
      <tr class="${rowClass}">
        <td class="cell-ruta">${item.id}</td>
        <td class="cell-name">${escapeHtml(item.item)}</td>
        <td class="cell-num text-center">${ini}</td>
        <td class="cell-num text-center" style="color:var(--accent-emerald); font-weight:600;">+${ent}</td>
        <td class="cell-num text-center" style="color:var(--accent-rose); font-weight:600;">-${sal}</td>
        <td class="${stockCellClass} text-center">${stk}</td>
      </tr>
    `;
  });

  if (tableBody) {
    tableBody.innerHTML = rowsHtml;
  }

  if (previewContainer) {
    previewContainer.innerHTML = `
      <div class="official-excel-sheet-preview">
        <div class="excel-header-banner-img">
          <img src="Imagen1.jpg" alt="Imagen Cabecera Oficial Pequiven / Hidrocarburos" style="max-width:100%; height:auto; display:block; margin: 0 auto 1.5rem auto;">
        </div>
        <div class="excel-title-block">
          <h1>INVENTARIO</h1>
          <h2>RESUMEN DE INVENTARIO DE EQUIPOS HERRAMIENTAS REPUESTOS Y CONSUMIBLES</h2>
          <p class="excel-date">${formattedDate}</p>
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
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}

function exportToOfficialExcel() {
  const reportNum = document.getElementById('report-number-input')?.value || '18';
  const reportDateInput = document.getElementById('report-date-input')?.value || '';
  
  if (window.location.pathname.includes('.php') || window.location.protocol.startsWith('http')) {
    window.location.href = `../reportes/exportar_excel.php?num=${encodeURIComponent(reportNum)}&fecha=${encodeURIComponent(reportDateInput)}`;
    return;
  }

  let formattedDate = '31/7/2026';
  let formattedFileNameDate = '31-07-2026';

  if (reportDateInput) {
    const [y, m, d] = reportDateInput.split('-');
    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    formattedFileNameDate = `${d}-${m}-${y}`;
  }

  const sortedItems = [...state.items].sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));

  let rowsHtml = '';
  sortedItems.forEach(item => {
    const ini = Number(item.entradaInicial || 0);
    const ent = Number(item.entrada || 0);
    const sal = Number(item.salida || 0);
    const stk = Number(item.stock || 0);

    const isZero = stk === 0;
    const stockStyle = isZero
      ? 'background-color: #FF6B6B; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #D9D9D9;'
      : 'background-color: #E2EFDA; color: #276749; font-weight: bold; text-align: center; border: 1px solid #D9D9D9;';

    const entStr = ent > 0 ? ent : '';
    const salStr = sal > 0 ? sal : '';
    const iniStr = ini > 0 ? ini : (stk > 0 ? stk : '');

    rowsHtml += `
      <tr style="height: 20pt;">
        <td style="text-align: center; font-weight: bold; background-color: #F8FAFC; border: 1px solid #D9D9D9; vertical-align: middle;">${item.id}</td>
        <td style="text-align: left; font-weight: bold; border: 1px solid #D9D9D9; font-size: 9pt; vertical-align: middle;">${escapeHtml(item.item)}</td>
        <td style="text-align: center; border: 1px solid #D9D9D9; vertical-align: middle;">${iniStr}</td>
        <td style="text-align: center; border: 1px solid #D9D9D9; color: #059669; font-weight: bold; vertical-align: middle;">${entStr}</td>
        <td style="text-align: center; border: 1px solid #D9D9D9; color: #DC2626; font-weight: bold; vertical-align: middle;">${salStr}</td>
        <td style="${stockStyle}">${stk}</td>
      </tr>
    `;
  });

  const imgUrl = `${window.location.protocol}//${window.location.host}/consumibles/vistas/Imagen1.jpg`;
  const logoImgTag = `<tr style="height: 75pt;"><td colspan="6" style="height: 75pt; text-align: center; vertical-align: middle; background-color: #FFFFFF;"><img src="${imgUrl}" height="85" style="display:block; margin: 0 auto;" alt="Membrete Hidrocarburos Pequiven" /></td></tr>`;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>RESUMEN DINAMICO</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; }
        .title-main { font-size: 16pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; }
        .title-sub { font-size: 11pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; color: #1E293B; }
        .title-date { font-size: 10pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; }
        .th-header { background-color: #D9E1F2; color: #000000; font-weight: bold; border: 1px solid #8EA9DB; text-align: center; padding: 8px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <table>
        ${logoImgTag}
        <tr style="height: 10pt;"><td colspan="6"></td></tr>
        <tr style="height: 25pt;"><td colspan="6" class="title-main" style="vertical-align: middle;">INVENTARIO</td></tr>
        <tr style="height: 20pt;"><td colspan="6" class="title-sub" style="vertical-align: middle;">RESUMEN DE INVENTARIO DE EQUIPOS HERRAMIENTAS REPUESTOS Y CONSUMIBLES</td></tr>
        <tr style="height: 20pt;"><td colspan="6" class="title-date" style="vertical-align: middle;">${formattedDate}</td></tr>
        <tr style="height: 12pt;"><td colspan="6"></td></tr>
        <tr style="height: 24pt;">
          <th class="th-header" style="width: 70px; vertical-align: middle;">RUTA</th>
          <th class="th-header" style="width: 380px; vertical-align: middle;">CONSUMIBLES</th>
          <th class="th-header" style="width: 140px; vertical-align: middle;">ENTRADA INICIAL</th>
          <th class="th-header" style="width: 120px; vertical-align: middle;">ENTRADA</th>
          <th class="th-header" style="width: 120px; vertical-align: middle;">SALIDA</th>
          <th class="th-header" style="width: 160px; vertical-align: middle;">INVENTARIO FINAL</th>
        </tr>
        ${rowsHtml}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${reportNum}.INVENTARIO DE ALMACEN ACTUALIZADO AL ${formattedFileNameDate}.xls`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
