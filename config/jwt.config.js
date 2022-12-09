import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const { _id, name, email, role } = user;
  const signature = process.env.TOKEN_SIGN_SECRET;
  const expiration = process.env.TOKEN_EXPIRATION;

  return jwt.sign({ _id, name, email, role }, signature, {
    expiresIn: expiration,
  });
};

export default generateToken;
