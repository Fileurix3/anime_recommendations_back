import { DataTypes, Model } from "@sequelize/core";
import sequelize from "../database/db.js";

interface UserAttributes {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  adminRights?: boolean;
}

export class UsersModel extends Model<UserAttributes> implements UserAttributes {
  public id?: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public avatar?: string;
  public adminRights?: boolean;

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
      defaultValue: null,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminRights: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
