import Link from "next/link";

import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const [{ count: noteCount }, { count: chatCount }, { data: profile }, { data: notes }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", user.id),
      supabase
        .from("chats")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", user.id),
      supabase
        .from("user_profile")
        .select("weak_topics,strong_topics,last_activity")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("notes")
        .select("id,title,subject,topic,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4)
    ]);

  const stats = [
    { label: "Notes", value: noteCount ?? 0, color: "bg-lemon" },
    { label: "Chats", value: chatCount ?? 0, color: "bg-sky" },
    {
      label: "Weak Topics",
      value: Array.isArray(profile?.weak_topics) ? profile.weak_topics.length : 0,
      color: "bg-coral"
    },
    {
      label: "Last Active",
      value: profile?.last_activity
        ? new Date(profile.last_activity).toLocaleDateString()
        : "New",
      color: "bg-mint"
    }
  ];

  return (
    <main className="space-y-6">
      <StatsGrid stats={stats} />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white">
          <h2 className="mb-4 text-xl font-black uppercase">Recent notes</h2>
          <div className="space-y-3">
            {notes?.map((note) => (
              <div key={note.id} className="border-[3px] border-ink bg-cream p-4">
                <p className="text-sm font-black uppercase">{note.title}</p>
                <p className="mt-1 text-xs font-black uppercase">
                  {note.subject || "General"} {note.topic ? `• ${note.topic}` : ""}
                </p>
              </div>
            ))}
            {!notes?.length ? (
              <p className="text-sm font-bold uppercase">
                No notes saved yet. Start in the notes workspace.
              </p>
            ) : null}
          </div>
        </Card>
        <Card className="bg-rose">
          <h2 className="mb-4 text-xl font-black uppercase">AI suggestions</h2>
          <div className="space-y-3 text-sm font-black uppercase leading-6">
            <p>
              Review weak topics:
              {" "}
              {Array.isArray(profile?.weak_topics) && profile.weak_topics.length
                ? profile.weak_topics.join(", ")
                : "No weak topics detected yet"}
            </p>
            <p>
              Strong topics:
              {" "}
              {Array.isArray(profile?.strong_topics) && profile.strong_topics.length
                ? profile.strong_topics.join(", ")
                : "Will update as usage patterns grow"}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="border-[3px] border-ink bg-white px-4 py-3 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
            >
              Ask your notes
            </Link>
            <Link
              href="/notes"
              className="border-[3px] border-ink bg-lemon px-4 py-3 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
            >
              Create a new note
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
