import { pool } from "../db.js";

const CAMPOS = `id, titulo, descripcion_corta, imagen_url, fecha_publicacion, modulo, autor`;

// Solo noticias activas; ?modulo=promocion filtra, ?limite=3 recorta
export const getNoticias = async (req, res) => {
  const { modulo } = req.query;
  const limite = Math.min(Number.parseInt(req.query.limite, 10) || 50, 50);

  try {
    const [rows] = await pool.query(
      `SELECT ${CAMPOS} FROM noticias
       WHERE activo = 1 ${modulo ? "AND modulo = ?" : ""}
       ORDER BY orden ASC, fecha_publicacion DESC, id DESC
       LIMIT ?`,
      modulo ? [modulo, limite] : [limite]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR getNoticias:", err);
    res.status(500).json({ error: "Error obteniendo noticias" });
  }
};

export const getNoticiaById = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!(id > 0)) return res.status(404).json({ error: "Noticia no encontrada" });

  try {
    const [[noticia]] = await pool.query(
      `SELECT ${CAMPOS}, contenido FROM noticias WHERE id = ? AND activo = 1`,
      [id]
    );
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });
    res.json({ data: noticia });
  } catch (err) {
    console.error("ERROR getNoticiaById:", err);
    res.status(500).json({ error: "Error obteniendo la noticia" });
  }
};
