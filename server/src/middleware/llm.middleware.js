import { client } from "../lib/utils.js";

// Middleware: LLM Analysis
export const llmMiddleware = async (req, res, next) => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🤖 STARTING LLM ANALYSIS");
    console.log("=".repeat(70));

    const { userMessage, languageContext = "Auto-detected" } = req;

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: "No user message found in request",
      });
    }

    const systemPrompt =
      "You are an assistant that summarizes, extracts action items, and provides a helpful response based on a user's speech transcript or question. Keep the response concise, structured, and helpful for a developer audience.";

    console.log("\n📋 STEP 1: Building LLM Request");
    console.log("─".repeat(70));
    console.log("🔹 Model:", "zai-org/GLM-4.6:novita");
    console.log("🔹 Base URL:", "https://router.huggingface.co/v1");
    console.log("🔹 Language context:", languageContext);
    console.log("🔹 User message length:", userMessage.length, "characters");

    console.log("\n📤 STEP 2: Prompt Being Sent to LLM");
    console.log("─".repeat(70));
    console.log("\n📌 System Prompt:");
    console.log(systemPrompt);
    console.log("\n📌 User Message:");
    console.log(userMessage);
    console.log("\n" + "─".repeat(70));

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    console.log("\n🔄 STEP 3: Sending Request to Hugging Face Router");
    console.log("─".repeat(70));
    console.log("🌐 Endpoint: POST /v1/chat/completions");
    console.log("🔑 Authentication: Bearer token (HF_TOKEN)");
    console.log("📊 Request payload:");
    console.log(
      JSON.stringify(
        {
          model: "zai-org/GLM-4.6:novita",
          messages: messages,
          temperature: 0.2,
          max_tokens: 600,
        },
        null,
        2
      )
    );

    const startTime = Date.now();

    const chatCompletion = await client.chat.completions.create({
      model: "zai-org/GLM-4.6:novita",
      messages: messages,
      temperature: 0.2,
      max_tokens: 600,
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log("\n✅ STEP 4: Response Received from LLM");
    console.log("─".repeat(70));
    console.log("⏱️  Response time:", durationMs, "ms");
    console.log("📦 Full response object:");
    console.log(JSON.stringify(chatCompletion, null, 2));

    const llmMessage = chatCompletion?.choices?.[0]?.message?.content || "";

    console.log("\n📥 STEP 5: Extracted LLM Response");
    console.log("─".repeat(70));
    console.log("📝 Response content:");
    console.log(llmMessage);
    console.log("\n🔹 Response length:", llmMessage.length, "characters");
    console.log(
      "🔹 Finish reason:",
      chatCompletion?.choices?.[0]?.finish_reason || "N/A"
    );

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
    console.log("✅ LLM ANALYSIS COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70) + "\n");

    // Attach LLM response to request for final route handler
    req.llmResponse = llmMessage;

    next();
  } catch (error) {
    console.error("\n" + "❌".repeat(35));
    console.error("💥 ERROR IN LLM MIDDLEWARE");
    console.error("❌".repeat(35));
    console.error("❌ Error:", error.message);
    console.error("❌".repeat(35) + "\n");

    next(error);
  }
};
