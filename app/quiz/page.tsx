import { QuizWorkspace } from "@/components/quiz/QuizWorkspace";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  generateAdaptiveQuiz,
  generateRetryWrongAnswers,
  getLatestQuizSession,
  getQuizSessionById,
  getRecentQuizSessions,
  submitAdaptiveQuiz
} from "@/server/actions/quiz";

type QuizPageProps = {
  searchParams?: Promise<{
    session?: string;
  }>;
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedSessionId = resolvedSearchParams?.session?.trim() || null;

  const [
    selectedQuiz,
    latestQuiz,
    recentQuizSessions,
    quizSetup,
    { count: noteCount },
    { data: profile }
  ] = await Promise.all([
    selectedSessionId ? getQuizSessionById(selectedSessionId) : Promise.resolve(null),
    getLatestQuizSession(),
    getRecentQuizSessions(),
    supabase.from("quiz_sessions").select("id", { head: true, count: "exact" }),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_profile")
      .select("weak_topics,strong_topics")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  return (
    <QuizWorkspace
      activeQuiz={selectedQuiz ?? latestQuiz}
      recentQuizSessions={recentQuizSessions}
      noteCount={noteCount ?? 0}
      weakTopics={Array.isArray(profile?.weak_topics) ? profile.weak_topics : []}
      strongTopics={Array.isArray(profile?.strong_topics) ? profile.strong_topics : []}
      setupReady={!quizSetup.error}
      selectedSessionId={selectedSessionId}
      generateAdaptiveQuizAction={generateAdaptiveQuiz}
      generateRetryWrongAnswersAction={generateRetryWrongAnswers}
      submitAdaptiveQuizAction={submitAdaptiveQuiz}
    />
  );
}
