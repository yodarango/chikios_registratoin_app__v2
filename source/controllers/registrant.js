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
import { executeQuery } from "../db/connection.js";
import { calculateBase64SizeInMB } from "../../utils/calculateBase64Size.js";

router.use(cors());

// write photo to disk
router.post("/upload-photo", async (req, res) => {
  const timestamp = Date.now();
  const filename = `${timestamp}.png`;
  console.log(
    "-------------------------------------------------------- \n",
    "POST: /upload-photo \n",
    "-------------------------------------------------------- \n"
  );
  console.log("📝 writing photo to disk");
  async function savePhoto(base64) {
    try {
      const split = base64.split(",");
      const mimetype = split[0].split(":")[1].split(";")[0];
      const buffer = Buffer.from(split[1], "base64");

      console.log("mimetype...................", mimetype);
      console.log(
        "size in MB.....................",
        calculateBase64SizeInMB(base64)
      );

      await fsPromises.mkdir(photosDir, { recursive: true });

      //const filename = `${Date.now()}.${mimetype.split("/")[1]}`;
      const path = join(photosDir, filename);

      await fsPromises.writeFile(path, buffer);

      console.log("✅ Successfully wrote photo to disk!");
      console.log("image path.....................", `${filename}`);

      return res.send({ path: `${filename}`, status: 200 });
    } catch (error) {
      console.log("error saving photo", error);
      res.send({ error: "error uploading photo", status: 500 });
    }
  }

  savePhoto(req.body.file);
});

// register the child
router.post("/register", async (req, res, next) => {
  console.log(
    "-------------------------------------------------------- \n",
    "POST: /register \n",
    "-------------------------------------------------------- \n"
  );
  console.log("📝 registering child");
  console.log("payload.....................", req.body);
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

    console.log("✅ Successfully registered child!");
    console.log("child id.....................", insertKid.results.insertId);
    console.log("📝 Writing guardian");

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

    console.log("✅ Successfully registered guardian!");

    return res.send({
      success: "child successfully registered",
      id: insertKid.results.insertId,
    });
  } catch (error) {
    console.log("error registering child and guardian", error);
    res.send({ error, id: null });
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-in/:id", async (req, res) => {
  console.log(
    "-------------------------------------------------------- \n",
    "PUT: /check-in/" + req.params.id + " \n",
    "-------------------------------------------------------- \n"
  );
  console.log("📝 checking-in child");
  console.log("payload.....................", req.body);

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

    console.log("✅ Successfully checked-in child!");
    console.log("child id.....................", req.params.id);

    return res.status(200).send({
      id: req.params.id,
      time: currTime(),
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-out/:id", async (req, res) => {
  console.log(
    "-------------------------------------------------------- \n",
    "PUT: /check-out/" + req.params.id + " \n",
    "-------------------------------------------------------- \n"
  );

  console.log("📝 checking-out child");
  console.log("payload.....................", req.body);

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

    console.log("✅ Successfully checked-out child!");
    return res.status(200).send({
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
