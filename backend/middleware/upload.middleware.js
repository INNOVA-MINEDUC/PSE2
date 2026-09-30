import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import { guardarArchivo, borrarArchivo, ErrorAlmacenamiento } from "../storage.js";

// Compatibilidad con los controladores que ya lo importan de aquí
export const borrarSubido = borrarArchivo;

const nombreSeguro = (original, extension) => {
  const base = path.basename(original, path.extname(original))
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "archivo";
  return `${base}-${crypto.randomBytes(4).toString("hex")}${extension}`;
};

const recibir = (limiteMb) =>
  multer({ storage: multer.memoryStorage(), limits: { fileSize: limiteMb * 1024 * 1024, files: 1 } }).single("archivo");

// Guarda el archivo validado (disco o bucket, según STORAGE_DRIVER) y deja la URL en req.archivoUrl
async function guardar(req, res, next, buffer, { carpeta, extension, tipo }) {
  try {
    req.archivoUrl = await guardarArchivo(buffer, { carpeta, nombre: nombreSeguro(req.file.originalname, extension), tipo });
    next();
  } catch (err) {
    console.error("ERROR guardando archivo:", err.message);
    const status = err instanceof ErrorAlmacenamiento ? err.status : 500;
    res.status(status).json({ error: "No se pudo guardar el archivo. Intente de nuevo." });
  }
}

// Imagen -> WebP (máx. 1600px de ancho). sharp falla con cualquier archivo que no sea una imagen real.
export const subirImagen = [
  recibir(8),
  async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen." });
    let webp;
    try {
      webp = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return res.status(400).json({ error: "El archivo no es una imagen válida." });
    }
    await guardar(req, res, next, webp, { carpeta: "noticias", extension: ".webp", tipo: "image/webp" });
  },
];

// PDF (se valida la firma %PDF-, no solo la extensión)
export const subirPdf = [
  recibir(20),
  async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });
    if (req.file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ error: "El archivo no es un PDF válido." });
    }
    await guardar(req, res, next, req.file.buffer, { carpeta: "docs", extension: ".pdf", tipo: "application/pdf" });
  },
];

// Audio MP3, WAV u OGG (validado por la firma del archivo)
const FIRMAS_AUDIO = [
  { ext: ".mp3", tipo: "audio/mpeg", ok: (b) => b.subarray(0, 3).toString("latin1") === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  { ext: ".wav", tipo: "audio/wav", ok: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WAVE" },
  { ext: ".ogg", tipo: "audio/ogg", ok: (b) => b.subarray(0, 4).toString("latin1") === "OggS" },
];

export const subirAudio = [
  recibir(40),
  async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });
    const firma = FIRMAS_AUDIO.find((f) => f.ok(req.file.buffer));
    if (!firma) return res.status(400).json({ error: "El archivo no es un audio MP3, WAV u OGG válido." });
    await guardar(req, res, next, req.file.buffer, { carpeta: "audio", extension: firma.ext, tipo: firma.tipo });
  },
];

// Hoja de cálculo para carga masiva: queda en memoria (req.file.buffer), no se guarda
export const recibirHoja = recibir(5);
