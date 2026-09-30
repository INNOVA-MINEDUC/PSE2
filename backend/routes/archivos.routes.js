import express from "express";
import rateLimit from "express-rate-limit";
import { leerDelBucket, llaveValida, ErrorAlmacenamiento } from "../storage.js";

const router = express.Router();

// Las páginas cargan varias imágenes: límite más amplio que el de la API
const archivosLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000, standardHeaders: true, legacyHeaders: false });

// Solo se sirven tipos que el portal usa. Cualquier otro se fuerza a descarga
// para que un archivo con HTML/JS nunca se ejecute en el dominio del portal.
const TIPOS_EN_LINEA = /^(image\/(webp|png|jpe?g|gif)|application\/pdf|audio\/(mpeg|wav|x-wav|ogg))$/i;

// GET /api/archivos/:key — proxy de lectura del bucketService
router.get("/:key", archivosLimiter, async (req, res) => {
  const { key } = req.params;
  if (!llaveValida(key)) return res.status(400).json({ error: "Llave de archivo inválida." });

  try {
    const { stream, tipo, largo } = await leerDelBucket(key);
    const tipoLimpio = tipo.split(";")[0].trim();
    const enLinea = TIPOS_EN_LINEA.test(tipoLimpio);

    res.setHeader("Content-Type", enLinea ? tipoLimpio : "application/octet-stream");
    res.setHeader("Content-Disposition", `${enLinea ? "inline" : "attachment"}; filename="${key}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // La llave es un UUID nuevo por archivo: el contenido nunca cambia
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (largo) res.setHeader("Content-Length", largo);

    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch (err) {
    const status = err instanceof ErrorAlmacenamiento ? err.status : 500;
    if (status >= 500) console.error("ERROR proxy archivo:", key, err.message);
    res.status(status).json({ error: status === 404 ? "Archivo no encontrado." : "No se pudo obtener el archivo." });
  }
});

export default router;
