// config
import express from "express";
const router = express.Router();

// midleware
import { authenticateToken } from "../helpers/auth/authenticate_token.js";

// models
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { executeQuery } from "../db/connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "..", "public");

// render the html
router.get("/", (req, res) => {
  res.sendFile(join(pub, "admin", "users.html"));
});

router.get("/user", (req, res) => {
  res.sendFile(join(pub, "admin", "user.html"));
});

// get all the users
router.get("/users", async (req, res) => {
  try {
    // find a child by last name
    if (req.query.ln) {
      const kids = await executeQuery(
        `SELECT * FROM registrant WHERE last_name LIKE ?`,
        [`%${req.query.ln}%`]
      );

      const count = kids.results.length;

      res.send({ kids: kids.results, count });
      return;
    }

    const skip = req.query.skip || 1000;
    const kids = await executeQuery(
      `SELECT * FROM registrant WHERE ID < ? LIMIT 20`,
      [skip]
    );

    const kidCount = await executeQuery(
      `SELECT COUNT(ID) as count FROM registrant`,
      [skip]
    );

    const count = kidCount.results[0]?.count;

    res.send({ kids: kids.results, count });
    return;
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

// get the registrant's info as well as the child info
router.get("/kid/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const kids = await executeQuery(
        `
      SELECT r.*, r.first_name as guardian_first_name, r.last_name as guardian_last_name, g.phone_number as guardian_phone_number 
      FROM registrant as r 
      LEFT JOIN guardian as g
      ON r.ID = g.registrant_id
      WHERE r.ID  = ?
      `,
        [req.params.id]
      );

      res.send({ kids: kids.results, status: 200 });
    }
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.delete("/kid/delete/:id", async (req, res) => {
  try {
    const kids = await executeQuery(
      `
      DELETE FROM registrant WHERE ID  = ?
      `,
      [req.params.id]
    );

    if (!(kids.results.affectedRows > 0)) {
      return res.send({ kids: null, status: 500 });
    }

    return res.send({ kids: kids.results.affectedRows, status: 200 });
  } catch (error) {
    res.send(false);
    console.log(error);
  }
});

export default router;
