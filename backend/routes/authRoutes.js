import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ---------- SIGNUP ---------- */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- LOGIN ---------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Incorrect password" });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});


router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: "No account found with this email",
    });
  }

  user.resetPasswordToken = "ALLOW_RESET";
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  res.json({
    message: "Email verified. You can reset password now.",
  });
});


router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordToken: "ALLOW_RESET",
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      message: "Reset session expired. Try again.",
    });
  }

  // Hash password
  user.password = await bcrypt.hash(newPassword, 10);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
  },
});
});


export default router;
