import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";
import { transcribeAudio } from "../middleware/transcribe.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Voice message route with transcription middleware
router.post(
  "/voice",
  upload.single("audio"),
  transcribeAudio,
  async (req, res) => {
    console.log("\n🤖 Gemini Processing Started");

    try {
      // Get transcription from middleware
      const { text, language, confidence } = req.transcription;

      console.log("📝 Processing transcription with Gemini...");
      console.log("🗣️ User said (in", language + "):", text);

      // Create prompt for Gemini
      const prompt = `The user said (in ${language} language): "${text}". Please respond naturally and helpfully to their message.`;

      // Get Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      console.log("🤖 Using model: gemini-2.5-pro");

      // Generate response
      console.log("⏳ Generating AI response...");
      const result = await model.generateContent(prompt);
      const response = result.response;
      const aiResponse = response.text();

      console.log("✅ AI Response generated!");
      console.log("💬 Response length:", aiResponse.length, "characters");

      // Clean up: delete uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Temporary file deleted");
      }

      // Send response to frontend
      res.json({
        success: true,
        transcription: text,
        language: language,
        confidence: confidence,
        response: aiResponse,
      });

      console.log("✅ Response sent to frontend\n");
    } catch (error) {
      console.error("❌ Error processing with Gemini:", error.message);

      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: "Failed to generate AI response",
        details: error.message,
      });
    }
  }
);

export default router;
