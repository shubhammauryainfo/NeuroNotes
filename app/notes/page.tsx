import { AiNotesPreview } from "@/components/notes/AiNotesPreview";
import { NoteForm } from "@/components/notes/NoteForm";
import { NoteList } from "@/components/notes/NoteList";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { generateStudyTool } from "@/lib/ai";
import { getNotes } from "@/server/actions/notes";

export default async function NotesPage() {
  await requireUser();
  const notes = await getNotes();
  const latestNote = notes[0];
  let summary = "Create a note to unlock AI study tools.";

  if (latestNote) {
    try {
      summary = await generateStudyTool("summary", latestNote.content);
    } catch {
      summary = "AI summary unavailable until OpenRouter is configured.";
    }
  }

  const noteCount = notes.length;
  const topicCount = new Set(
    notes.flatMap((note) => [note.subject, note.topic].filter(Boolean))
  ).size;
  const totalWords = notes.reduce(
    (total, note) => total + (note.content.match(/\S+/g) ?? []).length,
    0
  );
  const latestTitle = latestNote?.title ?? "No notes saved yet";

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-rose">
          <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-black uppercase">Notes workspace</h1>
              <p className="mt-2 max-w-2xl text-sm font-black uppercase leading-6">
                Store raw study material, upload revision docs, and turn every saved note
                into embeddings, summaries, and RAG-ready context.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Saved notes</p>
                <p className="mt-2 text-2xl font-black uppercase">{noteCount}</p>
              </div>
              <div className="border-[3px] border-ink bg-lemon p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Active topics</p>
                <p className="mt-2 text-2xl font-black uppercase">{topicCount}</p>
              </div>
              <div className="border-[3px] border-ink bg-mint p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Words stored</p>
                <p className="mt-2 text-2xl font-black uppercase">{totalWords}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-sky">
          <h2 className="text-xl font-black uppercase">Notes strategy</h2>
          <div className="mt-4 space-y-3 text-sm font-black uppercase">
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Latest saved note</p>
              <p className="mt-2 leading-6">{latestTitle}</p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Best input style</p>
              <p className="mt-2 leading-6">
                Use clear headings, named topics, and concise study language to improve chunk quality.
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">What happens after save</p>
              <p className="mt-2 leading-6">
                NeuroNotes stores the source text, chunks it, creates embeddings, and prepares it for chat retrieval.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <NoteForm />
          <AiNotesPreview content={summary} />
        </div>
        <NoteList notes={notes} />
      </section>
    </main>
  );
}
