import { ChatPanel } from "@/components/chat/ChatPanel";
import { requireUser } from "@/lib/auth";
import { getRecentChats } from "@/server/actions/chat";

export default async function ChatPage() {
  await requireUser();
  const chats = await getRecentChats();

  return (
    <main>
      <ChatPanel chats={chats} />
    </main>
  );
}
