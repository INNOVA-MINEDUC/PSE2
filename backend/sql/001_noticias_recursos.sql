-- Noticias del portal (estructura tomada de PSE-FINAL)
CREATE TABLE IF NOT EXISTS noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion_corta TEXT,
  -- Párrafos separados por una línea en blanco
  contenido LONGTEXT NULL,
  imagen_url TEXT,
  fecha_publicacion DATE,
  -- general | promocion | atencion | medicamentos | llamadas | funerario
  modulo VARCHAR(100) NOT NULL DEFAULT 'general',
  autor VARCHAR(255) NULL,
  activo TINYINT NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_noticias_publicas (activo, modulo, fecha_publicacion)
) DEFAULT CHARSET=utf8mb4;

-- Enlaces configurables por módulo (reemplaza video_url/folleto_url/formulario_url
-- de las tablas metricas_* de PSE-FINAL)
CREATE TABLE IF NOT EXISTS recursos_modulo (
  modulo VARCHAR(50) NOT NULL,
  clave VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (modulo, clave)
) DEFAULT CHARSET=utf8mb4;
