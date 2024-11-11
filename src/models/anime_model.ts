import { DataTypes, Model } from "@sequelize/core";
import sequelize from "../database/db.js";

interface AnimeAttributes {
  id: number;
  imageUrl: string;
  title: string;
  titleEng: string;
  synopsis: string;
  episodes: number;
  aired: number;
  rating: string;
  genres: string[];
}

export class AnimeModel extends Model<AnimeAttributes> implements AnimeAttributes {
  public id!: number;
  public imageUrl!: string;
  public title!: string;
  public titleEng!: string;
  public synopsis!: string;
  public episodes!: number;
  public aired!: number;
  public rating!: string;
  public genres!: string[];
}

AnimeModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING,
    },
    titleEng: {
      type: DataTypes.STRING,
    },
    synopsis: {
      type: DataTypes.STRING,
    },
    episodes: {
      type: DataTypes.INTEGER,
    },
    aired: {
      type: DataTypes.INTEGER,
    },
    rating: {
      type: DataTypes.STRING,
    },
    genres: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
  },
  {
    sequelize,
    tableName: "anime",
    modelName: "AnimeModel",
    timestamps: false,
  }
);
