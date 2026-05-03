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

const followupsTool = {
  name: "return_followup_questions",
  description: "Return adaptive follow-up questions for the restaurant-opening questionnaire.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      followUpQuestions: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            inputType: { type: "string", enum: ["radio", "text", "select"] },
            options: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["id", "question", "inputType"],
        },
      },
    },
    required: ["followUpQuestions"],
  },
};

function buildSystemPrompt(language) {
  return `You are Mise, a restaurant opening copilot for first-time independent operators in Boston, especially immigrant entrepreneurs. Your job right now is to read a user's initial concept questionnaire and generate 3-5 adaptive follow-up questions that will help you give them a personalized roadmap of permits, licenses, and inspections.

Use ONLY information grounded in the corpus below. If the user mentions something outside the corpus, do not invent details — generate questions that help clarify the situation rather than questions assuming facts you don't have.

CORPUS:
"""
${corpus}
"""

LANGUAGE: Respond with all question text in ${language}. Keep \`id\` field in English snake_case.

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
    const client = getClient();

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        system: buildSystemPrompt(language),
        messages: [{ role: "user", content: userMessage }],
        tools: [followupsTool],
        tool_choice: { type: "tool", name: "return_followup_questions" },
      });
      const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === "return_followup_questions");
      if (toolUse?.input?.followUpQuestions?.length) {
        res.status(200).json(toolUse.input);
        return;
      }
    }

    res.status(500).json({ error: "Claude returned an invalid follow-up question payload" });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
