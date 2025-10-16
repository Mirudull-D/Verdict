import { client } from "../lib/utils.js";
import { legalResponseSchema } from "../lib/legalSchema.js";

export const legalLLMMiddleware = async (req, res, next) => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("⚖️  STARTING LEGAL RESEARCH LLM ANALYSIS");
    console.log("=".repeat(70));

    const { incidentDetails } = req;

    if (!incidentDetails) {
      return res.status(400).json({
        success: false,
        error: "No incident details found in request",
      });
    }

    const systemPrompt = `You are a legal research copilot for Indian criminal law tasked with mapping incident facts to applicable provisions and close factual precedents for FIR drafting and investigation support.

CRITICAL RULES:
1. Use ONLY credible sources:
   - Government portals like Legislative Department/IndiaCode for statutes and the Constitution
   - Supreme Court/High Court official sites for judgments
   - Well-established law databases when clearly cited
2. AVOID blogs, forums, or unchecked summaries
3. Always include direct URLs to the exact statute section or judgment page you relied on
4. Prefer official PDFs or judgment pages when available
5. If confidence is low or sources conflict, explicitly mark 'low_confidence' and explain
6. Do NOT invent citations; if not found, say so and suggest next steps
7. Return ONLY valid JSON matching the schema provided - no extra prose, no markdown formatting, no code blocks
8. Ensure all URLs are real and verifiable - do not hallucinate sources`;

    const userPrompt = `Task: Given the incident details, identify applicable IPC/CrPC and any special acts, and list top similar judgments with links from credible sources only.

Incident_details:
- narrative: ${incidentDetails.narrative || "Not provided"}
- location_state: ${incidentDetails.location_state || "Not specified"}
- date_time: ${incidentDetails.date_time || "Not specified"}
- known_sections_or_acts: ${JSON.stringify(
      incidentDetails.known_sections_or_acts || []
    )}
- key_entities: ${JSON.stringify(incidentDetails.key_entities || [])}
- evidence_available: ${JSON.stringify(
      incidentDetails.evidence_available || []
    )}
- aggravating_factors: ${JSON.stringify(
      incidentDetails.aggravating_factors || []
    )}

Research_instructions:
- Statutes: Pull exact text and clause numbers from IndiaCode or Legislative.gov.in; include canonical section URLs and last amendment status
- Judgments: Prefer Supreme Court; include High Court judgments for fact similarity, each with neutral citation, year, court, and a one-line holding; link to the official court page when available
- Similarity: Prioritize cases matching actus reus, mens rea, victim profile, place (e.g., public transport/market), and evidence pattern
- Classification: State cognizable/non-cognizable, bailable/non-bailable, and punishment range with source citations to statute text or authoritative notes
- Caveat: If jurisdiction-specific special acts may apply (e.g., state police acts, special local laws), flag them with 'needs_local_check'

IMPORTANT: Return ONLY the JSON object. Do not include any markdown formatting, code blocks, or explanatory text before or after the JSON.`;

    console.log("\n📋 STEP 1: Building Legal LLM Request");
    console.log("─".repeat(70));
    console.log("🔹 Model:", "zai-org/GLM-4.6:novita");
    console.log("🔹 Response Format: Structured JSON Schema");
    console.log(
      "🔹 Incident narrative:",
      incidentDetails.narrative?.substring(0, 100) + "..."
    );

    console.log("\n📤 STEP 2: Prompt Being Sent to LLM");
    console.log("─".repeat(70));
    console.log("\n📌 System Prompt:");
    console.log(systemPrompt);
    console.log("\n📌 User Prompt:");
    console.log(userPrompt);
    console.log("\n" + "─".repeat(70));

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    console.log("\n🔄 STEP 3: Sending Request to Hugging Face Router");
    console.log("─".repeat(70));
    console.log("🌐 Endpoint: POST /v1/chat/completions");
    console.log("🔑 Authentication: Bearer token (HF_TOKEN)");
    console.log("📊 Request configuration:");
    console.log(
      JSON.stringify(
        {
          model: "zai-org/GLM-4.6:novita",
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        },
        null,
        2
      )
    );

    const startTime = Date.now();

    const chatCompletion = await client.chat.completions.create({
      model: "zai-org/GLM-4.6:novita",
      messages: messages,
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log("\n✅ STEP 4: Response Received from LLM");
    console.log("─".repeat(70));
    console.log("⏱️  Response time:", durationMs, "ms");

    const llmMessage = chatCompletion?.choices?.[0]?.message?.content || "";

    console.log("\n📥 STEP 5: Parsing JSON Response");
    console.log("─".repeat(70));
    console.log("📝 Raw response length:", llmMessage.length, "characters");

    let parsedResponse;
    try {
      let cleanedResponse = llmMessage.trim();

      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      parsedResponse = JSON.parse(cleanedResponse);
      console.log("✅ JSON parsing successful");
      console.log("📊 Response structure:");
      console.log(
        "  - Applicable provisions:",
        parsedResponse.applicable_provisions?.length || 0
      );
      console.log(
        "  - Procedural provisions:",
        parsedResponse.procedural_provisions?.length || 0
      );
      console.log(
        "  - Special acts:",
        parsedResponse.special_acts?.length || 0
      );
      console.log(
        "  - Similar cases:",
        parsedResponse.similar_cases?.length || 0
      );
      console.log(
        "  - Confidence level:",
        parsedResponse.confidence || "not specified"
      );
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError.message);
      console.error("Raw response:", llmMessage);
      throw new Error("LLM did not return valid JSON. Please try again.");
    }

    if (chatCompletion?.usage) {
      console.log("\n📊 Token Usage:");
      console.log(
        "  - Prompt tokens:",
        chatCompletion.usage.prompt_tokens || "N/A"
      );
      console.log(
        "  - Completion tokens:",
        chatCompletion.usage.completion_tokens || "N/A"
      );
      console.log(
        "  - Total tokens:",
        chatCompletion.usage.total_tokens || "N/A"
      );
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ LEGAL RESEARCH COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70) + "\n");

    req.legalResponse = parsedResponse;

    next();
  } catch (error) {
    console.error("\n" + "❌".repeat(35));
    console.error("💥 ERROR IN LEGAL LLM MIDDLEWARE");
    console.error("❌".repeat(35));
    console.error("❌ Error:", error.message);
    console.error("❌ Stack:", error.stack);
    console.error("❌".repeat(35) + "\n");

    next(error);
  }
};
