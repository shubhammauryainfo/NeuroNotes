import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { askYourNotes } from "@/lib/rag";

export async function POST(request: Request) {
  try {
    const { question } = (await request.json()) as { question?: string };
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!question) {
      return NextResponse.json({ ok: false, error: "Question is required" }, { status: 400 });
    }

    const result = await askYourNotes(question, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
