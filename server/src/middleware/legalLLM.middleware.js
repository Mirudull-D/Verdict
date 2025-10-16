import { client } from "../lib/utils.js";

export const legalLLMMiddleware = async (req, res, next) => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("⚖️  STARTING LEGAL RESEARCH LLM ANALYSIS");
    console.log("=".repeat(70));

    const { incidentDetails, queryLanguage = "english" } = req;

    if (!incidentDetails) {
      return res.status(400).json({
        success: false,
        error: "No incident details found in request",
      });
    }

    const languageMap = {
      english: "Respond in English.",
      hindi:
        "सभी उत्तर हिंदी में दें। All responses must be in Hindi (Devanagari script).",
      tamil:
        "அனைத்து பதில்களும் தமிழில் கொடுக்கவும். All responses must be in Tamil script.",
    };

    const systemPrompt = `You are a legal research AI for Indian criminal law (IPC/CrPC) trained to provide accurate, source-verified legal analysis.

CRITICAL JSON FORMATTING RULES:
1. ALL string values MUST escape special characters: " becomes \", \\ becomes \\\\, newlines become \\n
2. Legal text with quotes MUST be properly escaped
3. Return ONLY valid JSON - no markdown, no code blocks
4. Test: Can this be parsed by JSON.parse()? If no, fix it.

SOURCING RULES:
- ONLY cite: legislative.gov.in, indiacode.nic.in, main.sci.gov.in, High Court .nic.in sites
- NEVER cite: blogs, news, forums, law firm websites
- If source not found, write "Source not available" - do NOT invent URLs

LANGUAGE REQUIREMENT:
${languageMap[queryLanguage] || languageMap.english}

RESPONSE FORMAT:
- Return valid JSON object only
- Escape all quotes and special characters in legal text
- Use simple, short descriptions to avoid JSON parsing errors`;

    const userPrompt = `Analyze this legal ${
      incidentDetails.is_complaint ? "complaint" : "query"
    } and return structured JSON.

Input:
- Type: ${incidentDetails.is_complaint ? "COMPLAINT" : "LEGAL QUERY"}
- Language: ${queryLanguage}
- Content: ${incidentDetails.narrative}
- Location: ${incidentDetails.location_state || "India"}

${
  incidentDetails.is_complaint
    ? `
Return JSON with:
{
  "response_language": "${queryLanguage}",
  "query_type": "complaint",
  "summary": "Brief summary (2-3 sentences)",
  "applicable_provisions": [
    {
      "statute": "Indian Penal Code, 1860",
      "section": "379",
      "description": "Theft punishment",
      "bailable_status": "Bailable",
      "cognizable_status": "Cognizable",
      "punishment_range": "Up to 3 years imprisonment or fine or both",
      "source_url": "https://indiacode.nic.in/..."
    }
  ],
  "similar_judgments": [
    {
      "citation": "Case Name v State (Year) X SCC Y",
      "year": 2020,
      "court": "Supreme Court of India",
      "holding": "Brief holding in one sentence",
      "source_url": "https://main.sci.gov.in/..."
    }
  ],
  "confidence": "high",
  "disclaimer": "Consult a lawyer for case-specific advice"
}
`
    : `
Return JSON with:
{
  "response_language": "${queryLanguage}",
  "query_type": "query",
  "answer": "Direct answer to the legal question",
  "relevant_sections": [
    {
      "statute": "IPC",
      "section": "XXX",
      "relevance": "How it applies",
      "source_url": "https://indiacode.nic.in/..."
    }
  ],
  "confidence": "high",
  "disclaimer": "Consult a lawyer"
}
`
}

CRITICAL: Ensure ALL quotes in strings are escaped. Legal text like "punishment for theft" must be "punishment for theft" in JSON.`;

    console.log(
      "\n📋 Query Type:",
      incidentDetails.is_complaint ? "COMPLAINT" : "LEGAL QUERY"
    );
    console.log("🌐 Language:", queryLanguage);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const startTime = Date.now();

    const chatCompletion = await client.chat.completions.create({
      model: "zai-org/GLM-4.6:novita",
      messages: messages,
      temperature: 0.1,
      max_tokens: 7500,
      response_format: { type: "json_object" },
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log("\n✅ LLM Response Time:", durationMs, "ms");

    let llmMessage = chatCompletion?.choices?.[0]?.message?.content || "";

    console.log(
      "\n📥 Raw LLM Response Length:",
      llmMessage.length,
      "characters"
    );

    let parsedResponse;
    try {
      // Clean the response
      let cleanedResponse = llmMessage.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "") // remove opening ```json
          .replace(/\s*```$/, ""); // remove closing ```
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "") // remove opening ```
          .replace(/\s*```$/, ""); // remove closing ```
      }
      // Attempt to fix common JSON errors
      // Replace unescaped quotes in strings (basic attempt)
      // This is a simplified approach - may need more robust handling

      console.log("\n🔍 Attempting JSON parse...");
      parsedResponse = JSON.parse(cleanedResponse);

      console.log("✅ JSON parsed successfully");
      console.log("📊 Response type:", parsedResponse.query_type);
      console.log("🌐 Response language:", parsedResponse.response_language);

      if (parsedResponse.applicable_provisions) {
        console.log(
          "⚖️  Provisions found:",
          parsedResponse.applicable_provisions.length
        );
      }
      if (parsedResponse.similar_judgments) {
        console.log(
          "📚 Judgments found:",
          parsedResponse.similar_judgments.length
        );
      }
    } catch (parseError) {
      console.error("\n❌ JSON parsing failed:", parseError.message);
      console.error("📄 Raw response (first 500 chars):");
      console.error(llmMessage.substring(0, 500));
      console.error("\n📄 Raw response (last 500 chars):");
      console.error(llmMessage.substring(Math.max(0, llmMessage.length - 500)));

      // Fallback: Return a simplified error response
      parsedResponse = {
        response_language: queryLanguage,
        query_type: incidentDetails.is_complaint ? "complaint" : "query",
        error: "JSON parsing failed",
        raw_response: llmMessage.substring(0, 1000) + "...",
        summary:
          "Unable to parse LLM response. The model returned malformed JSON.",
        applicable_provisions: [],
        similar_judgments: [],
        confidence: "low",
        disclaimer: "Please try again. If the issue persists, contact support.",
      };
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ LEGAL RESEARCH COMPLETED");
    console.log("=".repeat(70) + "\n");

    req.legalResponse = parsedResponse;
    next();
  } catch (error) {
    console.error("\n❌ ERROR IN LEGAL LLM MIDDLEWARE:", error.message);

    // Return a graceful error response instead of crashing
    req.legalResponse = {
      response_language: req.queryLanguage || "english",
      query_type: req.incidentDetails?.is_complaint ? "complaint" : "query",
      error: "LLM processing error",
      summary:
        "An error occurred while processing your request. Please try again.",
      applicable_provisions: [],
      similar_judgments: [],
      confidence: "low",
      disclaimer: "Service temporarily unavailable. Please try again.",
    };

    next(); // Continue instead of throwing error
  }
};
