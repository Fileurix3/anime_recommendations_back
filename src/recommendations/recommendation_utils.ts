export class RecommendationUtils {
  protected preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""));
  }

  protected createDictionary(texts: string[]): string[] {
    return Array.from(new Set(texts.flatMap((text) => this.preprocessText(text))));
  }

  protected createTextVector(text: string, dictionary: string[]) {
    const wordCounts = new Map(dictionary.map((word) => [word, 0]));

    this.preprocessText(text).forEach((word) => {
      return wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    return Array.from(wordCounts.values());
  }

  protected createGenresVector(genres: string[], allGenres: string[]): number[] {
    return allGenres.map((genre) => (genres.includes(genre) ? 1 : 0));
  }

  protected cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, index) => acc + val * vec2[index], 0);
    const magnitudeVec1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const magnitudeVec2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

    if (magnitudeVec1 == 0 || magnitudeVec2 == 0) return 0;

    return dotProduct / (magnitudeVec1 * magnitudeVec2);
  }

  protected getLowerAndUpperBound(arr: number[]) {
    const standardDeviation = this.standardDeviation(arr);

    const average = arr.reduce((acc, val) => acc + val, 0) / arr.length;

    const calculateLowerBound = Math.round(average - standardDeviation);
    const upperBound = Math.round(average + standardDeviation);

    const lowerBound = calculateLowerBound <= 0 ? 1 : calculateLowerBound;

    return { lowerBound, upperBound };
  }

  protected standardDeviation(arr: number[]): number {
    const n = arr.length;
    if (n == 0) return 0;

    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const standardDeviation = Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0));

    return standardDeviation;
  }
}
