import express from "express";
import fs from "fs";
import path from "path";
import { upload, convertToWav } from "../lib/utils.js";
import { transcribeMiddleware } from "../middleware/transcribe.middleware.js";
import { llmMiddleware } from "../middleware/llm.middleware.js";

const router = express.Router();

// Pre-processing middleware: Handle file upload and conversion
const preprocessAudio = async (req, res, next) => {
  let filePath = null;
  let wavPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
      });
    }

    const language = req.body.language || "auto";

    console.log("📁 File received:", req.file);
    console.log("🌐 Language selected by user:", language);

    filePath = req.file.path;
    wavPath = path.join("uploads", `${req.file.filename}.wav`);

    console.log("🔄 Converting audio to WAV format...");
    await convertToWav(filePath, wavPath);

    console.log("🔄 Reading WAV file...");
    const audioBuffer = fs.readFileSync(wavPath);

    // Attach data to request for middleware chain
    req.audioBuffer = audioBuffer;
    req.language = language;
    req.filePath = filePath;
    req.wavPath = wavPath;
    req.originalFile = req.file;

    next();
  } catch (error) {
    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (wavPath && fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }

    next(error);
  }
};

// Middleware: Prepare LLM message from transcript
const prepareLLMMessage = (req, res, next) => {
  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமिழ்)",
  };

  const langForContext = languageNames[req.language] || req.language;
  const userMessage = `Language: ${langForContext}\nTranscript:\n"""${req.transcript}"""`;

  req.userMessage = userMessage;
  req.languageContext = langForContext;

  next();
};

// Final handler: Send response and cleanup
const finalHandler = (req, res) => {
  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமிழ்)",
  };

  const langForContext = languageNames[req.language] || req.language;

  res.json({
    success: true,
    transcription: req.transcript,
    language: langForContext,
    languageCode: req.language,
    fileName: req.originalFile.originalname,
    fileSize: req.originalFile.size,
    analysis: req.llmResponse,
    timestamp: new Date().toISOString(),
  });

  // Cleanup temporary files
  if (req.filePath && fs.existsSync(req.filePath)) {
    fs.unlinkSync(req.filePath);
  }
  if (req.wavPath && fs.existsSync(req.wavPath)) {
    fs.unlinkSync(req.wavPath);
  }
  console.log("🗑️ Temporary files deleted");
};

// Route with middleware chain
router.post(
  "/",
  upload.single("audio"),
  preprocessAudio,
  transcribeMiddleware,
  prepareLLMMessage,
  llmMiddleware,
  finalHandler
);

export default router;
