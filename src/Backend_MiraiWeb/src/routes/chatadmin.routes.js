import { Router } from 'express';
import { 
  getAvailableGraphs, 
  startGraphChat, 
  chatWithGraph 
} from '../controllers/chatadmin.controller.js';

const router = Router();

// Obtener lista de gráficas disponibles
router.get('/graphs', getAvailableGraphs);

// Iniciar chat con una gráfica específica
router.post('/start', startGraphChat);

// Enviar mensaje en el chat
router.post('/message', chatWithGraph);

export default router;