import express from "express";
import { getResumen } from "../controllers/pse.controller.js";
import { publicLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.get("/", publicLimiter, getResumen);

export default router;
