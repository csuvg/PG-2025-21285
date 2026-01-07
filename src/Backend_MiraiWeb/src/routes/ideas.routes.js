import { Router } from "express";
import { generateIdeas } from "../controllers/ideas.controller.js";

const router = Router();

// POST /api/ideas
router.post("/", generateIdeas);

export default router;
