import { User } from "../modules/user/user.model.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { BlacklistToken } from "../modules/user/blacklistToken.model.js";

export const authMiddleware = async (req, res, next) => {

  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  const isBlacklisted = await BlacklistToken.findOne({ token });
  if (isBlacklisted) {
    throw new ApiError(401, "Token has been blacklisted");
  }

  if (!token) {
    throw new ApiError(401, "Authorization header missing or malformed");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  req.user = user;
  next();

};