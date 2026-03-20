const OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings";

export async function createEmbedding(text: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_EMBEDDING_MODEL ?? "openai/text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding request failed: ${errorText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };

  const embedding = payload.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("Embedding response was empty");
  }

  return embedding;
}

export function chunkText(content: string, chunkSize = 380, overlap = 70) {
  const words = content.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  if (words.length === 0) {
    return chunks;
  }

  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));

    if (end === words.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
