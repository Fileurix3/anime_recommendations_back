import { PostgresDialect } from "@sequelize/postgres";
import { Sequelize } from "@sequelize/core";
import "dotenv/config";

const sequelize = new Sequelize({
  dialect: PostgresDialect,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
});

export default sequelize;
