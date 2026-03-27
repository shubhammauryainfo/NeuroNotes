import { ChatPanel } from "@/components/chat/ChatPanel";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getRecentChats } from "@/server/actions/chat";

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const [chats, { count: noteCount }, { data: profile }] = await Promise.all([
    getRecentChats(),
    supabase
      .from("notes")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("user_profile")
      .select("weak_topics")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  const weakTopics = Array.isArray(profile?.weak_topics) ? profile.weak_topics : [];
  const suggestedPrompts = [
    weakTopics[0] ? `Explain ${weakTopics[0]}` : "Explain the main idea",
    "List key definitions",
    "Test me with 3 quick questions"
  ];

  return (
    <ChatPanel
      chats={chats}
      noteCount={noteCount ?? 0}
      weakTopics={weakTopics}
      suggestedPrompts={suggestedPrompts}
    />
  );
}
