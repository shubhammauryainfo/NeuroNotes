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
      "Turn these study notes into structured revision notes. Use short section headings, bullet points, key ideas, formulas if present, and an exam takeaway section. Keep the format easy to scan like class notes.",
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
