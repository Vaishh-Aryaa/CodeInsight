import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: String,
  language: String,
  createdAt: { type: Date, default: Date.now }
});

const threadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "New Chat",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        role: String,
        content: String,
        language: String,
      },
    ],
  },
  { timestamps: true }
);


export default mongoose.model("Thread", threadSchema);
