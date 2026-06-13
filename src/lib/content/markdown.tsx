import type { ReactNode } from "react";

/**
 * Minimal, dependency-free markdown renderer for guide bodies. Supports the
 * subset the seed content uses: ## / ### headings, paragraphs, unordered
 * lists and **bold**. Headings get stable ids so the table of contents can
 * deep-link to them.
 */

export interface TocEntry {
  id: string;
  title: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line.trim());
    if (match) {
      entries.push({ id: slugifyHeading(match[1]), title: match[1] });
    }
  }
  return entries;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="prose-guide">
      {blocks.map((block, index) => {
        const h2 = /^##\s+(.+)$/.exec(block);
        if (h2) {
          return (
            <h2 key={index} id={slugifyHeading(h2[1])}>
              {h2[1]}
            </h2>
          );
        }
        const h3 = /^###\s+(.+)$/.exec(block);
        if (h3) {
          return <h3 key={index}>{h3[1]}</h3>;
        }
        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index}>
              {block.split("\n").map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}
