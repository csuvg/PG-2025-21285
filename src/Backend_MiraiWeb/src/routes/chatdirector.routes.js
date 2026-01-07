import { Router } from "express";
import { startGraphChatDirector, chatWithGraphDirector } from "../controllers/chatdirector.controller.js";

const router = Router();

router.post("/start-graph-chat", startGraphChatDirector);
router.post("/chat-with-graph", chatWithGraphDirector);

export default router;