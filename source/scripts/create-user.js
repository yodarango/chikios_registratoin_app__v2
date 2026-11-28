import { createInterface } from "node:readline";
import { pool } from "../db/connection.js";
import { createUser, initializeUsers } from "../models/user.js";

const [username, type, firstName, lastName] = process.argv.slice(2);
try {
  if (!username || !type || !firstName || !lastName || process.argv.length !== 6) throw new Error("Usage: npm run create-user -- <username> <admin|user> <first-name> <last-name> (provide password on stdin)");
  if (process.stdin.isTTY) throw new Error("Provide the password on stdin; see ACCOUNTS.md for a hidden prompt.");
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  let password;
  for await (const line of input) { password = line; break; }
  await initializeUsers();
  await createUser(username, password, type, firstName, lastName);
  console.log(`Created ${type} account.`);
} catch (error) {
  console.error(error.code === "ER_DUP_ENTRY" ? "Username already exists." : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}