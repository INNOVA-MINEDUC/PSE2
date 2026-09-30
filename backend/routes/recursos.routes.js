import express from "express";
import { getRecursos } from "../controllers/recursos.controller.js";
import { publicLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.get("/:modulo", publicLimiter, getRecursos);

export default router;
