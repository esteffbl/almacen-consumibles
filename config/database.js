/**
 * Configuración de conexión a la Base de Datos MySQL (XAMPP / MySQL Server / Cloud)
 */

const mysql = require('mysql2/promise');

let pool;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL || process.env.MYSQL_URL);
} else {
  const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'almacen_consumibles',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  pool = mysql.createPool(dbConfig);
}

// Prevenir que errores de conexión a MySQL tumben el servidor Node en la Nube
pool.on('error', (err) => {
  console.warn('⚠️ Evento de MySQL Pool:', err.message);
});

// Verificar conexión al iniciar
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL');
    connection.release();
  } catch (error) {
    console.warn('⚠️ Modo Standalone en la Nube / Local:', error.message);
  }
}

testConnection();

module.exports = pool;
