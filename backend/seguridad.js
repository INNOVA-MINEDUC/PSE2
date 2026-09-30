import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const LARGO_CLAVE = 64;

export async function hashClave(clave) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(clave, salt, LARGO_CLAVE);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verificarClave(clave, guardado) {
  const [saltHex, hashHex] = String(guardado || "").split(":");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const hash = await scrypt(clave, Buffer.from(saltHex, "hex"), esperado.length);
  return crypto.timingSafeEqual(hash, esperado);
}

// Hash con el que se compara cuando el correo no existe, para que la respuesta
// tarde lo mismo y no revele qué correos están registrados.
export const HASH_FALSO = await hashClave(crypto.randomBytes(16).toString("hex"));

export const nuevoToken = () => crypto.randomBytes(32).toString("base64url");
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const CLAVE_MINIMA = 10;
