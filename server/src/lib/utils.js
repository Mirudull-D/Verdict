import multer from "multer";
import { OpenAI } from "openai";
import ffmpeg from "fluent-ffmpeg";
import dotenv from "dotenv";

dotenv.config();

export const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

export const convertToWav = (inputPath, outputPath) => {
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
