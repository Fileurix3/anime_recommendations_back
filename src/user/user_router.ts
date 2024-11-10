import { Router } from "express";
import { UserServices } from "./user_services.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();
const userServices = new UserServices();

router.post("/change/anime/favorites", authMiddleware, userServices.addOrDeleteFavoriteAnime);
router.get("/profile/:userName", userServices.getUserProfilerByName);

export default router;
