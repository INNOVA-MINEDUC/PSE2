import { pool } from "../db.js";
import { hashClave, verificarClave, CLAVE_MINIMA, hashToken } from "../seguridad.js";

const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
const claveCorta = (c) => String(c || "").length < CLAVE_MINIMA;
const ERROR_CLAVE = `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`;

async function adminsActivos(exceptoId) {
  const [[{ total }]] = await pool.query(
    "SELECT COUNT(*) AS total FROM usuarios WHERE activo = 1 AND id <> ?",
    [exceptoId]
  );
  return total;
}

export const listarUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, correo, nombre, activo, ultimo_acceso, created_at FROM usuarios ORDER BY nombre"
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR listarUsuarios:", err);
    res.status(500).json({ error: "Error obteniendo usuarios." });
  }
};

export const crearUsuario = async (req, res) => {
  const correo = String(req.body?.correo || "").trim().toLowerCase();
  const nombre = String(req.body?.nombre || "").trim().slice(0, 255);
  const clave = String(req.body?.clave || "");

  if (!correoValido(correo)) return res.status(400).json({ error: "Correo no válido." });
  if (!nombre) return res.status(400).json({ error: "El nombre es requerido." });
  if (claveCorta(clave)) return res.status(400).json({ error: ERROR_CLAVE });

  try {
    const [r] = await pool.query(
      "INSERT INTO usuarios (correo, nombre, clave_hash) VALUES (?, ?, ?)",
      [correo, nombre, await hashClave(clave)]
    );
    res.status(201).json({ data: { id: r.insertId } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    console.error("ERROR crearUsuario:", err);
    res.status(500).json({ error: "Error creando el usuario." });
  }
};

// PUT { nombre, activo }
export const actualizarUsuario = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const nombre = String(req.body?.nombre || "").trim().slice(0, 255);
  const activo = [false, 0, "0"].includes(req.body?.activo) ? 0 : 1;

  if (!nombre) return res.status(400).json({ error: "El nombre es requerido." });
  if (!activo && id === req.usuario.id) return res.status(400).json({ error: "No puede desactivar su propio usuario." });

  try {
    if (!activo && (await adminsActivos(id)) === 0) {
      return res.status(400).json({ error: "Debe quedar al menos un usuario activo." });
    }
    const [r] = await pool.query("UPDATE usuarios SET nombre = ?, activo = ? WHERE id = ?", [nombre, activo, id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Usuario no encontrado." });
    if (!activo) await pool.query("DELETE FROM sesiones WHERE usuario_id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR actualizarUsuario:", err);
    res.status(500).json({ error: "Error guardando el usuario." });
  }
};

// PUT { clave } — restablece la contraseña de otro usuario y cierra sus sesiones
export const restablecerClave = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const clave = String(req.body?.clave || "");
  if (claveCorta(clave)) return res.status(400).json({ error: ERROR_CLAVE });

  try {
    const [r] = await pool.query("UPDATE usuarios SET clave_hash = ? WHERE id = ?", [await hashClave(clave), id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Usuario no encontrado." });
    await pool.query("DELETE FROM sesiones WHERE usuario_id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR restablecerClave:", err);
    res.status(500).json({ error: "Error guardando la contraseña." });
  }
};

export const eliminarUsuario = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (id === req.usuario.id) return res.status(400).json({ error: "No puede eliminar su propio usuario." });

  try {
    if ((await adminsActivos(id)) === 0) {
      return res.status(400).json({ error: "Debe quedar al menos un usuario activo." });
    }
    const [r] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR eliminarUsuario:", err);
    res.status(500).json({ error: "Error eliminando el usuario." });
  }
};

// PUT /api/auth/clave { actual, nueva } — el usuario cambia su propia contraseña.
// Se conservan la sesión actual y se cierran las demás.
export const cambiarMiClave = async (req, res) => {
  const actual = String(req.body?.actual || "");
  const nueva = String(req.body?.nueva || "");
  if (claveCorta(nueva)) return res.status(400).json({ error: ERROR_CLAVE });

  try {
    const [[u]] = await pool.query("SELECT clave_hash FROM usuarios WHERE id = ?", [req.usuario.id]);
    if (!u || !(await verificarClave(actual, u.clave_hash))) {
      return res.status(400).json({ error: "La contraseña actual no es correcta." });
    }
    await pool.query("UPDATE usuarios SET clave_hash = ? WHERE id = ?", [await hashClave(nueva), req.usuario.id]);
    await pool.query(
      "DELETE FROM sesiones WHERE usuario_id = ? AND token_hash <> ?",
      [req.usuario.id, hashToken(req.tokenSesion)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR cambiarMiClave:", err);
    res.status(500).json({ error: "Error guardando la contraseña." });
  }
};
