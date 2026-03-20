"use server";

import { revalidatePath } from "next/cache";

import { extractTextFromFile } from "@/lib/documents";
import { chunkText, createEmbedding } from "@/lib/embeddings";
import { requireUser } from "@/lib/auth";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient
} from "@/lib/supabase";

export async function getNotes() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id,title,content,subject,topic,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createNote(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const serviceSupabase = createServiceRoleSupabaseClient();

  const uploadedFile = formData.get("document");
  const file =
    uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : null;
  const titleInput = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const contentInput = String(formData.get("content") ?? "").trim();
  const extractedContent = file ? await extractTextFromFile(file) : "";
  const content = [extractedContent, contentInput].filter(Boolean).join("\n\n");
  const title =
    titleInput || (file ? file.name.replace(/\.[^/.]+$/, "") : "");

  if (!title || !content) {
    throw new Error("Provide a title plus note text or upload a document");
  }

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      subject,
      topic,
      content
    })
    .select("id,title,content,subject,topic")
    .single();

  if (error || !note) {
    throw new Error(error?.message ?? "Unable to create note");
  }

  const chunks = chunkText(content);

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);
    const { error: chunkError } = await serviceSupabase.from("note_chunks").insert({
      note_id: note.id,
      content_chunk: chunk,
      embedding,
      user_id: user.id,
      subject,
      topic,
      note_title: title
    });

    if (chunkError) {
      throw new Error(chunkError.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/notes");
}
