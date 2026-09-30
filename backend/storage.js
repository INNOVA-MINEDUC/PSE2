// Almacenamiento de archivos subidos desde el panel (imágenes, PDF, audio).
//
// STORAGE_DRIVER=bucket  -> microservicio bucketService (mismo que usa PSE-FINAL)
//                           STORAGE_SERVICE_URL y STORAGE_API_KEY obligatorios
// STORAGE_DRIVER=local   -> carpeta uploads/ del backend (desarrollo)
// Sin STORAGE_DRIVER: bucket si hay STORAGE_SERVICE_URL, si no local.
//
// En BD se guarda la URL pública del archivo:
//   bucket: /api/archivos/<uuid>.<ext>   (el backend hace de proxy; el navegador nunca habla con el bucket)
//   local:  /uploads/<carpeta>/<nombre>
import path from "path";
import { promises as fs } from "fs";
import { Readable } from "stream";
import { fileURLToPath } from "url";

export const DIR_UPLOADS = path.join(path.dirname(fileURLToPath(import.meta.url)), "uploads");
export const PREFIJO_BUCKET = "/api/archivos/";

// Forma exacta de las llaves de bucketService (UUID + extensión). Allowlist:
// nada que no calce llega a construir una URL hacia el servicio (evita SSRF / path traversal).
const PATRON_LLAVE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/i;
export const llaveValida = (llave) => typeof llave === "string" && PATRON_LLAVE.test(llave);

export class ErrorAlmacenamiento extends Error {
  constructor(mensaje, status = 502) {
    super(mensaje);
    this.status = status;
  }
}

export const driver = () =>
  process.env.STORAGE_DRIVER || (process.env.STORAGE_SERVICE_URL ? "bucket" : "local");

// ---------- bucketService ----------

function configBucket() {
  const base = (process.env.STORAGE_SERVICE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.STORAGE_API_KEY;
  if (!base || !apiKey) {
    throw new ErrorAlmacenamiento("Almacenamiento mal configurado: faltan STORAGE_SERVICE_URL o STORAGE_API_KEY.", 500);
  }
  return { base, cabeceras: { "X-API-Key": apiKey } };
}

async function llamarBucket(ruta, opciones = {}) {
  const { base, cabeceras } = configBucket();
  let respuesta;
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      ...opciones,
      headers: { ...cabeceras, ...opciones.headers },
      signal: AbortSignal.timeout(opciones.timeout || 30000),
    });
  } catch (err) {
    if (err.name === "TimeoutError") throw new ErrorAlmacenamiento("El servicio de almacenamiento no respondió a tiempo.", 504);
    throw new ErrorAlmacenamiento("No se pudo conectar con el servicio de almacenamiento.", 502);
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    const mensaje = cuerpo.error || cuerpo.message || "El servicio de almacenamiento rechazó la solicitud.";
    throw new ErrorAlmacenamiento(mensaje, respuesta.status === 404 ? 404 : respuesta.status >= 500 ? 502 : 400);
  }
  return respuesta;
}

// ---------- API usada por el resto del backend ----------

/**
 * Guarda un archivo ya validado. Devuelve la URL que se guarda en BD.
 * @param {Buffer} buffer
 * @param {{ carpeta: string, nombre: string, tipo: string }} datos  carpeta/nombre solo aplican en local
 */
export async function guardarArchivo(buffer, { carpeta, nombre, tipo }) {
  if (driver() === "bucket") {
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: tipo }), nombre);
    const respuesta = await llamarBucket("/", { method: "POST", body: form, timeout: 120000 });
    const llave = (await respuesta.json())?.data?.key;
    if (!llaveValida(llave)) throw new ErrorAlmacenamiento("El servicio de almacenamiento devolvió una llave inesperada.");
    return `${PREFIJO_BUCKET}${llave}`;
  }

  const dir = path.join(DIR_UPLOADS, carpeta);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, nombre), buffer);
  return `/uploads/${carpeta}/${nombre}`;
}

// Borra un archivo propio (local o del bucket). Ignora URLs externas o del sitio.
// Nunca lanza: un archivo que no se pudo borrar no debe impedir guardar el registro.
export async function borrarArchivo(url) {
  if (!url) return;
  try {
    if (url.startsWith(PREFIJO_BUCKET)) {
      const llave = url.slice(PREFIJO_BUCKET.length);
      if (llaveValida(llave)) await llamarBucket(`/${llave}`, { method: "DELETE" });
    } else if (url.startsWith("/uploads/")) {
      const ruta = path.resolve(DIR_UPLOADS, url.slice("/uploads/".length));
      if (ruta.startsWith(DIR_UPLOADS + path.sep)) await fs.unlink(ruta);
    }
  } catch (err) {
    if (err.code !== "ENOENT" && err.status !== 404) console.error("ERROR borrando archivo:", url, err.message);
  }
}

// Stream de un archivo del bucket (para el proxy /api/archivos/:key)
export async function leerDelBucket(llave) {
  if (!llaveValida(llave)) throw new ErrorAlmacenamiento("Llave de archivo inválida.", 400);
  const respuesta = await llamarBucket(`/${llave}/view`);
  return {
    stream: Readable.fromWeb(respuesta.body),
    tipo: respuesta.headers.get("content-type") || "application/octet-stream",
    largo: respuesta.headers.get("content-length"),
  };
}

export async function estadoAlmacenamiento() {
  if (driver() !== "bucket") return { driver: "local", ok: true };
  try {
    await llamarBucket("/health", { timeout: 5000 });
    return { driver: "bucket", ok: true };
  } catch (err) {
    return { driver: "bucket", ok: false, error: err.message };
  }
}
