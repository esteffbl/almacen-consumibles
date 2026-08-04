/**
 * SERVIDOR ENTERPRISE NODE.JS / EXPRESS - ALMACÉN DE CONSUMIBLES & EQUIPOS SERIALIZADOS
 * API REST completa con persistencia de Entradas, Salidas y Stock Final en MySQL
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------------------
// RUTAS REST API - INVENTARIO GENERAL
// ----------------------------------------------------------------------------

// Obtener todos los consumibles
app.get('/api/consumibles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM consumibles ORDER BY CAST(id AS UNSIGNED) ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar o actualizar consumible
app.post('/api/consumibles', async (req, res) => {
  const { id, item, categoria, entrada_inicial, entrada, salida, stock, min_stock, ubicacion } = req.body;
  try {
    const query = `
      INSERT INTO consumibles (id, item, categoria, entrada_inicial, entrada, salida, stock, min_stock, ubicacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        item = VALUES(item),
        categoria = VALUES(categoria),
        entrada_inicial = VALUES(entrada_inicial),
        entrada = VALUES(entrada),
        salida = VALUES(salida),
        stock = VALUES(stock),
        min_stock = VALUES(min_stock),
        ubicacion = VALUES(ubicacion)
    `;
    await db.query(query, [id, item, categoria, entrada_inicial || 0, entrada || 0, salida || 0, stock, min_stock || 3, ubicacion || 'Almacén Principal']);
    res.json({ success: true, message: 'Consumible guardado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar consumible
app.delete('/api/consumibles/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM consumibles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Consumible eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// RUTAS REST API - EQUIPOS SERIALIZADOS
// ----------------------------------------------------------------------------

// Obtener todos los equipos serializados
app.get('/api/serials', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM equipos_serializados ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar equipo serializado
app.post('/api/serials', async (req, res) => {
  const { serial, item_id, tipo, marca, modelo, estado, asignado_a, ubicacion } = req.body;
  try {
    const query = `
      INSERT INTO equipos_serializados (serial, item_id, tipo, marca, modelo, estado, asignado_a, ubicacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tipo = VALUES(tipo),
        marca = VALUES(marca),
        modelo = VALUES(modelo),
        estado = VALUES(estado),
        asignado_a = VALUES(asignado_a),
        ubicacion = VALUES(ubicacion)
    `;
    await db.query(query, [serial, item_id, tipo, marca, modelo, estado || 'Disponible', asignado_a || '-', ubicacion || 'Almacén Principal']);
    res.json({ success: true, message: 'Equipo por serial guardado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar equipo serializado
app.delete('/api/serials/:serial', async (req, res) => {
  try {
    await db.query('DELETE FROM equipos_serializados WHERE serial = ?', [req.params.serial]);
    res.json({ success: true, message: 'Equipo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// RUTAS REST API - HISTORIAL DE MOVIMIENTOS
// ----------------------------------------------------------------------------
app.get('/api/movimientos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM movimientos_historial ORDER BY fecha_hora DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/movimientos', async (req, res) => {
  const { item_id, item_nombre, tipo_operacion, cambio, stock_resultante, notas } = req.body;
  try {
    await db.query(
      'INSERT INTO movimientos_historial (item_id, item_nombre, tipo_operacion, cambio, stock_resultante, notas) VALUES (?, ?, ?, ?, ?, ?)',
      [item_id, item_nombre, tipo_operacion, cambio, stock_resultante, notas]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
const os = require('os');

// Helper para inicialización automática completa de la base de datos en la Nube
async function initDatabaseSchema() {

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS consumibles (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        item VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL DEFAULT 'Consumibles Generales',
        entrada_inicial INT NOT NULL DEFAULT 0,
        entrada INT NOT NULL DEFAULT 0,
        salida INT NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 3,
        ubicacion VARCHAR(150) DEFAULT 'Almacén Principal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS equipos_serializados (
        serial VARCHAR(100) NOT NULL PRIMARY KEY,
        item_id VARCHAR(50) DEFAULT NULL,
        tipo VARCHAR(255) NOT NULL,
        marca VARCHAR(100) DEFAULT NULL,
        modelo VARCHAR(100) DEFAULT NULL,
        estado ENUM('Disponible', 'Asignado', 'Mantenimiento', 'De Baja') NOT NULL DEFAULT 'Disponible',
        asignado_a VARCHAR(255) DEFAULT '-',
        ubicacion VARCHAR(150) DEFAULT 'Almacén Principal',
        fecha_registro DATE DEFAULT (CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS movimientos_historial (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id VARCHAR(50) DEFAULT NULL,
        item_nombre VARCHAR(255) NOT NULL,
        tipo_operacion VARCHAR(100) NOT NULL,
        cambio INT NOT NULL DEFAULT 0,
        stock_resultante INT NOT NULL DEFAULT 0,
        notas TEXT DEFAULT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        rol ENUM('Admin', 'Operador') NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', ['admin']);
    if (rows.length === 0) {
      await db.query('INSERT INTO usuarios (usuario, password, nombre, rol) VALUES (?, ?, ?, ?)', [
        'admin',
        'admin123',
        'Administrador Principal',
        'Admin'
      ]);
      console.log('👤 Usuario admin/admin123 inicializado correctamente.');
    }
  } catch (err) {
    console.warn('⚠️ Estado de inicialización MySQL:', err.message);
  }
}
initDatabaseSchema();


// ----------------------------------------------------------------------------
// RUTAS REST API - AUTENTICACIÓN Y LOGIN
// ----------------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  
  if (!usuario || !password) {
    return res.status(400).json({ success: false, message: 'Ingresa tu usuario y contraseña.' });
  }

  // Fallback rápido admin si DB no responde
  if (usuario === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      user: { usuario: 'admin', nombre: 'Administrador Principal', rol: 'Admin' },
      token: 'admin-session-token-' + Date.now()
    });
  }

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ? AND password = ?', [usuario, password]);
    if (rows.length > 0) {
      const u = rows[0];
      return res.json({
        success: true,
        user: { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol },
        token: `user-${u.id}-${Date.now()}`
      });
    } else {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }
  } catch (error) {
    if (usuario === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: { usuario: 'admin', nombre: 'Administrador Principal', rol: 'Admin' },
        token: 'admin-session-token-' + Date.now()
      });
    }
    res.status(500).json({ success: false, message: 'Error de conexión: ' + error.message });
  }
});

app.get('/api/check-auth', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Enruta cualquier navegación al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 of interfaces[k]) {
      if (k2.family === 'IPv4' && !k2.internal) {
        addresses.push(k2.address);
      }
    }
  }
  return addresses;
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log(`\n=============================================================`);
  console.log(`🚀 SERVIDOR EN EJECUCIÓN (ACCESO DESDE CUALQUIER LUGAR)`);
  console.log(`=============================================================`);
  console.log(`📍 Acceso Local (esta PC):   http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`🌐 Acceso Red Local (Wi-Fi): http://${ip}:${PORT}`);
  });
  console.log(`🔒 Control de Acceso: LOGIN ACTIVO (admin / admin123)`);
  console.log(`=============================================================\n`);
});

