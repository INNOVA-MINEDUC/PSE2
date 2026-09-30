import { pool } from "../db.js";
import { hashToken } from "../seguridad.js";

export const COOKIE_SESION = "pse_sesion";
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

export function leerCookie(req, nombre) {
  const cookies = req.headers.cookie || "";
  for (const parte of cookies.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function opcionesCookie() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "strict",
    path: "/api",
    maxAge: DURACION_SESION_MS,
  };
}

// Exige sesión válida; deja el usuario en req.usuario
export async function requireAuth(req, res, next) {
  const token = leerCookie(req, COOKIE_SESION);
  if (!token) return res.status(401).json({ error: "Sesión requerida" });

  try {
    const [[usuario]] = await pool.query(
      `SELECT u.id, u.correo, u.nombre
       FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = ? AND s.expira_en > NOW() AND u.activo = 1`,
      [hashToken(token)]
    );
    if (!usuario) return res.status(401).json({ error: "Sesión expirada" });
    req.usuario = usuario;
    req.tokenSesion = token;
    next();
  } catch (err) {
    console.error("ERROR requireAuth:", err);
    res.status(500).json({ error: "Error validando la sesión" });
  }
}

// Defensa extra contra CSRF: en peticiones que modifican datos, el Origin
// (si el navegador lo envía) debe coincidir con el host de la petición.
export function mismoOrigen(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  const permitidos = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  try {
    if (new URL(origin).host === req.headers.host || permitidos.includes(origin)) return next();
  } catch {
    // Origin inválido: se rechaza abajo
  }
  res.status(403).json({ error: "Origen no permitido" });
}
