#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FORK_REPO, UPSTREAM_REPO } from "./identity.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function publishRelease({ root = ROOT } = {}) {
  const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const tag = `v${version}`;
  const statePath = join(root, "deslop", "upstream.json");
  const state = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : null;

  if (releaseExists(tag, root)) {
    console.log(`publish: ${tag} already exists`);
    return { tag, created: false };
  }

  const sha = state?.sha ? state.sha.slice(0, 7) : "unknown";
  const notes = [
    `Deslop mirror of [${UPSTREAM_REPO}](https://github.com/${UPSTREAM_REPO}) \`${tag}\`.`,
    "",
    `Upstream commit: https://github.com/${UPSTREAM_REPO}/commit/${state?.sha ?? ""}`,
    "",
    "Em dashes in the skill text are replaced with ordinary punctuation.",
    `Install: \`npx skills@latest add ${FORK_REPO}\``,
  ].join("\n");

  execSync(
    `gh release create "${tag}" --title "${tag}" --notes ${JSON.stringify(notes)}`,
    { cwd: root, stdio: "inherit" },
  );
  console.log(`publish: created ${tag} from ${UPSTREAM_REPO}@${sha}`);
  return { tag, created: true };
}

function releaseExists(tag, root) {
  try {
    execSync(`gh release view "${tag}"`, {
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
