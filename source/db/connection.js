import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
// production

const pool = mysql
  .createPool({
    connectionLimit: 100,
    host: process.env.MYSQL_VPS_IP,
    user: process.env.MYSQL_DB_USER,
    password: process.env.MYSQL_DB_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    socketPath: process.env.MYSQL_LOCAL_SOCKET,
    // acquireTimeout: 600000, //'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    connectTimeout: 30000, // 'connectTimeout' is the maximum number of milliseconds before a timeout occurs during the initial connection to the database.
    queueLimit: 0, // unlimited
    port: 3306,
    charset: "utf8mb4",
  })
  .promise();
// dataService.js
export async function executeQuery(query, params) {
  try {
    const [results, fields] = await pool.query(query, params);
    return { results, fields };
  } catch (err) {
    console.error("Error executing query:", err);
  }
}
