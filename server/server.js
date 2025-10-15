import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("📁 Created uploads directory");
}

const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log("🔄 Converting:", inputPath, "->", outputPath);

    ffmpeg(inputPath)
      .toFormat("wav")
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("end", () => {
        console.log("✅ Audio conversion completed");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Audio conversion error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

app.get("/", (req, res) => {
  res.json({
    message: "🎙️ Audio Transcription Server is running!",
    status: "active",
    supportedLanguages: [
      "English",
      "Hindi (हिन्दी)",
      "Tamil (தமிழ்)",
      "Auto-detect",
    ],
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  let filePath = null;
  let wavPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
      });
    }

    // Get language from frontend (this is what you wanted!)
    const language = req.body.language || "auto";

    console.log("📁 File received:", req.file);
    console.log("🌐 Language selected by user:", language);

    filePath = req.file.path;
    wavPath = path.join("uploads", `${req.file.filename}.wav`);

    console.log("🔄 Converting audio to WAV format...");
    await convertToWav(filePath, wavPath);

    console.log("🔄 Reading WAV file...");
    const audioBuffer = fs.readFileSync(wavPath);
    console.log("📊 Audio buffer size:", audioBuffer.length, "bytes");

    // Build the API URL with language parameter if not auto
    let apiUrl =
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

    // Add query parameters for language if specified
    if (language !== "auto") {
      // Map frontend language codes to Whisper language codes
      const languageMap = {
        english: "en",
        hindi: "hi",
        tamil: "ta",
      };

      const whisperLangCode = languageMap[language] || language;
      apiUrl += `?language=${whisperLangCode}`;
      console.log("🌐 Using language code:", whisperLangCode);
    } else {
      console.log("🌐 Using automatic language detection");
    }

    console.log("🔄 Sending to Hugging Face API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);

      if (response.status === 503) {
        return res.status(503).json({
          success: false,
          error: "Model is loading. Please wait 20-30 seconds and try again.",
          details: errorText,
        });
      }

      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ API Response:", JSON.stringify(result, null, 2));

    let transcript = "";

    if (typeof result === "string") {
      transcript = result;
    } else if (result.text) {
      transcript = result.text;
    } else if (Array.isArray(result) && result[0]?.text) {
      transcript = result[0].text;
    } else {
      console.error("❌ Unexpected response format:", result);
      transcript = "Unable to extract transcription";
    }

    console.log("✅ Transcription:", transcript);

    // Map language codes back to full names for response
    const languageNames = {
      auto: "Auto-detected",
      english: "English",
      hindi: "Hindi (हिन्दी)",
      tamil: "Tamil (தமிழ்)",
    };

    res.json({
      success: true,
      transcription: transcript,
      language: languageNames[language] || language,
      languageCode: language,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      timestamp: new Date().toISOString(),
    });

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (wavPath && fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }
    console.log("🗑️ Temporary files deleted");
  } catch (error) {
    console.error("❌ Error processing audio:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (wavPath && fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }

    res.status(500).json({
      success: false,
      error: "Failed to process audio file.",
      details: error.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🎙️  Audio Transcription Server Started  ║
  ╠═══════════════════════════════════════════╣
  ║  Server: http://localhost:${PORT}           ║
  ║  API Endpoint: /api/transcribe            ║
  ║  Languages: English, Hindi, Tamil         ║
  ║  Engine: Hugging Face Whisper API         ║
  ║  Status: ✅ Ready                          ║
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
