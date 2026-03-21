"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { askYourNotes } from "@/lib/rag";
import { createServerSupabaseClient } from "@/lib/supabase";

function deriveWeakTopic(question: string, chunks: Array<{ topic?: string; subject?: string }>) {
  const topicCounts = new Map<string, number>();

  for (const chunk of chunks) {
    const label = chunk.topic || chunk.subject;
    if (!label) {
      continue;
    }
    topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
  }

  const topTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return topTopic ?? question.split(" ").slice(0, 3).join(" ");
}

export async function askNotesQuestion(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const question = String(formData.get("question") ?? "").trim();

  if (!question) {
    throw new Error("Question is required");
  }

  const { data: chat } = await supabase
    .from("chats")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  const result = await askYourNotes(question, user.id);

  if (chat?.id) {
    await supabase.from("messages").insert([
      {
        chat_id: chat.id,
        role: "user",
        content: question
      },
      {
        chat_id: chat.id,
        role: "assistant",
        content: result.answer
      }
    ]);
  }

  const weakTopic = deriveWeakTopic(question, result.chunks);

  await supabase.from("user_profile").upsert(
    {
      user_id: user.id,
      weak_topics: [weakTopic],
      last_activity: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  revalidatePath("/chat");
  revalidatePath("/analytics");
}

export async function getRecentChats() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("chats")
    .select("id,created_at,messages(role,content)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function deleteChat(chatId: string) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/chat");
  revalidatePath("/analytics");
}
