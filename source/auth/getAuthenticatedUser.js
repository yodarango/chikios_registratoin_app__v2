import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js";

export async function getAuthenticatedUser(token) {
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return null; }
  if (!payload || !Number.isSafeInteger(payload.userId) || payload.userId < 1) return null;
  const [rows] = await pool.execute("SELECT id, username, type, first_name, last_name FROM users WHERE id = ? LIMIT 1", [payload.userId]);
  return rows[0] || null;
}