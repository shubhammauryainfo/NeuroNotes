const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function askAI(messages: ChatMessage[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CHAT_MODEL ?? "deepseek/deepseek-v3.2",
      messages
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? "No response";
}

export async function generateStudyTool(
  type: "summary" | "mcq" | "flashcards" | "viva",
  content: string
) {
  const prompts = {
    summary:
      `Turn these study notes into structured revision notes.

Formatting rules:
- Use short uppercase section headings
- Under each heading, use clean bullet points
- Keep each bullet concise and exam-focused
- Include formulas or definitions when present
- End with a heading called EXAM TAKEAWAYS
- Do not write long paragraphs unless absolutely necessary
- Do not use markdown tables

Return the result in neat student-note format.`,
    mcq:
      "Generate 5 multiple-choice questions from these notes. Provide options A-D and mark the correct answer.",
    flashcards:
      "Create 8 flashcards from these notes using 'Front:' and 'Back:' formatting.",
    viva:
      "Create 6 viva-style oral exam questions with model answers from these notes."
  };

  return askAI([
    {
      role: "system",
      content: "You are a strict study assistant that returns clean, exam-focused output."
    },
    {
      role: "user",
      content: `${prompts[type]}\n\nNotes:\n${content}`
    }
  ]);
}

export async function generateNightBeforeSheet(input: {
  subject: string;
  context: string;
}) {
  const { subject, context } = input;

  return askAI([
    {
      role: "system",
      content:
        "You are an exam revision coach. Generate a compact, high-signal final revision sheet."
    },
    {
      role: "user",
      content: `Build a one-page "T-12 Hours Night-Before Sheet" for the subject below using only the provided study context.

Subject:
${subject}

Rules:
- Use ONLY the context; do not invent facts
- If context is missing for a section, write "Not in notes"
- Keep output concise, practical, and exam-first
- Prefer bullets over long paragraphs
- Include formulas exactly when present in context
- Include common mistakes and trap patterns
- Include likely viva/oral questions with short model answers

Required output structure (use these exact section headings):
T-12 SNAPSHOT
CORE FORMULAS
HIGH-YIELD DEFINITIONS
TRAPS TO AVOID
PROBABLE VIVA QUESTIONS
LAST 30-MINUTE PLAN

Study context:
${context}`
    }
  ]);
}
