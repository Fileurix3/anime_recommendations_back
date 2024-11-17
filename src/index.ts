import { Response } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import redisClient from "./database/redis.js";
import sequelize from "./database/db.js";
import authRouter from "./auth/auth_router.js";
import userRouter from "./user/user_router.js";
import animeRouter from "./anime/anime_router.js";
import recommendationsRouter from "./recommendations/recommendations_router.js";
import "dotenv/config";

const app = express();

redisClient
  .connect()
  .then(() => console.log("Connected to Redis was successful"))
  .catch((err) => console.log("Redis error: " + err));

sequelize
  .authenticate()
  .then(() => console.log("Connection to database was successful"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/anime", animeRouter);
app.use("/recommendations", recommendationsRouter);

export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function handlerError(err: unknown, res: Response): Response {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  } else {
    return res.status(500).json({
      message: (err as Error).message || "Unknown error",
    });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server was running on port: ${PORT}`));

export default app;
