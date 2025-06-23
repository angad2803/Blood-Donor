import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ✅ import your User model

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch full user from database
    const user = await User.findById(decoded.id).select("-password"); // exclude password for safety
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user; // ✅ Full user object now available
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
