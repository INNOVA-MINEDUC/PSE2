import express from "express";
import {
  listarNoticias, crearNoticia, actualizarNoticia, eliminarNoticia,
  listarRecursos, guardarRecurso, archivoSubido,
} from "../controllers/admin.controller.js";
import { listar, crear, actualizar, eliminar, guardarConfiguracion } from "../controllers/crud.controller.js";
import { descargarPlantilla, importar } from "../controllers/importar.controller.js";
import {
  listarUsuarios, crearUsuario, actualizarUsuario, restablecerClave, eliminarUsuario,
} from "../controllers/usuarios.controller.js";
import { requireAuth, mismoOrigen } from "../middleware/auth.middleware.js";
import { adminLimiter } from "../middleware/rateLimiter.middleware.js";
import { subirImagen, subirPdf, subirAudio, recibirHoja } from "../middleware/upload.middleware.js";

const router = express.Router();

// Todo lo de /api/admin exige sesión
router.use(adminLimiter, mismoOrigen, requireAuth);

router.get("/noticias", listarNoticias);
router.post("/noticias", crearNoticia);
router.put("/noticias/:id", actualizarNoticia);
router.delete("/noticias/:id", eliminarNoticia);

router.get("/recursos", listarRecursos);
router.put("/recursos/:modulo/:clave", guardarRecurso);

// CRUD genérico de las colecciones definidas en colecciones.js
router.get("/c/:coleccion", listar);
router.get("/c/:coleccion/plantilla", descargarPlantilla);
router.post("/c/:coleccion/importar", recibirHoja, importar);
router.post("/c/:coleccion", crear);
router.put("/c/:coleccion/:id", actualizar);
router.delete("/c/:coleccion/:id", eliminar);

router.put("/configuracion", guardarConfiguracion);

router.get("/usuarios", listarUsuarios);
router.post("/usuarios", crearUsuario);
router.put("/usuarios/:id", actualizarUsuario);
router.put("/usuarios/:id/clave", restablecerClave);
router.delete("/usuarios/:id", eliminarUsuario);

router.post("/uploads/imagen", subirImagen, archivoSubido);
router.post("/uploads/pdf", subirPdf, archivoSubido);
router.post("/uploads/audio", subirAudio, archivoSubido);

export default router;
