import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

// set up the server
import express from "express";
const app = express();

// controllers
import { publicRouter, privateRouter } from "./source/controllers/admin.js";
import { authenticateToken } from "./source/helpers/auth/authenticate_token.js";
import indexControllers from "./source/controllers/index.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up view engine
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "source", "views"));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/admin", publicRouter);

app.use("/admin", authenticateToken, privateRouter);
app.use("/", indexControllers);

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
