import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import threadRoutes from "./routes/threadRoutes.js";

import rateLimit from "express-rate-limit";

// ✅ Gemini Import
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use("/api/auth", authRoutes);
app.use("/api", threadRoutes);


// ✅ RATE LIMIT (Prevent Render Crash)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // max 15 requests per minute
  message: {
    error: "Too many requests. Please wait a minute.",
  },
});

app.use("/api/explain", limiter);


// ✅ OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ✅ Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// ✅ Language Detection
function detectLanguage(code) {
  if (/^\s*#include\s*</m.test(code)) return "C++";
  if (/\busing\s+System\b|\bConsole\.WriteLine\b/.test(code)) return "C#";
  if (/\bpublic\s+class\b|\bSystem\.out\.println\b/.test(code)) return "Java";
  if (/\bdef\b|\bprint\s*\(|\brange\s*\(/.test(code)) return "Python";
  if (/\bconsole\.log\b|\bfunction\b|\b=>\b/.test(code)) return "JavaScript";
  return "Unknown";
}


// ✅ Prompt Builder (Better Markdown Output)
function buildPrompt(code, language) {
  return `
You are a coding tutor.

Explain the following ${language} code in Markdown format.

### Format strictly like this:

## Language
${language}

## Overview
- What this code does

## Step-by-step Logic
- Explain clearly

## Output
- What will happen when run

## Notes
- Any important points

Code:
\`\`\`
${code}
\`\`\`
`;
}


// ✅ OpenAI Explanation Function
async function explainWithOpenAI(code, language) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful programming tutor.",
      },
      {
        role: "user",
        content: buildPrompt(code, language),
      },
    ],
  });

  return response.choices[0].message.content;
}


// ✅ Gemini Explanation Function
async function explainWithGemini(code, language) {
  const result = await geminiModel.generateContent(
    buildPrompt(code, language)
  );

  return result.response.text();
}


// ✅ Main Explain Route (Retry + Fallback)
// ✅ Main Explain Route (Retry + Fallback)
app.post("/api/explain", async (req, res) => {
  try {
    const { code } = req.body;

    console.log("Received code:", code);

    if (!code) {
      return res.status(400).json({ error: "No code provided." });
    }

    const language = detectLanguage(code);
    console.log("Detected Language:", language);

    let explanation;

    // ✅ Try OpenAI first
try {
  console.log("Trying OpenAI...");
  explanation = await explainWithOpenAI(code, language);

} catch (err) {

  // ✅ If quota finished → directly Gemini
  if (err.code === "insufficient_quota") {
    console.log("OpenAI quota exceeded. Switching directly to Gemini...");
    explanation = await explainWithGemini(code, language);

  } else {
    console.log("OpenAI failed. Switching to Gemini...");
    explanation = await explainWithGemini(code, language);
  }
}


    if (!explanation) {
      return res.status(500).json({
        error: "No explanation generated",
      });
    }

    res.json({
      language,
      explanation,
    });

  } catch (error) {
    console.error("Final Error:", error.message);

    res.status(500).json({
      error: "Both OpenAI and Gemini failed. Try again later.",
    });
  }
});


// ✅ Health Check
app.get("/", (req, res) => res.send("Backend is live 🚀"));


// ✅ Start Server
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
