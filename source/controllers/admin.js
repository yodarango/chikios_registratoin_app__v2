// config
import express from "express";
const publicRouter = express.Router();
const privateRouter = express.Router();

import { generateAccessToken } from "../helpers/auth/sign_new_token.js";
import { Registrant } from "../models/registrant.js";

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
    console.log(error);
    res.send({ error: "wrong pass" });
  }
});

// gets all registrants
privateRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrants();

  res.status(200).render("admin/index", { registrants });
});

// gets registrant by id
privateRouter.get("/:id", async (req, res) => {
  const registrant = new Registrant();
  const singleRegistrant = await registrant.getSingleRegistrantById();

  res.status(200).render("admin/[id]", { registrant: singleRegistrant });
});

// creates a new registrant
privateRouter.post("/new", async (req, res) => {
  const registrant = new Registrant();

  registrant.newRegistrantFromRequestBody(req.body);
  const { newRegistrantId, success } = await registrant.add();

  setTimeout(() => {
    res.status(200).json({ newRegistrantId, success });
  }, 15000);
});

// checks out a registrant
privateRouter.put("/check-out/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.checkIn = req.body.checkIn;

  const { newRegistrantId, success } = await registrant.checkOut();

  res.status(200).json({ newRegistrantId, success });
});

// checks in a registrant
privateRouter.put("/check-in/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.checkedIn = req.body.checkIn;

  const { newRegistrantId, success } = await registrant.checkIn();

  res.status(200).json({ newRegistrantId, success });
});

// deletes a registrant
privateRouter.delete("/delete/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const { newRegistrantId, success } = await registrant.checkIn();

  res.status(200).json({ newRegistrantId, success });
});

export { publicRouter, privateRouter };
