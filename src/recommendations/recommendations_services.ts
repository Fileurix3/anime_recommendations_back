import { RecommendationUtils } from "./recommendation_utils.js";
import { Request, Response } from "express";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import jwt from "jsonwebtoken";

export class RecommendationsServices extends RecommendationUtils {
  private allGenres: string[] = [
    "Supernatural",
    "Drama",
    "Sci-Fi",
    "Suspense",
    "Avant Garde",
    "Mystery",
    "Adventure",
    "Romance",
    "Comedy",
    "Hentai",
    "UNKNOWN",
    "Action",
    "Award Winning",
    "Fantasy",
    "Girls Love",
    "Slice of Life",
    "Sports",
    "Ecchi",
    "Horror",
    "Gourmet",
    "Erotica",
  ];

  public recommendations = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.token;

    try {
      const tokenDecode = jwt.decode(token);
      const userId: string = (tokenDecode as { userId: string }).userId;

      const excludeWhenRecommending: number[] = [];
      const genresUserFavoriteAnime: string[] = [];

      const userFavoritesAnime = (
        await UserFavoriteModel.findAll({
          where: {
            userId: userId,
          },
          include: [
            {
              model: AnimeModel,
              required: true,
            },
          ],
          attributes: [],
        })
      ).map((anime) => {
        genresUserFavoriteAnime.push(...anime.animeModel.genres);
        excludeWhenRecommending.push(anime.animeModel.id);

        return anime.animeModel;
      });

      const { lowerBound: lowerBoundEpisodes, upperBound: upperBoundEpisodes } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.episodes));

      const { lowerBound: lowerBoundAirDate, upperBound: upperBoundAirDate } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.aired));

      const userGenresVector = this.createGenresVector(genresUserFavoriteAnime, this.allGenres);

      const synopsisFavoriteAnime = userFavoritesAnime.map((anime) => anime.synopsis);

      console.log(lowerBoundEpisodes);

      const recommendedAnime = await AnimeModel.findAll({
        where: {
          id: {
            [Op.notIn]: excludeWhenRecommending,
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

      res.status(200).json({
        message: recommendedAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };
}
