import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic();

function loadCorpus() {
  try {
    const dir = path.join(process.cwd(), "corpus");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    if (!files.length) return "(corpus directory is empty)";
    return files
      .map((f) => `\n\n=== FILE: ${f} ===\n\n${fs.readFileSync(path.join(dir, f), "utf-8")}`)
      .join("");
  } catch (e) {
    return "(corpus unavailable)";
  }
}
const corpus = loadCorpus();

function buildSystemPrompt(language) {
  return `You are Mise, a restaurant opening copilot for first-time independent operators in Boston, especially immigrant entrepreneurs. Your job right now is to read a user's initial concept questionnaire and generate 3-5 adaptive follow-up questions that will help you give them a personalized roadmap of permits, licenses, and inspections.

Use ONLY information grounded in the corpus below. If the user mentions something outside the corpus, do not invent details — generate questions that help clarify the situation rather than questions assuming facts you don't have.

CORPUS:
"""
${corpus}
"""

LANGUAGE: Respond with all question text in ${language}. Keep \`id\` field in English snake_case.

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown code fences, no preamble, no explanation. Match this exact shape:
{
  "followUpQuestions": [
    {
      "id": "snake_case_id",
      "question": "question text in ${language}",
      "inputType": "radio" | "text" | "select",
      "options": ["option1", "option2"]   // omit for "text"
    }
  ]
}

Generate 3-5 questions total. Prioritize questions about: previous tenant's licensing status, proximity to schools/churches/residential, lease terms, build-out scope, prior food service experience, ownership structure, target opening date.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { initialAnswers } = req.body || {};
    if (!initialAnswers) {
      res.status(400).json({ error: "Missing initialAnswers" });
      return;
    }

    const language = initialAnswers.language || "English";
    const userMessage = `User's initial answers:\n${JSON.stringify(initialAnswers, null, 2)}\n\nGenerate 3-5 adaptive follow-up questions in ${language}.`;

    let parsed = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[followups] attempt ${attempt + 1} (lang=${language})`);
        const t0 = Date.now();
        const response = await client.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: buildSystemPrompt(language),
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        });
        console.log(`[followups] response in ${Date.now() - t0}ms`);
        const text = response.content[0].text.trim();
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        parsed = JSON.parse(cleaned);
        break;
      } catch (e) {
        console.error(`[followups] attempt ${attempt + 1} failed:`, e?.message || e);
        lastErr = e;
      }
    }

    if (!parsed) {
      res.status(500).json({ error: "Failed to generate follow-ups", detail: String(lastErr?.message || lastErr) });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("[followups] outer error:", err);
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
