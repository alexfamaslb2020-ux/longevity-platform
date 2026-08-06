import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface TextChunk {
  content: string;
  tokenCount: number;
}

/**
 * Divisão de documentos em chunks com overlap.
 * Estratégia: parágrafos primeiro; parágrafos longos são cortados por
 * frases; o final do chunk anterior é reutilizado como contexto do
 * seguinte (overlap) para não perder significado entre fronteiras.
 */
@Injectable()
export class ChunkerService {
  private readonly maxChars: number;
  private readonly overlap: number;

  constructor(configService: ConfigService) {
    this.maxChars = configService.get<number>(
      "aiAssistant.chunker.maxChunkChars",
      700,
    );
    this.overlap = configService.get<number>(
      "aiAssistant.chunker.overlapChars",
      80,
    );
  }

  chunk(text: string): TextChunk[] {
    const cleaned = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!cleaned) return [];

    const paragraphs = cleaned
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    const chunks: TextChunk[] = [];

    let buffer = "";

    const flush = () => {
      if (!buffer.trim()) return;
      chunks.push({
        content: buffer.trim(),
        tokenCount: this.countTokens(buffer),
      });
      buffer = "";
    };

    for (const paragraph of paragraphs) {
      if (paragraph.length <= this.maxChars) {
        if (buffer.length + paragraph.length + 2 > this.maxChars) flush();
        buffer += (buffer ? "\n\n" : "") + paragraph;
        continue;
      }
      flush();
      const pieces = this.splitLongParagraph(paragraph);
      for (const piece of pieces) {
        if (piece.length <= this.maxChars) {
          buffer = buffer ? `${buffer}\n\n${piece}` : piece;
          if (buffer.length >= this.maxChars) flush();
        } else {
          buffer = piece;
          flush();
        }
      }
    }
    flush();

    if (this.overlap > 0 && chunks.length > 1) {
      return chunks.map((chunk, index) => {
        if (index === 0) return chunk;
        return {
          content: `${previousTailOf(chunks, index - 1, this.overlap)}\n${chunk.content}`,
          tokenCount: chunk.tokenCount,
        };
      });
    }
    return chunks;
  }

  countTokens(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  private splitLongParagraph(paragraph: string): string[] {
    const sentences = paragraph
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const pieces: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if (current.length + sentence.length + 1 > this.maxChars) {
        if (current) pieces.push(current);
        current = sentence;
      } else {
        current += (current ? " " : "") + sentence;
      }
    }
    if (current) pieces.push(current);
    return pieces.length ? pieces : [paragraph];
  }
}

function previousTailOf(
  chunks: TextChunk[],
  index: number,
  overlap: number,
): string {
  const previous = chunks[index].content.replace(/\s+/g, " ");
  if (previous.length <= overlap) return previous;
  const cut = previous.slice(-overlap);
  const firstSpace = cut.indexOf(" ");
  return firstSpace > 0 ? cut.slice(firstSpace + 1) : cut;
}
