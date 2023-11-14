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

      res.send({ path, status: 200 });
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
    guardian_phone_number: phone_number,
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

    // const insertParent = await executeQuery(
    //   "SELECT first_name, last_name, age, gender, profile_picture FROM registrant",
    //   []
    // );

    console.log(insertKid);
  } catch (error) {
    console.log(error);
    res.send({ error, id: null });
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-in/:id", authenticateToken, async (req, res) => {
  try {
    const kid = await Kid.findOne({ _id: req.params.id });
    kid.checked_in = true;
    kid.changed_at = currTime();

    const updated = await kid.save();

    res.send({
      id: updated._id,
      time: updated.changed_at,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.put("/check-out/:id", authenticateToken, async (req, res) => {
  try {
    const kid = await Kid.findOne({ _id: req.params.id });
    kid.checked_in = false;
    kid.changed_at = currTime();

    const updated = await kid.save();

    res.send({
      id: updated._id,
      time: updated.changed_at,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

export default router;
