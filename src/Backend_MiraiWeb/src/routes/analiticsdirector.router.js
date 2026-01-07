import { Router } from 'express';
import { analyzeGraphWithAIDirector } from '../controllers/analitictsdirector.controller.js';

const router = Router();

router.post('/analyze-graph', analyzeGraphWithAIDirector);

export default router;