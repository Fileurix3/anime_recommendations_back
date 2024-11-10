import { Router } from "express";
import { RecommendationsServices } from "./recommendations_services.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();
const recommendationsServices = new RecommendationsServices();

router.get("/anime", authMiddleware, recommendationsServices.recommendations);

export default router;
