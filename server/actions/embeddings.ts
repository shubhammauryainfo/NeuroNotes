"use server";

import { chunkText, createEmbedding } from "@/lib/embeddings";

export async function previewEmbeddings(content: string) {
  const chunks = chunkText(content);

  return Promise.all(
    chunks.slice(0, 3).map(async (chunk) => ({
      preview: `${chunk.slice(0, 120)}${chunk.length > 120 ? "..." : ""}`,
      dimensions: (await createEmbedding(chunk)).length
    }))
  );
}
