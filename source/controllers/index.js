// config
import { Registrant } from "../models/registrant.js";
import express from "express";

const indexRouter = express.Router();

indexRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrants();
  res.render("index", { registrants });
});

indexRouter.get("/success", async (req, res) => {
  res.render("success");
});

export { indexRouter };
