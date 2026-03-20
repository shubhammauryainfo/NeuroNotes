import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getNotes } from "@/server/actions/notes";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notes = await getNotes();
    return NextResponse.json({ ok: true, notes });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
