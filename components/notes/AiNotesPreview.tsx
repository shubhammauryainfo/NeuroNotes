import { Card } from "@/components/ui/Card";

type NoteBlock =
  | { type: "heading"; content: string }
  | { type: "bulletList"; items: string[] }
  | { type: "numberList"; items: string[] }
  | { type: "paragraph"; content: string };

function normalizeLine(line: string) {
  return line.replace(/\u2022/g, "-").trim();
}

function isHeading(line: string) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^[A-Z][A-Z\s/&-]{3,}$/.test(line) ||
    /^[A-Z][^.!?]{2,40}:$/.test(line)
  );
}

function isBullet(line: string) {
  return /^[-*]\s+/.test(line);
}

function isNumbered(line: string) {
  return /^\d+\.\s+/.test(line);
}

function cleanHeading(line: string) {
  return line.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
}

function cleanListItem(line: string) {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

function parseBlocks(content: string): NoteBlock[] {
  const lines = content.split("\n").map(normalizeLine);
  const blocks: NoteBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line) {
      index += 1;
      continue;
    }

    if (isHeading(line)) {
      blocks.push({
        type: "heading",
        content: cleanHeading(line)
      });
      index += 1;
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];

      while (index < lines.length && isBullet(lines[index])) {
        items.push(cleanListItem(lines[index]));
        index += 1;
      }

      blocks.push({ type: "bulletList", items });
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];

      while (index < lines.length && isNumbered(lines[index])) {
        items.push(cleanListItem(lines[index]));
        index += 1;
      }

      blocks.push({ type: "numberList", items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (
      index < lines.length &&
      lines[index] &&
      !isHeading(lines[index]) &&
      !isBullet(lines[index]) &&
      !isNumbered(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" ")
    });
  }

  return blocks;
}

function renderInlineEmphasis(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function AiNotesPreview({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <Card className="bg-mint">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black uppercase">Latest AI notes</h2>
        <span className="border-[3px] border-ink bg-white px-3 py-1 text-[10px] font-black uppercase text-ink shadow-brutal-sm">
          Scroll
        </span>
      </div>

      <div className="max-h-[30rem] space-y-4 overflow-y-auto pr-2">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <div
                key={`heading-${index}`}
                className="border-[3px] border-ink bg-white px-4 py-2 text-sm font-black uppercase text-ink shadow-brutal-sm"
              >
                {block.content}
              </div>
            );
          }

          if (block.type === "bulletList") {
            return (
              <ul
                key={`bullets-${index}`}
                className="space-y-2 border-[3px] border-ink bg-white p-4 text-sm font-bold leading-6 text-ink shadow-brutal-sm"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`bullet-${index}-${itemIndex}`} className="flex gap-3">
                    <span className="mt-[2px] text-base font-black">■</span>
                    <span>{renderInlineEmphasis(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === "numberList") {
            return (
              <ol
                key={`numbers-${index}`}
                className="space-y-2 border-[3px] border-ink bg-lemon p-4 text-sm font-bold leading-6 text-ink shadow-brutal-sm"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`number-${index}-${itemIndex}`} className="flex gap-3">
                    <span className="min-w-6 font-black">{itemIndex + 1}.</span>
                    <span>{renderInlineEmphasis(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <div
              key={`paragraph-${index}`}
              className="border-[3px] border-ink bg-cream p-4 text-sm font-bold leading-7 text-ink shadow-brutal-sm"
            >
              {renderInlineEmphasis(block.content)}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
