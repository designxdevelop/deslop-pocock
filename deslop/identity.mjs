export const UPSTREAM_REPO = "mattpocock/skills";
export const FORK_REPO = "designxdevelop/deslop-pocock";
export const PLUGIN_NAME = "deslop-pocock";
export const MARKETPLACE_NAME = "deslop-pocock";

const UPSTREAM_SLUG_RE =
  /mattpocock\/skills(?!\/(?:pull|commit|commits|issues|issue|blob|tree|compare|discussions|actions|releases|archive|raw)\b)/g;

const README_BANNER = `> **Deslop fork** of [mattpocock/skills](https://github.com/mattpocock/skills). Tracks upstream \`main\` and republishes whenever that set changes. Em dashes are replaced with ordinary punctuation. Not affiliated with Matt Pocock.

`;
const README_BANNER_RE = /> \*\*Deslop fork\*\*[^\n]*\n\n/;

const CLAUDE_CODE_INSTALL = `claude plugin marketplace add ${FORK_REPO}
claude plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

const CLAUDE_SESSION_INSTALL = `/plugin marketplace add ${FORK_REPO}
/plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

export function rewriteIdentityText(text) {
  let next = text.replace(UPSTREAM_SLUG_RE, FORK_REPO);
  next = next.replaceAll("mattpocock-skills", PLUGIN_NAME);
  next = rewriteClaudeInstallStory(next);
  return next;
}

export function rewriteReadme(text) {
  const stripped = text.replace(README_BANNER_RE, "");
  const rewritten = rewriteIdentityText(stripped);
  if (/^# Skills For Real Engineers\n\n/m.test(rewritten)) {
    return rewritten.replace(
      /^(# Skills For Real Engineers\n\n)/m,
      `$1${README_BANNER}`,
    );
  }
  return rewritten.replace(
    /^(# Skills For Real Engineers\n)/m,
    `$1\n${README_BANNER}`,
  );
}

export function rewritePackageJson(source) {
  const pkg = JSON.parse(source);
  pkg.name = PLUGIN_NAME;
  pkg.description =
    "Deslop mirror of Matt Pocock's agent skills. Tracks upstream main; em dashes replaced.";
  pkg.repository = {
    type: "git",
    url: `https://github.com/${FORK_REPO}`,
  };
  pkg.scripts = {
    ...pkg.scripts,
    deslop: "node deslop/apply.mjs",
    sync: "node deslop/sync.mjs",
    publish: "node deslop/publish.mjs",
    test: "node --test deslop/*.test.mjs",
  };
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function rewritePluginJson(source) {
  const plugin = JSON.parse(source);
  plugin.name = PLUGIN_NAME;
  plugin.description =
    "Deslop mirror of Matt Pocock's agent skills: grilling, spec/ticket flows, TDD, code review, domain modelling and more. Em dashes replaced with ordinary punctuation.";
  plugin.repository = `https://github.com/${FORK_REPO}`;
  plugin.keywords = unique([
    ...(plugin.keywords ?? []),
    "deslop",
    "fork",
  ]);
  return `${JSON.stringify(plugin, null, 2)}\n`;
}

export function rewriteMarketplaceJson(source) {
  const marketplace = JSON.parse(source);
  marketplace.name = MARKETPLACE_NAME;
  marketplace.owner = {
    name: "Design x Develop",
    url: "https://github.com/designxdevelop",
  };
  marketplace.description =
    "Deslop mirror of Matt Pocock's skills for real engineering, as an installable Claude Code plugin.";
  if (Array.isArray(marketplace.plugins)) {
    marketplace.plugins = marketplace.plugins.map((plugin) => ({
      ...plugin,
      name: PLUGIN_NAME,
      description:
        "Deslop mirror of Matt Pocock's agent skills: grilling, spec/ticket flows, TDD, code review, domain modelling and more.",
    }));
  }
  return `${JSON.stringify(marketplace, null, 2)}\n`;
}

function rewriteClaudeInstallStory(text) {
  let next = text.replace(
    /`deslop-pocock` is listed in \*\*Claude Code's official marketplace\*\*[\s\S]*?not a hope\./,
    `\`deslop-pocock\` is a deslop fork of Matt Pocock's skills. It is not on Anthropic's official marketplace. Add this GitHub repo as a marketplace, then install the plugin. Hourly sync tracks upstream \`main\` and publishes a GitHub release when the upstream version changes.`,
  );
  next = next.replace(
    /It's in Claude Code's official marketplace, so there's nothing to add first, and updates arrive automatically\./g,
    "This fork is not on Anthropic's official marketplace. Add it as a marketplace, then install. GitHub Actions republish when upstream ships.",
  );
  next = next.replace(
    /claude plugins install deslop-pocock/g,
    CLAUDE_CODE_INSTALL,
  );
  next = next.replace(
    /(?<=```\n)\/plugin install deslop-pocock(?=\n```)/g,
    CLAUDE_SESSION_INSTALL,
  );
  next = next.replace(
    /\/plugin install deslop-pocock@mattpocock/g,
    `/plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME}`,
  );
  return next;
}

function unique(values) {
  return [...new Set(values)];
}
