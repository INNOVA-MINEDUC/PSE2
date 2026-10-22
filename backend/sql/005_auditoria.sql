-- Bitácora de auditoría: quién cambió qué y cuándo en el panel.
-- Sin llave foránea a usuarios para que el historial sobreviva al eliminar un usuario;
-- por eso se guarda también el correo del momento.
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NULL,
  usuario_correo VARCHAR(255) NULL,
  -- crear | actualizar | eliminar | importar | login | login_fallido | logout | clave
  accion VARCHAR(30) NOT NULL,
  -- noticias, usuarios, configuracion, visibilidad, recursos, sesion o una colección del CRUD
  entidad VARCHAR(60) NOT NULL,
  entidad_id VARCHAR(100) NULL,
  -- { antes, despues } o { cambios: { campo: [antes, despues] } } o datos extra
  detalle JSON NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  INDEX idx_auditoria_fecha (fecha),
  INDEX idx_auditoria_usuario (usuario_id, fecha),
  INDEX idx_auditoria_entidad (entidad, entidad_id)
) DEFAULT CHARSET=utf8mb4;
