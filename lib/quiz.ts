export type QuizOption = {
  label: string;
  text: string;
};

export type QuizQuestion = {
  question: string;
  options: QuizOption[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
};

export type QuizAnswerRecord = {
  question_index: number;
  selected_option: string;
  correct_option: string | null;
  is_correct: boolean | null;
};

export type QuizSessionRecord = {
  id: string;
  topic: string | null;
  difficulty: string;
  source_note_ids: string[];
  questions: QuizQuestion[];
  score: number | null;
  total_questions: number;
  status: "generated" | "completed";
  created_at: string;
  completed_at: string | null;
  quiz_answers?: QuizAnswerRecord[];
};

export type QuizSessionSummary = {
  id: string;
  topic: string | null;
  difficulty: string;
  score: number | null;
  total_questions: number;
  status: "generated" | "completed";
  created_at: string;
  completed_at: string | null;
};
