import { Router } from "express";
import { AnimeServices } from "./anime_services.js";

const router = Router();
const animeServices = new AnimeServices();

router.get("/search/:searchParams", animeServices.searchAnime);
router.get("/get/:animeId", animeServices.getAnimeById);

export default router;
