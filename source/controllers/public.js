// // config
// import express from "express";
// const router = express.Router();

// router.use(express.json({ limit: "5mb" }));
// router.use(express.urlencoded({ extended: false }));

// import { join } from "path";
// import { dirname } from "path";
// import { fileURLToPath } from "url";

// const __dirname = dirname(fileURLToPath(import.meta.url));
// const pub = join(__dirname, "..", "..", "public");

// // middleware
// import { generateAccessToken } from "../helpers/auth/sign_new_token.js";

// // register
// router.get("/", async (req, res) => {
//   console.log(
//     "--------------------------------------------------------",
//     "GET: /",
//     "--------------------------------------------------------"
//   );
//   return res.sendFile(join(pub, "index.html"));
// });

// // login
// router.get("/login", async (req, res) => {
//   res.sendFile(join(pub, "admin", "login.html"));
// });

// // login
// router.post("/login", async (req, res) => {
//   if (req.cookies.authorization) {
//     res.redirect("/admin/users");
//     return;
//   }

//   try {
//     if (
//       req?.body?.username.toLowerCase() === "admin" &&
//       req?.body?.password === "K1dzqu35T_NYC_202E"
//     ) {
//       const token = await generateAccessToken({
//         username: req?.body?.username,
//         email: req?.body?.admin_email,
//       });

//       res.send({ token });
//     }
//   } catch (error) {
//     console.log(error);
//     res.send({ error: "wrong pass" });
//   }
// });

// // repeated as the admin route but with a different route because I messed up the codes
// // get all the users
// router.get("/home/users", async (req, res) => {
//   try {
//     res.sendFile(join(pub, "admin", "user_home.html"));
//   } catch (error) {
//     console.log(error);
//   }
// });

// export default router;
