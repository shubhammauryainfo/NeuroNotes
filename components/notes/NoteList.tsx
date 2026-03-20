import { Card } from "@/components/ui/Card";

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string | null;
  topic: string | null;
  created_at: string;
};

export function NoteList({ notes }: { notes: Note[] }) {
  return (
    <div className="grid gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="bg-cream">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-black uppercase">{note.title}</h3>
              <p className="mt-2 text-xs font-black uppercase">
                {note.subject || "General"} {note.topic ? `• ${note.topic}` : ""}
              </p>
            </div>
            <span className="text-xs font-black uppercase">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-6">
            {note.content.slice(0, 500)}
            {note.content.length > 500 ? "..." : ""}
          </p>
        </Card>
      ))}
      {notes.length === 0 ? (
        <Card className="bg-coral">
          <p className="text-sm font-black uppercase">
            No notes yet. Create the first one to power embeddings and RAG.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
