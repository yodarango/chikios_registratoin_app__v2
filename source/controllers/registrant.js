// config
import express from "express";
const router = express.Router();
import cors from "cors";
import { promises } from "fs";
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fsPromises = promises;
const photosDir = join(__dirname, "..", "..", "public", "photos");

// parse body
router.use(express.json({ limit: "3mb" }));
router.use(express.urlencoded({ extended: true }));

// models
import { currTime } from "../helpers/temp/current_time.js";
import { authenticateToken } from "../helpers/auth/authenticate_token.js";
import { executeQuery } from "../db/connection.js";

router.use(cors());

// write photo to disk
router.post("/upload-photo", async (req, res) => {
  const timestamp = Date.now();
  const filename = `${timestamp}.png`;

  console.log("writing photo to disk...");
  async function savePhoto(base64) {
    try {
      const split = base64.split(",");
      const mimetype = split[0].split(":")[1].split(";")[0];
      const buffer = Buffer.from(split[1], "base64");

      await fsPromises.mkdir(photosDir, { recursive: true });

      //const filename = `${Date.now()}.${mimetype.split("/")[1]}`;
      const path = join(photosDir, filename);

      await fsPromises.writeFile(path, buffer);

      res.send({ path: `${filename}`, status: 200 });
    } catch (error) {
      console.log(error);
      res.send({ error: "error uploading photo", status: 500 });
    }
  }

  savePhoto(req.body.file);
});

// register the child
router.post("/register", async (req, res, next) => {
  const {
    guardian_phone_number: g_phone_number,
    guardian_first_name: g_first_name,
    guardian_last_name: g_last_name,
    profile_picture,
    first_name,
    last_name,
    gender,
    age,
  } = req.body;

  try {
    const insertKid = await executeQuery(
      `INSERT INTO registrant (first_name, last_name, age, gender, profile_picture)
       VALUES(?, ?, ?, ?, ?);`,
      [first_name, last_name, age, gender, profile_picture]
    );

    // the Kid record was not inserted
    if (!(insertKid.results.insertId > 0)) {
      res.status(500).send({
        success: null,
        error: "error saving registrant record",
        id: null,
      });
      return;
    }

    // get the child ID and insert the parent now
    const insertParent = await executeQuery(
      `INSERT INTO guardian (first_name, last_name, phone_number, registrant_id)
       VALUES(?, ?, ?, ?)`,
      [g_first_name, g_last_name, g_phone_number, insertKid.results.insertId]
    );

    if (!(insertParent.results.insertId > 0)) {
      res.status(500).send({
        success: null,
        error: "error saving guardian record",
        id: null,
      });
      return;
    }

    res.send({
      success: "child successfully registered",
      id: insertKid.results.insertId,
    });
  } catch (error) {
    console.log(error);
    res.send({ error, id: null });
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-in/:id", authenticateToken, async (req, res) => {
  try {
    // get the child ID and insert the parent now
    const checkIn = await executeQuery(
      `UPDATE registrant 
      SET checked_in = TRUE 
      WHERE ID = ?`,
      [req.params.id]
    );

    if (!(checkIn.results.affectedRows > 0)) {
      res.status(500).send({
        id: null,
        time: null,
        status: 500,
        error: "Error checking-in record",
      });

      return;
    }
    res.status(200).send({
      id: req.params.id,
      time: currTime(),
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-out/:id", authenticateToken, async (req, res) => {
  try {
    // get the child ID and insert the parent now
    const checkOut = await executeQuery(
      `UPDATE registrant 
      SET checked_in = FALSE 
      WHERE ID = ?`,
      [req.params.id]
    );

    if (!(checkOut.results.affectedRows > 0)) {
      res.status(500).send({
        id: null,
        time: null,
        status: null,
        error: "Error checking-in record",
      });

      return;
    }

    res.status(200).send({
      id: req.params.id,
      time: currTime(),
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

export default router;
