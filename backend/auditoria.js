import { pool } from "./db.js";

// Campos que nunca se guardan en la bitácora
const OCULTOS = new Set(["clave", "clave_hash", "token", "token_hash"]);
const MAX_TEXTO = 1000;

const comparable = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));

// Copia sin campos sensibles y con textos largos recortados
function limpiar(obj) {
  if (!obj || typeof obj !== "object") return obj ?? null;
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => !OCULTOS.has(k))
      .map(([k, v]) => [k, typeof v === "string" && v.length > MAX_TEXTO ? `${v.slice(0, MAX_TEXTO)}…` : v])
  );
}

// { a: { b: 1 } } -> { "a.b": 1 }, para comparar objetos anidados campo por campo
export function aplanar(obj, prefijo = "") {
  const plano = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const llave = prefijo ? `${prefijo}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) Object.assign(plano, aplanar(v, llave));
    else plano[llave] = v;
  }
  return plano;
}

// Solo los campos que cambiaron: { campo: [antes, despues] }
export function diferencias(antes = {}, despues = {}) {
  const a = limpiar(antes) || {};
  const d = limpiar(despues) || {};
  const cambios = {};
  for (const k of Object.keys(d)) {
    if (comparable(a[k]) !== comparable(d[k])) cambios[k] = [a[k] ?? null, d[k] ?? null];
  }
  return cambios;
}

export const detalleCrear = (datos) => ({ despues: limpiar(datos) });
export const detalleEliminar = (datos) => ({ antes: limpiar(datos) });
export const detalleActualizar = (antes, despues) => ({ cambios: diferencias(antes, despues) });

// Registra un evento. Nunca lanza: un fallo de la bitácora no debe tumbar la operación.
// `usuario` por defecto es el de la sesión (req.usuario).
export async function auditar(req, { accion, entidad, entidadId = null, detalle = null, usuario = req.usuario }) {
  // Guardar sin cambios reales no aporta nada a la bitácora
  if (detalle?.cambios && !Object.keys(detalle.cambios).length) return;
  try {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, usuario_correo, accion, entidad, entidad_id, detalle, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario?.id ?? null,
        usuario?.correo ?? null,
        accion,
        entidad,
        entidadId === null ? null : String(entidadId),
        detalle ? JSON.stringify(detalle) : null,
        req.ip || null,
        String(req.headers["user-agent"] || "").slice(0, 255) || null,
      ]
    );
  } catch (err) {
    console.error("ERROR auditar:", accion, entidad, err.message);
  }
}
