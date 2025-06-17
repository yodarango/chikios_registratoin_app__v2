// config
import express from "express";
const publicRouter = express.Router();
const privateRouter = express.Router();

import { authenticateToken } from "../auth/index.js";
import { createResponse } from "../utils/index.js";
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
      req?.body?.username.toLowerCase() === process.env.ADMIN_USERNAME &&
      req?.body?.password === process.env.ADMIN_PASSWORD
    ) {
      const token = await authenticateToken({
        username: req?.body?.username,
        email: req?.body?.admin_email,
      });

      createResponse(res, { data: token, error: null, success: true });
      return;
    }

    createResponse(res, {
      data: null,
      error: "Wrong credentials. Please try again!",
      success: false,
    });
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error, success: false });
  }
});

// creates a new registrant
publicRouter.post("/new", async (req, res) => {
  try {
    // instantiate the registrant and guardian objects
    const registrant = new Registrant();
    const guardian = new Guardian();

    // map the request body to the registrant and guardian objects
    registrant.newRegistrantFromRequestBody(req.body);
    guardian.newGuardianFromRequestBody(req.body);

    // check if guardian exists
    const guardianExists = await guardian.checkIfGuardianExists();

    // check if the registrant exists
    const registrantExists = await registrant.checkIfRegistrantExists();

    // only create a new record for the registrant and guardian if they don't exist
    let registrantSuccess = false;

    if (registrantExists) {
      const registrantUpdate = await registrant.update();
      registrantSuccess = registrantUpdate.success;
    } else {
      const registrantSave = await registrant.save();
      registrant.id = registrantSave.newRegistrantId;
      registrantSuccess = registrantSave.success;
    }

    // attach this registrant to the guardian
    guardian.registrant_id = registrant.id;

    if (!registrantSuccess) {
      createResponse(res, {
        data: null,
        error: "Failed to save registrant",
        success: false,
      });
      return;
    }

    // only create a new record for the guardian if they don't exist
    let guardianSuccess = false;
    if (guardianExists) {
      const guardianUpdate = await guardian.update();
      guardianSuccess = guardianUpdate.success;
    } else {
      const guardianSave = await guardian.save();
      guardianSuccess = guardianSave.success;
    }

    if (!guardianSuccess) {
      createResponse(res, {
        data: null,
        error: "Failed to save guardian",
        success: false,
      });
      return;
    }

    createResponse(res, { data: registrant, error: null, success: true });
  } catch (error) {
    console.error(error);
    createResponse(res, { data: null, error: error, success: false });
  }
});

publicRouter.put("/update/registrant/:id", async (req, res) => {
  try {
    const registrant = new Registrant();
    registrant.newRegistrantFromRequestBody(req.body);

    const { success } = await registrant.update();

    if (!success) {
      createResponse(res, {
        data: null,
        error: "Failed to update registrant",
        success: false,
      });
      return;
    }

    createResponse(res, { data: req.body, error: null, success: true });
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error, success: false });
  }
});

// gets all registrants
privateRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrantsForLastConf();

  res.status(200).render("admin/index", { registrants });
});

// gets a registrant by id
privateRouter.get("/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const singleRegistrant = await registrant.getSingleRegistrantById();

  if (!singleRegistrant) {
    createResponse(res, {
      data: null,
      error: "Registrant not found",
      success: false,
    });
    return;
  }

  createResponse(res, { data: singleRegistrant, error: null, success: true });
});

// checks out a registrant
privateRouter.post("/check-out/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = false;

  const { success } = await registrant.checkOut();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check out registrant",
      success: false,
    });
    return;
  }

  createResponse(res, { data: req.body, error: null, success: true });
});

// checks in a registrant
privateRouter.post("/check-in/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = true;

  const { success } = await registrant.checkIn();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check in registrant",
      success: false,
    });
    return;
  }

  createResponse(res, { data: req.body, error: null, success: true });
});

// deletes a registrant
privateRouter.delete("/delete/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const { success } = await registrant.deleteRegistrant();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to delete registrant",
      success: false,
    });
    return;
  }

  createResponse(res, { data: req.body, error: null, success: true });
});

export { publicRouter, privateRouter };
