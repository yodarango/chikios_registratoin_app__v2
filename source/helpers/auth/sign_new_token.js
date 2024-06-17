import jwt from "jsonwebtoken";

// sign the token
export const generateAccessToken = async (user) => {
  if (!user) {
    return;
  }
  return jwt.sign({ ...user }, process.env.JWT_SECRET, {
    expiresIn: "14d",
    // httpOnly: true,
  });
};
