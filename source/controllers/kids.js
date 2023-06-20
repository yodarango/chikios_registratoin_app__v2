// config
import express from "express";
const router = express.Router();
import cors from "cors";
// import { promises as fsPromises } from "fs";
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
import { Kid } from "../db/models/kid.js";
import { currTime } from "../helpers/temp/current_time.js";
import { authenticateToken } from "../helpers/auth/authenticate_token.js";

router.use(cors());
// ---------- get request
router.post("/register", async (req, res, next) => {
  const newKid = new Kid({
    ...req.body,
    created: new Date(),
    changed_at: new Date(),
    checked_in: false,
    profile_picture: req.body.profile_picture?.split("/photos/")[1] || "",
  });

  try {
    const kid = await newKid.save();

    res.send({ success: "child successfully registered", id: kid._id });
  } catch (error) {
    console.log(error);
    res.send({ error, id: null });
    return `the following error ocurred ${error}`;
  }
});

router.post("/upload-photo", async (req, res) => {
  const timestamp = Date.now();
  const filename = `${timestamp}.png`;

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

    console.log(kid);

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
