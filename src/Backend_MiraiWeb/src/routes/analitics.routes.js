import { Router } from "express";
import { analyzeGraphWithAI } from "../controllers/analiticts.controller.js";

const router = Router();

// Endpoint para análisis con IA de gráficas
router.post("/analyze-graph", analyzeGraphWithAI);

export default router;