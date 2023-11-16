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
      expiresIn: "14d", // 14 days from now
      // httpOnly: true,
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
