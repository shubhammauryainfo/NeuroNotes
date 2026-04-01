"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";

type NightBeforeSheetProps = {
  subjects: string[];
};

const T12_SECTION_ORDER = [
  "T-12 SNAPSHOT",
  "CORE FORMULAS",
  "HIGH-YIELD DEFINITIONS",
  "TRAPS TO AVOID",
  "PROBABLE VIVA QUESTIONS",
  "LAST 30-MINUTE PLAN"
] as const;

const SECTION_TONE: Record<(typeof T12_SECTION_ORDER)[number], string> = {
  "T-12 SNAPSHOT": "bg-lemon",
  "CORE FORMULAS": "bg-mint",
  "HIGH-YIELD DEFINITIONS": "bg-white",
  "TRAPS TO AVOID": "bg-coral",
  "PROBABLE VIVA QUESTIONS": "bg-cream",
  "LAST 30-MINUTE PLAN": "bg-sky"
};

type SheetBlock =
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

function normalizeHeadingToken(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function parseSections(content: string) {
  const lines = content.split("\n").map(normalizeLine);
  const sections = new Map<string, string[]>();

  T12_SECTION_ORDER.forEach((section) => {
    sections.set(section, []);
  });

  let currentSection: string | null = null;

  for (const line of lines) {
    if (!line) {
      if (currentSection) {
        sections.get(currentSection)?.push("");
      }
      continue;
    }

    if (isHeading(line)) {
      const heading = normalizeHeadingToken(cleanHeading(line));
      const matchedSection = T12_SECTION_ORDER.find(
        (section) => normalizeHeadingToken(section) === heading
      );

      if (matchedSection) {
        currentSection = matchedSection;
        continue;
      }
    }

    if (!currentSection) {
      currentSection = "T-12 SNAPSHOT";
    }

    sections.get(currentSection)?.push(line);
  }

  return T12_SECTION_ORDER.map((section) => ({
    title: section,
    content: (sections.get(section) ?? []).join("\n").trim()
  }));
}

function parseBlocks(content: string): SheetBlock[] {
  const lines = content.split("\n").map(normalizeLine);
  const blocks: SheetBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line) {
      index += 1;
      continue;
    }

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

    blocks.push({ type: "paragraph", content: paragraphLines.join(" ") });
  }

  return blocks;
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapText(value: string, maxChars = 88) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current.length) {
      current = word;
      continue;
    }

    if ((current + " " + word).length <= maxChars) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current.length) {
    lines.push(current);
  }

  return lines;
}

