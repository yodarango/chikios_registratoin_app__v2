// config
import express from "express";
const publicRouter = express.Router();
const privateRouter = express.Router();

import { generateAccessToken } from "../helpers/auth/sign_new_token.js";
import { Registrant } from "../models/registrant.js";
import { Guardian } from "../models/guardian.js";

publicRouter.get("/login", async (req, res) => {
  res.status(200).render("admin/login");
});

// login
publicRouter.post("/login", async (req, res) => {
  if (req.cookies.authorization) {
    res.redirect("/admin/users");
    return;
  }

  try {
    if (
      req?.body?.username.toLowerCase() === "admin" &&
      req?.body?.password === "K1dzqu35T_GMC_2024"
    ) {
      const token = await generateAccessToken({
        username: req?.body?.username,
        email: req?.body?.admin_email,
      });

      res.send({ token });
    }
  } catch (error) {
    console.error(error);
    res.send({ error: "wrong pass" });
  }
});

// creates a new registrant
publicRouter.post("/new", async (req, res) => {
  try {
    const registrant = new Registrant();
    const guardian = new Guardian();

    registrant.newRegistrantFromRequestBody(req.body);
    guardian.newGuardianFromRequestBody(req.body);

    const { newRegistrantId, success: registrantSuccess } =
      await registrant.save();

    guardian.registrant_id = newRegistrantId;

    if (!registrantSuccess) {
      res.status(500).json({ success: false });
    }

    const { success } = await guardian.save();

    res.status(200).json({ newRegistrantId, success });
  } catch (error) {
    console.error(error);
  }
});
// gets all registrants
privateRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrantsForLastConf();

  res.status(200).render("admin/index", { registrants });
});

// gets registrant by id
privateRouter.get("/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const singleRegistrant = await registrant.getSingleRegistrantById();

  res.status(200).render("admin/[id]", { registrant: singleRegistrant });
});

// checks out a registrant
privateRouter.post("/check-out/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = false;

  const { success } = await registrant.checkOut();

  res.status(200).json({ success });
});

// checks in a registrant
privateRouter.post("/check-in/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = true;

  const { success } = await registrant.checkIn();

  res.status(200).json({ success });
});

// deletes a registrant
privateRouter.delete("/delete/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const { success } = await registrant.deleteRegistrant();

  res.status(200).json({ success });
});

export { publicRouter, privateRouter };
