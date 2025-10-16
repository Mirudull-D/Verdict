import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export const ttsMiddleware = async (req, res, next) => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔊 STARTING TEXT-TO-SPEECH CONVERSION");
    console.log("=".repeat(70));

    const { llmResponse } = req;

    if (!llmResponse || llmResponse.trim() === "") {
      console.log("⚠️  No LLM response to convert, skipping TTS");
      return next();
    }

    console.log("📝 Text to convert:", llmResponse.substring(0, 100) + "...");
    console.log("📏 Text length:", llmResponse.length, "characters");

    const ttsModel = "facebook/mms-tts-eng";
    const apiUrl = `https://api-inference.huggingface.co/models/${ttsModel}`;

    console.log("🔄 Sending to Hugging Face TTS API:", apiUrl);

    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: llmResponse,
      }),
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log("📥 TTS Response status:", response.status);
    console.log("⏱️  TTS generation time:", durationMs, "ms");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ TTS API Error:", response.status, errorText);

      if (response.status === 503) {
        console.log("⚠️  TTS model loading, skipping audio generation");
        return next();
      }

      throw new Error(`TTS API returned ${response.status}: ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("📊 Audio buffer size:", audioBuffer.byteLength, "bytes");

    const timestamp = Date.now();
    const audioFileName = `tts_${timestamp}.flac`;
    const audioFilePath = path.join("uploads", audioFileName);

    fs.writeFileSync(audioFilePath, Buffer.from(audioBuffer));
    console.log("✅ Audio file saved:", audioFilePath);

    req.ttsAudioPath = audioFilePath;
    req.ttsAudioFileName = audioFileName;

    console.log("=".repeat(70) + "\n");

    next();
  } catch (error) {
    console.error("\n" + "❌".repeat(35));
    console.error("💥 ERROR IN TTS MIDDLEWARE");
    console.error("❌".repeat(35));
    console.error("❌ Error:", error.message);
    console.error("❌".repeat(35) + "\n");

    next();
  }
};
