import bcrypt from "bcrypt";
import { pool } from "../db/connection.js";

export function normalizeUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

export function validateCredentials(username, password, type) {
  if (!username || username.length > 100 || /\s/.test(username)) throw new Error("Username must be 1–100 characters with no whitespace.");
  if (typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) throw new Error("Password must be nonempty and at most 72 UTF-8 bytes.");
  if (!["admin", "user"].includes(type)) throw new Error("Type must be admin or user.");
}

export async function createUser(username, password, type, firstName = null, lastName = null) {
  username = normalizeUsername(username);
  validateCredentials(username, password, type);
  const hash = await bcrypt.hash(password, 12);
  if ((firstName !== null && (typeof firstName !== "string" || !firstName.trim() || firstName.trim().length > 100)) || (lastName !== null && (typeof lastName !== "string" || !lastName.trim() || lastName.trim().length > 100))) throw new Error("Names must be 1–100 characters.");
  await pool.execute("INSERT INTO users (username, password_hash, type, first_name, last_name) VALUES (?, ?, ?, ?, ?)", [username, hash, type, firstName?.trim() || null, lastName?.trim() || null]);
}

export async function initializeUsers() {
  const [existing] = await pool.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'");
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'user'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [columns] = await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'");
  if (!columns.some(column => column.COLUMN_NAME === "type")) {
    await pool.query("ALTER TABLE users ADD COLUMN type VARCHAR(32) NOT NULL DEFAULT 'user'");
  }
  for (const name of ["first_name", "last_name"]) {
    if (!columns.some(column => column.COLUMN_NAME === name)) await pool.query(`ALTER TABLE users ADD COLUMN ${name} VARCHAR(100) NULL`);
  }
  const [registrantColumns] = await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrant'");
  if (!registrantColumns.length) throw new Error("The registrant table is missing.");
  if (!registrantColumns.some(column => column.COLUMN_NAME === "status_changed_by")) await pool.query("ALTER TABLE registrant ADD COLUMN status_changed_by VARCHAR(201) NULL");
  if (!registrantColumns.some(column => column.COLUMN_NAME === "status_changed_at")) await pool.query("ALTER TABLE registrant ADD COLUMN status_changed_at DATETIME NULL");
  // Refuse to start against an incompatible existing table rather than guessing how to migrate credentials.
  await pool.query("SELECT id, username, password_hash, type FROM users LIMIT 0");
  if (!existing.length && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const username = normalizeUsername(process.env.ADMIN_USERNAME);
    validateCredentials(username, process.env.ADMIN_PASSWORD, "admin");
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const [result] = await pool.execute("INSERT IGNORE INTO users (username, password_hash, type) VALUES (?, ?, 'admin')", [username, hash]);
    if (result.affectedRows === 1) console.log("Created the initial admin account from the existing environment credentials.");
  }
}