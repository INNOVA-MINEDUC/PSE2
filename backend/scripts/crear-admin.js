// Crea un usuario administrador o cambia su contraseña.
// Uso: npm run crear-admin -- correo@mineduc.gob.gt "Nombre Apellido"
// La contraseña se pide por consola (o se toma de la variable ADMIN_CLAVE).
import readline from "readline/promises";
import { pool } from "../db.js";
import { hashClave, CLAVE_MINIMA } from "../seguridad.js";

const [correoArg, nombre] = process.argv.slice(2);
const correo = String(correoArg || "").trim().toLowerCase();

if (!correo.includes("@")) {
  console.error('Uso: npm run crear-admin -- correo@dominio "Nombre"');
  process.exit(1);
}

let clave = process.env.ADMIN_CLAVE;
if (!clave) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  clave = await rl.question(`Contraseña para ${correo} (mín. ${CLAVE_MINIMA} caracteres): `);
  rl.close();
}

if (clave.length < CLAVE_MINIMA) {
  console.error(`La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`);
  process.exit(1);
}

const hash = await hashClave(clave);
const [[existente]] = await pool.query("SELECT id FROM usuarios WHERE correo = ?", [correo]);

if (existente) {
  await pool.query("UPDATE usuarios SET clave_hash = ?, activo = 1 WHERE id = ?", [hash, existente.id]);
  // Cierra las sesiones abiertas con la contraseña anterior
  await pool.query("DELETE FROM sesiones WHERE usuario_id = ?", [existente.id]);
  console.log(`Contraseña actualizada para ${correo}.`);
} else {
  await pool.query(
    "INSERT INTO usuarios (correo, nombre, clave_hash) VALUES (?, ?, ?)",
    [correo, nombre || correo, hash]
  );
  console.log(`Administrador ${correo} creado.`);
}

await pool.end();
