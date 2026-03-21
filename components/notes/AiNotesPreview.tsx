import { Card } from "@/components/ui/Card";

function classifyLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return "empty";
  }

  if (/^#{1,6}\s/.test(trimmed)) {
    return "heading";
  }

  if (/^[A-Z][A-Z\s]{3,}$/.test(trimmed) || trimmed.endsWith(":")) {
    return "heading";
  }

  if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
    return "bullet";
  }

  return "paragraph";
}

export function AiNotesPreview({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <Card className="bg-mint">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black uppercase">Latest AI notes</h2>

      </div>
      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-2">
        {lines.map((line, index) => {
          const kind = classifyLine(line);

          if (kind === "empty") {
            return <div key={`space-${index}`} className="h-2" />;
          }

          if (kind === "heading") {
            return (
              <p
                key={`heading-${index}`}
                className="mt-3 border-[3px] border-ink bg-white px-3 py-2 text-sm font-black uppercase text-ink shadow-brutal-sm"
              >
                {line.replace(/^#+\s*/, "")}
              </p>
            );
          }

          if (kind === "bullet") {
            return (
              <p
                key={`bullet-${index}`}
                className="border-l-[3px] border-ink pl-3 text-sm font-bold leading-6 text-ink"
              >
                {line}
              </p>
            );
          }

          return (
            <p
              key={`paragraph-${index}`}
              className="text-sm font-bold leading-6 text-ink"
            >
              {line}
            </p>
          );
        })}
      </div>
    </Card>
  );
}
