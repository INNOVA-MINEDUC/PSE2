import { pool } from "../db.js";

const POR_PAGINA = 50;
const fechaValida = (f) => /^\d{4}-\d{2}-\d{2}$/.test(f || "");

// GET /api/admin/auditoria?usuario=&accion=&entidad=&desde=AAAA-MM-DD&hasta=AAAA-MM-DD&pagina=1
export const listarAuditoria = async (req, res) => {
  const { usuario, accion, entidad, desde, hasta } = req.query;
  const pagina = Math.max(1, Number.parseInt(req.query.pagina, 10) || 1);

  const condiciones = [];
  const params = [];
  if (usuario) { condiciones.push("usuario_correo = ?"); params.push(String(usuario)); }
  if (accion) { condiciones.push("accion = ?"); params.push(String(accion)); }
  if (entidad) { condiciones.push("entidad = ?"); params.push(String(entidad)); }
  if (fechaValida(desde)) { condiciones.push("fecha >= ?"); params.push(desde); }
  if (fechaValida(hasta)) { condiciones.push("fecha < DATE_ADD(?, INTERVAL 1 DAY)"); params.push(hasta); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM auditoria ${where}`, params);
    const [rows] = await pool.query(
      `SELECT id, fecha, usuario_id, usuario_correo, accion, entidad, entidad_id, detalle, ip, user_agent
       FROM auditoria ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, POR_PAGINA, (pagina - 1) * POR_PAGINA]
    );
    // Valores para llenar los filtros del panel
    const [usuarios] = await pool.query(
      "SELECT DISTINCT usuario_correo AS v FROM auditoria WHERE usuario_correo IS NOT NULL ORDER BY v"
    );
    const [entidades] = await pool.query("SELECT DISTINCT entidad AS v FROM auditoria ORDER BY v");

    res.json({
      data: rows,
      total,
      pagina,
      porPagina: POR_PAGINA,
      filtros: { usuarios: usuarios.map((r) => r.v), entidades: entidades.map((r) => r.v) },
    });
  } catch (err) {
    console.error("ERROR listarAuditoria:", err);
    res.status(500).json({ error: "Error obteniendo la auditoría." });
  }
};
