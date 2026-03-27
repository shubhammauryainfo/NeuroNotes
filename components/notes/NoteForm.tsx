import { createNote } from "@/server/actions/notes";
import { getMaxUploadSizeBytes } from "@/lib/uploads";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function NoteForm() {
  const maxUploadSizeMb = getMaxUploadSizeBytes() / (1024 * 1024);

  return (
    <Card className="bg-white">
      <div className="mb-5 flex flex-col gap-4 border-b-[3px] border-ink pb-4">
        <div>
          <h2 className="text-xl font-black uppercase">Create note</h2>
          <p className="mt-2 text-sm font-black uppercase leading-6">
            Paste lecture notes, upload study documents, or combine both in one
            save for chunking and embeddings.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-[3px] border-ink bg-lemon p-3 shadow-brutal-sm">
            <p className="text-[10px] font-black uppercase">Upload limit</p>
            <p className="mt-2 text-lg font-black uppercase">{maxUploadSizeMb} MB</p>
          </div>
          <div className="border-[3px] border-ink bg-sky p-3 shadow-brutal-sm">
            <p className="text-[10px] font-black uppercase">Accepted files</p>
            <p className="mt-2 text-lg font-black uppercase">PDF DOCX TXT</p>
          </div>
          <div className="border-[3px] border-ink bg-mint p-3 shadow-brutal-sm">
            <p className="text-[10px] font-black uppercase">Output</p>
            <p className="mt-2 text-lg font-black uppercase">Chunks + RAG</p>
          </div>
        </div>
      </div>
      <form action={createNote} className="grid gap-4">
        <Input
          name="title"
          placeholder="Note title (optional if uploading a file)"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="subject" placeholder="Subject" />
          <Input name="topic" placeholder="Topic" />
        </div>
        <div className="border-[3px] border-ink bg-sky p-4">
          <label
            htmlFor="document"
            className="mb-2 block text-sm font-black uppercase"
          >
            Upload PDF, DOCX, or TXT
          </label>
          <input
            id="document"
            name="document"
            type="file"
            accept=".pdf,.docx,.txt"
            className="block w-full text-sm font-bold file:mr-4 file:border-[3px] file:border-ink file:bg-lemon file:px-4 file:py-2 file:font-black file:uppercase"
          />
          <p className="mt-3 text-xs font-black uppercase leading-5">
            Max upload size: {maxUploadSizeMb} MB. You can upload a document,
            paste note text, or do both in one save.
          </p>
        </div>
        <Textarea
          name="content"
          placeholder="Paste your lecture notes, revision bullets, or add extra text to combine with an uploaded document..."
        />
        <SubmitButton
          className="w-full md:w-fit"
          idleLabel="Save note or upload document"
          pendingLabel="Uploading and embedding..."
        />
      </form>
    </Card>
  );
}
