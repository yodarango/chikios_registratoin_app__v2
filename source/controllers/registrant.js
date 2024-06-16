// // config
// import { fileURLToPath } from "url";
// const router = express.Router();
// import { dirname } from "path";
// import express from "express";
// import { promises } from "fs";
// import { join } from "path";
// import cors from "cors";

// // models
// import { calculateBase64SizeInMB } from "../../utils/calculateBase64Size.js";
// import { currTime } from "../helpers/temp/current_time.js";
// import { executeQuery } from "../db/connection.js";

// const __dirname = dirname(fileURLToPath(import.meta.url));

// const photosDir = join(__dirname, "..", "..", "public", "photos");
// const fsPromises = promises;

// // parse body
// router.use(express.urlencoded({ extended: true }));
// router.use(express.json({ limit: "3mb" }));

// router.use(cors());

// // gets all users
// router.get("/", (req, res) => {
//   res.sendFile(join(pub, "admin", "users.html"));
// });

// // get single user
// router.get("/user", (req, res) => {
//   res.sendFile(join(pub, "admin", "user.html"));
// });

// // get all the users
// router.get("/users", async (req, res) => {
//   try {
//     // find a child by last name
//     if (req.query.ln) {
//       const kids = await executeQuery(
//         `SELECT * FROM registrant WHERE last_name LIKE ?`,
//         [`%${req.query.ln}%`]
//       );

//       const count = kids.results.length;

//       res.send({ kids: kids.results, count });
//       return;
//     }

//     const skip = req.query.skip || 1000;
//     const kids = await executeQuery(
//       `SELECT * FROM registrant WHERE ID < ? LIMIT 20`,
//       [skip]
//     );

//     const kidCount = await executeQuery(
//       `SELECT COUNT(ID) as count FROM registrant`,
//       [skip]
//     );

//     const count = kidCount.results[0]?.count;

//     res.send({ kids: kids.results, count });
//     return;
//   } catch (error) {
//     console.log(error);
//     return `the following error ocurred ${error}`;
//   }
// });

// // get the registrant's info as well as the child info
// router.get("/kid/:id", async (req, res) => {
//   console.log(req.params.id);
//   try {
//     if (req.params.id) {
//       const kids = await executeQuery(
//         `
//       SELECT r.*, r.first_name as guardian_first_name, r.last_name as guardian_last_name, g.phone_number as guardian_phone_number
//       FROM registrant as r
//       LEFT JOIN guardian as g
//       ON r.ID = g.registrant_id
//       WHERE r.ID = ?
//       `,
//         [req.params.id]
//       );

//       console.log(kids);

//       res.send({ kids: kids.results, status: 200 });
//     }
//   } catch (error) {
//     console.log(error);
//     return `the following error ocurred ${error}`;
//   }
// });

// router.delete("/kid/delete/:id", async (req, res) => {
//   try {
//     const kids = await executeQuery(
//       `
//       DELETE FROM registrant WHERE ID  = ?
//       `,
//       [req.params.id]
//     );

//     if (!(kids.results.affectedRows > 0)) {
//       return res.send({ kids: null, status: 500 });
//     }

//     return res.send({ kids: kids.results.affectedRows, status: 200 });
//   } catch (error) {
//     res.send(false);
//     console.log(error);
//   }
// });

// // write photo to disk
// router.post("/upload-photo", async (req, res) => {
//   const timestamp = Date.now();
//   const filename = `${timestamp}.png`;
//   console.log(
//     "-------------------------------------------------------- \n",
//     "POST: /upload-photo \n",
//     "-------------------------------------------------------- \n"
//   );
//   console.log("📝 writing photo to disk");
//   async function savePhoto(base64) {
//     try {
//       const split = base64.split(",");
//       const mimetype = split[0].split(":")[1].split(";")[0];
//       const buffer = Buffer.from(split[1], "base64");

//       console.log("mimetype...................", mimetype);
//       console.log(
//         "size in MB.....................",
//         calculateBase64SizeInMB(base64)
//       );

//       await fsPromises.mkdir(photosDir, { recursive: true });

//       //const filename = `${Date.now()}.${mimetype.split("/")[1]}`;
//       const path = join(photosDir, filename);

//       await fsPromises.writeFile(path, buffer);

//       console.log("✅ Successfully wrote photo to disk!");
//       console.log("image path.....................", `${filename}`);

