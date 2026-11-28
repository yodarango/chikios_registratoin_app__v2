import { getAuthenticatedUser } from "./getAuthenticatedUser.js";

// ---------------- authenticate the token sent by the user
export const authenticateToken = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req.cookies.authorization);
    if (!user) {
      if (req.originalUrl.startsWith('/admin/sms') || req.originalUrl.startsWith('/admin/search/') || req.originalUrl.startsWith('/admin/live/')) return res.status(401).json({ success: false, error: 'Please sign in again.' });
      return res.render("admin/login");
    }

    if (user.type !== "admin") return res.status(403).send("Admin access required.");
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication failed:", error.message);
    res.status(503).send("Authentication temporarily unavailable.");
  }
};
