#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { replaceEmDashes } from "./emdash.mjs";
import {
  rewriteGitignore,
  rewriteIdentityText,
  rewriteMarketplaceJson,
  rewritePackageJson,
  rewritePluginJson,
  rewriteReadme,
} from "./identity.mjs";
import { isOverlayPath, isTextPath, toRelPath } from "./paths.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function applyDeslop(root = ROOT, { skipOverlay = true } = {}) {
  let changed = 0;
  for (const relPath of listFiles(root)) {
    if (relPath.startsWith(".git/") || relPath.startsWith("node_modules/")) {
      continue;
    }
    if (skipOverlay && isOverlayPath(relPath)) {
      continue;
    }
    if (!isTextPath(relPath)) {
      continue;
    }
    const absolutePath = join(root, relPath);
    const original = readFileSync(absolutePath, "utf8");
    const updated = transformFile(relPath, original);
    if (updated !== original) {
      writeFileSync(absolutePath, updated);
      changed += 1;
    }
  }
  return changed;
}

export function transformFile(relPath, original) {
  const deslopped = replaceEmDashes(original);
  switch (relPath) {
    case "README.md":
      return rewriteReadme(deslopped);
    case "package.json":
      return rewritePackageJson(deslopped);
    case ".gitignore":
      return rewriteGitignore(deslopped);
    case ".claude-plugin/plugin.json":
      return rewritePluginJson(deslopped);
    case ".claude-plugin/marketplace.json":
      return rewriteMarketplaceJson(deslopped);
    default:
      return rewriteIdentityText(deslopped);
  }
}

function listFiles(dir, acc = [], root = dir) {
  for (const entry of readdirSync(dir)) {
    const absolutePath = join(dir, entry);
    const relPath = toRelPath(root, absolutePath);
    if (relPath === ".git" || relPath.startsWith(".git/")) {
      continue;
    }
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      listFiles(absolutePath, acc, root);
      continue;
    }
    acc.push(relPath);
  }
  return acc;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const changed = applyDeslop();
  console.log(`deslop: updated ${changed} files`);
}
