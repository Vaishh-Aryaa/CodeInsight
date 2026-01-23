import mongoose from "mongoose";

const explanationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Explanation", explanationSchema);
