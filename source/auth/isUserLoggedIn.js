export const isUserLoggedIn = (req, res, next) => {
  const user = req.cookies.authorization;
  if (user) {
    res.redirect("/admin");
  } else {
    next();
  }
};
