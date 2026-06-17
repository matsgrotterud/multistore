import fs from "fs";
import path from "path";

const root = process.cwd();
const outDir = path.join(root, "_ai_context");
const outFile = path.join(outDir, "multistore-context.md");

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".cache"
]);

const EXCLUDED_FILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".DS_Store"
]);

const INCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".prisma",
  ".css",
  ".scss",
  ".md",
  ".sql",
  ".yml",
  ".yaml"
]);

const MAX_FILE_SIZE = 160_000;

function rel(p) {
  return path.relative(root, p).replaceAll(path.sep, "/");
}

function shouldSkipPath(absPath) {
  const r = rel(absPath);

  if (!r) return false;

  if (r.startsWith("_ai_context/")) return true;
  if (r.startsWith("public/uploads/")) return true;
  if (r.startsWith("public/catalog/images/")) return true;
  if (r.startsWith("public/catalog/videos/")) return true;

  const parts = r.split("/");
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return true;

  const base = path.basename(absPath);
  if (EXCLUDED_FILE_NAMES.has(base)) return true;

  if (base === ".env" || base.startsWith(".env.")) return true;

  return false;
}

function shouldIncludeFile(absPath) {
  if (shouldSkipPath(absPath)) return false;

  const base = path.basename(absPath);
  const ext = path.extname(absPath);

  if (INCLUDED_EXTENSIONS.has(ext)) return true;

  return [
    "package.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "middleware.ts",
    "middleware.js",
    "Dockerfile",
    "README"
  ].includes(base);
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);

    if (shouldSkipPath(abs)) continue;

    if (entry.isDirectory()) {
      walk(abs, files);
    } else if (entry.isFile() && shouldIncludeFile(abs)) {
      files.push(abs);
    }
  }

  return files;
}

function makeTree(dir, prefix = "", depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return "";

  let entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !shouldSkipPath(path.join(dir, entry.name)))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  let output = "";

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const marker = entry.isDirectory() ? "/" : "";
    output += `${prefix}${entry.name}${marker}\n`;

    if (entry.isDirectory()) {
      output += makeTree(abs, prefix + "  ", depth + 1, maxDepth);
    }
  }

  return output;
}

function redact(content) {
  return content
    .replace(/sk_live_[A-Za-z0-9_]+/g, "sk_live_***REDACTED***")
    .replace(/sk_test_[A-Za-z0-9_]+/g, "sk_test_***REDACTED***")
    .replace(/pk_live_[A-Za-z0-9_]+/g, "pk_live_***REDACTED***")
    .replace(/pk_test_[A-Za-z0-9_]+/g, "pk_test_***REDACTED***")
    .replace(/(DATABASE_URL\s*=\s*)[^\n]+/gi, "$1***REDACTED***")
    .replace(/(SECRET|TOKEN|PASSWORD|API_KEY|ACCESS_KEY)(["']?\s*[:=]\s*["']?)[^"',\n]+/gi, "$1$2***REDACTED***");
}

fs.mkdirSync(outDir, { recursive: true });

const files = walk(root).sort((a, b) => rel(a).localeCompare(rel(b)));

let md = `# Multistore AI Context

Generated from: ${root}

## Project tree

\`\`\`
${makeTree(root)}
\`\`\`

## Files

`;

for (const file of files) {
  const relativePath = rel(file);
  const stat = fs.statSync(file);
  const ext = path.extname(file).replace(".", "") || "txt";

  md += `\n\n---\n\n## ${relativePath}\n\n`;

  if (stat.size > MAX_FILE_SIZE) {
    const raw = fs.readFileSync(file, "utf8").slice(0, MAX_FILE_SIZE);
    md += `File was larger than ${MAX_FILE_SIZE} bytes. Showing first part only.\n\n`;
    md += `\`\`\`${ext}\n${redact(raw)}\n\`\`\`\n`;
  } else {
    const raw = fs.readFileSync(file, "utf8");
    md += `\`\`\`${ext}\n${redact(raw)}\n\`\`\`\n`;
  }
}

fs.writeFileSync(outFile, md, "utf8");

console.log("");
console.log("Done.");
console.log(`Created: ${outFile}`);
console.log("");
console.log("Upload this file to ChatGPT:");
console.log("_ai_context/multistore-context.md");
console.log("");
