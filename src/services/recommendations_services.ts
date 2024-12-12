import { RecommendationUtils } from "../recommendation utils/recommendation_utils.js";
import { Request, Response } from "express";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { decodeJwt, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import redisClient from "../database/redis.js";

export class RecommendationsServices extends RecommendationUtils {
  public recommendations = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.token;

    try {
      const userId = decodeJwt(token).userId;

      const { redisUser, userFavoritesAnimeData } = await this.getUserFavorites(userId);

      const { userFavoritesAnimeIds, genresUserFavoriteAnime, synopsisFavoriteAnime } =
        this.processUserFavorites(userFavoritesAnimeData);

      if (redisUser && this.isRedisCacheValid(redisUser, userFavoritesAnimeIds)) {
        res.status(200).json({
          message: JSON.parse(redisUser).recommendedAnime,
        });

        return;
      }

      const { lowerBound: lowerBoundEpisodes, lowerBound: upperBoundEpisodes } =
        this.getLowerAndUpperBound(userFavoritesAnimeData.map((anime) => anime.episodes));
      const { lowerBound: lowerBoundAirDate, lowerBound: upperBoundAirDate } =
        this.getLowerAndUpperBound(userFavoritesAnimeData.map((anime) => anime.aired));

      const userGenresVector = this.createGenresVector(genresUserFavoriteAnime, this.allGenres);

      const recommendedAnime = await this.getRecommendedAnime(
        userFavoritesAnimeIds,
        lowerBoundEpisodes,
        upperBoundEpisodes,
        lowerBoundAirDate,
        upperBoundAirDate,
        userGenresVector,
        synopsisFavoriteAnime
      );

      this.cacheRecommendations(userId, userFavoritesAnimeIds, recommendedAnime);

      res.status(200).json({
        message: recommendedAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };

  private processUserFavorites(userFavoritesAnimeData: any[]) {
    const userFavoritesAnimeIds: number[] = [];
    const genresUserFavoriteAnime: string[] = [];
    const synopsisFavoriteAnime: string[] = [];

    userFavoritesAnimeData.forEach((anime) => {
      const animeModel = anime.animeModel;
      genresUserFavoriteAnime.push(...animeModel.genres);
      userFavoritesAnimeIds.push(animeModel.id);
      synopsisFavoriteAnime.push(animeModel.synopsis);
    });

    return { userFavoritesAnimeIds, genresUserFavoriteAnime, synopsisFavoriteAnime };
  }

  private async getUserFavorites(
    userId: string
  ): Promise<{ redisUser: string | null; userFavoritesAnimeData: any[] }> {
    const [redisUser, userFavoritesAnimeData] = await Promise.all([
      redisClient.get(userId),
      UserFavoriteModel.findAll({
        where: { userId },
        include: [{ model: AnimeModel, required: true }],
        attributes: [],
      }),
    ]);

    return { redisUser, userFavoritesAnimeData };
  }

  private isRedisCacheValid(redisUser: string, userFavoritesAnimeIds: number[]) {
    const redisUserData = JSON.parse(redisUser);
    const redisUserFavoritesAnimeId = redisUserData.userFavoritesAnimeId;
    return (
      userFavoritesAnimeIds.length === redisUserFavoritesAnimeId.length &&
      userFavoritesAnimeIds.every((value, index) => value === redisUserFavoritesAnimeId[index])
    );
  }

  private async getRecommendedAnime(
    userFavoritesAnimeIds: number[],
    lowerBoundEpisodes: number,
    upperBoundEpisodes: number,
    lowerBoundAirDate: number,
    upperBoundAirDate: number,
    userGenresVector: number[],
    synopsisFavoriteAnime: string[]
  ) {
    const animeList = await AnimeModel.findAll({
      where: {
        id: {
          [Op.notIn]: userFavoritesAnimeIds,
        },
        episodes: {
          [Op.between]: [lowerBoundEpisodes, upperBoundEpisodes],
        },
        aired: {
          [Op.between]: [lowerBoundAirDate, upperBoundAirDate],
        },
      },
    });

    return animeList
      .map((anime) => {
        const animeGenresVector = this.createGenresVector(anime.genres, this.allGenres);
        const genresSimilarity = this.cosineSimilarity(userGenresVector, animeGenresVector);

        const similaritySynopsis = synopsisFavoriteAnime.reduce((totalSimilarity, synopsis) => {
          const dictionary = this.createDictionary([synopsis, anime.synopsis]);
          const vector1 = this.createTextVector(synopsis, dictionary);
          const vector2 = this.createTextVector(anime.synopsis, dictionary);
          return totalSimilarity + this.cosineSimilarity(vector1, vector2);
        }, 0);

        const averageSimilarity = similaritySynopsis / synopsisFavoriteAnime.length;
        const totalSimilarity = genresSimilarity + averageSimilarity;

        return { anime, totalSimilarity };
      })
      .sort((a, b) => b.totalSimilarity - a.totalSimilarity)
      .slice(0, 5)
      .map((item) => item.anime);
  }

  private async cacheRecommendations(
    userId: string,
    userFavoritesAnimeIds: number[],
    recommendedAnime: any[]
  ) {
    const ttl = 7 * 24 * 60 * 60;
    await redisClient.setEx(
      userId,
      ttl,
      JSON.stringify({
        userFavoritesAnimeId: userFavoritesAnimeIds,
        recommendedAnime: recommendedAnime,
      })
    );
  }
}
