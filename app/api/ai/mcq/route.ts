import { NextResponse } from "next/server";

import { generateStudyTool } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { content } = (await request.json()) as { content?: string };

    if (!content) {
      return NextResponse.json({ ok: false, error: "Content is required" }, { status: 400 });
    }

    const result = await generateStudyTool("mcq", content);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
