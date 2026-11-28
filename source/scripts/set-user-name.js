import { pool } from "../db/connection.js";
import { normalizeUsername, initializeUsers } from "../models/user.js";

try {
  const [username, firstName, lastName] = process.argv.slice(2);
  if (process.argv.length !== 5 || !normalizeUsername(username) || !firstName?.trim() || !lastName?.trim() || firstName.trim().length > 100 || lastName.trim().length > 100) throw new Error("Usage: npm run set-user-name -- <username> <first-name> <last-name>");
  await initializeUsers();
  const [result] = await pool.execute("UPDATE users SET first_name = ?, last_name = ? WHERE username = ?", [firstName.trim(), lastName.trim(), normalizeUsername(username)]);
  if (!result.affectedRows) throw new Error("User not found.");
  console.log("Updated account name.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}