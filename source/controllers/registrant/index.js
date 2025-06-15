import express from "express";

const publicRegistrantRouter = express.Router();

import { createResponse } from "../../utils/index.js";
import { Registrant } from "../../models/registrant.js";
import { Guardian } from "../../models/guardian.js";

publicRegistrantRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrants();
  res.render("index", { registrants });
});

publicRegistrantRouter.get("/success", async (req, res) => {
  res.render("success");
});

export { publicRegistrantRouter };
