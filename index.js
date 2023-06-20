import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";

// set up the server
import express from "express";
import mongoose from "mongoose";
const app = express();

// controllers
import kidControllers from "./source/controllers/kids.js";
import kidControllersGet from "./source/controllers/kids_get.js";
import mainControllers from "./source/controllers/main.js";

//middleware
// app.set("view engine", "ejs");
app.use(express.static(`/public`));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static("public"));
app.use("/kids", kidControllers);
app.use("/admin", kidControllersGet);
app.use("/", mainControllers);

// db connection
export const dbConnection = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_DB, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`Successfully connected to ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
dbConnection();

app.listen(process.env.PORT, () => {
  console.log(`listening on post ${process.env.PORT}`);
});
