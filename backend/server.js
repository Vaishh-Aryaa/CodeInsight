import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import threadRoutes from "./routes/threadRoutes.js";


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api", threadRoutes);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function detectLanguage(code) {
  if (/^\s*#include\s*</m.test(code)) return "C++";
  if (/\busing\s+System\b|\bConsole\.WriteLine\b/.test(code)) return "C#";
  if (/\bpublic\s+class\b|\bSystem\.out\.println\b/.test(code)) return "Java";
  if (/\bdef\b|\bprint\s*\(|\brange\s*\(/.test(code)) return "Python";
  if (/\bconsole\.log\b|\bfunction\b|\b=>\b/.test(code)) return "JavaScript";
  return "Unknown";
}

app.post("/api/explain", async (req, res) => {
  try {
    // FIRST read code
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided." });
    }

    // THEN detect language
    const language = detectLanguage(code);
    console.log("Detected language:", language);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an expert software engineer and teacher.
Your job is to explain ONLY the given code.

The input code language is: ${language}.

Rules:
- Do NOT answer general questions
- Do NOT add unrelated information
- Assume the reader is a beginner

Structure your response strictly in this format:

Language:
- ${language}

Overview:
- Briefly explain what the code does

Logic:
- Explain step by step

Output:
- Describe the output

Notes:
- Important observations if any
          `,
        },
        {
          role: "user",
          content: code,
        },
      ],
    });

    // SEND language to frontend
    res.json({
      language,
      explanation: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate explanation",
    });
  }
});

app.get("/", (req, res) => res.send("Backend is live"));

const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });