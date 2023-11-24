import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

// set up the server
import express from "express";
const app = express();

// controllers
import registrantControllers from "./source/controllers/registrant.js";
import adminControllers from "./source/controllers/admin.js";
import mainControllers from "./source/controllers/public.js";
import { authenticateToken } from "./source/helpers/auth/authenticate_token.js";

//middleware
// app.set("view engine", "ejs");
app.use(express.static(`/public`));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.static("public"));
app.use("/kids", registrantControllers);
app.use("/admin", adminControllers);
app.use("/", mainControllers);

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
