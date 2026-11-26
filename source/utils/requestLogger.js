export function requestLogger(req, res, next) {
  // Request bodies can contain passwords, phone numbers and children's data.
  console.log(`${req.method} ${req.path}`);
  next();
}
