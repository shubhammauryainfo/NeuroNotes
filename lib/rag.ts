import { askAI } from "@/lib/ai";
import { createEmbedding } from "@/lib/embeddings";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type RetrievedChunk = {
  content_chunk: string;
  note_title?: string;
  subject?: string;
  topic?: string;
};

type FallbackNote = {
  title: string;
  content: string;
  subject?: string;
  topic?: string;
};

function getQuestionKeywords(question: string) {
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);
}

function buildFallbackContext(notes: FallbackNote[], keywords: string[]) {
  const scored = notes
    .map((note) => {
      const haystack = `${note.title} ${note.subject ?? ""} ${note.topic ?? ""} ${note.content}`.toLowerCase();
      const score = keywords.reduce(
        (total, keyword) => total + (haystack.includes(keyword) ? 1 : 0),
        0
      );

      return { note, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map(({ note }, index) => {
    const label = [note.title, note.subject, note.topic].filter(Boolean).join(" / ");
    const excerpt = note.content.slice(0, 1400);
    return `[Fallback ${index + 1}${label ? ` - ${label}` : ""}]\n${excerpt}`;
  });
}

export async function askYourNotes(question: string, userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const embedding = await createEmbedding(question);

  const { data, error } = await supabase.rpc("match_note_chunks", {
    query_embedding: embedding,
    match_count: 8,
    match_user_id: userId
  });

  if (error) {
    throw new Error(error.message);
  }

  const chunks = ((data as RetrievedChunk[] | null) ?? []).slice(0, 8);
  let contextBlocks = chunks
    .map((chunk, index) => {
      const label = [chunk.note_title, chunk.subject, chunk.topic]
        .filter(Boolean)
        .join(" / ");
      return `[Chunk ${index + 1}${label ? ` - ${label}` : ""}]\n${chunk.content_chunk}`;
    });

  if (contextBlocks.length === 0) {
    const { data: notes } = await supabase
      .from("notes")
      .select("title,content,subject,topic")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    const fallbackBlocks = buildFallbackContext(
      (notes as FallbackNote[] | null) ?? [],
      getQuestionKeywords(question)
    );

    contextBlocks = fallbackBlocks;
  }

  const context = contextBlocks.join("\n\n");

  const { data: profile } = await supabase
    .from("user_profile")
    .select("weak_topics,strong_topics,last_activity")
    .eq("user_id", userId)
    .maybeSingle();

  const prompt = `You are a strict study assistant.

Rules:
Answer ONLY from context
If not found, say 'Not in notes'
Keep structured answers

User Profile:
${JSON.stringify(profile ?? {}, null, 2)}

Context:
${context || "No matching notes found."}

Question:
${question}`;

  const answer = await askAI([
    {
      role: "system",
      content: "You answer only with grounded study help based on the supplied context."
    },
    {
      role: "user",
      content: prompt
    }
  ]);

  return {
    answer,
    chunks
  };
}
