import express from "express";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Example protected route
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user.id,
  });
});

export default router;
