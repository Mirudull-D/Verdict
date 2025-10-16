import express from "express";
import { legalLLMMiddleware } from "../middleware/legalLLM.middleware.js";
import { ttsMiddleware } from "../middleware/tts.middleware.js";

const router = express.Router();

const prepareLegalQuery = (req, res, next) => {
  const {
    narrative,
    location_state,
    date_time,
    known_sections_or_acts,
    key_entities,
    evidence_available,
    aggravating_factors,
    enableTTS = false,
  } = req.body;

  if (!narrative || narrative.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Incident narrative is required",
      hint: "Please provide a description of the legal incident or situation",
    });
  }

  console.log("⚖️  Legal query received");
  console.log("📝 Narrative:", narrative.substring(0, 100) + "...");
  console.log("🌍 Location:", location_state || "Not specified");
  console.log("🔊 TTS Enabled:", enableTTS);

  const incidentDetails = {
    narrative,
    location_state: location_state || "India (unspecified state)",
    date_time: date_time || new Date().toISOString(),
    known_sections_or_acts: Array.isArray(known_sections_or_acts)
      ? known_sections_or_acts
      : [],
    key_entities: Array.isArray(key_entities) ? key_entities : [],
    evidence_available: Array.isArray(evidence_available)
      ? evidence_available
      : [],
    aggravating_factors: Array.isArray(aggravating_factors)
      ? aggravating_factors
      : [],
  };

  req.incidentDetails = incidentDetails;
  req.enableTTS = enableTTS;
  req.originalNarrative = narrative;

  next();
};

const finalHandler = (req, res) => {
  const response = {
    success: true,
    incident_narrative: req.originalNarrative,
    legal_analysis: req.legalResponse,
    timestamp: new Date().toISOString(),
  };

  if (req.ttsAudioFileName) {
    response.audio = {
      fileName: req.ttsAudioFileName,
      url: `/audio/${req.ttsAudioFileName}`,
      description: "Text-to-speech audio of the legal summary",
    };
  }

  res.json(response);
};

const prepareTTSText = (req, res, next) => {
  if (!req.enableTTS || !req.legalResponse) {
    return next();
  }

  const ttsText = `Legal Analysis Summary: ${req.legalResponse.summary}. 
  
Applicable Provisions: ${req.legalResponse.applicable_provisions
    .map((p) => p.code)
    .join(", ")}. 
  
Confidence Level: ${req.legalResponse.confidence}. 
  
${req.legalResponse.disclaimer}`;

  req.llmResponse = ttsText;
  next();
};

router.post(
  "/",
  prepareLegalQuery,
  legalLLMMiddleware,
  prepareTTSText,
  (req, res, next) => {
    if (req.enableTTS) {
      return ttsMiddleware(req, res, next);
    }
    next();
  },
  finalHandler
);

export default router;
