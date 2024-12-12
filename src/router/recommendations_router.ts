import { Router } from "express";
import { RecommendationsServices } from "../services/recommendations_services.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();
const recommendationsServices = new RecommendationsServices();

router.get("/anime", authMiddleware, recommendationsServices.recommendations);

export default router;
