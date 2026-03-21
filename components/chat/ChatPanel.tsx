import { askNotesQuestion, deleteChat } from "@/server/actions/chat";
import { AssistantMessage } from "@/components/chat/AssistantMessage";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

type ChatRecord = {
  id: string;
  created_at: string;
  messages: Array<{ role: string; content: string }>;
};

export function ChatPanel({ chats }: { chats: ChatRecord[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="bg-sky">
        <h2 className="mb-4 text-xl font-black uppercase">Ask your notes</h2>
        <form action={askNotesQuestion} className="grid gap-4">
          <Textarea
            name="question"
            placeholder="Ask a concept question, request an explanation, or test yourself from your notes..."
            required
          />
          <SubmitButton
            className="w-full md:w-fit"
            idleLabel="Run RAG answer"
            pendingLabel="Thinking with your notes..."
          />
        </form>
      </Card>
      <div className="grid gap-4">
        {chats.map((chat) => (
          <Card key={chat.id} className="bg-white">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase">Recent chat</h3>
                <span className="text-xs font-black uppercase">
                  {new Date(chat.created_at).toLocaleString()}
                </span>
              </div>
              <form action={deleteChat.bind(null, chat.id)}>
                <SubmitButton
                  variant="danger"
                  className="px-3 py-2 text-xs"
                  idleLabel="Delete"
                  pendingLabel="Deleting..."
                />
              </form>
            </div>
            <div className="space-y-3">
              {chat.messages?.map((message, index) => (
                <div
                  key={`${chat.id}-${index}`}
                  className={
                    message.role === "assistant"
                      ? "border-[3px] border-ink bg-mint p-3"
                      : "border-[3px] border-ink bg-lemon p-3"
                  }
                >
                  <p className="mb-1 text-xs font-black uppercase">{message.role}</p>
                  {message.role === "assistant" ? (
                    <AssistantMessage content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm font-bold leading-6">
                      {message.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {chats.length === 0 ? (
          <Card className="bg-coral">
            <p className="text-sm font-black uppercase">
              No chat history yet. Ask the first question to test retrieval.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
