// Sube al bucket los archivos que hoy están en uploads/ y actualiza sus referencias en la BD.
//
//   npm run migrar-archivos             -> solo muestra qué haría
//   npm run migrar-archivos -- --aplicar -> sube y actualiza
//
// Requiere STORAGE_SERVICE_URL y STORAGE_API_KEY. Los archivos locales no se borran.
import path from "path";
import { promises as fs } from "fs";
import { pool } from "../db.js";
import { COLECCIONES } from "../colecciones.js";
import { guardarArchivo, DIR_UPLOADS, driver } from "../storage.js";

const aplicar = process.argv.includes("--aplicar");

const TIPOS = {
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
};

// Tablas y columnas que guardan archivos subidos
const REFERENCIAS = [
  { tabla: "noticias", pk: "id", columna: "imagen_url" },
  { tabla: "recursos_modulo", pk: ["modulo", "clave"], columna: "url" },
  ...Object.values(COLECCIONES).flatMap((c) =>
    Object.entries(c.campos).filter(([, d]) => d.archivo).map(([columna]) => ({ tabla: c.tabla, pk: c.pk, columna }))
  ),
];

if (driver() !== "bucket") {
  console.error("Configure STORAGE_SERVICE_URL y STORAGE_API_KEY (y STORAGE_DRIVER=bucket) antes de migrar.");
  process.exit(1);
}

const subidos = new Map(); // mismo archivo referenciado varias veces -> se sube una vez
let pendientes = 0;
let faltantes = 0;

for (const { tabla, pk, columna } of REFERENCIAS) {
  const llaves = [pk].flat();
  const [filas] = await pool.query(
    `SELECT ${llaves.map((k) => `\`${k}\``).join(", ")}, \`${columna}\` AS url FROM \`${tabla}\` WHERE \`${columna}\` LIKE '/uploads/%'`
  );

  for (const fila of filas) {
    const ruta = path.resolve(DIR_UPLOADS, fila.url.slice("/uploads/".length));
    const id = llaves.map((k) => fila[k]).join("/");
    if (!ruta.startsWith(DIR_UPLOADS + path.sep)) continue;

    let buffer;
    try {
      buffer = await fs.readFile(ruta);
    } catch {
      console.warn(`  ! ${tabla}.${columna} [${id}]: no existe ${fila.url}`);
      faltantes++;
      continue;
    }

    pendientes++;
    if (!aplicar) {
      console.log(`  - ${tabla}.${columna} [${id}]: ${fila.url}`);
      continue;
    }

    if (!subidos.has(fila.url)) {
      const tipo = TIPOS[path.extname(ruta).toLowerCase()] || "application/octet-stream";
      subidos.set(fila.url, await guardarArchivo(buffer, { nombre: path.basename(ruta), tipo }));
    }
    const nueva = subidos.get(fila.url);
    await pool.query(
      `UPDATE \`${tabla}\` SET \`${columna}\` = ? WHERE ${llaves.map((k) => `\`${k}\` = ?`).join(" AND ")}`,
      [nueva, ...llaves.map((k) => fila[k])]
    );
    console.log(`  ✓ ${tabla}.${columna} [${id}]: ${fila.url} -> ${nueva}`);
  }
}

console.log(
  aplicar
    ? `\nMigrados ${pendientes} registros (${subidos.size} archivos subidos). Faltantes: ${faltantes}.`
    : `\n${pendientes} registros por migrar. Faltantes: ${faltantes}. Ejecute con --aplicar para subirlos.`
);
await pool.end();
