// config
import express from "express";
const router = express.Router();

router.use(express.json({ limit: "3mb" }));
router.use(express.urlencoded({ extended: false }));

import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "..", "public");

// ----------- middleware
import { generateAccessToken } from "../helpers/auth/sign_new_token.js";

router.get("/", async (req, res) => {
  res.sendFile(join(pub, "index.html"));
});

router.get("/login", async (req, res) => {
  res.sendFile(join(pub, "admin", "login.html"));
});

router.post("/login", async (req, res) => {
  if (req.cookies.authorization) {
    res.redirect("/admin/users");
    return;
  }

  try {
    if (
      req?.body?.username === "admin" &&
      req?.body?.password === "K1dzqu35T202E"
    ) {
      const token = await generateAccessToken({
        username: req?.body?.username,
        email: req?.body?.admin_email,
      });

      res.send({ token });
    }
  } catch (error) {
    console.log(error);
    res.send({ error: "wrong pass" });
  }
});

export default router;
