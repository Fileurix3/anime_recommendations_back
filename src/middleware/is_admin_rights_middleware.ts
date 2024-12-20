import { Request, Response, NextFunction } from "express";
import { CustomError, decodeJwt, handlerError } from "../index.js";
import { UsersModel } from "../models/users_model.js";

export async function isAdminRightsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies.token;

  try {
    const userId: string = decodeJwt(token).userId;

    const user: UsersModel | null = await UsersModel.findOne({
      where: {
        id: userId,
      },
    });

    if (user == null) {
      throw new CustomError("User not found", 404);
    }

    if (user.adminRights == false) {
      throw new CustomError("You don't have enough rights", 403);
    }

    next();
  } catch (err: unknown) {
    handlerError(err, res);
  }
}
