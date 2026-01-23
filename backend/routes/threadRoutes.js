import express from "express";
import Thread from "../models/Thread.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/* Create thread */
router.post("/threads", protect, async (req, res) => {
  const thread = await Thread.create({
    title: "New Chat",
    messages: [],
    user: req.user._id,
  });

  res.json(thread);
});

/* Get all threads of logged user */
router.get("/threads", protect, async (req, res) => {
  const threads = await Thread.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json(threads);
});

/* Get single thread */
router.get("/threads/:id", protect, async (req, res) => {
  const thread = await Thread.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!thread) return res.status(404).json({ error: "Thread not found" });

  res.json(thread);
});

/* Add message */
router.post("/threads/:id/messages", protect, async (req, res) => {
  const { role, content, language } = req.body;

  const thread = await Thread.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!thread) return res.status(404).json({ error: "Thread not found" });

  thread.messages.push({ role, content, language });

  /* Auto rename */
  if (
    role === "user" &&
    thread.title === "New Chat" &&
    thread.messages.length === 1
  ) {
    thread.title = content.split("\n")[0].slice(0, 40);
  }

  await thread.save();
  res.json(thread);
});

/* Rename thread */
router.put("/threads/:id", protect, async (req, res) => {
  const thread = await Thread.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title: req.body.title },
    { new: true }
  );

  res.json(thread);
});

/* Delete thread */
router.delete("/threads/:id", protect, async (req, res) => {
  await Thread.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  res.json({ success: true });
});

export default router;
