import { createNote } from "@/server/actions/notes";
import { getMaxUploadSizeBytes } from "@/lib/uploads";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

export function NoteForm() {
  const maxUploadSizeMb = getMaxUploadSizeBytes() / (1024 * 1024);

  return (
    <Card className="bg-white">
      <h2 className="mb-4 text-xl font-black uppercase">Create note</h2>
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
        <Button type="submit" className="w-full md:w-fit">
          Save note or upload document
        </Button>
      </form>
    </Card>
  );
}
