import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic();

let corpus = "";
try {
  corpus = fs.readFileSync(
    path.join(process.cwd(), "corpus", "boston-restaurants.md"),
    "utf-8"
  );
} catch (e) {
  corpus = "(corpus unavailable)";
}

function buildSystemPrompt(language) {
  return `You are Mise, a restaurant opening copilot for first-time independent operators in Boston, especially immigrant entrepreneurs. Given a user's full questionnaire (initial answers + adaptive follow-up answers), produce (a) a phased roadmap of permits, licenses, and inspections, and (b) a prep sheet for their next critical bureaucratic interaction.

Use ONLY information grounded in the corpus below. If the user mentions something outside the corpus or you lack information to answer confidently, add an entry to \`warnings\` rather than inventing details.

CORPUS:
"""
${corpus}
"""

LANGUAGE: Write \`conceptSummary\`, \`warnings\`, \`whatItIs\`, \`theyWillAsk\`, \`youShouldAsk\`, \`whatGoodLooksLike\`, \`ifItGoesBadly\` in ${language}. Keep \`item\`, \`agency\`, \`interactionName\`, \`location\`, \`whatToBring\`, \`keyTermsEnglish\` in English (these are official names the user must recognize in real conversations). \`phase\` must be exactly one of: "Setup", "Build-out", "Pre-opening".

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown code fences, no preamble, no explanation. Match this exact shape:
{
  "detectedLanguage": "${language}",
  "conceptSummary": "string in ${language}",
  "warnings": ["string in ${language}"],
  "roadmap": [
    {
      "phase": "Setup" | "Build-out" | "Pre-opening",
      "item": "official English name",
      "whatItIs": "plain-language description in ${language}",
      "fee": "string",
      "timeline": "string",
      "agency": "official agency name in English"
    }
  ],
  "prepSheet": {
    "interactionName": "official English name of the next critical interaction",
    "location": "where it happens (English)",
    "whatToBring": ["item names in English"],
    "theyWillAsk": ["question in ${language}"],
    "youShouldAsk": ["question in ${language}"],
    "keyTermsEnglish": ["official term 1", "official term 2"],
    "whatGoodLooksLike": "string in ${language}",
    "ifItGoesBadly": "string in ${language}"
  }
}

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

    let parsed = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: buildSystemPrompt(language),
        messages: [{ role: "user", content: userMessage }],
      });
      const text = response.content[0].text.trim();
      try {
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        parsed = JSON.parse(cleaned);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!parsed) {
      res.status(500).json({ error: "Failed to parse Claude response", detail: String(lastErr) });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
