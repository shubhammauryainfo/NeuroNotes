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

function renderInline(text: string) {
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

export function AssistantMessage({ content }: { content: string }) {
  const lines = content.split("\n").map(normalizeLine).filter(Boolean);
  const blocks: Array<
    | { type: "heading"; content: string }
    | { type: "bullets"; items: string[] }
    | { type: "numbers"; items: string[] }
    | { type: "paragraph"; content: string }
  > = [];

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isHeading(line)) {
      blocks.push({ type: "heading", content: cleanHeading(line) });
      index += 1;
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (index < lines.length && isBullet(lines[index])) {
        items.push(cleanListItem(lines[index]));
        index += 1;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];
      while (index < lines.length && isNumbered(lines[index])) {
        items.push(cleanListItem(lines[index]));
        index += 1;
      }
      blocks.push({ type: "numbers", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      !isHeading(lines[index]) &&
      !isBullet(lines[index]) &&
      !isNumbered(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push({ type: "paragraph", content: paragraph.join(" ") });
  }

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          return (
            <div
              key={`heading-${blockIndex}`}
              className="border-[3px] border-ink bg-white px-3 py-2 text-xs font-black uppercase text-ink shadow-brutal-sm"
            >
              {block.content}
            </div>
          );
        }

        if (block.type === "bullets") {
          return (
            <ul
              key={`bullets-${blockIndex}`}
              className="space-y-2 border-[3px] border-ink bg-white p-3 text-sm font-bold leading-6 text-ink shadow-brutal-sm"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`bullet-${blockIndex}-${itemIndex}`} className="flex gap-3">
                  <span className="font-black">■</span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbers") {
          return (
            <ol
              key={`numbers-${blockIndex}`}
              className="space-y-2 border-[3px] border-ink bg-white p-3 text-sm font-bold leading-6 text-ink shadow-brutal-sm"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`number-${blockIndex}-${itemIndex}`} className="flex gap-3">
                  <span className="min-w-6 font-black">{itemIndex + 1}.</span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div
            key={`paragraph-${blockIndex}`}
            className="border-[3px] border-ink bg-white p-3 text-sm font-bold leading-7 text-ink shadow-brutal-sm"
          >
            {renderInline(block.content)}
          </div>
        );
      })}
    </div>
  );
}
