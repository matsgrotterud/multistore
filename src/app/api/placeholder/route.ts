import { NextRequest, NextResponse } from "next/server";

/**
 * Deterministic SVG placeholder images so the whole platform runs offline
 * with a coherent, branded look. Replace product imageUrl values with real
 * supplier/CDN imagery in production.
 */

const PALETTES: Array<[string, string]> = [
  ["#0e7490", "#164e63"],
  ["#1d4ed8", "#1e293b"],
  ["#15803d", "#14532d"],
  ["#b45309", "#451a03"],
  ["#7c3aed", "#2e1065"],
  ["#be123c", "#4c0519"],
  ["#0f766e", "#134e4a"],
  ["#4338ca", "#1e1b4b"],
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const label = (searchParams.get("label") ?? "Product").slice(0, 40);
  const seed = searchParams.get("seed") ?? label;
  const [from, to] = PALETTES[hash(seed) % PALETTES.length];

  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 14) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());

  const textSpans = lines
    .slice(0, 3)
    .map(
      (line, index) =>
        `<tspan x="400" dy="${index === 0 ? 0 : 64}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="650" cy="160" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="660" r="260" fill="#ffffff" opacity="0.05"/>
  <text x="400" y="${400 - (Math.min(lines.length, 3) - 1) * 32}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${textSpans}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
