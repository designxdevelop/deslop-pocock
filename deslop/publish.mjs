#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FORK_REPO, UPSTREAM_REPO } from "./identity.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function releaseNotes(tag, state) {
  const sha = state?.sha ?? "";
  return [
    `Deslop mirror of ${UPSTREAM_REPO} ${tag}.`,
    "",
    `Upstream commit: https://github.com/${UPSTREAM_REPO}/commit/${sha}`,
    "",
    "Em dashes in the skill text are replaced with ordinary punctuation.",
    `Install: npx skills@latest add ${FORK_REPO}`,
    "",
  ].join("\n");
}

export function publishRelease({
  root = ROOT,
  edit = process.argv.includes("--edit"),
} = {}) {
  const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const tag = `v${version}`;
  const statePath = join(root, "deslop", "upstream.json");
  const state = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : null;

  const exists = releaseExists(tag, root);
  if (exists && !edit) {
    console.log(`publish: ${tag} already exists`);
    return { tag, created: false };
  }

  const sha = state?.sha ? state.sha.slice(0, 7) : "unknown";
  const notesDir = mkdtempSync(join(tmpdir(), "deslop-notes-"));
  const notesPath = join(notesDir, "notes.md");
  writeFileSync(notesPath, releaseNotes(tag, state));

  try {
    if (exists) {
      execSync(
        `gh release edit "${tag}" --repo "${FORK_REPO}" --notes-file "${notesPath}"`,
        { cwd: root, stdio: "inherit" },
      );
      console.log(`publish: updated ${tag}`);
      return { tag, created: false, updated: true };
    }

    execSync(
      `gh release create "${tag}" --repo "${FORK_REPO}" --target main --title "${tag}" --notes-file "${notesPath}"`,
      { cwd: root, stdio: "inherit" },
    );
    console.log(`publish: created ${tag} from ${UPSTREAM_REPO}@${sha}`);
    return { tag, created: true };
  } finally {
    rmSync(notesDir, { recursive: true, force: true });
  }
}

function releaseExists(tag, root) {
  try {
    execSync(`gh release view "${tag}" --repo "${FORK_REPO}"`, {
      cwd: root,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  publishRelease();
}
