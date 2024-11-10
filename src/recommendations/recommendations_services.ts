import { Request, Response } from "express";
import { handlerError } from "../index.js";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import jwt from "jsonwebtoken";
import { Float } from "type-fest";

export class RecommendationsServices {
  public recommendations = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.token;

    try {
      const tokenDecode = jwt.decode(token);
      const userId: string = (tokenDecode as { userId: string }).userId;

      const excludeWhenRecommending: string[] = [];
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

      const { lowerBound, upperBound } = this.getLowerAndUpperBoundEpisodes(
        userFavoritesAnime.map((anime) => anime.episodes)
      );

      const recommendedAnime = await AnimeModel.findAll({
        where: {
          id: {
            [Op.notIn]: excludeWhenRecommending,
          },
          episodes: {
            [Op.between]: [lowerBound, upperBound],
          },
        },
      }).then((animeList) => {
        return animeList
          .map((anime) => {
            const combinedGenres = Array.from(
              new Set([...genresUserFavoriteAnime, ...anime.genres])
            );

            console.log(combinedGenres);
            const userVector = this.createGenresVector(genresUserFavoriteAnime, combinedGenres);
            const animeVector = this.createGenresVector(anime.genres, combinedGenres);

            console.log(userVector);
            console.log(animeVector);

            const similarity = this.cosineSimilarity(userVector, animeVector);
            return { anime, similarity };
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);
      });

      res.status(200).json({
        message: recommendedAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };

  private createGenresVector(genres: string[], allGenres: string[]) {
    return allGenres.map((genre) => (genres.includes(genre) ? 1 : 0));
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, index) => acc + val * vec2[index], 0);
    const magnitudeVec1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const magnitudeVec2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

    return dotProduct / (magnitudeVec1 * magnitudeVec2);
  }

  private getLowerAndUpperBoundEpisodes(episodes: number[]) {
    const n = episodes.length;
    if (n == 0) return { lowerBound: 0, upperBound: 0 };

    const mean = episodes.reduce((acc, val) => acc + val, 0) / n;
    const standardDeviation = Math.sqrt(
      episodes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0)
    );

    const averageEpisodes = episodes.reduce((acc, val) => acc + val, 0) / episodes.length;

    const lowerBound = Math.round(averageEpisodes - standardDeviation);
    const upperBound = Math.round(averageEpisodes + standardDeviation);

    return { lowerBound, upperBound };
  }
}
