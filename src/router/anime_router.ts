import { Router } from "express";
import { AnimeServices } from "../services/anime_services.js";
import { authMiddleware } from "../middleware/auth_middleware.js";
import { isAdminRightsMiddleware } from "../middleware/is_admin_rights_middleware.js";

const router = Router();
const animeServices = new AnimeServices();

router.get("/search/:searchParams", animeServices.searchAnime);
router.get("/get/:animeId", animeServices.getAnimeById);

router.post("/add/new", authMiddleware, isAdminRightsMiddleware, animeServices.addNewAnime);
router.put("/edit/:animeId", authMiddleware, isAdminRightsMiddleware, animeServices.editAnime);
router.delete(
  "/delete/:animeId",
  authMiddleware,
  isAdminRightsMiddleware,
  animeServices.deleteAnime
);

export default router;
