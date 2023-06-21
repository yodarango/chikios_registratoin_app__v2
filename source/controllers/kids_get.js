// config
import express from "express";
const router = express.Router();

// midleware
import { authenticateToken } from "../helpers/auth/authenticate_token.js";

// models
import { Kid } from "../db/models/kid.js";
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "..", "public");

// ---------- get request

router.get("/", (req, res) => {
  res.sendFile(join(pub, "admin", "users.html"));
});

router.get("/user", (req, res) => {
  res.sendFile(join(pub, "admin", "user.html"));
});

router.get("/users", authenticateToken, async (req, res) => {
  try {
    if (req.query.ln) {
      const lastname = `${req.query.ln.toLocaleLowerCase()}`;

      const count = await Kid.count();
      let kids = await Kid.find({ last_name: { $regex: lastname } });

      // kids = kids.map((k) => ({ ...k, id: k._id }));

      res.send({ kids, count });
      return;
    }

    const count = await Kid.count();
    let kids = await Kid.find({})
      .sort({ last_name: 1 })
      .limit(10)
      .skip(req.query.skip);

    // kids = kids.map((k) => ({ ...k._doc, id: k._id }));

    res.send({ kids, count });
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.get("/kid/:id", authenticateToken, async (req, res) => {
  try {
    if (req.params.id) {
      const kids = await Kid.find({ _id: req.params.id });

      res.send({ kids, status: 200 });
    }
  } catch (error) {
    console.log(error);
    return `the following error ocurred ${error}`;
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.params.id) {
      const deleted = await Kid.deleteOne({ _id: req.params.id });
      if (deleted) res.send(true);
    }
  } catch (error) {
    res.send(false);
    console.log(error);
  }
});

export default router;
