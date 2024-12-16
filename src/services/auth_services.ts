import { Request, Response } from "express";
import { CustomError, handlerError } from "../index.js";
import { UsersModel } from "../models/users_model.js";
import { Op } from "@sequelize/core";
import validator from "email-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthServices {
  public async register(req: Request, res: Response): Promise<void> {
    const { name, password, email } = req.body;

    try {
      if (!name || !password || !email) {
        throw new CustomError("You have not filled in all the fields", 400);
      } else if (password.length < 6) {
        throw new CustomError("Password must be at least 6 characters long", 400);
      }

      if (!validator.validate(email)) {
        throw new CustomError("Invalid email", 400);
      }

      const existingUser: UsersModel[] = await UsersModel.findAll({
        where: {
          [Op.or]: [{ name: name }, { email: email }],
        },
      });

      if (existingUser.length > 0) {
        throw new CustomError("User with this name or email already exists", 400);
      }

      const hashPassword: string = await bcrypt.hash(password, 10);

      const newUser: UsersModel = await UsersModel.create({
        name: name,
        email: email,
        password: hashPassword,
      });

      const token = jwt.sign(
        {
          userId: newUser.id,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "10h",
        }
      );

      res.cookie("token", token, {
        maxAge: 10 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      });

      res.status(201).json({
        message: "User successfully registered",
        token: token,
        user: newUser,
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        throw new CustomError("You have not filled in all the fields", 400);
      }

      const user: UsersModel | null = await UsersModel.findOne({
        where: {
          email: email,
        },
      });

      if (user == null) {
        throw new CustomError("Invalid email or password", 400);
      }

      const hashPassword: boolean = await bcrypt.compare(password, user.password);

      if (!hashPassword) {
        throw new CustomError("Invalid email or password", 400);
      }

      const token = jwt.sign(
        {
          userId: user.id,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "175h",
        }
      );

      res.cookie("token", token, {
        maxAge: 7 * 26 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      });

      res.status(200).json({
        token,
        message: "Login successful",
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("token");
      res.status(200).json({
        message: "logout successfully",
      });
    } catch (err: unknown) {
      handlerError(err, res);
    }
  }
}
