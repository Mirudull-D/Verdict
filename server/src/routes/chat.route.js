import express from "express";
import { llmMiddleware } from "../middleware/llm.middleware.js";

const router = express.Router();

// Pre-processing middleware: Validate and prepare chat request
const prepareChatRequest = (req, res, next) => {
  const { question, language } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "No question provided",
    });
  }

  console.log("💬 Chat request received");
  console.log("📝 Question:", question);
  console.log("🌐 Language:", language || "Not specified");

  const languageNames = {
    auto: "Auto-detected",
    english: "English",
    hindi: "Hindi (हिन्दी)",
    tamil: "Tamil (தமிழ்)",
  };

  const langForContext = languageNames[language] || "English";
  const userMessage = `Language: ${langForContext}\nUser Question:\n"""${question}"""`;

  // Attach data to request for middleware
  req.userMessage = userMessage;
  req.languageContext = langForContext;
  req.originalQuestion = question;

  next();
};

// Final handler: Send response
const finalHandler = (req, res) => {
  res.json({
    success: true,
    question: req.originalQuestion,
    language: req.languageContext,
    response: req.llmResponse,
    timestamp: new Date().toISOString(),
  });
};

// Route with middleware chain
router.post("/", prepareChatRequest, llmMiddleware, finalHandler);

export default router;
