import {
  getData,
  getPath,
} from "pdf-parse/worker";

import { PDFParse } from "pdf-parse";

export type ParsedDocument = {
  text: string;
  pageCount: number;
  characterCount: number;
};

PDFParse.setWorker(getPath());
// getPath()로 계속 문제가 나면 아래로 바꿔도 돼.
// PDFParse.setWorker(getData());

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export async function parsePdfBuffer(
  buffer: Buffer,
): Promise<ParsedDocument> {
  if (!buffer.length) {
    throw new Error("PDF 파일 데이터가 비어 있어요.");
  }

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const result = await parser.getText();

    const cleanedText = cleanExtractedText(
      result.text ?? "",
    );

    if (!cleanedText) {
      throw new Error(
        "PDF에서 텍스트를 찾지 못했어요. 스캔 이미지 PDF일 수 있어요.",
      );
    }

    return {
      text: cleanedText,
      pageCount: result.total ?? 0,
      characterCount: cleanedText.length,
    };
  } finally {
    await parser.destroy();
  }
}