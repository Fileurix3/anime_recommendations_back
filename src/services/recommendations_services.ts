import { Request, Response } from "express";
import { UserFavoriteModel } from "../models/user_favorite_model.js";
import { CustomError, decodeJwt, handlerError } from "../index.js";
import { AnimeModel } from "../models/anime_model.js";
import { Op } from "@sequelize/core";
import redisClient from "../database/redis.js";

export class RecommendationsServices {
  public recommendations = async (req: Request, res: Response): Promise<void> => {
    const userToken = req.cookies.token;

    try {
      const userId = decodeJwt(userToken).userId;

      const recommendationRedis = await redisClient.get(`${userId}`);

      if (recommendationRedis != null) {
        const ttl = await redisClient.ttl(userId);
        res.status(200).json({
          message: `You will be able to update your recommendations after ${ttl / 3600}h`,
          recommendation: JSON.parse(recommendationRedis),
        });

        return;
      }

      const userFavoritesAnimeList = await UserFavoriteModel.findAll({
        where: { userId },
        include: [{ model: AnimeModel, required: true }],
        attributes: [],
      });

      if (userFavoritesAnimeList.length < 3) {
        throw new CustomError("Add at least 3 anime to your favorites", 400);
      }

      const standardDeviationForEpisodes: [number, number] = this.standardDeviationCalculate(
        userFavoritesAnimeList.map((anime) => {
          return anime.animeModel.episodes;
        })
      );

      const standardDeviationForAired: [number, number] = this.standardDeviationCalculate(
        userFavoritesAnimeList.map((anime) => {
          return anime.animeModel.aired;
        })
      );

      const userGenresVector: number[] = this.createGenresVector(
        userFavoritesAnimeList
          .map((anime) => {
            return anime.animeModel.genres;
          })
          .flat()
      );

      const userSynopsisAnime: string[] = userFavoritesAnimeList.map((anime) => {
        return anime.animeModel.synopsis;
      });

      const recommendationAnimeData = await AnimeModel.findAll({
        where: {
          id: {
            [Op.notIn]: userFavoritesAnimeList.map((anime) => anime.animeModel.id),
          },
          episodes: {
            [Op.between]: standardDeviationForEpisodes,
          },
          aired: {
            [Op.between]: standardDeviationForAired,
          },
        },
      });

      const recommendation = recommendationAnimeData
        .map((anime) => {
          const animeGenresVector = this.createGenresVector(anime.genres);

          const genresSimilarity = this.cosineSimilarity(userGenresVector, animeGenresVector);

          const similaritySynopsis = userSynopsisAnime.reduce((totalSimilarity, synopsis) => {
            const dictionary = this.createDictionary([synopsis, anime.synopsis]);
            const vector1 = this.createTextVector(synopsis, dictionary);
            const vector2 = this.createTextVector(anime.synopsis, dictionary);
            return totalSimilarity + this.cosineSimilarity(vector1, vector2);
          }, 0);

          const totalSimilarity: number =
            genresSimilarity + similaritySynopsis / userFavoritesAnimeList.length;

          return { anime, totalSimilarity };
        })
        .sort((a, b) => b.totalSimilarity - a.totalSimilarity)
        .splice(0, 5);

      await redisClient.setEx(`${userId}`, 24 * 60 * 60, JSON.stringify(recommendation));

      res.status(200).json({
        message: "You will be able to update your recommendations after 24h",
        recommendation,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  };

  private standardDeviationCalculate(arr: number[]): [number, number] {
    const n = arr.length;
    if (n == 0) return [0, 0];

    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const standardDeviation = Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0));

    return [Math.abs(Math.round(standardDeviation - mean)), Math.round(standardDeviation + mean)];
  }

  private createGenresVector(genres: string[]): number[] {
    return this.allGenres.map((genre) => (genres.includes(genre) ? 1 : 0));
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, index) => acc + val * vec2[index], 0);
    const magnitudeVec1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const magnitudeVec2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

    if (magnitudeVec1 == 0 || magnitudeVec2 == 0) return 0;

    return dotProduct / (magnitudeVec1 * magnitudeVec2);
  }

  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => this.stopWords.has(word));
  }

  private createDictionary(texts: string[]): string[] {
    return Array.from(new Set(texts.flatMap((text) => this.preprocessText(text))));
  }

  private createTextVector(text: string, dictionary: string[]) {
    const wordCounts = new Map(dictionary.map((word) => [word, 0]));

    this.preprocessText(text).forEach((word) => {
      if (wordCounts.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCounts.values());
  }

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
    "Action",
    "Award Winning",
    "Fantasy",
    "Slice of Life",
    "Sports",
    "Ecchi",
    "Horror",
    "Gourmet",
  ];

  private stopWords: Set<string> = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
    "they",
    "them",
    "their",
    "theirs",
    "themselves",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "a",
    "an",
    "the",
    "and",
    "but",
    "if",
    "or",
    "because",
    "as",
    "until",
    "while",
    "of",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "to",
    "from",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
  ]);
}
