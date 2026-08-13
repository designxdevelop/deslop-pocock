import assert from "node:assert/strict";
import test from "node:test";
import { replaceEmDashes } from "./emdash.mjs";

test("turns markdown labels into colons", () => {
  const input = [
    "- `engineering/` — daily code work",
    "- **[ask-matt](./skills/engineering/ask-matt/SKILL.md)** — Ask which skill or flow fits.",
  ].join("\n");
  const out = replaceEmDashes(input);
  assert.match(out, /`engineering\/`: daily code work/);
  assert.match(out, /\*\*\[ask-matt\][^:]+: Ask which skill/);
  assert.equal(out.includes("\u2014"), false);
});

test("uses a comma when the dash joins a continuing clause", () => {
  const input =
    "The plugin installs the whole set as a managed, read-only bundle that updates when I ship — you subscribe rather than fork.";
  assert.equal(
    replaceEmDashes(input),
    "The plugin installs the whole set as a managed, read-only bundle that updates when I ship, you subscribe rather than fork.",
  );
});

test("uses a colon after a short lead-in", () => {
  assert.equal(
    replaceEmDashes("Pick one — installing both leaves you with every skill twice."),
    "Pick one: installing both leaves you with every skill twice.",
  );
});

test("wraps paired asides in parentheses", () => {
  const input =
    "People kept reading a wayfinder ticket as an ordinary _implementation_ ticket — a slice of a build to execute — when wayfinder uses them as decision tickets.";
  assert.equal(
    replaceEmDashes(input),
    "People kept reading a wayfinder ticket as an ordinary _implementation_ ticket (a slice of a build to execute) when wayfinder uses them as decision tickets.",
  );
});

test("replaces em dashes inside fenced examples too", () => {
  const input = [
    "```markdown",
    "- [`closed`](link) — gist of the answer",
    "```",
  ].join("\n");
  const out = replaceEmDashes(input);
  assert.match(out, /\]\(link\): gist of the answer/);
  assert.equal(out.includes("\u2014"), false);
});

test("replaces HTML em dash entities", () => {
  assert.equal(
    replaceEmDashes("The first clause is long enough to take a comma &mdash; beta continues."),
    "The first clause is long enough to take a comma, beta continues.",
  );
});

test("treats a trailing em dash before a newline as the same break", () => {
  const input =
    "A package's PUBLIC SURFACE is its ENTRY POINTS —\nthe files at the package root.";
  const out = replaceEmDashes(input);
  assert.match(out, /ENTRY POINTS:\nthe files at the package root\./);
});
