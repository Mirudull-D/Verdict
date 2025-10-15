import express from "express";
import fs from "fs";
import cors from "cors";

import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Import routes
import transcribeRoute from "./src/routes/transcribe.route.js";
import chatRoute from "./src/routes/chat.route.js";

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("📁 Created uploads directory");
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🎙️ Audio Transcription & Chat Server is running!",
    status: "active",
    endpoints: {
      transcribe: {
        path: "/api/transcribe",
        method: "POST",
        description: "Upload audio, transcribe, and get AI analysis",
        accepts: "multipart/form-data (audio file + language)",
      },
      chat: {
        path: "/api/chat",
        method: "POST",
        description: "Send text question and get AI response",
        accepts: "application/json (question + language)",
      },
    },
    supportedLanguages: [
      "English",
      "Hindi (हिन्दी)",
      "Tamil (தமிழ்)",
      "Auto-detect",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/api/transcribe", transcribeRoute);
app.use("/api/chat", chatRoute);

// Global error handler
app.use((err, req, res, next) => {
  console.error("\n" + "❌".repeat(35));
  console.error("💥 GLOBAL ERROR HANDLER");
  console.error("❌".repeat(35));
  console.error("❌ Error type:", err.name);
  console.error("❌ Error message:", err.message);
  console.error("❌ Error stack:", err.stack);

  if (err.response) {
    console.error("\n📥 API Error Response:");
    console.error("  - Status:", err.response.status);
    console.error("  - Status text:", err.response.statusText);
    console.error("  - Data:", JSON.stringify(err.response.data, null, 2));
  }
  console.error("❌".repeat(35) + "\n");

  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🎙️  Audio Transcription Server Started    ║
  ╠═══════════════════════════════════════════╣
  ║  Server: http://localhost:${PORT}            ║
  ║  Endpoints:                               ║
  ║    - POST /api/transcribe (audio)         ║
  ║    - POST /api/chat (text only)           ║
  ║  Languages: English, Hindi, Tamil         ║
  ║  Engine: HF Whisper + LLM (router)        ║
  ║  Status: ✅ Ready                         ║
  ╚═══════════════════════════════════════════╝
  `);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  if (fs.existsSync("uploads")) {
    const files = fs.readdirSync("uploads");
    files.forEach((file) => {
      fs.unlinkSync(path.join("uploads", file));
    });
    console.log("🧹 Cleaned up temporary files");
  }
  process.exit(0);
});