//       return res.send({ path: `${filename}`, status: 200 });
//     } catch (error) {
//       console.log("error saving photo", error);
//       res.send({ error: "error uploading photo", status: 500 });
//     }
//   }

//   savePhoto(req.body.file);
// });

// // register
// router.post("/register", async (req, res, next) => {
//   console.log(
//     "-------------------------------------------------------- \n",
//     "POST: /register \n",
//     "-------------------------------------------------------- \n"
//   );
//   console.log("📝 registering child");
//   console.log("payload.....................", req.body);
//   const {
//     guardian_phone_number: g_phone_number,
//     guardian_first_name: g_first_name,
//     guardian_last_name: g_last_name,
//     profile_picture,
//     first_name,
//     last_name,
//     gender,
//     age,
//   } = req.body;

//   try {
//     const insertKid = await executeQuery(
//       `INSERT INTO registrant (first_name, last_name, age, gender, profile_picture)
//        VALUES(?, ?, ?, ?, ?);`,
//       [first_name, last_name, age, gender, profile_picture]
//     );

//     // the Kid record was not inserted
//     if (!(insertKid.results.insertId > 0)) {
//       res.status(500).send({
//         success: null,
//         error: "error saving registrant record",
//         id: null,
//       });
//       return;
//     }

//     console.log("✅ Successfully registered child!");
//     console.log("child id.....................", insertKid.results.insertId);
//     console.log("📝 Writing guardian");

//     // get the child ID and insert the parent now
//     const insertParent = await executeQuery(
//       `INSERT INTO guardian (first_name, last_name, phone_number, registrant_id)
//        VALUES(?, ?, ?, ?)`,
//       [g_first_name, g_last_name, g_phone_number, insertKid.results.insertId]
//     );

//     if (!(insertParent.results.insertId > 0)) {
//       res.status(500).send({
//         success: null,
//         error: "error saving guardian record",
//         id: null,
//       });
//       return;
//     }

//     console.log("✅ Successfully registered guardian!");

//     return res.send({
//       success: "child successfully registered",
//       id: insertKid.results.insertId,
//     });
//   } catch (error) {
//     console.log("error registering child and guardian", error);
//     res.send({ error, id: null });
//     return `the following error ocurred ${error}`;
//   }
// });

// // check-in
// router.put("/check-in/:id", async (req, res) => {
//   console.log(
//     "-------------------------------------------------------- \n",
//     "PUT: /check-in/" + req.params.id + " \n",
//     "-------------------------------------------------------- \n"
//   );
//   console.log("📝 checking-in child");
//   console.log("payload.....................", req.body);

//   try {
//     // get the child ID and insert the parent now
//     const checkIn = await executeQuery(
//       `UPDATE registrant
//       SET checked_in = TRUE
//       WHERE ID = ?`,
//       [req.params.id]
//     );

//     if (!(checkIn.results.affectedRows > 0)) {
//       res.status(500).send({
//         id: null,
//         time: null,
//         status: 500,
//         error: "Error checking-in record",
//       });

//       return;
//     }

//     console.log("✅ Successfully checked-in child!");
//     console.log("child id.....................", req.params.id);

//     return res.status(200).send({
//       id: req.params.id,
//       time: currTime(),
//       status: 200,
//     });
//   } catch (error) {
//     console.log(error);
//     return `the following error ocurred ${error}`;
//   }
// });

// // checkout
// router.put("/check-out/:id", async (req, res) => {
//   console.log(
//     "-------------------------------------------------------- \n",
//     "PUT: /check-out/" + req.params.id + " \n",
//     "-------------------------------------------------------- \n"
//   );

//   console.log("📝 checking-out child");
//   console.log("payload.....................", req.body);

//   try {
//     // get the child ID and insert the parent now
//     const checkOut = await executeQuery(
//       `UPDATE registrant
//       SET checked_in = FALSE
//       WHERE ID = ?`,
//       [req.params.id]
//     );

//     if (!(checkOut.results.affectedRows > 0)) {
//       res.status(500).send({
//         id: null,
//         time: null,
//         status: null,
//         error: "Error checking-in record",
//       });

//       return;
//     }

//     console.log("✅ Successfully checked-out child!");
//     return res.status(200).send({
//       id: req.params.id,
//       time: currTime(),
//       status: 200,
//     });
//   } catch (error) {
//     console.log(error);
//     return `the following error ocurred ${error}`;
//   }
// });

// export default router;
