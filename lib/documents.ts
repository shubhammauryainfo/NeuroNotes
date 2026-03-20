import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/uploads";

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractTextFromFile(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("Upload exceeds the 2.5 MB limit");
  }

  const extension = getFileExtension(file.name);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (extension === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = normalizeExtractedText(result.text);

    await parser.destroy();

    if (!text) {
      throw new Error("Could not extract text from this PDF");
    }

    return text;
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeExtractedText(result.value);

    if (!text) {
      throw new Error("Could not extract text from this Word file");
    }

    return text;
  }

  if (extension === "txt") {
    const text = normalizeExtractedText(buffer.toString("utf-8"));

    if (!text) {
      throw new Error("The uploaded text file is empty");
    }

    return text;
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}
