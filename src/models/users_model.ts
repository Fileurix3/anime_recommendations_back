import { DataTypes, Model } from "@sequelize/core";
import sequelize from "../database/db.js";

interface UserAttributes {
  id?: string;
  name: string;
  email: string;
  password: string;
}

export class UsersModel extends Model<UserAttributes> implements UserAttributes {
  public id?: string;
  public name!: string;
  public email!: string;
  public password!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UsersModel.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "UsersModel",
    tableName: "users",
    timestamps: true,
  }
);
