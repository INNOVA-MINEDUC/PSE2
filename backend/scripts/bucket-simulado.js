// SOLO DESARROLLO: imita la API de bucketService para probar STORAGE_DRIVER=bucket sin el servicio real.
//
//   BUCKET_API_KEY=clave-local node scripts/bucket-simulado.js   (puerto 4100, o BUCKET_PORT)
//   backend/.env: STORAGE_DRIVER=bucket  STORAGE_SERVICE_URL=http://127.0.0.1:4100  STORAGE_API_KEY=clave-local
//
// Endpoints: POST / (multipart "file") · GET /:key/view · DELETE /:key · GET /health
// Los archivos se guardan en backend/.bucket-simulado/ (ignorado por git).
import http from "http";
import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";
import { Readable } from "stream";
import { fileURLToPath } from "url";

const PORT = Number(process.env.BUCKET_PORT) || 4100;
const API_KEY = process.env.BUCKET_API_KEY || "clave-local";
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".bucket-simulado");
const PATRON = /^[0-9a-f-]{36}\.[a-z0-9]{1,10}$/i;

await fs.mkdir(DIR, { recursive: true });

const json = (res, status, datos) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(datos));
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const partes = url.pathname.split("/").filter(Boolean);

  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { status: "ok" });
  if (req.headers["x-api-key"] !== API_KEY) return json(res, 401, { error: "API key inválida" });

  try {
    if (req.method === "POST" && partes.length === 0) {
      const peticion = new Request("http://x/", { method: "POST", headers: req.headers, body: Readable.toWeb(req), duplex: "half" });
      const archivo = (await peticion.formData()).get("file");
      if (!archivo) return json(res, 400, { error: "Falta el campo file" });
      const ext = (path.extname(archivo.name) || ".bin").toLowerCase();
      const key = `${crypto.randomUUID()}${ext}`;
      const buffer = Buffer.from(await archivo.arrayBuffer());
      await fs.writeFile(path.join(DIR, key), buffer);
      await fs.writeFile(path.join(DIR, `${key}.tipo`), archivo.type || "application/octet-stream");
      return json(res, 201, { data: { key, size: buffer.length, mimeType: archivo.type } });
    }

    const key = partes[0];
    if (!PATRON.test(key || "")) return json(res, 400, { error: "Key inválida" });

    if (req.method === "GET" && partes[1] === "view") {
      const [buffer, tipo] = await Promise.all([fs.readFile(path.join(DIR, key)), fs.readFile(path.join(DIR, `${key}.tipo`), "utf8")]);
      res.writeHead(200, { "Content-Type": tipo, "Content-Length": buffer.length });
      return res.end(buffer);
    }

    if (req.method === "DELETE" && partes.length === 1) {
      await fs.unlink(path.join(DIR, key));
      await fs.unlink(path.join(DIR, `${key}.tipo`)).catch(() => {});
      return json(res, 200, { success: true });
    }

    json(res, 404, { error: "Ruta no encontrada" });
  } catch (err) {
    json(res, err.code === "ENOENT" ? 404 : 500, { error: err.code === "ENOENT" ? "Archivo no encontrado" : err.message });
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Bucket simulado en http://127.0.0.1:${PORT}`));
