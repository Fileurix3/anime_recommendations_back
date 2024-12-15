import { Request, Response } from "express";
import { CustomError, decodeJwt, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { UsersModel } from "../models/users_model.js";

export class UserServices {
  public async addOrDeleteFavoriteAnime(req: Request, res: Response): Promise<void> {
    const userToken = req.cookies.token;
    const { animeId } = req.body;

    try {
      if (!animeId || isNaN(Number(animeId))) {
        throw new CustomError("invalid animeId", 400);
      }

      const anime = await AnimeModel.findOne({
        where: {
          id: animeId,
        },
      });

      if (anime == null) {
        throw new CustomError("anime not found", 404);
      }

      const userId = decodeJwt(userToken).userId;

      const isUserFavoriteAnime = await UserFavoriteModel.findOne({
        where: {
          userId: userId,
          animeId: animeId,
        },
      });

      if (isUserFavoriteAnime == null) {
        await UserFavoriteModel.create({
          userId: userId,
          animeId: animeId,
        });

        res.status(200).json({
          message: "The anime has been successfully added to favorites",
        });
      } else {
        await UserFavoriteModel.destroy({
          where: {
            userId: userId,
            animeId: animeId,
          },
        });

        res.status(200).json({
          message: "The anime has been successfully deleted from favorites",
        });
      }
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async getUserProfilerByName(req: Request, res: Response): Promise<void> {
    const userName = req.params.userName;

    try {
      const user: UsersModel | null = await UsersModel.findOne({
        where: {
          name: userName,
        },
      });

      if (user == null) {
        throw new CustomError("User not found", 404);
      }

      const userFavorites = (
        await UserFavoriteModel.findAll({
          where: {
            userId: user.id,
          },
          include: [
            {
              model: AnimeModel,
              required: true,
            },
          ],
          attributes: [],
        })
      ).map((favorite) => favorite.animeModel);

      res.status(200).json({
        user: user,
        favorites: userFavorites,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }
}
