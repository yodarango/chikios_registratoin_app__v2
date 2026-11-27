import jwt from "jsonwebtoken";

// ---------------- authenticate the token sent by the user
export const authenticateToken = (req, res, next) => {
  // get the cookie from the header
  const token = req.cookies.authorization;

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (req.originalUrl.startsWith('/admin/sms') || req.originalUrl.startsWith('/admin/search/') || req.originalUrl.startsWith('/admin/live/')) return res.status(401).json({ success: false, error: 'Please sign in again.' });
      return res.render("admin/login");
    }

    req.user = user;

    next();
  });
};
