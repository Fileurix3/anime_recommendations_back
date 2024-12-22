CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY UNIQUE,
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT NULL,
  "adminRights" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE anime (
  id SERIAL PRiMARY KEY,
  "imageUrl" TEXT NOT NULL,
  title TEXT NOT NULL,
  "titleEng" TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  episodes INTEGER NOT NULL,
  aired INTEGER NOT NULL,
  rating TEXT NOT NULL,
  genres TEXT[] NOT NULL 
);

CREATE TABLE "userFavoritesAnime" (
  "userId" uuid,
  "animeId" INTEGER,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("animeId") REFERENCES anime(id) ON DELETE CASCADE,
  PRIMARY KEY ("userId", "animeId") 
);