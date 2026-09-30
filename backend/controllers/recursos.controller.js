import { pool } from "../db.js";

// Enlaces configurables por módulo (video, folleto, formulario...).
// Respuesta: { data: { video_url: "...", folleto_url: "..." } }
export const getRecursos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT clave, url FROM recursos_modulo WHERE modulo = ? AND url <> ''`,
      [req.params.modulo]
    );
    res.json({ data: Object.fromEntries(rows.map((r) => [r.clave, r.url])) });
  } catch (err) {
    console.error("ERROR getRecursos:", err);
    res.status(500).json({ error: "Error obteniendo recursos" });
  }
};
