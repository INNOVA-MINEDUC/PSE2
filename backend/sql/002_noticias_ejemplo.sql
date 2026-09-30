-- NOTICIAS DE EJEMPLO: contenido de prueba para visualizar el portal.
-- Eliminar antes de producción:  DELETE FROM noticias WHERE autor = 'Contenido de ejemplo';
INSERT INTO noticias (titulo, descripcion_corta, contenido, imagen_url, fecha_publicacion, modulo, autor, activo, orden) VALUES
('[Ejemplo] Jornada de lavado de manos en centros educativos',
 'Texto de ejemplo: actividad de promoción de hábitos de higiene con estudiantes del nivel primario.',
 'Este es un texto de ejemplo para mostrar cómo se ve una noticia publicada en el portal del Programa de Salud Escolar.\n\nEl contenido real se cargará desde el panel de administración. Cada párrafo se separa con una línea en blanco.\n\nEsta noticia debe eliminarse antes de publicar el sitio.',
 '/uploads/noticias/ejemplo-lavado-manos.webp', '2026-09-15', 'promocion', 'Contenido de ejemplo', 1, 0),
('[Ejemplo] Acciones de prevención del dengue',
 'Texto de ejemplo: orientación a docentes y estudiantes para eliminar criaderos de zancudos.',
 'Este es un texto de ejemplo para mostrar cómo se ve una noticia publicada en el portal del Programa de Salud Escolar.\n\nEl contenido real se cargará desde el panel de administración.\n\nEsta noticia debe eliminarse antes de publicar el sitio.',
 '/uploads/noticias/ejemplo-dengue.webp', '2026-09-08', 'promocion', 'Contenido de ejemplo', 1, 0),
('[Ejemplo] Recursos digitales para el cuidado de la salud',
 'Texto de ejemplo: materiales educativos disponibles para las comunidades educativas.',
 'Este es un texto de ejemplo para mostrar cómo se ve una noticia publicada en el portal del Programa de Salud Escolar.\n\nEl contenido real se cargará desde el panel de administración.\n\nEsta noticia debe eliminarse antes de publicar el sitio.',
 '/uploads/noticias/ejemplo-tecnologia.webp', '2026-08-28', 'general', 'Contenido de ejemplo', 1, 0);
