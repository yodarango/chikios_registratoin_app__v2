// config
import express from "express";
const router = express.Router();

// midleware
import { authenticateToken } from "../helpers/auth/authenticate_token.js";

// models
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { executeQuery } from "../db/executeQuery.js";
import { Registrant } from "../models/registrant.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "..", "public");

router.get(
  "/",
  /*authenticateToken,*/ async (req, res) => {
    const registrant = new Registrant();
    const registrants = await registrant.getAllRegistrants();

    res.render("admin/users", { registrants });
  }
);

export default router;
