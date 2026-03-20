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

  return (
    <main className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <NoteForm />
        <Card className="bg-mint">
          <h2 className="mb-4 text-xl font-black uppercase">Latest AI summary</h2>
          <p className="whitespace-pre-wrap text-sm font-bold uppercase leading-6">
            {summary}
          </p>
        </Card>
      </div>
      <NoteList notes={notes} />
    </main>
  );
}
