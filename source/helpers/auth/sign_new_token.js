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
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      httpOnly: true,
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
