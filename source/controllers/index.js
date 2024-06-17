// config
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  res.render("index");
});

router.get("/success", async (req, res) => {
  res.render("success");
});

export default router;
