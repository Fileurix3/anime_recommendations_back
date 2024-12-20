import { Request, Response } from "express";
import { CustomError, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import axios from "axios";
import minioClient from "../database/minio.js";
import "dotenv/config";

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

  public async addNewAnime(req: Request, res: Response): Promise<void> {
    const { imageUrl, title, titleEng, synopsis, episodes, aired, rating, genres } = req.body;

    try {
      if (
        !imageUrl ||
        !title ||
        !titleEng ||
        !synopsis ||
        !episodes ||
        !aired ||
        !rating ||
        !genres
      ) {
        throw new CustomError("You must fill in all the fields", 400);
      } else if (!Array.isArray(genres)) {
        throw new CustomError("Genres should be an array", 400);
      }

      const instalImage = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "stream",
      });

      if (instalImage.status != 200) {
        throw new CustomError("Failed to install image, check imageUrl", 400);
      }

      const imageName: string = `${title
        .replace(/[^a-zA-Z0-9\-\_\.\,]/g, " ")
        .replace(/\s+/g, "-")}.png`;

      await minioClient
        .putObject("images", imageName, instalImage.data, undefined, {
          "Content-Type": "image/png",
        })
        .catch((err) => {
          throw new CustomError("Failed to upload image", 500);
        });

      const minioImageUrl = `${process.env.MINIO_END_POINT}:${process.env.MINIO_PORT}/images/${imageName}`;

      const newAnime: AnimeModel = await AnimeModel.create({
        imageUrl: minioImageUrl,
        title: title,
        titleEng: titleEng,
        synopsis: synopsis,
        episodes: episodes,
        aired: aired,
        rating: rating,
        genres: genres,
      });

      res.status(201).json({
        message: "New anime successfully added",
        anime: newAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async editAnime(req: Request, res: Response): Promise<void> {
    const animeId = req.params.animeId;
    const {
      newImageUrl,
      newTitle,
      newTitleEng,
      newSynopsis,
      newEpisodes,
      newAired,
      newRating,
      newGenres,
    } = req.body;

    try {
      const anime: AnimeModel | null = await AnimeModel.findOne({
        where: {
          id: animeId,
        },
      });

      if (anime == null) {
        throw new CustomError("Anime not found", 404);
      }

      if (newImageUrl) {
        const nameInMinio: string = anime.imageUrl.split("/").pop()!;

        const instalImage = await axios({
          url: newImageUrl,
          method: "GET",
          responseType: "stream",
        });

        if (instalImage.status != 200) {
          throw new CustomError("Failed to install image, check imageUrl", 400);
        }

        await minioClient
          .putObject("images", nameInMinio, instalImage.data, undefined, {
            "Content-Type": "image/png",
          })
          .catch((err) => {
            throw new CustomError("Failed to upload image", 500);
          });
      }

      const fieldsToUpdate: Record<string, any> = {};

      if (newTitle != null) fieldsToUpdate.title = newTitle;
      if (newTitleEng != null) fieldsToUpdate.titleEng = newTitleEng;
      if (newSynopsis != null) fieldsToUpdate.synopsis = newSynopsis;
      if (newEpisodes != null) fieldsToUpdate.episodes = newEpisodes;
      if (newAired != null) fieldsToUpdate.aired = newAired;
      if (newRating != null) fieldsToUpdate.rating = newRating;
      if (newGenres != null) fieldsToUpdate.genres = newGenres;

      const updateAnime = await AnimeModel.update(fieldsToUpdate, { where: { id: animeId } });

      res.status(200).json({
        massage: "Anime update successfully",
        anime: updateAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async deleteAnime(req: Request, res: Response): Promise<void> {
    const animeId = req.params.animeId;

    try {
      const anime: AnimeModel | null = await AnimeModel.findOne({
        where: {
          id: animeId,
        },
      });

      if (anime == null) {
        throw new CustomError("Anime not found", 404);
      }

      const nameInMinio: string = anime.imageUrl.split("/").pop()!;

      await minioClient.removeObject("images", nameInMinio).catch((err) => {
        throw new CustomError("Failed to delete the image", 500);
      });

      await AnimeModel.destroy({
        where: {
          id: animeId,
        },
      });

      res.status(200).json({
        message: "Image successfully delete",
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }
}
