"use server";

import { revalidatePath } from "next/cache";

import { askAI } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import type {
  QuizQuestion,
  QuizSessionRecord,
  QuizSessionSummary
} from "@/lib/quiz";
import { createServerSupabaseClient } from "@/lib/supabase";

function extractJsonPayload(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const plainFence = content.match(/```([\s\S]*?)```/);
  if (plainFence?.[1]) {
    return plainFence[1].trim();
  }

  return content.trim();
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function isMissingQuizTableError(message: string) {
  const value = message.toLowerCase();
  return (
    value.includes("quiz_sessions") &&
    (value.includes("schema cache") || value.includes("does not exist"))
  );
}

function normalizeQuestions(payload: unknown): QuizQuestion[] {
  if (!Array.isArray(payload)) {
    throw new Error("Quiz payload is not an array");
  }

  return payload.slice(0, 5).map((item, index) => {
    const record = item as Record<string, unknown>;
    const options = Array.isArray(record.options) ? record.options : [];

    return {
      question: String(record.question ?? `Question ${index + 1}`),
      options: options.slice(0, 4).map((option, optionIndex) => {
        const optionRecord = option as Record<string, unknown>;
        return {
          label: String(
            optionRecord.label ?? String.fromCharCode(65 + optionIndex)
          ),
          text: String(optionRecord.text ?? "")
        };
      }),
      answer: String(record.answer ?? "A"),
      explanation: String(record.explanation ?? ""),
      topic: String(record.topic ?? "General"),
      difficulty: String(record.difficulty ?? "adaptive")
    };
  });
}

async function buildQuizSource(userId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ data: profile }, { data: notes }] = await Promise.all([
    supabase
      .from("user_profile")
      .select("weak_topics,strong_topics")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("notes")
      .select("id,title,content,subject,topic,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const weakTopics = Array.isArray(profile?.weak_topics) ? profile.weak_topics : [];
  const strongTopics = Array.isArray(profile?.strong_topics) ? profile.strong_topics : [];
  const selectedTopic =
    weakTopics[0] ??
    notes?.[0]?.topic ??
    notes?.[0]?.subject ??
    "General revision";

  const sourceNotes = (notes ?? []).slice(0, 4);
  const sourceNoteIds = sourceNotes.map((note) => note.id);
  const context = sourceNotes
    .map((note, index) => {
      const label = [note.title, note.subject, note.topic].filter(Boolean).join(" / ");
      return `[Source ${index + 1}${label ? ` - ${label}` : ""}]\n${note.content.slice(0, 1800)}`;
    })
    .join("\n\n");

  return {
    weakTopics,
    strongTopics,
    selectedTopic,
    context,
    sourceNoteIds
  };
}

export async function generateAdaptiveQuiz() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { weakTopics, strongTopics, selectedTopic, context, sourceNoteIds } =
    await buildQuizSource(user.id);

  if (!context) {
    throw new Error("Add some notes first to generate an adaptive quiz");
  }

  const response = await askAI([
    {
      role: "system",
      content:
        "You create adaptive quizzes for students. Return only valid JSON with no extra commentary."
    },
    {
      role: "user",
      content: `Create an adaptive multiple-choice quiz from the study material below.

Rules:
- Focus more on weak topics than strong topics
- Generate exactly 5 questions
- Each question must have 4 options labeled A, B, C, D
- Include the correct answer label
- Include a short explanation
- Include a topic and difficulty for each question
- Return ONLY a JSON array

Weak topics:
${weakTopics.join(", ") || "None recorded"}

Strong topics:
${strongTopics.join(", ") || "None recorded"}

Priority topic:
${selectedTopic}

Study material:
${context}

JSON shape:
[
  {
    "question": "string",
    "options": [
      { "label": "A", "text": "string" },
      { "label": "B", "text": "string" },
      { "label": "C", "text": "string" },
      { "label": "D", "text": "string" }
    ],
    "answer": "A",
    "explanation": "string",
    "topic": "string",
    "difficulty": "easy|medium|hard"
  }
]`
    }
  ]);

  const parsed = JSON.parse(extractJsonPayload(response));
  const questions = normalizeQuestions(parsed);

  const { error } = await supabase.from("quiz_sessions").insert({
    user_id: user.id,
    topic: selectedTopic,
    difficulty: "adaptive",
    source_note_ids: sourceNoteIds,
    questions,
    total_questions: questions.length,
    status: "generated"
  });

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      throw new Error(
        "Quiz mode is not ready in Supabase yet. Run the latest schema.sql to create quiz tables."
      );
    }
    throw new Error(error.message);
  }

  revalidatePath("/quiz");
  revalidatePath("/analytics");
}

