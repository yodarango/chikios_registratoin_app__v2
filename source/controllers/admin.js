// config
import { Registrant } from "../models/registrant.js";
import { createResponse } from "../utils/index.js";
const publicRouter = express.Router();
const privateRouter = express.Router();
import express from "express";

privateRouter.put("/update/registrant/:id", async (req, res) => {
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

  res.status(200).render("admin/[id]", { registrant: singleRegistrant });
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
