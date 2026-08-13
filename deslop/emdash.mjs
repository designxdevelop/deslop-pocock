const EM_DASH = "\u2014";
const ENTITY_RE = /&mdash;|&#8212;|&#x2014;/gi;

/**
 * Replace em dashes with ordinary punctuation, including inside
 * fenced examples that skills copy into real files.
 */
export function replaceEmDashes(text) {
  return replaceEmDashesInProse(text);
}

function replaceEmDashesInProse(prose) {
  let next = prose.replace(ENTITY_RE, EM_DASH);
  next = replacePairedEmDashes(next);
  next = next.replace(/(\s*)\u2014(\s*)/g, (match, leftWs, rightWs, offset, whole) => {
    const left = whole.slice(0, offset);
    const right = whole.slice(offset + match.length);
    const punct = choosePunctuation(left, right);
    if (rightWs.includes("\n")) {
      return `${punct.trimEnd()}${rightWs.replace(/^[ \t]+/, "")}`;
    }
    return punct;
  });
  return next;
}

function replacePairedEmDashes(prose) {
  const pairRe = / \u2014 ([^\u2014\n.!?]{1,160}?) \u2014 /g;
  return prose.replace(pairRe, (_match, inner) => ` (${inner.trim()}) `);
}

function choosePunctuation(left, right) {
  const leftEnd = left.trimEnd();
  const rightStart = right.trimStart();

  if (isLabel(leftEnd)) {
    return ": ";
  }

  if (/^[A-Z]/.test(rightStart) && /[A-Za-z0-9"'`)\]]$/.test(leftEnd)) {
    if (/[.!?]$/.test(leftEnd)) {
      return " ";
    }
    const clauseWords = lastClauseWords(leftEnd);
    if (clauseWords.length >= 6) {
      return ". ";
    }
  }

  if (lastClauseWords(leftEnd).length <= 4) {
    return ": ";
  }

  return ", ";
}

function isLabel(leftEnd) {
  const line = leftEnd.split("\n").pop() ?? "";
  if (/(?:\*\*|`|\])$/.test(line.trimEnd())) {
    return true;
  }
  if (/(?:^|\s)(?:\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\](?:\([^)]+\))?)$/.test(line.trimEnd())) {
    return true;
  }
  const trailing = line.trimEnd().match(/([A-Z]{2,}(?:\s+[A-Z]{2,})*)$/);
  return Boolean(trailing);
}

function lastClauseWords(leftEnd) {
  const clause = (leftEnd.split(/[.!?]/).pop() ?? "").trim();
  return clause.split(/\s+/).filter(Boolean);
}