export async function generateRetryWrongAnswers(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  if (!sessionId) {
    throw new Error("Missing quiz session for retry");
  }

  const { data: session, error } = await supabase
    .from("quiz_sessions")
    .select(
      "id,topic,source_note_ids,questions,status,quiz_answers(question_index,is_correct)"
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !session) {
    if (error && isMissingQuizTableError(error.message)) {
      throw new Error(
        "Quiz mode is not ready in Supabase yet. Run the latest schema.sql to create quiz tables."
      );
    }
    throw new Error(error?.message ?? "Retry source quiz not found");
  }

  if (session.status !== "completed") {
    throw new Error("Complete this quiz first before retrying wrong answers");
  }

  const questions = (session.questions as QuizQuestion[] | null) ?? [];
  const wrongIndexes = new Set(
    ((session.quiz_answers as Array<{ question_index: number; is_correct: boolean | null }> | null) ?? [])
      .filter((answer) => answer.is_correct === false)
      .map((answer) => answer.question_index)
  );

  const retryQuestions = questions.filter((_, index) => wrongIndexes.has(index)).slice(0, 5);

  if (!retryQuestions.length) {
    throw new Error("No incorrect answers found. Great job, nothing to retry.");
  }

  const { error: insertError } = await supabase.from("quiz_sessions").insert({
    user_id: user.id,
    topic: session.topic ?? "Wrong-answer retry",
    difficulty: "retry-wrong",
    source_note_ids: session.source_note_ids ?? [],
    questions: retryQuestions,
    total_questions: retryQuestions.length,
    status: "generated"
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/quiz");
  revalidatePath("/analytics");
}

export async function submitAdaptiveQuiz(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  if (!sessionId) {
    throw new Error("Missing quiz session");
  }

  const { data: session, error } = await supabase
    .from("quiz_sessions")
    .select("id,questions,status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !session) {
    if (error && isMissingQuizTableError(error.message)) {
      throw new Error(
        "Quiz mode is not ready in Supabase yet. Run the latest schema.sql to create quiz tables."
      );
    }
    throw new Error(error?.message ?? "Quiz session not found");
  }

  if (session.status === "completed") {
    revalidatePath("/quiz");
    return;
  }

  const questions = (session.questions as QuizQuestion[]) ?? [];
  let score = 0;
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];

  const answerRows = questions.map((question, index) => {
    const selectedOption = String(formData.get(`answer-${index}`) ?? "").trim();
    const isCorrect =
      selectedOption.toUpperCase() === question.answer.toUpperCase();

    if (isCorrect) {
      score += 1;
      strongTopics.push(question.topic);
    } else {
      weakTopics.push(question.topic);
    }

    return {
      quiz_session_id: session.id,
      question_index: index,
      selected_option: selectedOption || "UNANSWERED",
      correct_option: question.answer,
      is_correct: isCorrect
    };
  });

  const { error: answersError } = await supabase
    .from("quiz_answers")
    .insert(answerRows);

  if (answersError) {
    throw new Error(answersError.message);
  }

  const { error: sessionError } = await supabase
    .from("quiz_sessions")
    .update({
      score,
      status: "completed",
      completed_at: new Date().toISOString()
    })
    .eq("id", session.id)
    .eq("user_id", user.id);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const mergedWeakTopics = dedupeStrings(weakTopics);
  const mergedStrongTopics = dedupeStrings(strongTopics);

  await supabase.from("user_profile").upsert(
    {
      user_id: user.id,
      weak_topics: mergedWeakTopics,
      strong_topics: mergedStrongTopics,
      last_activity: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  revalidatePath("/quiz");
  revalidatePath("/analytics");
}

export async function getQuizSessionById(sessionId: string) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("quiz_sessions")
    .select(
      "id,topic,difficulty,source_note_ids,questions,score,total_questions,status,created_at,completed_at,quiz_answers(question_index,selected_option,correct_option,is_correct)"
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data as QuizSessionRecord | null) ?? null;
}

export async function getLatestQuizSession() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("quiz_sessions")
    .select(
      "id,topic,difficulty,source_note_ids,questions,score,total_questions,status,created_at,completed_at,quiz_answers(question_index,selected_option,correct_option,is_correct)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data as QuizSessionRecord | null) ?? null;
}

export async function getRecentQuizSessions() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("id,topic,difficulty,score,total_questions,status,created_at,completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return [] as QuizSessionSummary[];
    }
    throw new Error(error.message);
  }

  return (data as QuizSessionSummary[] | null) ?? [];
}
