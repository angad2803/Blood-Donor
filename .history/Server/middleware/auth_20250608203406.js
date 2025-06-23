import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "No token, access denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user data to request
    next(); // Go to next middleware or controller
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
