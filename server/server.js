import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

console.log("🚀 Server initializing...");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
console.log("✅ Middleware configured: CORS and JSON parsing enabled");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("✅ Gemini AI client initialized");

// Root route
app.get("/", (req, res) => {
  console.log("📍 Root endpoint accessed");
  res.json({
    message: "Gemini Backend API is running!",
    endpoints: {
      chat: "POST /api/chat",
    },
  });
});

// Chat endpoint - receives message, adds to prompt, sends to Gemini
app.post("/api/chat", async (req, res) => {
  console.log("\n📨 Received chat request");

  try {
    const { message } = req.body;

    // Validate input
    if (!message) {
      console.log("❌ Error: No message provided");
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("📝 User message:", message);

    const customPrompt = `You are a helpful assistant. User asks: ${message}`;
    console.log("🔧 Custom prompt created:", customPrompt);

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("🤖 Using model: gemini-2.5-flash");

    // Generate content
    console.log("⏳ Sending request to Gemini API...");
    const result = await model.generateContent(customPrompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log("✅ Response received from Gemini");
    console.log(
      "📤 Generated text length:",
      generatedText.length,
      "characters"
    );
    console.log(
      "💬 Generated text preview:",
      generatedText.substring(0, 100) + "..."
    );

    // Return response to frontend
    res.json({
      success: true,
      response: generatedText,
      originalMessage: message,
    });

    console.log("✅ Response sent to frontend\n");
  } catch (error) {
    // Fix for 'error is of type unknown' - Type narrowing
    if (error instanceof Error) {
      console.error("❌ Error in /api/chat:", error.message);
      console.error("Stack trace:", error.stack);

      res.status(500).json({
        success: false,
        error: "Failed to generate response from Gemini",
        details: error.message,
      });
    } else {
      console.error("❌ Unknown error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate response from Gemini",
        details: "Unknown error occurred",
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log("\n🎉 Server is running!");
  console.log(`🌐 Listening on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log("\n💡 Ready to receive messages from frontend!\n");
});
