import { Router } from "express";
import { UserServices } from "../services/user_services.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();
const userServices = new UserServices();

router.post("/change/anime/favorites", authMiddleware, userServices.addOrDeleteFavoriteAnime);
router.get("/profile/:userName", userServices.getUserProfilerByName);
router.get("/profile", authMiddleware, userServices.getYourProfile);
router.put("/update/profile", authMiddleware, userServices.updateUserProfile);
router.put("/change/password", authMiddleware, userServices.changePassword);

export default router;
