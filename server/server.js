import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Import routes
import transcribeRoute from "./src/routes/transcribe.route.js";
import chatRoute from "./src/routes/chat.route.js";
import legalRoute from "./src/routes/legal.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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

// Serve audio files
app.use("/audio", express.static(path.join(__dirname, "uploads")));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "⚖️  Legal Assistant API for Police Officers",
    status: "active",
    description:
      "AI-powered legal research assistant for Indian criminal law (IPC/CrPC)",
    endpoints: {
      legal: {
        path: "/api/legal",
        method: "POST",
        description:
          "Submit incident details and get applicable IPC/CrPC sections, case law, and investigation tips",
        accepts: "application/json",
        required_fields: ["narrative"],
        optional_fields: [
          "location_state",
          "date_time",
          "known_sections_or_acts",
          "key_entities",
          "evidence_available",
          "aggravating_factors",
          "enableTTS",
        ],
      },
      transcribe: {
        path: "/api/transcribe",
        method: "POST",
        description:
          "Upload audio complaint/statement, transcribe, and get AI analysis",
        accepts: "multipart/form-data (audio file + language + enableTTS)",
      },
      chat: {
        path: "/api/chat",
        method: "POST",
        description: "General legal questions in text format",
        accepts: "application/json (question + language + enableTTS)",
      },
      audio: {
        path: "/audio/:filename",
        method: "GET",
        description: "Stream generated TTS audio files",
      },
    },
    supportedLanguages: [
      "English",
      "Hindi (हिन्दी)",
      "Tamil (தமிழ்)",
      "Auto-detect",
    ],
    features: [
      "IPC/CrPC Section Mapping",
      "Similar Case Law Search",
      "Investigation Tips",
      "Source Verification",
      "Speech-to-Text for Complaints",
      "Text-to-Speech for Reports",
      "Multi-language Support",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/api/legal", legalRoute);
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
    available_endpoints: ["/api/legal", "/api/transcribe", "/api/chat"],
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  ⚖️   Legal Assistant API Started          ║
  ╠═══════════════════════════════════════════╣
  ║  Server: http://localhost:${PORT}            ║
  ║  Endpoints:                               ║
  ║    - POST /api/legal (IPC/CrPC research)  ║
  ║    - POST /api/transcribe (audio)         ║
  ║    - POST /api/chat (general questions)   ║
  ║    - GET /audio/:filename (TTS)           ║
  ║  Languages: English, Hindi, Tamil         ║
  ║  Engine: HF Whisper + LLM + Legal AI      ║
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
