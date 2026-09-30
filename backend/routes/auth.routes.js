import express from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { cambiarMiClave } from "../controllers/usuarios.controller.js";
import { requireAuth, mismoOrigen } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.use(mismoOrigen);
router.post("/login", loginLimiter, login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.put("/clave", requireAuth, cambiarMiClave);

export default router;
