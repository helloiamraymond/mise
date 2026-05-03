import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

let corpus = "";
try {
  corpus = fs.readFileSync(
    path.join(process.cwd(), "corpus", "boston-restaurants.md"),
    "utf-8"
  );
} catch (e) {
  corpus = "(corpus unavailable)";
}

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const generateTool = {
  name: "return_roadmap_and_prep_sheet",
  description: "Return the phased roadmap and prep sheet for the restaurant-opening workflow.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      detectedLanguage: { type: "string" },
      conceptSummary: { type: "string" },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
      roadmap: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            phase: { type: "string", enum: ["Setup", "Build-out", "Pre-opening"] },
            item: { type: "string" },
            whatItIs: { type: "string" },
            fee: { type: "string" },
            timeline: { type: "string" },
            agency: { type: "string" },
          },
          required: ["phase", "item", "whatItIs", "fee", "timeline", "agency"],
        },
      },
      prepSheet: {
        type: "object",
        additionalProperties: false,
        properties: {
          interactionName: { type: "string" },
          location: { type: "string" },
          whatToBring: { type: "array", items: { type: "string" } },
          theyWillAsk: { type: "array", items: { type: "string" } },
          youShouldAsk: { type: "array", items: { type: "string" } },
          keyTermsEnglish: { type: "array", items: { type: "string" } },
          whatGoodLooksLike: { type: "string" },
          ifItGoesBadly: { type: "string" },
        },
        required: ["interactionName", "location", "whatToBring", "theyWillAsk", "youShouldAsk", "keyTermsEnglish", "whatGoodLooksLike", "ifItGoesBadly"],
      },
    },
    required: ["detectedLanguage", "conceptSummary", "warnings", "roadmap", "prepSheet"],
  },
};

function buildSystemPrompt(language) {
  return `You are Mise, a restaurant opening copilot for first-time independent operators in Boston, especially immigrant entrepreneurs. Given a user's full questionnaire (initial answers + adaptive follow-up answers), produce (a) a phased roadmap of permits, licenses, and inspections, and (b) a prep sheet for their next critical bureaucratic interaction.

Use ONLY information grounded in the corpus below. If the user mentions something outside the corpus or you lack information to answer confidently, add an entry to \`warnings\` rather than inventing details.

CORPUS:
"""
${corpus}
"""

LANGUAGE: Write \`conceptSummary\`, \`warnings\`, \`whatItIs\`, \`theyWillAsk\`, \`youShouldAsk\`, \`whatGoodLooksLike\`, \`ifItGoesBadly\` in ${language}. Keep \`item\`, \`agency\`, \`interactionName\`, \`location\`, \`whatToBring\`, \`keyTermsEnglish\` in English (these are official names the user must recognize in real conversations). \`phase\` must be exactly one of: "Setup", "Build-out", "Pre-opening".

Generate 10-15 roadmap items spanning all three phases, ordered roughly chronologically within each phase. The prep sheet should target the SINGLE most urgent next interaction given the user's stage.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { initialAnswers, followUpAnswers } = req.body || {};
    if (!initialAnswers) {
      res.status(400).json({ error: "Missing initialAnswers" });
      return;
    }

    const language = initialAnswers.language || "English";
    const userMessage = `Initial answers:\n${JSON.stringify(initialAnswers, null, 2)}\n\nFollow-up answers:\n${JSON.stringify(followUpAnswers || {}, null, 2)}\n\nProduce the roadmap and prep sheet as specified. Respond in ${language}.`;
    const client = getClient();

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: buildSystemPrompt(language),
        messages: [{ role: "user", content: userMessage }],
        tools: [generateTool],
        tool_choice: { type: "tool", name: "return_roadmap_and_prep_sheet" },
      });
      const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === "return_roadmap_and_prep_sheet");
      if (toolUse?.input?.roadmap?.length && toolUse?.input?.prepSheet) {
        res.status(200).json(toolUse.input);
        return;
      }
    }

    res.status(500).json({ error: "Claude returned an invalid roadmap payload" });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
