import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const [
    { data: notes },
    { data: chats },
    { data: profile },
    quizSessionsResult
  ] = await Promise.all([
    supabase.from("notes").select("subject,topic").eq("user_id", user.id),
    supabase
      .from("chats")
      .select("messages(content)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("user_profile")
      .select("weak_topics,strong_topics,last_activity")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("quiz_sessions")
      .select("topic,score,total_questions,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);
  const quizSessions = quizSessionsResult.error ? [] : quizSessionsResult.data;

  const subjectMap = new Map<string, number>();
  const questionSignals =
    chats?.flatMap((chat) => chat.messages?.map((message) => message.content) ?? []) ?? [];

  for (const note of notes ?? []) {
    const key = note.subject || "General";
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1);
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-coral">
          <h2 className="mb-4 text-lg font-black uppercase">Weak topics</h2>
          <p className="text-sm font-black uppercase leading-6">
            {Array.isArray(profile?.weak_topics) && profile.weak_topics.length
              ? profile.weak_topics.join(", ")
              : "No weak topics logged yet"}
          </p>
        </Card>
        <Card className="bg-mint">
          <h2 className="mb-4 text-lg font-black uppercase">Strong topics</h2>
          <p className="text-sm font-black uppercase leading-6">
            {Array.isArray(profile?.strong_topics) && profile?.strong_topics.length
              ? profile.strong_topics.join(", ")
              : "Strong topics will emerge as usage data grows"}
          </p>
        </Card>
        <Card className="bg-sky">
          <h2 className="mb-4 text-lg font-black uppercase">Recent activity</h2>
          <p className="text-sm font-black uppercase leading-6">
            {profile?.last_activity
              ? new Date(profile.last_activity).toLocaleString()
              : "No study activity tracked yet"}
          </p>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="bg-rose">
          <h2 className="mb-4 text-xl font-black uppercase">Adaptive quiz results</h2>
          <div className="space-y-3">
            {quizSessions?.map((session, index) => (
              <div key={`${session.topic}-${index}`} className="border-[3px] border-ink bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase">
                      {session.topic || "General"}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase">
                      {session.status}
                    </p>
                  </div>
                  <span className="text-sm font-black uppercase">
                    {typeof session.score === "number"
                      ? `${session.score}/${session.total_questions}`
                      : "Pending"}
                  </span>
                </div>
              </div>
            ))}
            {!quizSessions?.length ? (
              <p className="text-sm font-bold uppercase">
                No quiz results yet. Generate an adaptive quiz to start tracking.
              </p>
            ) : null}
          </div>
        </Card>
        <Card className="bg-white">
          <h2 className="mb-4 text-xl font-black uppercase">Adaptive quiz summary</h2>
          <p className="text-sm font-bold uppercase leading-6">
            Quiz mode prioritizes weak topics first, then recent notes, and feeds
            completed quiz results back into your weak-topic and strong-topic signals.
          </p>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white">
          <h2 className="mb-4 text-xl font-black uppercase">Notes by subject</h2>
          <div className="space-y-3">
            {[...subjectMap.entries()].map(([subject, count]) => (
              <div key={subject} className="border-[3px] border-ink bg-lemon p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase">{subject}</span>
                  <span className="text-lg font-black uppercase">{count}</span>
                </div>
              </div>
            ))}
            {!subjectMap.size ? (
              <p className="text-sm font-bold uppercase">
                Save notes to populate analytics.
              </p>
            ) : null}
          </div>
        </Card>
        <Card className="bg-cream">
          <h2 className="mb-4 text-xl font-black uppercase">Question signals</h2>
          <div className="space-y-3">
            {questionSignals.slice(0, 8).map((content, index) => (
              <div key={`${content}-${index}`} className="border-[3px] border-ink bg-white p-4">
                <p className="text-sm font-bold uppercase leading-6">
                  {content}
                </p>
              </div>
            ))}
            {!questionSignals.length ? (
              <p className="text-sm font-bold uppercase">
                Ask questions in chat to generate analytics signals.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </main>
  );
}
