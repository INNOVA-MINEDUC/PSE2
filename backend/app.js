import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db.js";
import pseRoutes from "./routes/pse.routes.js";
import noticiasRoutes from "./routes/noticias.routes.js";
import recursosRoutes from "./routes/recursos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import contenidoRoutes from "./routes/contenido.routes.js";
import archivosRoutes from "./routes/archivos.routes.js";
import { estadoAlmacenamiento, driver } from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// Detrás de nginx: la IP real llega en X-Forwarded-For (necesario para el rate limit)
app.set("trust proxy", 1);
app.disable("x-powered-by");

// En producción el frontend y la API comparten dominio (nginx hace de proxy),
// así que CORS solo hace falta si se define CORS_ORIGINS.
const origins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
if (origins.length) app.use(cors({ origin: origins, credentials: true }));

app.use(express.json({ limit: "1mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "30d" }));

app.get("/api/health", async (req, res) => {
  const almacenamiento = await estadoAlmacenamiento();
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", almacenamiento });
  } catch {
    res.status(503).json({ status: "db-error", almacenamiento });
  }
});

app.use("/api/pse", pseRoutes);
app.use("/api/noticias", noticiasRoutes);
app.use("/api/recursos", recursosRoutes);
app.use("/api/archivos", archivosRoutes);
app.use("/api", contenidoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Errores no controlados (p. ej. archivo demasiado grande en multer)
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "El archivo es demasiado grande." });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON no válido." });
  console.error("ERROR no controlado:", err);
  res.status(500).json({ error: "Error interno." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API PSE en http://localhost:${PORT} (almacenamiento: ${driver()})`);
});
