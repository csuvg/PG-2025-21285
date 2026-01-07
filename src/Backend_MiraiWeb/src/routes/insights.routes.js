import { Router } from "express";
import { 
  getCompleteCareerInsightsStream
} from "../controllers/insights.controller.js";

const router = Router();

router.get("/completo/:carrera", getCompleteCareerInsightsStream);

export default router;