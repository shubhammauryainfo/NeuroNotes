import Link from "next/link";

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

type ChatPanelProps = {
  chats: ChatRecord[];
  noteCount: number;
  weakTopics: string[];
  suggestedPrompts: string[];
};

export function ChatPanel({
  chats,
  noteCount,
  weakTopics,
  suggestedPrompts
}: ChatPanelProps) {
  const messageCount = chats.reduce(
    (total, chat) => total + (chat.messages?.length ?? 0),
    0
  );

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-sky">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-black uppercase">Ask your notes</h1>
                <p className="mt-2 max-w-2xl text-sm font-black uppercase leading-6">
                  Run grounded RAG answers, turn your notes into quick revision
                  help, and keep your weak-topic signals improving over time.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border-[3px] border-ink bg-white p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Notes ready</p>
                  <p className="mt-2 text-2xl font-black uppercase">{noteCount}</p>
                </div>
                <div className="border-[3px] border-ink bg-lemon p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Saved chats</p>
                  <p className="mt-2 text-2xl font-black uppercase">{chats.length}</p>
                </div>
                <div className="border-[3px] border-ink bg-mint p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Messages tracked</p>
                  <p className="mt-2 text-2xl font-black uppercase">{messageCount}</p>
                </div>
              </div>

              {noteCount === 0 ? (
                <div className="border-[3px] border-ink bg-coral p-4 shadow-brutal-sm">
                  <p className="text-sm font-black uppercase leading-6">
                    Add notes first so the assistant has something real to retrieve.
                  </p>
                  <Link
                    href="/notes"
                    className="mt-4 inline-flex border-[3px] border-ink bg-white px-4 py-3 text-sm font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
                  >
                    Open notes
                  </Link>
                </div>
              ) : null}
            </div>

            <Card className="w-full max-w-lg bg-white">
              <h2 className="text-xl font-black uppercase">New question</h2>
              <p className="mt-2 text-sm font-black uppercase leading-6">
                Ask for explanations, comparisons, quick revision summaries, or
                testing questions from your stored notes.
              </p>
              <form action={askNotesQuestion} className="mt-4 grid gap-4">
                <Textarea
                  name="question"
                  placeholder="Ask a concept question, request an explanation, or test yourself from your notes..."
                  required
                />
                <SubmitButton
                  className="w-full md:w-fit"
                  idleLabel="Run RAG answer"
                  pendingLabel="Thinking with your notes..."
                  disabled={noteCount === 0}
                />
              </form>
            </Card>
          </div>
        </Card>

        <Card className="bg-cream">
          <h2 className="text-xl font-black uppercase">Chat strategy</h2>
          <div className="mt-4 space-y-3 text-sm font-black uppercase">
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Weak topics in focus</p>
              <p className="mt-2 leading-6">
                {weakTopics.length
                  ? weakTopics.slice(0, 4).join(", ")
                  : "Weak topics appear after more quiz and chat activity"}
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Best prompt style</p>
              <p className="mt-2 leading-6">
                Use note words directly. Ask for definitions, steps, comparisons,
                or examples from a named topic.
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Quick prompts</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <span
                    key={prompt}
                    className="border-[3px] border-ink bg-lemon px-3 py-2 text-[10px] shadow-brutal-sm"
                  >
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-lemon">
          <h2 className="mb-4 text-xl font-black uppercase">History overview</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px] font-black uppercase">Latest chat</p>
              <p className="mt-2 text-sm font-black uppercase leading-6">
                {chats[0]?.created_at
                  ? new Date(chats[0].created_at).toLocaleString()
                  : "No questions asked yet"}
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px] font-black uppercase">Assistant turns</p>
              <p className="mt-2 text-sm font-black uppercase leading-6">
                {
                  chats.flatMap((chat) => chat.messages ?? []).filter((message) => message.role === "assistant")
                    .length
                }{" "}
                tracked answers
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {!chats.length ? (
            <Card className="bg-coral">
              <p className="text-sm font-black uppercase leading-6">
                No chat history yet. Ask the first grounded question to start saving study conversations.
              </p>
            </Card>
          ) : null}

          {chats.map((chat) => (
            <Card key={chat.id} className="bg-white">
              <details className="group" open={chat === chats[0]}>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border-[3px] border-ink bg-lemon px-2 py-1 text-[10px] font-black uppercase shadow-brutal-sm">
                          Recent chat
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1 text-[10px] font-black uppercase shadow-brutal-sm">
                          {chat.messages?.length ?? 0} messages
                        </span>
                        <span className="text-xs font-black uppercase group-open:hidden">
                          Expand
                        </span>
                        <span className="hidden text-xs font-black uppercase group-open:inline">
                          Collapse
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-black uppercase leading-6">
                        {new Date(chat.created_at).toLocaleString()}
                      </p>
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
                  <p className="mt-4 text-sm font-bold uppercase leading-6 group-open:hidden">
                    {(chat.messages?.[0]?.content ?? "Open this chat to review the saved conversation.").slice(0, 140)}
                    {(chat.messages?.[0]?.content?.length ?? 0) > 140 ? "..." : ""}
                  </p>
                </summary>

                <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                  {chat.messages?.map((message, index) => (
                    <div
                      key={`${chat.id}-${index}`}
                      className={
                        message.role === "assistant"
                          ? "border-[3px] border-ink bg-mint p-3 shadow-brutal-sm"
                          : "border-[3px] border-ink bg-lemon p-3 shadow-brutal-sm"
                      }
                    >
                      <p className="mb-2 text-xs font-black uppercase">{message.role}</p>
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
              </details>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
