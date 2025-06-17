// config
import { Registrant } from "../models/registrant.js";
import { signNewToken } from "../auth/index.js";
import { createResponse } from "../utils/index.js";
import { Guardian } from "../models/guardian.js";
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

indexRouter.get("/login", async (req, res) => {
  res.status(200).render("admin/login");
});

// login
indexRouter.post("/login", async (req, res) => {
  if (req.cookies.authorization) {
    res.redirect("/admin/users");
    return;
  }

  try {
    if (
      req?.body?.username.toLowerCase().trim() === process.env.ADMIN_USERNAME &&
      req?.body?.password.trim() === process.env.ADMIN_PASSWORD
    ) {
      const token = await signNewToken({
        username: req?.body?.username,
        email: req?.body?.admin_email,
      });

      createResponse(res, { data: { token }, error: null, success: true });
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
indexRouter.post("/new", async (req, res) => {
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

export { indexRouter };
