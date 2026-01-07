import { Router } from "express";
import { 
  analyzeCareer, 
  generateAcademicContent, 
  suggestCurriculumImprovements 
} from "../controllers/infovocacional.controller.js";

const router = Router();

// POST /api/managers/analyze-career - Analizar carrera y generar recomendaciones
router.post("/analyze-career", analyzeCareer);

// POST /api/managers/generate-content - Generar contenido académico
router.post("/generate-content", generateAcademicContent);

// POST /api/managers/improve-curriculum - Sugerir mejoras al plan de estudios
router.post("/improve-curriculum", suggestCurriculumImprovements);

export default router;