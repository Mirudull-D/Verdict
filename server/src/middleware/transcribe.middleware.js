import fetch from "node-fetch";

export const transcribeMiddleware = async (req, res, next) => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🎙️ STARTING SPEECH-TO-TEXT TRANSCRIPTION");
    console.log("=".repeat(70));

    const { audioBuffer, language = "auto" } = req;

    if (!audioBuffer) {
      return res.status(400).json({
        success: false,
        error: "No audio buffer found in request",
      });
    }

    console.log("📊 Audio buffer size:", audioBuffer.length, "bytes");
    console.log("🌐 Requested language:", language);
    console.log("ℹ️  Note: Whisper will auto-detect language");

    const apiUrl =
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

    console.log("🔄 Sending to Hugging Face Whisper API:", apiUrl);

    const startTime = Date.now();

    // Send raw audio buffer - Whisper will auto-detect language
    // DO NOT send language parameter - it's not supported
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log("📥 Response status:", response.status);
    console.log("⏱️  Transcription time:", durationMs, "ms");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Whisper API Error:", response.status, errorText);

      if (response.status === 503) {
        return res.status(503).json({
          success: false,
          error: "Model is loading. Please wait 20-30 seconds and try again.",
        });
      }

      throw new Error(`Whisper API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Whisper API Response:", JSON.stringify(result, null, 2));

    let transcript = "";

    if (typeof result === "string") {
      transcript = result;
    } else if (result.text) {
      transcript = result.text;
    } else if (Array.isArray(result) && result[0]?.text) {
      transcript = result[0].text;
    } else {
      console.error("❌ Unexpected response format:", result);
      throw new Error("Unable to extract transcription from Whisper response");
    }

    console.log("✅ Transcription extracted:", transcript);
    console.log("=".repeat(70) + "\n");

    // Attach transcript to request
    req.transcript = transcript;

    next();
  } catch (error) {
    console.error("\n" + "❌".repeat(35));
    console.error("💥 ERROR IN TRANSCRIPTION MIDDLEWARE");
    console.error("❌".repeat(35));
    console.error("❌ Error:", error.message);
    console.error("❌".repeat(35) + "\n");

    next(error);
  }
};
