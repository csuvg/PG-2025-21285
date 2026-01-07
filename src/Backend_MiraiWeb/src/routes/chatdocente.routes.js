import { Router } from 'express';
import { 
  getAvailableGraphsDocente, 
  startGraphChatDocente, 
  chatWithGraphDocente 
} from '../controllers/chatdocente.controller.js';

const router = Router();

// Obtener lista de gráficas disponibles
router.get('/graphs', getAvailableGraphsDocente);

// Iniciar chat con una gráfica específica
router.post('/start', startGraphChatDocente);

// Enviar mensaje en el chat
router.post('/message', chatWithGraphDocente);

export default router;