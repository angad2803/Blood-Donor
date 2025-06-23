import express from "express";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
  res.json({ message: `Welcome user with ID ${req.user.id}` });
});

export default router;
