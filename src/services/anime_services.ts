import { Request, Response } from "express";
import { CustomError, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";

export class AnimeServices {
  public async searchAnime(req: Request, res: Response): Promise<void> {
    const searchParams = req.params.searchParams;

    try {
      if (searchParams.trim().length < 5) {
        throw new CustomError("Search requires more than 5 characters", 400);
      }

      const resultSearch = await AnimeModel.findAll({
        where: {
          [Op.or]: [
            {
              title: {
                [Op.iLike]: `%${searchParams}%`,
              },
            },
            {
              titleEng: {
                [Op.iLike]: `%${searchParams}%`,
              },
            },
          ],
        },
      });

      if (resultSearch.length == 0) {
        throw new CustomError("Nothing found", 404);
      }

      res.status(200).json({
        result: resultSearch,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async getAnimeById(req: Request, res: Response): Promise<void> {
    const animeId = req.params.animeId;

    try {
      const anime = await AnimeModel.findOne({
        where: {
          id: animeId,
        },
      });

      if (anime == null) {
        throw new CustomError("Anime not found", 404);
      }

      res.status(200).json({
        anime: anime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }
}
