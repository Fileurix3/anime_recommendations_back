import * as Minio from "minio";
import "dotenv/config";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_END_POINT as string,
  port: parseInt(process.env.MINIO_PORT as string, 10),
  useSSL: process.env.MINIO_USE_SSL == "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export default minioClient;
