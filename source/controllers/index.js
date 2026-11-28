// config
import { Registrant } from "../models/registrant.js";
import { signNewToken } from "../auth/index.js";
import { createResponse } from "../utils/index.js";
import { Guardian } from "../models/guardian.js";
import express from "express";
import { registerSms, normalizePhone, smsMode } from "../services/sms.js";
import { notifyRosterChanged } from "../services/rosterLive.js";
import { pool } from "../db/connection.js";
import { normalizeUsername } from "../models/user.js";
import bcrypt from "bcrypt";

const indexRouter = express.Router();

indexRouter.get("/", async (req, res) => {
  const registrant = new Registrant();
  const registrants = await registrant.getAllRegistrants();
  res.render("index", { registrants });
});

indexRouter.get("/success", async (req, res) => {
  res.render("success");
});

indexRouter.get("/privacy", (req, res) => {
  res.render("privacy");
});

indexRouter.get("/terms", (req, res) => {
  res.render("terms");
});

indexRouter.get("/login", async (req, res) => {
  res.status(200).render("admin/login");
});

indexRouter.post("/logout", (req, res) => {
  res.clearCookie("authorization", { path: "/", httpOnly: true, sameSite: "lax" });
  res.redirect("/login");
});

// login
indexRouter.post("/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = req.body?.password;
    if (username && username.length <= 100 && typeof password === "string" && password && Buffer.byteLength(password, "utf8") <= 72) {
      const [rows] = await pool.execute("SELECT id, password_hash, type FROM users WHERE username = ? LIMIT 1", [username]);
      const user = rows[0];
      if (user && ["admin", "user"].includes(user.type) && await bcrypt.compare(password, user.password_hash)) {
        const token = await signNewToken({ userId: user.id });
        res.cookie("authorization", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: req.secure || req.headers["x-forwarded-proto"]?.split(",")[0].trim() === "https",
          maxAge: 14 * 24 * 60 * 60 * 1000,
          path: "/",
        });
        createResponse(res, { data: { redirect: user.type === "admin" ? "/admin" : "/" }, error: null, success: true });
        return;
      }
    }

    createResponse(res, {
      data: null,
      error: "Wrong credentials. Please try again!",
      success: false,
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.status(503).json({ data: null, error: "Login is temporarily unavailable.", success: false });
  }
});

// creates a new registrant
indexRouter.post("/new", async (req, res) => {
  try {
    if (req.body.sms_consent === true && !normalizePhone(req.body.guardian_phone_number)) {
      return res.status(400).json({ success: false, error: "Enter a valid US phone number to receive texts." });
    }
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
    let guardianSaveId;
    if (guardianExists) {
      const guardianUpdate = await guardian.update();
      guardianSuccess = guardianUpdate.success;
    } else {
      const guardianSave = await guardian.save();
      guardianSuccess = guardianSave.success;
      guardianSaveId = guardianSave.results?.insertId;
    }

    if (!guardianSuccess) {
      createResponse(res, {
        data: null,
        error: "Failed to save guardian",
        success: false,
      });
      return;
    }

    notifyRosterChanged();

    let smsStatus = 'not_requested';
    if (req.body.sms_consent === true && smsMode() === 'off') {
      smsStatus = 'unavailable';
    } else if (smsMode() !== 'off') {
      try {
        smsStatus = await registerSms({ registrantId: registrant.id, guardianId: guardianExists ? guardian.id : guardianSaveId, phone: guardian.phone_number, consent: req.body.sms_consent === true });
        if (smsStatus === 'queued' && smsMode() === 'dry-run') smsStatus = 'dry_run';
      } catch (error) {
        console.error('Could not queue registration text:', error.message);
        smsStatus = 'unavailable';
      }
    }
    createResponse(res, { data: { ...registrant, first_name: registrant.firstName, last_name: registrant.lastName, smsStatus }, error: null, success: true });
  } catch (error) {
    console.error(error);
    createResponse(res, { data: null, error: error, success: false });
  }
});

export { indexRouter };
