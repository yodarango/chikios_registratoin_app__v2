// config
import { Registrant } from "../models/registrant.js";
import { createResponse } from "../utils/index.js";
const publicRouter = express.Router();
const privateRouter = express.Router();
import express from "express";
import { enrollAtCheckIn, smsMode } from "../services/sms.js";
import { notifyRosterChanged, rosterEventStream } from "../services/rosterLive.js";
import { statusAttribution } from "../utils/statusAttribution.js";

// updates the registrant with the data incoming from the body
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

    notifyRosterChanged();
    createResponse(res, { data: req.body, error: null, success: true });
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error, success: false });
  }
});

// gets all registrants
privateRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const { results: registrants } = await registrant.searchAdminRegistrants("");

  res.status(200).render("admin/index", { registrants, statusAttribution });
});

privateRouter.get("/live/events", rosterEventStream);

privateRouter.get("/search/registrants", async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (typeof req.query.q !== "string" || req.query.q.length > 100) {
    return res.status(400).json({ success: false, error: "Enter a search of up to 100 characters." });
  }
  try {
    const registrant = new Registrant();
    const { results, counts } = await registrant.searchAdminRegistrants(req.query.q.trim());
    res.json({ success: true, registrants: results, counts });
  } catch (error) {
    console.error("Could not search registrants:", error.message);
    res.status(503).json({ success: false, error: "Could not search registrations. Please try again." });
  }
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

  res.status(200).render("admin/[id]", { registrant: singleRegistrant, statusAttribution });
});

// checks out a registrant
privateRouter.post("/check-out/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = false;

  const actor = [req.user.first_name, req.user.last_name].filter(Boolean).join(" ") || req.user.username;
  const { success } = await registrant.checkOut(actor);

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check out registrant",
      success: false,
    });
    return;
  }

  notifyRosterChanged();
  createResponse(res, { data: null, error: null, success: true });
});

// checks in a registrant
privateRouter.post("/check-in/:id", async (req, res) => {
  const registrant = new Registrant();

  registrant.id = req.params.id;
  registrant.checkedIn = true;

  const actor = [req.user.first_name, req.user.last_name].filter(Boolean).join(" ") || req.user.username;
  const { success } = await registrant.checkIn(actor);

  if (!success) {
    createResponse(res, {
      data: null,
      error: "Failed to check in registrant",
      success: false,
    });
    return;
  }

  notifyRosterChanged();
  if (smsMode() !== 'off') {
    try { await enrollAtCheckIn(registrant.id); }
    catch (error) { console.error('Could not assign checked-in child to event:', error.message); }
  }

  createResponse(res, { data: null, error: null, success: true });
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

  notifyRosterChanged();
  createResponse(res, { data: req.body, error: null, success: true });
});

export { publicRouter, privateRouter };
