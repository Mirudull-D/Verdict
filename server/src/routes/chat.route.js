import express from "express";
import fs from "fs";
import { llmMiddleware } from "../middleware/llm.middleware.js";
import { ttsMiddleware } from "../middleware/tts.middleware.js";

const router = express.Router();

const prepareChatRequest = (req, res, next) => {
  const { question, language, enableTTS = false } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "No question provided",
    });
  }

  console.log("💬 Chat request received");
  console.log("📝 Question:", question);
  console.log("🌐 Language:", language || "Not specified");
  console.log("🔊 TTS Enabled:", enableTTS);

  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமிழ்)",
  };

  const langForContext = languageNames[language] || "English";
  const userMessage = `Language: ${langForContext}\nUser Question:\n"""${question}"""`;

  req.userMessage = userMessage;
  req.languageContext = langForContext;
  req.originalQuestion = question;
  req.enableTTS = enableTTS;

  next();
};

const finalHandler = (req, res) => {
  const response = {
    success: true,
    question: req.originalQuestion,
    language: req.languageContext,
    response: req.llmResponse,
    timestamp: new Date().toISOString(),
  };

  if (req.ttsAudioFileName) {
    response.audio = {
      fileName: req.ttsAudioFileName,
      url: `/audio/${req.ttsAudioFileName}`,
    };
  }

  res.json(response);
};

router.post(
  "/",
  prepareChatRequest,
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
