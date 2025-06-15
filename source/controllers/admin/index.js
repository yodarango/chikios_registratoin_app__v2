// config
import express from "express";
const publicAdminRouter = express.Router();
const privateAdminRouter = express.Router();

import { authenticateToken } from "../../auth/index.js";
import { createResponse } from "../../utils/index.js";
import { Registrant } from "../../models/registrant.js";
import { Guardian } from "../../models/guardian.js";

// creates a new registrant
publicAdminRouter.post("/new", async (req, res) => {
  try {
    // instantiate the registrant and guardian objects
    const registrant = new Registrant();
    const guardian = new Guardian();

    // map the request body to the registrant and guardian objects
    registrant.newRegistrantFromRequestBody(req.body);
    guardian.newGuardianFromRequestBody(req.body);

    // check if guardian exists
    const { success: guardianExists } = await guardian.checkIfGuardianExists();

    // check if the registrant exists
    const { success: registrantExists } =
      await registrant.checkIfRegistrantExists();

    // only create a new record for the registrant and guardian if they don't exist
    let newRegistrantId = null;
    let registrantSuccess = false;
    if (registrantExists) {
      const registrantUpdate = await registrant.update();
      newRegistrantId = registrantUpdate.newRegistrantId;
      registrantSuccess = registrantUpdate.success;
    } else {
      const registrantSave = await registrant.save();
      newRegistrantId = registrantSave.newRegistrantId;
      registrantSuccess = registrantSave.success;
    }

    // attach this registrant to the guardian
    guardian.registrant_id = newRegistrantId;

    if (!registrantSuccess) {
      createResponse(res, { data: null, error: "Failed to save registrant" });
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
      createResponse(res, { data: null, error: "Failed to save guardian" });
      return;
    }

    createResponse(res, { data: req.body, error: null });
  } catch (error) {
    console.error(error);
    createResponse(res, { data: null, error: error });
  }
});

publicAdminRouter.put("/update/registrant/:id", async (req, res) => {
  try {
    const registrant = new Registrant();
    registrant.newRegistrantFromRequestBody(req.body);

    const { success } = await registrant.update();

    if (!success) {
      createResponse(res, { data: null, error: "Failed to update registrant" });
      return;
    }

    createResponse(res, { data: req.body, error: null });
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error });
  }
});

// gets all registrants
privateAdminRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrantsForLastConf();

  res.status(200).render("admin/index", { registrants });
});

// gets a registrant by id
privateAdminRouter.get("/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const singleRegistrant = await registrant.getSingleRegistrantById();

  if (!singleRegistrant) {
    createResponse(res, { data: null, error: "Registrant not found" });
    return;
  }

  createResponse(res, { data: singleRegistrant, error: null });
});

// checks out a registrant
privateAdminRouter.post("/check-out/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = false;

  const { success } = await registrant.checkOut();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check out registrant",
    });
    return;
  }

  createResponse(res, { data: req.body, error: null });
});

// checks in a registrant
privateAdminRouter.post("/check-in/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = true;

  const { success } = await registrant.checkIn();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check in registrant",
    });
    return;
  }

  createResponse(res, { data: req.body, error: null });
});

// deletes a registrant
privateAdminRouter.delete("/delete/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;

  const { success } = await registrant.deleteRegistrant();

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to delete registrant",
    });
    return;
  }

  createResponse(res, { data: req.body, error: null });
});

export { publicAdminRouter, privateAdminRouter };
