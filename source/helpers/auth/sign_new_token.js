import jwt from "jsonwebtoken";

// --------- sign the token
export const generateAccessToken = async (user) => {
  if (!user) {
    return;
  }
  return jwt.sign(
    { ...user },
    process.env.JWT_SECRET,
    {
      expiresIn: 60 * 60 * 26,
    }
    // (err, token) => {
    //   if (err) {
    //     console.log(err);
    //     return err;
    //   }
    //   console.log(token);
    // }
  );
};
