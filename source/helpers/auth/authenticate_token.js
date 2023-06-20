import jwt from "jsonwebtoken";

// ---------------- authenticate the token sent by the user
export const authenticateToken = (req, res, next) => {
  // get the cookie from the header
  const token = req.cookies.authorization;

  if (token == null) return res.redirect("/login");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
};
