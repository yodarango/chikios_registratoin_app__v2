import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
// production

const connectionParams = {
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_DB_USER,
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  connectTimeout: 30000,
  connectionLimit: 100,
  charset: "utf8mb4",
  queueLimit: 0, // unlimited`
};

// pool singleton
export const pool = mysql.createPool(connectionParams).promise();
