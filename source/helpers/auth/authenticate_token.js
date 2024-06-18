import jwt from "jsonwebtoken";

// ---------------- authenticate the token sent by the user
export const authenticateToken = (req, res, next) => {
  // get the cookie from the header
  const token = req.cookies.authorization;

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error(err);
      return res.render("admin/login");
    }

    req.user = user;

    next();
  });
};
