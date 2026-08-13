import { basename, extname, relative } from "node:path";

export const OVERLAY_PATHS = [
  "deslop",
  ".github/workflows",
  "NOTICE",
  "AGENTS.md",
  "CLAUDE.md",
];

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".mjs",
  ".js",
  ".cjs",
  ".ts",
  ".mts",
  ".cts",
  ".sh",
  ".bash",
  ".html",
  ".css",
  ".txt",
  ".toml",
  ".xml",
  ".svg",
  ".csv",
]);

const TEXT_BASENAMES = new Set([
  "LICENSE",
  "NOTICE",
  "AGENTS.md",
  "CLAUDE.md",
  ".gitignore",
]);

export function isOverlayPath(relPath) {
  return OVERLAY_PATHS.some((overlay) => {
    if (relPath === overlay) {
      return true;
    }
    return relPath.startsWith(`${overlay}/`);
  });
}

export function isTextPath(relPath) {
  if (TEXT_BASENAMES.has(basename(relPath))) {
    return true;
  }
  return TEXT_EXTENSIONS.has(extname(relPath));
}

export function toRelPath(root, absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}
