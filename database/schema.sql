-- ============================================================================
-- SCRIPT DE BASE DE DATOS MYSQL - ALMACÉN DE CONSUMIBLES & EQUIPOS SERIALIZADOS
-- Compatible con XAMPP, MySQL Server 5.7+ / 8.0+ y MariaDB
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `almacen_consumibles` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `almacen_consumibles`;

-- ----------------------------------------------------------------------------
-- 1. TABLA: consumibles (Inventario General por Categoría y Cantidad)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `consumibles`;
CREATE TABLE `consumibles` (
  `id` VARCHAR(50) NOT NULL,
  `item` VARCHAR(255) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL DEFAULT 'Consumibles Generales',
  `entrada_inicial` INT NOT NULL DEFAULT 0,
  `entrada` INT NOT NULL DEFAULT 0,
  `salida` INT NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 3,
  `ubicacion` VARCHAR(150) DEFAULT 'Almacén Principal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLA: equipos_serializados (Rastreo Físico Individual por Serial)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipos_serializados`;
CREATE TABLE `equipos_serializados` (
  `serial` VARCHAR(100) NOT NULL,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `tipo` VARCHAR(255) NOT NULL,
  `marca` VARCHAR(100) DEFAULT NULL,
  `modelo` VARCHAR(100) DEFAULT NULL,
  `estado` ENUM('Disponible', 'Asignado', 'Mantenimiento', 'De Baja') NOT NULL DEFAULT 'Disponible',
  `asignado_a` VARCHAR(255) DEFAULT '-',
  `ubicacion` VARCHAR(150) DEFAULT 'Almacén Principal',
  `fecha_registro` DATE DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`serial`),
  KEY `fk_equipos_consumibles` (`item_id`),
  CONSTRAINT `fk_equipos_consumibles` FOREIGN KEY (`item_id`) REFERENCES `consumibles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLA: movimientos_historial (Kárdex y Registro de Auditoría)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `movimientos_historial`;
CREATE TABLE `movimientos_historial` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` VARCHAR(50) DEFAULT NULL,
  `item_nombre` VARCHAR(255) NOT NULL,
  `tipo_operacion` VARCHAR(100) NOT NULL,
  `cambio` INT NOT NULL DEFAULT 0,
  `stock_resultante` INT NOT NULL DEFAULT 0,
  `notas` TEXT DEFAULT NULL,
  `fecha_hora` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLA: usuarios (Control de Acceso y Sesión para la Web)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `rol` ENUM('Admin', 'Operador') NOT NULL DEFAULT 'Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`usuario`, `password`, `nombre`, `rol`) VALUES
('admin', 'admin123', 'Administrador Principal', 'Admin');


-- ----------------------------------------------------------------------------
-- INSERCIÓN DE DATOS INICIALES (94 CONSUMIBLES EXTRAÍDOS DE EXCEL)
-- ----------------------------------------------------------------------------
INSERT INTO `consumibles` (`id`, `item`, `categoria`, `entrada_inicial`, `entrada`, `salida`, `stock`, `min_stock`, `ubicacion`) VALUES
('1', 'PC', 'Equipos & Laptops', 64, 192, 214, 42, 3, 'Almacén Principal'),
('2', 'DISCO DURO SSD', 'Almacenamiento & RAM', 50, 30, 39, 41, 3, 'Almacén Principal'),
('3', 'DISCO DURO M.2', 'Almacenamiento & RAM', 60, 0, 45, 15, 3, 'Almacén Principal'),
('4', 'MEMORIA RAM PC (DDR4, DDR3)', 'Almacenamiento & RAM', 60, 21, 24, 57, 3, 'Almacén Principal'),
('5', 'MEMORIA RAM LAPTOP (DDR3, DDR4)', 'Almacenamiento & RAM', 100, 18, 52, 66, 3, 'Almacén Principal'),
('6', 'MOUSE', 'Periféricos & Accesorios', 89, 195, 220, 64, 3, 'Almacén Principal'),
('7', 'DOCKING STATION', 'Periféricos & Accesorios', 4, 0, 0, 4, 3, 'Almacén Principal'),
('8', 'REPLICADOR USB MULTIPUERTO', 'Periféricos & Accesorios', 7, 1, 1, 7, 3, 'Almacén Principal'),
('9', 'ROUTER', 'Redes, Cableado & Fibra', 5, 0, 1, 4, 3, 'Almacén Principal'),
('10', 'MODEM ROUTER', 'Redes, Cableado & Fibra', 2, 0, 2, 0, 3, 'Almacén Principal'),
('11', 'REGULADOR / UPS', 'Energía & Iluminación', 73, 84, 117, 40, 3, 'Almacén Principal'),
('12', 'DOCKING PARA LAPTOP', 'Periféricos & Accesorios', 33, 1, 1, 33, 3, 'Almacén Principal'),
('13', 'TECLADO', 'Periféricos & Accesorios', 212, 98, 136, 174, 3, 'Almacén Principal'),
('14', 'LAPTOP', 'Equipos & Laptops', 5, 62, 64, 3, 3, 'Almacén Principal'),
('15', 'RADIO', 'Periféricos & Accesorios', 16, 19, 15, 20, 3, 'Almacén Principal'),
('16', 'PANTALLA INTERACTIVA', 'Equipos & Laptops', 4, 1, 2, 3, 3, 'Almacén Principal'),
('17', 'BASE PROYECTOR EPSON', 'Herramientas & Consumibles', 2, 0, 0, 2, 3, 'Almacén Principal'),
('18', 'MONITOR (HDMI, VGA)', 'Equipos & Laptops', 58, 155, 170, 43, 3, 'Almacén Principal'),
('19', 'TELEFONO', 'Redes, Cableado & Fibra', 25, 36, 32, 29, 3, 'Almacén Principal'),
('20', 'PATCH CORD PANDUIT CAT 6 1,5 MTS', 'Redes, Cableado & Fibra', 6, 0, 3, 3, 3, 'Almacén Principal'),
('21', 'PATCH CORD PANDUIT CAT 6 3 MTS', 'Redes, Cableado & Fibra', 4, 0, 0, 4, 3, 'Almacén Principal'),
('22', 'CONECTORES RJ11', 'Redes, Cableado & Fibra', 48, 0, 48, 0, 3, 'Almacén Principal'),
('23', 'JACK COUPLER RJ45', 'Redes, Cableado & Fibra', 175, 239, 184, 230, 3, 'Almacén Principal'),
('24', 'CONECTORES RJ45', 'Redes, Cableado & Fibra', 400, 150, 531, 19, 3, 'Almacén Principal'),
('25', 'JACK COUPLER RJ11', 'Redes, Cableado & Fibra', 100, 28, 25, 103, 3, 'Almacén Principal'),
('26', 'KIT DE HERRAMIENTA PROFESIONAL PARA RED', 'Herramientas & Consumibles', 3, 0, 3, 0, 3, 'Almacén Principal'),
('27', 'PENDRIVE', 'Almacenamiento & RAM', 31, 0, 15, 16, 3, 'Almacén Principal'),
('28', 'LECTOR DE DISCO', 'Periféricos & Accesorios', 1, 0, 1, 0, 3, 'Almacén Principal'),
('29', 'CABLE HDMI', 'Redes, Cableado & Fibra', 8, 0, 4, 4, 3, 'Almacén Principal'),
('30', 'DISCO DURO EXTERNO PORTATIL', 'Almacenamiento & RAM', 8, 0, 4, 4, 3, 'Almacén Principal'),
('31', 'ROLLO CINTA ORGANIZA RACK AMARRA', 'Redes, Cableado & Fibra', 2, 0, 2, 0, 3, 'Almacén Principal'),
('32', 'CONECTOR UNIVERSAL DE COMPRESION PROFESIONAL', 'Redes, Cableado & Fibra', 30, 0, 0, 30, 3, 'Almacén Principal'),
('33', 'CONECTORES TIPO N MACHO PLUG COAXIAL', 'Redes, Cableado & Fibra', 10, 0, 0, 10, 3, 'Almacén Principal'),
('34', 'CABLE DE CONSOLA CON ENRUTADOR DE CHIP F', 'Redes, Cableado & Fibra', 1, 0, 0, 1, 3, 'Almacén Principal'),
('35', 'PATCH CORD FIBRA OPTICA SC/SC MONOMODO', 'Redes, Cableado & Fibra', 10, 0, 5, 5, 3, 'Almacén Principal'),
('36', 'PATCH CORD FIBRA OPTICA DUPLEX SC/ST M', 'Redes, Cableado & Fibra', 10, 0, 0, 10, 3, 'Almacén Principal'),
('37', 'PATCH CORD FIBRA OPTICA LC/LC MONOMODO', 'Redes, Cableado & Fibra', 10, 0, 3, 7, 3, 'Almacén Principal'),
('38', 'PATCH CORD FIBRA OPTICA DUPLEX ST/ST MO', 'Redes, Cableado & Fibra', 10, 0, 5, 5, 3, 'Almacén Principal'),
('39', 'FIBRA OPTICA 1X8 DE MODO UNICO PLC DIVISOR DE FIBRA PC/APC PLC', 'Redes, Cableado & Fibra', 3, 0, 0, 3, 3, 'Almacén Principal'),
('40', 'PATCH CORD FIBRA OPTICA DUPLEX MONOMODO', 'Redes, Cableado & Fibra', 10, 0, 12, 2, 3, 'Almacén Principal'),
('41', 'PATCH CORD DUPLEX DE FIBRA OPTICA MULTI', 'Redes, Cableado & Fibra', 10, 0, 0, 10, 3, 'Almacén Principal'),
('42', 'PATCH CORD SC/SC DUPLEX', 'Redes, Cableado & Fibra', 2, 0, 0, 2, 3, 'Almacén Principal'),
('43', 'FIBRA OPTICA 1X4 DE MODO UNICO PLC DIVISOR DE FIBRA PC/APC PLC', 'Redes, Cableado & Fibra', 3, 0, 0, 3, 3, 'Almacén Principal'),
('44', 'PATCH CORD FIBRA JUMPER TEST DATA', 'Redes, Cableado & Fibra', 2, 0, 0, 2, 3, 'Almacén Principal'),
('45', 'FTTH PLC SPLITTER 1X8 ABS BOX MODULE PLC', 'Redes, Cableado & Fibra', 4, 0, 0, 4, 3, 'Almacén Principal'),
('46', 'CABLE ADAPTADOR USB A PUERTO SERIE RS232', 'Redes, Cableado & Fibra', 2, 0, 1, 1, 3, 'Almacén Principal'),
('47', 'CONMUTADORES KVM VGA', 'Redes, Cableado & Fibra', 1, 0, 1, 0, 3, 'Almacén Principal'),
('48', 'FUENTES DE ALIMENTACION DE CONMUTACION CI', 'Energía & Iluminación', 20, 0, 5, 15, 3, 'Almacén Principal'),
('49', 'SOPLADOR INALAMBRICO', 'Herramientas & Consumibles', 1, 0, 1, 0, 3, 'Almacén Principal'),
('50', 'LINTERNA TACTICA LED', 'Energía & Iluminación', 6, 0, 0, 6, 3, 'Almacén Principal'),
('51', 'CONECTORES UY PARA EMPALME DE CABLE MULTIPAR', 'Redes, Cableado & Fibra', 250, 0, 0, 250, 3, 'Almacén Principal'),
('52', 'EMPALME UNIVERSAL DE FIBRA OPTICA', 'Redes, Cableado & Fibra', 24, 0, 18, 6, 3, 'Almacén Principal'),
('53', 'CABLE UTP CAT5E', 'Redes, Cableado & Fibra', 1220, 0, 273, 947, 3, 'Almacén Principal'),
('54', 'CABLE UTP CAT6', 'Redes, Cableado & Fibra', 1723, 915, 1694, 944, 3, 'Almacén Principal'),
('55', 'BATERIA EXTERNA DE LITIO LBXR2020-OPE', 'Energía & Iluminación', 1, 0, 0, 1, 3, 'Almacén Principal'),
('56', 'LINTERNA LED DE CABEZA / CASCO RECARGABLE', 'Energía & Iluminación', 5, 0, 3, 2, 3, 'Almacén Principal'),
('57', 'LAMPARA - ELPL80', 'Energía & Iluminación', 4, 1, 1, 4, 3, 'Almacén Principal'),
('58', 'RASTREADOR DE CABLE DE RED', 'Herramientas & Consumibles', 1, 0, 1, 0, 3, 'Almacén Principal'),
('59', 'HERRAMIENTA MODULAR DE ALAMBRE, CORTE', 'Herramientas & Consumibles', 1, 0, 1, 0, 3, 'Almacén Principal'),
('60', 'DESTORNILLADORES DE PRECISION 66-052', 'Herramientas & Consumibles', 1, 0, 1, 0, 3, 'Almacén Principal'),
('61', 'CINTAS MAGNETICAS LTO4 ULTRIUM, 1.6 TB', 'Almacenamiento & RAM', 20, 0, 0, 20, 3, 'Almacén Principal'),
('63', 'PATCH PANEL', 'Redes, Cableado & Fibra', 1, 0, 2, 1, 3, 'Almacén Principal'),
('64', 'ORGANIZADOR DE CABLE HORIZONTAL METALICO', 'Redes, Cableado & Fibra', 5, 0, 2, 3, 3, 'Almacén Principal'),
('65', 'MANGAS PARA EMPALMES DE FIBRA ÓPTICA', 'Redes, Cableado & Fibra', 4, 0, 0, 4, 3, 'Almacén Principal'),
('66', 'CILINDRO (D197-9510)', 'Impresión & Tóner', 50, 0, 9, 41, 3, 'Almacén Principal'),
('67', 'CUCHILLA (AD041161)', 'Impresión & Tóner', 50, 0, 9, 41, 3, 'Almacén Principal'),
('68', 'RODILLO FUSOR (D0DK4032)', 'Impresión & Tóner', 50, 0, 7, 43, 3, 'Almacén Principal'),
('69', 'RODILLO DE PRESION (D202-4313)', 'Impresión & Tóner', 20, 0, 2, 18, 3, 'Almacén Principal'),
('70', 'RODILLO DE CARGA (AD02-7034)', 'Impresión & Tóner', 50, 0, 8, 42, 3, 'Almacén Principal'),
('71', 'TÓNER SHARP MODELO AR455NT (COLOR NEGRO)', 'Impresión & Tóner', 1, 0, 1, 0, 3, 'Almacén Principal'),
('72', 'TÓNER HP LASERJET MODELO 42A (COLOR NEGRO)', 'Impresión & Tóner', 11, 0, 0, 11, 3, 'Almacén Principal'),
('73', 'TÓNER LASERJET MODELO 15A (COLOR NEGRO)', 'Impresión & Tóner', 5, 0, 0, 5, 3, 'Almacén Principal'),
('74', 'TÓNER LASERJET MODELO 12A (COLOR NEGRO)', 'Impresión & Tóner', 1, 0, 0, 1, 3, 'Almacén Principal'),
('75', 'TÓNER LASERJET MODELO 61A (COLOR NEGRO)', 'Impresión & Tóner', 1, 0, 0, 1, 3, 'Almacén Principal'),
('76', 'TÓNER LASERJET MODELO C4129X (COLOR NEGRO)', 'Impresión & Tóner', 1, 0, 0, 1, 3, 'Almacén Principal'),
('77', 'TÓNER LASERJET MODELO 124A (COLOR NEGRO)', 'Impresión & Tóner', 20, 0, 0, 20, 3, 'Almacén Principal'),
('78', 'TÓNER Q6471A HP 502A (AZUL, AMARILLO Y ROJO)', 'Impresión & Tóner', 12, 0, 0, 12, 3, 'Almacén Principal'),
('79', 'TÓNER NEGRO Q6470A HP 501A', 'Impresión & Tóner', 4, 0, 0, 4, 3, 'Almacén Principal'),
('80', 'TÓNER SHARP MODELO 310 (COLOR NEGRO)', 'Impresión & Tóner', 30, 0, 0, 30, 3, 'Almacén Principal'),
('81', 'TÓNER SHARP MODELO MX62NT (COLOR NEGRO)', 'Impresión & Tóner', 5, 0, 0, 5, 3, 'Almacén Principal'),
('82', 'TÓNER SHARP MODELO AR621NTA (COLOR NEGRO)', 'Impresión & Tóner', 6, 0, 0, 6, 3, 'Almacén Principal'),
('83', 'TÓNER SHARP MODELO MX62NT (COLORES)', 'Impresión & Tóner', 40, 0, 0, 40, 3, 'Almacén Principal'),
('84', 'TÓNER SHARP MODELO MX27NTCA (COLORES)', 'Impresión & Tóner', 28, 0, 0, 28, 3, 'Almacén Principal'),
('85', 'TÓNER SHARP MODELO MX45NTBA (COLORES)', 'Impresión & Tóner', 11, 0, 0, 11, 3, 'Almacén Principal'),
('86', 'TÓNER SHARP MODELO MX27NT (COLORES)', 'Impresión & Tóner', 4, 0, 0, 4, 3, 'Almacén Principal'),
('87', 'TÓNER IMPRESORA RICOH IM4000', 'Impresión & Tóner', 97, 1, 57, 41, 3, 'Almacén Principal'),
('88', 'CARTUCHO NEGRO EPSON T544120-AL', 'Impresión & Tóner', 4, 0, 1, 3, 3, 'Almacén Principal'),
('89', 'CARTUCHO CIAN EPSON T544220-AL (CIAN, AMARILLO, MAGENTA)', 'Impresión & Tóner', 12, 0, 3, 9, 3, 'Almacén Principal'),
('90', 'FILM FIXING RM1-2665-FM3 HP 3600', 'Impresión & Tóner', 2, 0, 0, 2, 3, 'Almacén Principal'),
('91', 'NUMERADORA AUTOMÁTICA 6D 5MM FOLIADORA', 'Herramientas & Consumibles', 1, 0, 0, 1, 3, 'Almacén Principal'),
('92', 'SWITCH', 'Redes, Cableado & Fibra', 0, 6, 1, 5, 3, 'Almacén Principal'),
('93', 'LAPTOPS LENOVO E41-50', 'Equipos & Laptops', 27, 1, 26, 2, 3, 'Almacén Principal'),
('94', 'PC LENOVO ESCRITORIO', 'Equipos & Laptops', 42, 0, 40, 2, 3, 'Almacén Principal'),
('95', 'MONITOR LENOVO THINKVISION', 'Equipos & Laptops', 42, 0, 40, 2, 3, 'Almacén Principal');

-- ----------------------------------------------------------------------------
-- INSERCIÓN DE DATOS INICIALES (EQUIPOS SERIALIZADOS)
-- ----------------------------------------------------------------------------
INSERT INTO `equipos_serializados` (`serial`, `item_id`, `tipo`, `marca`, `modelo`, `estado`, `asignado_a`, `ubicacion`, `fecha_registro`) VALUES
('PC-LENOVO-9481', '1', 'PC', 'Lenovo', 'ThinkCentre M720q', 'Disponible', '-', 'Estante A-1', '2026-07-28'),
('PC-LENOVO-9482', '1', 'PC', 'Lenovo', 'ThinkCentre M720q', 'Disponible', '-', 'Estante A-1', '2026-07-28'),
('PC-HP-4412', '1', 'PC', 'HP', 'ProDesk 400 G6', 'Asignado', 'Carlos Mendoza (Contabilidad)', 'Oficina 204', '2026-07-29'),
('LAP-LEN-0012', '93', 'LAPTOPS LENOVO E41-50', 'Lenovo', 'E41-50 Core i5', 'Disponible', '-', 'Estante B-2', '2026-07-30'),
('LAP-LEN-0013', '93', 'LAPTOPS LENOVO E41-50', 'Lenovo', 'E41-50 Core i5', 'Disponible', '-', 'Estante B-2', '2026-07-30'),
('MON-THINK-771', '95', 'MONITOR LENOVO THINKVISION', 'Lenovo', 'ThinkVision T24i-20', 'Disponible', '-', 'Estante B-1', '2026-07-30'),
('MON-THINK-772', '95', 'MONITOR LENOVO THINKVISION', 'Lenovo', 'ThinkVision T24i-20', 'Disponible', '-', 'Estante B-1', '2026-07-30'),
('SW-CISCO-2960', '92', 'SWITCH', 'Cisco', 'Catalyst 2960-X 24P', 'Disponible', '-', 'Estante R-1', '2026-07-31'),
('RICOH-IM4000-01', '87', 'TONER IMPRESORA RICOH IM4000', 'Ricoh', 'IM 4000', 'Disponible', '-', 'Zona Impresoras', '2026-07-31');
