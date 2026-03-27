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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-[3px] border-ink bg-lemon p-4 shadow-brutal sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black uppercase">Saved notes</h2>
          <p className="mt-2 text-sm font-black uppercase leading-6">
            Expand any note to review the full source text powering your AI study tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
          <span className="border-[3px] border-ink bg-white px-3 py-2 shadow-brutal-sm">
            Total: {notes.length}
          </span>
          <span className="border-[3px] border-ink bg-white px-3 py-2 shadow-brutal-sm">
            Scrollable detail
          </span>
        </div>
      </div>

      <div className="grid gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="bg-cream">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="border-[3px] border-ink bg-white px-2 py-1 text-[10px] font-black uppercase text-ink shadow-brutal-sm">
                      Note
                    </span>
                    <span className="border-[3px] border-ink bg-white px-2 py-1 text-[10px] font-black uppercase text-ink shadow-brutal-sm">
                      {note.subject || "General"}
                    </span>
                    {note.topic ? (
                      <span className="border-[3px] border-ink bg-white px-2 py-1 text-[10px] font-black uppercase text-ink shadow-brutal-sm">
                        {note.topic}
                      </span>
                    ) : null}
                    <span className="text-xs font-black uppercase group-open:hidden">
                      Expand
                    </span>
                    <span className="hidden text-xs font-black uppercase group-open:inline">
                      Collapse
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black uppercase">{note.title}</h3>
                  <p className="mt-2 text-xs font-black uppercase leading-5">
                    {(note.content.match(/\S+/g) ?? []).length} words stored for embeddings and study tools
                  </p>
                </div>
                <span className="text-xs font-black uppercase">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-6 group-open:hidden">
                {note.content.slice(0, 220)}
                {note.content.length > 220 ? "..." : ""}
              </p>
            </summary>

            <div className="mt-4 max-h-[24rem] overflow-y-auto border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-ink">
                {note.content}
              </p>
            </div>
          </details>
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
    </div>
  );
}
