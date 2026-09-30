import express from "express";
import { getNoticias, getNoticiaById } from "../controllers/noticias.controller.js";
import { publicLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.get("/", publicLimiter, getNoticias);
router.get("/:id", publicLimiter, getNoticiaById);

export default router;
