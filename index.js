import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

// set up the server
import express from "express";
const app = express();

// controllers
// import registrantControllers from "./source/controllers/registrant.js";
// import adminControllers from "./source/controllers/admin.js";
import adminControllers from "./source/controllers/admin.js";
import { authenticateToken } from "./source/helpers/auth/authenticate_token.js";

// Set up view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware
app.use(express.static("public"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
// app.use("/registrant", registrantControllers);
// app.use("/guardian", adminControllers);
app.use("/", adminControllers);

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
