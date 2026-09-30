import { pool } from "../db.js";
import { verificarClave, HASH_FALSO, nuevoToken, hashToken } from "../seguridad.js";
import { COOKIE_SESION, DURACION_SESION_MS, opcionesCookie } from "../middleware/auth.middleware.js";

const ERROR_CREDENCIALES = "Correo o contraseña incorrectos.";

export const login = async (req, res) => {
  const correo = String(req.body?.correo || "").trim().toLowerCase();
  const clave = String(req.body?.clave || "");
  if (!correo || !clave) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }

  try {
    const [[usuario]] = await pool.query(
      "SELECT id, correo, nombre, clave_hash FROM usuarios WHERE correo = ? AND activo = 1",
      [correo]
    );

    const valida = await verificarClave(clave, usuario?.clave_hash || HASH_FALSO);
    if (!usuario || !valida) return res.status(401).json({ error: ERROR_CREDENCIALES });

    const token = nuevoToken();
    await pool.query(
      `INSERT INTO sesiones (token_hash, usuario_id, expira_en)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
      [hashToken(token), usuario.id, DURACION_SESION_MS / 1000]
    );
    await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [usuario.id]);
    // Limpieza de sesiones vencidas
    await pool.query("DELETE FROM sesiones WHERE expira_en < NOW()");

    res.cookie(COOKIE_SESION, token, opcionesCookie());
    res.json({ data: { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre } });
  } catch (err) {
    console.error("ERROR login:", err);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
};

export const logout = async (req, res) => {
  try {
    await pool.query("DELETE FROM sesiones WHERE token_hash = ?", [hashToken(req.tokenSesion)]);
  } catch (err) {
    console.error("ERROR logout:", err);
  }
  const { maxAge, ...opciones } = opcionesCookie();
  res.clearCookie(COOKIE_SESION, opciones);
  res.json({ ok: true });
};

export const me = (req, res) => res.json({ data: req.usuario });
