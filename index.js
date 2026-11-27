import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

// set up the server
import express from "express";
const app = express();

// controllers & middleware
import { publicRouter, privateRouter } from "./source/controllers/admin.js";
import { authenticateToken } from "./source/auth/index.js";
import { indexRouter } from "./source/controllers/index.js";
import { requestLogger } from "./source/utils/index.js";
import { smsAdminRouter, smsWebhookRouter } from "./source/controllers/sms.js";
import { initializeSms, startSmsWorker } from "./source/services/sms.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up view engine
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "source", "views"));

// Middleware
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/webhooks/twilio", smsWebhookRouter);
app.use("/admin/sms", authenticateToken, smsAdminRouter);
app.use("/admin", requestLogger, authenticateToken, privateRouter);
app.use("/", requestLogger, indexRouter);

app.listen(process.env.PORT, async () => {
  console.log(`listening on port ${process.env.PORT}`);
  if (await initializeSms()) startSmsWorker();
});
