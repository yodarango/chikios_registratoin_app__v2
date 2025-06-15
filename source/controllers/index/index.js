// config
import { Admin } from "../../models/index.js";
import express from "express";

const indexRouter = express.Router();

// render the login page
indexRouter.get("/login", async (req, res) => {
  res.status(200).render("login");
});

// handle login for and admin
indexRouter.post("/login", async (req, res) => {
  if (req.cookies.authorization) {
    res.redirect("/admin");
    return;
  }

  try {
    if (
      req?.body?.username.toLowerCase() === process.env.APP_ADMIN_USERNAME &&
      req?.body?.password === process.env.APP_ADMIN_PASSWORD
    ) {
      const token = await authenticateToken({
        username: req?.body?.username,
        email: req?.body?.admin_email,
      });

      createResponse(res, { data: token, error: null });
      return;
    }

    createResponse(res, {
      data: null,
      error: "Wrong credentials. Please try again!",
    });
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error });
  }
});

indexRouter.get("/", async (req, res) => {
  res.status(200).render("index");
});

indexRouter.get("/signup", async (req, res) => {
  res.status(200).render("signup");
});

// handle the registration for a new admin
indexRouter.post("/signup", async (req, res) => {
  if (req.cookies.authorization) {
    res.redirect("/admin");
    return;
  }

  try {
    if (
      !req?.body?.email ||
      !req?.body?.password ||
      !req?.body?.first_name ||
      !req?.body?.last_name
    ) {
      createResponse(res, {
        data: token,
        error: "Please make sure you provide all the necessary information.",
      });
      return;
    }

    const hashedPassword = hashedPassword(req?.body?.password);

    const admin = new Admin();

    admin.first_name = req?.body?.first_name;
    admin.last_name = req?.body?.last_name;
    admin.password = hashedPassword;
    admin.email = req?.body?.email;

    const newAdminSave = await admin.save();
    console.log("newAdminSave", newAdminSave);
  } catch (error) {
    console.error(error);

    createResponse(res, { data: null, error: error });
  }
});

export { indexRouter };
