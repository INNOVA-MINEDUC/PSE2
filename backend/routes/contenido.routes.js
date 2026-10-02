import express from "express";
import { listarPublico, leerConfiguracion, leerVisibilidad } from "../controllers/crud.controller.js";
import { publicLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.get("/configuracion", publicLimiter, leerConfiguracion);
router.get("/visibilidad", publicLimiter, leerVisibilidad);
router.get("/contenido/:coleccion", publicLimiter, listarPublico);

export default router;
