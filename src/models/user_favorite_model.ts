import { DataTypes, Model } from "@sequelize/core";
import sequelize from "../database/db.js";
import { UsersModel } from "./users_model.js";
import { AnimeModel } from "./anime_model.js";

interface UserFavoriteAttributes {
  userId: string;
  animeId: number;
}

export class UserFavoriteModel
  extends Model<UserFavoriteAttributes>
  implements UserFavoriteAttributes
{
  public userId!: string;
  public animeId!: number;
  animeModel: any;
}

UserFavoriteModel.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    animeId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: "UserFavorite",
    tableName: "userFavoritesAnime",
    timestamps: false,
  }
);

UserFavoriteModel.belongsTo(UsersModel, {
  foreignKey: "userId",
  targetKey: "id",
});

UserFavoriteModel.belongsTo(AnimeModel, {
  foreignKey: "animeId",
  targetKey: "id",
});

UsersModel.hasMany(UserFavoriteModel, {
  foreignKey: "userId",
  sourceKey: "id",
});

AnimeModel.hasMany(UserFavoriteModel, {
  foreignKey: "animeId",
  sourceKey: "id",
});
