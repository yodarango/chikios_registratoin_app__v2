// config
import express from "express";
const router = express.Router();

import { Registrant } from "../models/registrant.js";

// gets all registrants
router.get(
  "/",
  /*authenticateToken,*/ async (req, res) => {
    const registrant = new Registrant();
    const registrants = await registrant.getAllRegistrants();

    res.render("admin/registrants", { registrants });
  }
);

// creates a new registrant
router.post("/new", async (req, res) => {
  const registrant = new Registrant();

  registrant.newRegistrantFromRequestBody(req.body);
  const { newRegistrantId, success } = await registrant.save();

  setTimeout(() => {
    res.status(200).json({ newRegistrantId, success });
  }, 15000);
});

export default router;
