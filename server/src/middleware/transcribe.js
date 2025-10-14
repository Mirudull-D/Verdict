import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const assemblyAI = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export const transcribeAudio = async (req, res, next) => {
  console.log("\n🎤 Transcription Middleware Started");

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log("📁 Audio file received:", req.file.originalname);
    console.log("📊 File size:", (req.file.size / 1024).toFixed(2), "KB");

    const filePath = req.file.path;

    // Configure transcription parameters
    const params = {
      audio: filePath,
      speech_model: "universal", // Supports 99 languages
      language_detection: true, // Auto-detect language
      // Or specify a language: language_code: "hi" for Hindi
      speaker_labels: false, // Set to true if you want speaker diarization
    };

    console.log("⏳ Transcribing audio with AssemblyAI...");
    console.log("🌍 Auto-detecting language from 99+ supported languages");

    // Transcribe the audio
    const transcript = await assemblyAI.transcripts.transcribe(params);

    // Check transcription status
    if (transcript.status === "error") {
      console.error("❌ Transcription failed:", transcript.error);
      return res.status(500).json({
        success: false,
        error: "Transcription failed",
        details: transcript.error,
      });
    }

    console.log("✅ Transcription successful!");
    console.log("🗣️ Detected language:", transcript.language_code);
    console.log("📝 Transcribed text:", transcript.text);
    console.log("🎯 Confidence:", transcript.confidence);

    // Attach transcription data to request for next middleware/route
    req.transcription = {
      text: transcript.text,
      language: transcript.language_code,
      confidence: transcript.confidence,
      words: transcript.words,
      duration: transcript.audio_duration,
    };

    // Move to next middleware (Gemini processing)
    next();
  } catch (error) {
    console.error("❌ Error in transcription middleware:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      error: "Failed to transcribe audio",
      details: error.message,
    });
  }
};
