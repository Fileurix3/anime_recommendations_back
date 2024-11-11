import { Request, Response } from "express";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import jwt from "jsonwebtoken";

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

      const allGenres = [
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

      const { lowerBound: lowerBoundEpisodes, upperBound: upperBoundEpisodes } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.episodes));

      const { lowerBound: lowerBoundAirDate, upperBound: upperBoundAirDate } =
        this.getLowerAndUpperBound(userFavoritesAnime.map((anime) => anime.aired));

      const userGenresVector = this.createGenresVector(genresUserFavoriteAnime, allGenres);

      const synopsisFavoriteAnime = userFavoritesAnime.map((anime) => anime.synopsis);

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
            const animeGenresVector = this.createGenresVector(anime.genres, allGenres);
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
          .slice(0, 10)
          .map((anime) => anime.anime);
      });

      res.status(200).json({
        message: recommendedAnime,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };

  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((word) => word.length > 0);
  }

  private createDictionary(texts: string[]): string[] {
    const dictionary = new Set<string>();

    texts.forEach((text) => {
      this.preprocessText(text).forEach((word) => dictionary.add(word));
    });

    return Array.from(dictionary);
  }

  private createTextVector(text: string, dictionary: string[]) {
    const wordCounts = new Array(dictionary.length).fill(0);
    const words = this.preprocessText(text);

    words.forEach((word) => {
      const index = dictionary.indexOf(word);
      if (index != -1) {
        wordCounts[index]++;
      }
    });

    return wordCounts;
  }

  private createGenresVector(genres: string[], allGenres: string[]): number[] {
    return allGenres.map((genre) => (genres.includes(genre) ? 1 : 0));
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, index) => acc + val * vec2[index], 0);
    const magnitudeVec1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const magnitudeVec2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

    if (magnitudeVec1 == 0 || magnitudeVec2 == 0) return 0;

    return dotProduct / (magnitudeVec1 * magnitudeVec2);
  }

  private getLowerAndUpperBound(arr: number[]) {
    const standardDeviation = this.standardDeviation(arr);

    const average = arr.reduce((acc, val) => acc + val, 0) / arr.length;

    const lowerBound = Math.round(average - standardDeviation);
    const upperBound = Math.round(average + standardDeviation);

    return { lowerBound, upperBound };
  }

  private standardDeviation(arr: number[]): number {
    const n = arr.length;
    if (n == 0) return 0;

    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const standardDeviation = Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0));

    return standardDeviation;
  }
}
