export const legalResponseSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "2-3 line plain-language summary of the legal characterization",
    },
    applicable_provisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          title: { type: "string" },
          why_applicable: { type: "string" },
          classification: {
            type: "object",
            properties: {
              cognizable: { type: "boolean" },
              bailable: { type: "boolean" },
              punishment: { type: "string" },
            },
            required: ["cognizable", "bailable", "punishment"],
          },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["statute", "judgment", "government_portal"],
                },
                name: { type: "string" },
                url: { type: "string" },
              },
              required: ["type", "name", "url"],
            },
          },
        },
        required: [
          "code",
          "title",
          "why_applicable",
          "classification",
          "sources",
        ],
      },
    },
    procedural_provisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          purpose: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                name: { type: "string" },
                url: { type: "string" },
              },
              required: ["type", "name", "url"],
            },
          },
        },
        required: ["code", "purpose", "sources"],
      },
    },
    special_acts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          act: { type: "string" },
          why_applicable: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                name: { type: "string" },
                url: { type: "string" },
              },
              required: ["type", "name", "url"],
            },
          },
        },
        required: ["act", "why_applicable", "sources"],
      },
    },
    similar_cases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          citation: { type: "string" },
          court: { type: "string" },
          year: { type: "integer" },
          fact_similarity: { type: "string" },
          key_holding: { type: "string" },
          url: { type: "string" },
        },
        required: [
          "citation",
          "court",
          "year",
          "fact_similarity",
          "key_holding",
          "url",
        ],
      },
    },
    investigation_tips: {
      type: "array",
      items: { type: "string" },
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    needs_local_check: {
      type: "array",
      items: { type: "string" },
    },
    disclaimer: {
      type: "string",
    },
  },
  required: [
    "summary",
    "applicable_provisions",
    "procedural_provisions",
    "special_acts",
    "similar_cases",
    "investigation_tips",
    "confidence",
    "needs_local_check",
    "disclaimer",
  ],
};
