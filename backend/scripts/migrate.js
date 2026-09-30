// Aplica en orden los archivos sql/*.sql que aún no se han ejecutado.
// Uso: npm run migrate
import mysql from "mysql2/promise";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sql");

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  multipleStatements: true,
});

try {
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    nombre VARCHAR(255) PRIMARY KEY,
    aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const [hechas] = await conn.query("SELECT nombre FROM schema_migrations");
  const aplicadas = new Set(hechas.map((r) => r.nombre));
  const archivos = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;
    console.log(`Aplicando ${archivo}...`);
    await conn.query(await readFile(path.join(dir, archivo), "utf8"));
    await conn.query("INSERT INTO schema_migrations (nombre) VALUES (?)", [archivo]);
  }
  console.log("Migraciones al día.");
} finally {
  await conn.end();
}
