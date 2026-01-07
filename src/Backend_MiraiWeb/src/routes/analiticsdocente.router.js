import { Router } from 'express';
import { 
  analyzeGraphWithAIDocente
} from '../controllers/analitictsdocente.controller.js';

const router = Router();

// Análisis profundo con IA para docentes
router.post('/analyze-graph', analyzeGraphWithAIDocente);

export default router;