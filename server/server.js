import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import voiceRouter from "./src/routes/gemini.routes.js";

dotenv.config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in .env file!");
  process.exit(1);
}

if (!process.env.ASSEMBLYAI_API_KEY) {
  console.error("❌ ASSEMBLYAI_API_KEY not found in .env file!");
  process.exit(1);
}

console.log("🚀 Server initializing...");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
console.log("✅ Middleware configured");

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("📁 Created uploads directory");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("✅ Gemini AI client initialized");

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Voice AI Backend with AssemblyAI + Gemini",
    endpoints: {
      chat: "POST /api/chat",
      voice: "POST /api/voice",
    },
    features: {
      languages: "99+ languages supported (Hindi, Urdu, Tamil, etc.)",
      transcription: "AssemblyAI Universal Model",
      ai: "Google Gemini 1.5 Flash",
    },
  });
});

// Text chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log("\n📨 Received text chat request");

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("📝 User message:", message);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    console.log("⏳ Generating response...");
    const result = await model.generateContent(message);
    const response = result.response;
    const generatedText = response.text();

    console.log("✅ Response generated!");

    res.json({
      success: true,
      response: generatedText,
      originalMessage: message,
    });

    console.log("✅ Response sent to frontend\n");
  } catch (error) {
    console.error("❌ Error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// Voice routes (with transcription middleware)
app.use("/api", voiceRouter);

// Start server
app.listen(PORT, () => {
  console.log("\n🎉 Server is running!");
  console.log(`🌐 Listening on http://localhost:${PORT}`);
  console.log(`📡 Text endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🎤 Voice endpoint: http://localhost:${PORT}/api/voice`);
});
