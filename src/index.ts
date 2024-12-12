import { Response } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import redisClient from "./database/redis.js";
import sequelize from "./database/db.js";
import authRouter from "./router/auth_router.js";
import userRouter from "./router/user_router.js";
import animeRouter from "./router/anime_router.js";
import recommendationsRouter from "./router/recommendations_router.js";
import jwt from "jsonwebtoken";
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

export function decodeJwt(token: string): Record<string, string> {
  let userId;

  jwt.verify(token, process.env.JWT_SECRET as string, (err: unknown) => {
    if (err) {
      throw new CustomError("Invalid token", 403);
    }
  });

  const decodeToken = jwt.decode(token);
  return decodeToken as Record<string, string>;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server was running on port: ${PORT}`));

export default app;
