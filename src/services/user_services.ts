import { Request, Response } from "express";
import { CustomError, decodeJwt, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { UsersModel } from "../models/users_model.js";
import bcrypt from "bcrypt";

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

  public async getYourProfile(req: Request, res: Response): Promise<void> {
    const userToken = req.cookies.token;

    try {
      const userId: string = decodeJwt(userToken).userId;

      const user: UsersModel | null = await UsersModel.findOne({
        where: {
          id: userId,
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

  public async updateUserProfile(req: Request, res: Response): Promise<void> {
    const userToken = req.cookies.token;

    const { newAvatarUrl, newName } = req.body;

    try {
      const userId: string = decodeJwt(userToken).userId;

      const updateFields: Record<string, any> = {};

      if (newName) {
        const existingName: UsersModel | null = await UsersModel.findOne({
          where: {
            name: newName,
          },
        });

        if (existingName != null) {
          throw new CustomError("This name already exists", 400);
        }

        updateFields.name = newName;
      }

      if (newAvatarUrl) updateFields.avatar = newAvatarUrl;

      const updateProfile = await UsersModel.update(updateFields, { where: { id: userId } });

      res.status(200).json({
        message: "User profile was successfully update",
        updateProfile,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    const userToken = req.cookies.token;
    const { oldPassword, newPassword } = req.body;

    try {
      if (!oldPassword || !newPassword) {
        throw new CustomError("Old and new passwords are required", 400);
      } else if (oldPassword.trim() == newPassword.trim()) {
        throw new CustomError("The old password must not match the new one password", 400);
      }

      if (newPassword.trim().length < 6) {
        throw new CustomError("Password must be at least 6 characters long", 400);
      }

      const userId = decodeJwt(userToken).userId;

      const user: UsersModel | null = await UsersModel.findOne({
        where: {
          id: userId,
        },
      });

      if (user == null) {
        throw new CustomError("User not found", 404);
      }

      const isCorrectPassword: boolean = await bcrypt.compare(oldPassword, user.password);

      if (!isCorrectPassword) {
        throw new CustomError("The old password is incorrect", 400);
      }

      const hashPassword = await bcrypt.hash(newPassword, 10);

      await UsersModel.update({ password: hashPassword }, { where: { id: userId } });

      res.status(200).json({
        message: "Password was successfully update",
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }
}
