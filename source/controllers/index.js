// config
import express from "express";
const indexRouter = express.Router();

indexRouter.get("/", async (req, res) => {
  res.render("index");
});

indexRouter.get("/success", async (req, res) => {
  res.render("success");
});

export { indexRouter };
