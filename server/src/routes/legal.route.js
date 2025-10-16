import express from "express";
import { legalLLMMiddleware } from "../middleware/legalLLM.middleware.js";
import { ttsMiddleware } from "../middleware/tts.middleware.js";

const router = express.Router();

const prepareLegalQuery = (req, res, next) => {
  const {
    narrative,
    location_state,
    evidence_available,
    aggravating_factors,
    language = "english",
    is_complaint = true, // true = complaint, false = legal query
    enableTTS = false,
  } = req.body;

  if (!narrative || narrative.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Content is required (complaint or legal question)",
    });
  }

  console.log("⚖️  Legal request received");
  console.log("📝 Type:", is_complaint ? "COMPLAINT" : "LEGAL QUERY");
  console.log("🌐 Language:", language);
  console.log("📄 Content:", narrative.substring(0, 100) + "...");

  const incidentDetails = {
    narrative,
    location_state: location_state || "India",
    date_time: new Date().toISOString(),
    evidence_available: Array.isArray(evidence_available)
      ? evidence_available
      : [],
    aggravating_factors: Array.isArray(aggravating_factors)
      ? aggravating_factors
      : [],
    is_complaint: is_complaint,
  };

  req.incidentDetails = incidentDetails;
  req.queryLanguage = language;
  req.enableTTS = enableTTS;
  req.originalNarrative = narrative;

  next();
};

const finalHandler = (req, res) => {
  const response = {
    success: true,
    query_type: req.incidentDetails.is_complaint ? "complaint" : "query",
    language: req.queryLanguage,
    content: req.originalNarrative,
    legal_analysis: req.legalResponse,
    timestamp: new Date().toISOString(),
  };

  if (req.ttsAudioFileName) {
    response.audio = {
      fileName: req.ttsAudioFileName,
      url: `/audio/${req.ttsAudioFileName}`,
    };
  }

  res.json(response);
};

const prepareTTSText = (req, res, next) => {
  if (!req.enableTTS || !req.legalResponse) {
    return next();
  }

  let ttsText = "";

  if (req.incidentDetails.is_complaint) {
    ttsText = `Legal Analysis. ${
      req.legalResponse.summary || ""
    }. Applicable provisions: ${
      req.legalResponse.applicable_provisions?.length || 0
    } sections found.`;
  } else {
    ttsText = req.legalResponse.answer || "Legal query response ready.";
  }

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
