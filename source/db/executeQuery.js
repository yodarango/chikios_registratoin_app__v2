import { pool } from "./connection.js";

export async function executeQuery(query, params) {
  try {
    const [results, fields] = await pool.query(query, params);
    return { results, fields };
  } catch (err) {
    console.error("Error executing query:", err);
  }
}
