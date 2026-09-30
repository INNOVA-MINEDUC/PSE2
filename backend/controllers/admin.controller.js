import { pool } from "../db.js";
import { validarNoticia, RECURSOS, urlValida } from "../validacion.js";
import { borrarSubido } from "../middleware/upload.middleware.js";

// ---------- Noticias ----------

export const listarNoticias = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, descripcion_corta, contenido, imagen_url, fecha_publicacion,
              modulo, autor, activo, orden, updated_at
       FROM noticias ORDER BY fecha_publicacion DESC, id DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR listarNoticias:", err);
    res.status(500).json({ error: "Error obteniendo noticias." });
  }
};

export const crearNoticia = async (req, res) => {
  const { datos, error } = validarNoticia(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const [r] = await pool.query("INSERT INTO noticias SET ?", [datos]);
    res.status(201).json({ data: { id: r.insertId } });
  } catch (err) {
    console.error("ERROR crearNoticia:", err);
    res.status(500).json({ error: "Error guardando la noticia." });
  }
};

export const actualizarNoticia = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { datos, error } = validarNoticia(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const [[anterior]] = await pool.query("SELECT imagen_url FROM noticias WHERE id = ?", [id]);
    if (!anterior) return res.status(404).json({ error: "Noticia no encontrada." });

    await pool.query("UPDATE noticias SET ? WHERE id = ?", [datos, id]);
    if (anterior.imagen_url !== datos.imagen_url) await borrarSubido(anterior.imagen_url);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR actualizarNoticia:", err);
    res.status(500).json({ error: "Error guardando la noticia." });
  }
};

export const eliminarNoticia = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  try {
    const [[noticia]] = await pool.query("SELECT imagen_url FROM noticias WHERE id = ?", [id]);
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada." });

    await pool.query("DELETE FROM noticias WHERE id = ?", [id]);
    await borrarSubido(noticia.imagen_url);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR eliminarNoticia:", err);
    res.status(500).json({ error: "Error eliminando la noticia." });
  }
};

// ---------- Recursos por módulo ----------

export const listarRecursos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT modulo, clave, url, updated_at FROM recursos_modulo");
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR listarRecursos:", err);
    res.status(500).json({ error: "Error obteniendo recursos." });
  }
};

// PUT { url } — url vacía elimina el recurso
export const guardarRecurso = async (req, res) => {
  const { modulo, clave } = req.params;
  const url = String(req.body?.url ?? "").trim();

  if (!RECURSOS[modulo]?.includes(clave)) return res.status(400).json({ error: "Recurso no válido." });
  if (!urlValida(url)) {
    return res.status(400).json({ error: "La URL debe empezar con https:// o ser un archivo subido." });
  }

  try {
    const [[anterior]] = await pool.query(
      "SELECT url FROM recursos_modulo WHERE modulo = ? AND clave = ?",
      [modulo, clave]
    );

    if (url) {
      await pool.query(
        `INSERT INTO recursos_modulo (modulo, clave, url) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE url = VALUES(url)`,
        [modulo, clave, url]
      );
    } else {
      await pool.query("DELETE FROM recursos_modulo WHERE modulo = ? AND clave = ?", [modulo, clave]);
    }

    if (anterior && anterior.url !== url) await borrarSubido(anterior.url);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR guardarRecurso:", err);
    res.status(500).json({ error: "Error guardando el recurso." });
  }
};

// ---------- Subidas ----------

export const archivoSubido = (req, res) => res.status(201).json({ data: { url: req.archivoUrl } });
