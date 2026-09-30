-- Tablas del dump original: InnoDB + utf8mb4 + llaves primarias para poder editarlas con seguridad
ALTER TABLE resumen_ejecutivo_pse ENGINE = InnoDB;
ALTER TABLE resumen_ejecutivo_pse CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE resumen_ejecutivo_pse MODIFY cod_departamento INT NOT NULL, ADD PRIMARY KEY (cod_departamento);

ALTER TABLE diagnosticos_pse ENGINE = InnoDB;
ALTER TABLE diagnosticos_pse CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE diagnosticos_pse
  ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
  ADD INDEX idx_diagnosticos_departamento (cod_departamento, numero);

ALTER TABLE medicamentos_pse ENGINE = InnoDB;
ALTER TABLE medicamentos_pse CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE medicamentos_pse
  ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
  ADD INDEX idx_medicamentos_departamento (cod_departamento, numero);

-- Cifras cerradas de años anteriores (antes escritas en el código: Multianual y Centro 1528)
CREATE TABLE IF NOT EXISTS historico_anual (
  anio INT PRIMARY KEY,
  periodo_inicio VARCHAR(50) NOT NULL DEFAULT '',
  periodo_fin VARCHAR(50) NOT NULL DEFAULT '',
  consultas INT NOT NULL DEFAULT 0,
  estudiantes INT NOT NULL DEFAULT 0,
  llamadas INT NOT NULL DEFAULT 0,
  infecciones_respiratorias INT NOT NULL DEFAULT 0,
  enfermedades_gastrointestinales INT NOT NULL DEFAULT 0,
  accidentes INT NOT NULL DEFAULT 0,
  medicamentos_dispensados INT NOT NULL DEFAULT 0,
  aportes INT NOT NULL DEFAULT 0,
  monto_aportes INT NOT NULL DEFAULT 0,
  aportes_f INT NOT NULL DEFAULT 0,
  aportes_m INT NOT NULL DEFAULT 0
) DEFAULT CHARSET=utf8mb4;

INSERT INTO historico_anual VALUES
(2024, '01 marzo', '31 diciembre', 674656, 222704, 68016, 223892, 69763, 33934, 927335, 836, 6251500, 383, 453),
(2025, '01 enero', '31 diciembre', 3119633, 1172576, 57440, 604011, 284540, 152829, 3749196, 839, 6292500, 329, 510);

-- Datos generales del portal
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(50) PRIMARY KEY,
  valor TEXT NOT NULL
) DEFAULT CHARSET=utf8mb4;

INSERT INTO configuracion VALUES
('anio_actual', '2026'),
('correo_contacto', 'saludescolar@mineduc.gob.gt');

-- Actividades de Promoción de la salud
CREATE TABLE IF NOT EXISTS actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT NOT NULL DEFAULT 1
) DEFAULT CHARSET=utf8mb4;

INSERT INTO actividades (titulo, imagen_url, orden) VALUES
('Jornadas de desparasitación escolar', '/imagenes/promocion/actividad-1.webp', 1),
('Jornadas de inmunización', '/imagenes/promocion/actividad-2.webp', 2),
('Prevención del dengue', '/imagenes/promocion/actividad-3.webp', 3),
('Promoción de salud renal', '/imagenes/promocion/actividad-4.webp', 4);

-- Personal del Centro de llamadas 1528
CREATE TABLE IF NOT EXISTS personal_1528 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cantidad INT NOT NULL DEFAULT 0,
  titulo VARCHAR(255) NOT NULL,
  texto TEXT,
  imagen_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT NOT NULL DEFAULT 1
) DEFAULT CHARSET=utf8mb4;

INSERT INTO personal_1528 (cantidad, titulo, texto, imagen_url, orden) VALUES
(4, 'Médicos pediatras', 'Médicos profesionales especializados en brindarte la mejor atención.', '/imagenes/icons/students.png', 1),
(24, 'Médicos generales', 'Organizados en turnos fijos y rotativos para garantizar la atención continua durante todo el día.', '/imagenes/icons/stethoscope.png', 2),
(16, 'Gestores de llamadas', 'Equipo que atiende a las familias de todo el país.', '/imagenes/icons/center.png', 3),
(1, 'Psicólogo', 'Apoyo psicológico para ayudarte a gestionar tu bienestar mental y emocional.', '/imagenes/icons/promotion.png', 4);

-- Material educativo
CREATE TABLE IF NOT EXISTS materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  -- audio: botón "escuchar"; pdf: botones "ver" y "descargar"
  tipo VARCHAR(10) NOT NULL DEFAULT 'pdf',
  archivo_url TEXT NOT NULL,
  etiqueta_boton VARCHAR(100) NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT NOT NULL DEFAULT 1
) DEFAULT CHARSET=utf8mb4;

INSERT INTO materiales (titulo, descripcion, imagen_url, tipo, archivo_url, etiqueta_boton, orden) VALUES
('Spot de Radio', 'Escuche el spot de radio del Programa de Salud Escolar.', '/imagenes/spot_radio.png', 'audio', '/audio/spot_pse.wav', 'Escuchar Spot', 1),
('Trifoliar Informativo - PSE', 'Consulte el trifoliar informativo del Programa de Salud Escolar o descárguelo en formato PDF.', '/imagenes/bifoliar_pse.jpeg', 'pdf', '/documentos/bifoliarpse.pdf', 'Ver Trifoliar', 2);

-- Normativa legal (Inicio y Apoyo funerario)
CREATE TABLE IF NOT EXISTS normativa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(255) NOT NULL DEFAULT '',
  archivo_url TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT NOT NULL DEFAULT 1
) DEFAULT CHARSET=utf8mb4;

INSERT INTO normativa (titulo, subtitulo, archivo_url, orden) VALUES
('Acuerdo Gubernativo 36-2024', 'Programa de Salud Escolar', '/documentos/ACUERDO 36-2024.pdf', 1),
('Acuerdo Ministerial 815-2024', 'Aporte económico para gastos funerarios', '/documentos/ACUERDO 815-2024.pdf', 2);
