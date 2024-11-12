import { RecommendationUtils } from "./recommendation_utils.js";
import { Request, Response } from "express";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import redisClient from "../database/redis.js";
import jwt from "jsonwebtoken";

export class RecommendationsServices extends RecommendationUtils {
  public recommendations = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.token;

    try {
      const tokenDecode = jwt.decode(token);
      const userId: string = (tokenDecode as { userId: string }).userId;

      const [redisUser, userFavoritesAnimeData] = await Promise.all([
        redisClient.get(userId),

        UserFavoriteModel.findAll({
          where: { userId },
          include: [{ model: AnimeModel, required: true }],
          attributes: [],
        }),
      ]);

      const userFavoritesAnimeId: number[] = [];
      const genresUserFavoriteAnime: string[] = [];
      const synopsisFavoriteAnime: string[] = [];

      const userFavoritesAnime = userFavoritesAnimeData.map((anime) => {
        const animeModel = anime.animeModel;

        genresUserFavoriteAnime.push(...animeModel.genres);
        userFavoritesAnimeId.push(animeModel.id);
        synopsisFavoriteAnime.push(animeModel.synopsis);

        return animeModel;
      });

      if (redisUser != null) {
        const userFavoritesAnimeIdInRedis = JSON.parse(redisUser).userFavoritesAnimeId;
        if (
          userFavoritesAnimeId.length == userFavoritesAnimeIdInRedis.length &&
          userFavoritesAnimeId.every((value, index) => value === userFavoritesAnimeIdInRedis[index])
        ) {
          res.status(200).json({
            message: JSON.parse(redisUser).recommendedAnime,
          });

          return;
        }
      }

      const { lowerBound: lowerBoundEpisodes, upperBound: upperBoundEpisodes } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.episodes));

      const { lowerBound: lowerBoundAirDate, upperBound: upperBoundAirDate } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.aired));

      const userGenresVector = this.createGenresVector(genresUserFavoriteAnime, this.allGenres);

      const recommendedAnime = await AnimeModel.findAll({
        where: {
          id: {
            [Op.notIn]: userFavoritesAnimeId,
          },
          episodes: {
            [Op.between]: [lowerBoundEpisodes, upperBoundEpisodes],
          },
          aired: {
            [Op.between]: [lowerBoundAirDate, upperBoundAirDate],
          },
        },
      }).then((animeList) => {
        return animeList
          .map((anime) => {
            const animeGenresVector = this.createGenresVector(anime.genres, this.allGenres);
            const genresSimilarity = this.cosineSimilarity(userGenresVector, animeGenresVector);

            let similaritySynopsis = 0;

            synopsisFavoriteAnime.forEach((synopsis) => {
              const dictionary = this.createDictionary([synopsis, anime.synopsis]);

              const vector1 = this.createTextVector(synopsis, dictionary);
              const vector2 = this.createTextVector(anime.synopsis, dictionary);

              const similarity = this.cosineSimilarity(vector1, vector2);

              similaritySynopsis += similarity;
            });

            const averageSimilarity = similaritySynopsis / synopsisFavoriteAnime.length;
            const similarity = genresSimilarity + averageSimilarity;
            return { anime, similarity };
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 20)
          .map((anime) => anime.anime);
      });

      const ttl = 7 * 24 * 60 * 60;
      await redisClient.setEx(
        userId,
        ttl,
        JSON.stringify({
          userFavoritesAnimeId: userFavoritesAnimeId,
          recommendedAnime: recommendedAnime,
        })
      );

      res.status(200).json({
        message: recommendedAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };
}
