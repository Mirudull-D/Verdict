import express from "express";
import fs from "fs";
import path from "path";
import { upload, convertToWav } from "../lib/utils.js";
import { transcribeMiddleware } from "../middleware/transcribe.middleware.js";
import { llmMiddleware } from "../middleware/llm.middleware.js";
import { ttsMiddleware } from "../middleware/tts.middleware.js";

const router = express.Router();

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
    const enableTTS = req.body.enableTTS === "true" || false;

    console.log("📁 File received:", req.file);
    console.log("🌐 Language selected by user:", language);
    console.log("🔊 TTS Enabled:", enableTTS);

    filePath = req.file.path;
    wavPath = path.join("uploads", `${req.file.filename}.wav`);

    console.log("🔄 Converting audio to WAV format...");
    await convertToWav(filePath, wavPath);

    console.log("🔄 Reading WAV file...");
    const audioBuffer = fs.readFileSync(wavPath);

    req.audioBuffer = audioBuffer;
    req.language = language;
    req.filePath = filePath;
    req.wavPath = wavPath;
    req.originalFile = req.file;
    req.enableTTS = enableTTS;

    next();
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (wavPath && fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }

    next(error);
  }
};

const prepareLLMMessage = (req, res, next) => {
  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமிழ்)",
  };

  const langForContext = languageNames[req.language] || req.language;
  const userMessage = `Language: ${langForContext}\nTranscript:\n"""${req.transcript}"""`;

  req.userMessage = userMessage;
  req.languageContext = langForContext;

  next();
};

const finalHandler = (req, res) => {
  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமிழ்)",
  };

  const langForContext = languageNames[req.language] || req.language;

  const response = {
    success: true,
    transcription: req.transcript,
    language: langForContext,
    languageCode: req.language,
    fileName: req.originalFile.originalname,
    fileSize: req.originalFile.size,
    analysis: req.llmResponse,
    timestamp: new Date().toISOString(),
  };

  if (req.ttsAudioFileName) {
    response.audio = {
      fileName: req.ttsAudioFileName,
      url: `/audio/${req.ttsAudioFileName}`,
      description: "Text-to-speech audio of the analysis",
    };
  }

  res.json(response);

  if (req.filePath && fs.existsSync(req.filePath)) {
    fs.unlinkSync(req.filePath);
  }
  if (req.wavPath && fs.existsSync(req.wavPath)) {
    fs.unlinkSync(req.wavPath);
  }
  console.log("🗑️ Temporary files deleted");
};

router.post(
  "/",
  upload.single("audio"),
  preprocessAudio,
  transcribeMiddleware,
  prepareLLMMessage,
  llmMiddleware,
  (req, res, next) => {
    if (req.enableTTS) {
      return ttsMiddleware(req, res, next);
    }
    next();
  },
  finalHandler
);

export default router;
