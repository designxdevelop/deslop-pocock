#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { applyDeslop } from "./apply.mjs";
import { UPSTREAM_REPO } from "./identity.mjs";
import { isOverlayPath, toRelPath } from "./paths.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = join(ROOT, "deslop", "upstream.json");

export function syncFromUpstream({
  root = ROOT,
  force = process.env.FORCE === "true" || process.argv.includes("--force"),
} = {}) {
  ensureUpstreamRemote(root);
  execSync("git fetch upstream main --tags", { cwd: root, stdio: "inherit" });
  const sha = git(root, "rev-parse upstream/main").trim();
  const previous = readState();
  if (!force && previous?.sha === sha) {
    console.log(`sync: already at ${sha.slice(0, 7)}`);
    return { sha, changed: false, version: previous.version };
  }

  const staging = mkdtempSync(join(tmpdir(), "deslop-pocock-"));
  try {
    execSync(`git archive upstream/main | tar -x -C "${staging}"`, {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    replaceTrackedTree(root, staging);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  applyDeslop(root, { skipOverlay: true });
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
    .version;
  const state = {
    repo: UPSTREAM_REPO,
    sha,
    version,
    syncedAt: new Date().toISOString(),
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`sync: ${UPSTREAM_REPO}@${sha.slice(0, 7)} (v${version})`);
  return { sha, changed: true, version };
}

function replaceTrackedTree(root, staging) {
  const upstreamFiles = new Set(listFiles(staging));
  for (const relPath of listFiles(root)) {
    if (relPath.startsWith(".git/") || relPath.startsWith("node_modules/")) {
      continue;
    }
    if (isOverlayPath(relPath)) {
      continue;
    }
    if (!upstreamFiles.has(relPath)) {
      rmSync(join(root, relPath), { force: true });
    }
  }
  for (const relPath of upstreamFiles) {
    if (isOverlayPath(relPath)) {
      continue;
    }
    const from = join(staging, relPath);
    const to = join(root, relPath);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
  }
  pruneEmptyDirs(root);
}

function pruneEmptyDirs(root) {
  const dirs = [];
  collectDirs(root, dirs, root);
  dirs.sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    const relPath = toRelPath(root, dir);
    if (!relPath || relPath.startsWith(".git") || isOverlayPath(relPath)) {
      continue;
    }
    if (readdirSync(dir).length === 0) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

function collectDirs(dir, acc, root) {
  for (const entry of readdirSync(dir)) {
    const absolutePath = join(dir, entry);
    const relPath = toRelPath(root, absolutePath);
    if (relPath === ".git" || relPath.startsWith(".git/")) {
      continue;
    }
    if (statSync(absolutePath).isDirectory()) {
      acc.push(absolutePath);
      collectDirs(absolutePath, acc, root);
    }
  }
}

function ensureUpstreamRemote(root) {
  const remotes = git(root, "remote");
  if (!remotes.split("\n").includes("upstream")) {
    execSync(`git remote add upstream https://github.com/${UPSTREAM_REPO}.git`, {
      cwd: root,
      stdio: "inherit",
    });
  }
}

function readState() {
  if (!existsSync(STATE_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function listFiles(dir, acc = [], root = dir) {
  if (!existsSync(dir)) {
    return acc;
  }
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

function git(root, args) {
  return execSync(`git ${args}`, { cwd: root, encoding: "utf8" });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  syncFromUpstream();
}