function buildPdfBytes(lines: string[]) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 44;
  const top = 796;
  const bottom = 48;
  const lineHeight = 14;
  const linesPerPage = Math.max(Math.floor((top - bottom) / lineHeight), 1);
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (!pages.length) {
    pages.push(["No content"]);
  }

  const objects: string[] = [];
  const pushObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = pushObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = pushObject("<< /Type /Pages /Count 0 /Kids [] >>");
  const fontId = pushObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    const contentCommands = ["BT", `/F1 11 Tf`, `${marginLeft} ${top} Td`];

    for (const line of pageLines) {
      contentCommands.push(`(${escapePdfText(line)}) Tj`);
      contentCommands.push(`0 -${lineHeight} Td`);
    }

    contentCommands.push("ET");

    const stream = contentCommands.join("\n");
    const contentId = pushObject(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    );
    const pageId = pushObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] >>`;

  const header = "%PDF-1.4\n";
  let pdf = header;
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function NightBeforeSheet({ subjects }: NightBeforeSheetProps) {
  const [selectedSubject, setSelectedSubject] = useState("General");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<{ noteCount: number; subject: string } | null>(null);

  const options = useMemo(() => {
    const unique = [...new Set(subjects.map((subject) => subject.trim()).filter(Boolean))];
    return ["General", ...unique.filter((subject) => subject.toLowerCase() !== "general")];
  }, [subjects]);

  const sections = useMemo(() => parseSections(result), [result]);
  const canDownload = Boolean(result) && !isLoading;

  function onDownloadPdf() {
    if (!result) {
      return;
    }

    const printableLines: string[] = [];
    printableLines.push("NeuroNotes - T-12 Night-Before Sheet");
    printableLines.push(`Subject: ${meta?.subject || selectedSubject}`);
    printableLines.push(`Generated: ${new Date().toLocaleString()}`);
    printableLines.push("");

    sections.forEach((section) => {
      printableLines.push(section.title);
      printableLines.push("-".repeat(section.title.length));
      const blocks = parseBlocks(section.content || "Not in notes");

      blocks.forEach((block) => {
        if (block.type === "heading") {
          printableLines.push(...wrapText(block.content.toUpperCase()));
          return;
        }

        if (block.type === "bulletList") {
          block.items.forEach((item) => {
            wrapText(`- ${item}`).forEach((line) => printableLines.push(line));
          });
          return;
        }

        if (block.type === "numberList") {
          block.items.forEach((item, index) => {
            wrapText(`${index + 1}. ${item}`).forEach((line) => printableLines.push(line));
          });
          return;
        }

        wrapText(block.content).forEach((line) => printableLines.push(line));
      });

      printableLines.push("");
    });

    const bytes = buildPdfBytes(printableLines);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeSubject = (meta?.subject || selectedSubject || "general")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    link.href = url;
    link.download = `neuronotes-t12-${safeSubject || "general"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function onGenerateSheet() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/night-before-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ subject: selectedSubject })
      });

      const payload = (await response.json()) as {
        ok: boolean;
        result?: string;
        error?: string;
        meta?: { noteCount: number; subject: string };
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error || "Failed to generate sheet");
      }

      setResult(payload.result);
      setMeta(payload.meta ?? null);
    } catch (requestError) {
      setResult("");
      setMeta(null);
      setError(
        requestError instanceof Error ? requestError.message : "Failed to generate sheet"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-sky">
      <h2 className="text-xl font-black uppercase">T-12 Night-Before Sheet</h2>
      <p className="mt-2 text-sm font-black uppercase leading-6">
        Auto-build a final one-page revision sheet with formulas, traps, and probable viva questions.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-2 text-xs font-black uppercase">
          Subject
          <select
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="w-full border-[3px] border-ink bg-white px-3 py-3 text-sm font-black uppercase shadow-brutal-sm"
          >
            {options.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onGenerateSheet}
          disabled={isLoading}
          className="mt-[22px] border-[3px] border-ink bg-lemon px-4 py-3 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Generating..." : "Generate Sheet"}
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!canDownload}
          className="mt-[22px] border-[3px] border-ink bg-white px-4 py-3 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          Download PDF
        </button>
      </div>

      {meta ? (
        <div className="mt-4 border-[3px] border-ink bg-white p-3 text-[10px] font-black uppercase shadow-brutal-sm">
          Subject: {meta.subject} | Notes used: {meta.noteCount}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 border-[3px] border-ink bg-coral p-3 text-xs font-black uppercase leading-5 shadow-brutal-sm">
          {error}
        </div>
      ) : null}

      <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-2">
        {!result && !error && !isLoading ? (
          <div className="border-[3px] border-dashed border-ink bg-white p-5 text-sm font-black uppercase leading-6 shadow-brutal-sm">
            Generate your subject sheet to get a focused final revision blueprint.
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-12 animate-pulse border-[3px] border-ink bg-white shadow-brutal-sm"
              />
            ))}
          </div>
        ) : null}

        {sections.map((section, sectionIndex) => {
          const blocks = parseBlocks(section.content || "Not in notes");

          return (
            <div
              key={`${section.title}-${sectionIndex}`}
              className="border-[3px] border-ink bg-white p-3 shadow-brutal-sm"
            >
              <div
                className={`border-[3px] border-ink px-3 py-2 text-[10px] font-black uppercase shadow-brutal-sm ${SECTION_TONE[section.title]}`}
              >
                {section.title}
              </div>
              <div className="mt-3 space-y-2">
                {blocks.map((block, index) => {
                  if (block.type === "heading") {
                    return (
                      <div
                        key={`heading-${sectionIndex}-${index}`}
                        className="border-[3px] border-ink bg-lemon px-3 py-2 text-xs font-black uppercase text-ink"
                      >
                        {renderInlineEmphasis(block.content)}
                      </div>
                    );
                  }

                  if (block.type === "bulletList") {
                    return (
                      <ul
                        key={`bullets-${sectionIndex}-${index}`}
                        className="space-y-2 border-[3px] border-ink bg-white p-3 text-sm font-bold leading-6 text-ink"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`bullet-${sectionIndex}-${index}-${itemIndex}`} className="flex gap-3">
                            <span className="mt-[2px] text-base font-black">-</span>
                            <span>{renderInlineEmphasis(item)}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  if (block.type === "numberList") {
                    return (
                      <ol
                        key={`numbers-${sectionIndex}-${index}`}
                        className="space-y-2 border-[3px] border-ink bg-cream p-3 text-sm font-bold leading-6 text-ink"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`number-${sectionIndex}-${index}-${itemIndex}`} className="flex gap-3">
                            <span className="min-w-6 font-black">{itemIndex + 1}.</span>
                            <span>{renderInlineEmphasis(item)}</span>
                          </li>
                        ))}
                      </ol>
                    );
                  }

                  return (
                    <div
                      key={`paragraph-${sectionIndex}-${index}`}
                      className="border-[3px] border-ink bg-white p-3 text-sm font-bold leading-7 text-ink"
                    >
                      {renderInlineEmphasis(block.content)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
