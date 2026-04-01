import { NextResponse } from "next/server";

import { generateNightBeforeSheet } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type NightBeforeRequest = {
  subject?: string;
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { subject } = (await request.json()) as NightBeforeRequest;
    const normalizedSubject = subject?.trim() || "General";
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("notes")
      .select("id,title,content,subject,topic,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (normalizedSubject.toLowerCase() !== "general") {
      query = query.eq("subject", normalizedSubject);
    }

    const { data: notes, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!notes?.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            normalizedSubject.toLowerCase() === "general"
              ? "Add notes first to generate a night-before sheet"
              : `No notes found for subject: ${normalizedSubject}`
        },
        { status: 400 }
      );
    }

    const context = notes
      .slice(0, 6)
      .map((note, index) => {
        const label = [note.title, note.subject, note.topic].filter(Boolean).join(" / ");
        return `[Source ${index + 1}${label ? ` - ${label}` : ""}]\n${note.content.slice(0, 2200)}`;
      })
      .join("\n\n");

    const result = await generateNightBeforeSheet({
      subject: normalizedSubject,
      context
    });

    return NextResponse.json({
      ok: true,
      result,
      meta: {
        subject: normalizedSubject,
        noteCount: notes.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
