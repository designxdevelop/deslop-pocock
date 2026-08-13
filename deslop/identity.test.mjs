import assert from "node:assert/strict";
import test from "node:test";
import {
  FORK_REPO,
  rewriteIdentityText,
  rewriteMarketplaceJson,
  rewritePackageJson,
  rewritePluginJson,
  rewriteReadme,
} from "./identity.mjs";

test("rewrites install slugs but keeps upstream pull links", () => {
  const input = [
    "npx skills@latest add mattpocock/skills",
    "See https://github.com/mattpocock/skills/pull/788",
    "Repo: https://github.com/mattpocock/skills",
  ].join("\n");
  const out = rewriteIdentityText(input);
  assert.match(out, new RegExp(`npx skills@latest add ${FORK_REPO}`));
  assert.match(out, /https:\/\/github\.com\/mattpocock\/skills\/pull\/788/);
  assert.match(out, new RegExp(`https://github.com/${FORK_REPO}$`, "m"));
});

test("retargets package metadata and adds fork scripts", () => {
  const pkg = rewritePackageJson(
    JSON.stringify({
      name: "mattpocock-skills",
      version: "1.2.3",
      private: true,
      scripts: { changeset: "changeset" },
    }),
  );
  const parsed = JSON.parse(pkg);
  assert.equal(parsed.name, "deslop-pocock");
  assert.equal(parsed.repository.url, `https://github.com/${FORK_REPO}`);
  assert.equal(parsed.scripts.sync, "node deslop/sync.mjs");
  assert.equal(parsed.scripts.changeset, "changeset");
});

test("retargets plugin and marketplace manifests", () => {
  const plugin = JSON.parse(
    rewritePluginJson(
      JSON.stringify({
        name: "mattpocock-skills",
        version: "1.2.3",
        description: "Matt Pocock's agent skills — grilling.",
        repository: "https://github.com/mattpocock/skills",
        keywords: ["engineering"],
      }),
    ),
  );
  assert.equal(plugin.name, "deslop-pocock");
  assert.equal(plugin.repository, `https://github.com/${FORK_REPO}`);
  assert.ok(plugin.keywords.includes("deslop"));

  const marketplace = JSON.parse(
    rewriteMarketplaceJson(
      JSON.stringify({
        name: "mattpocock",
        owner: { name: "Matt Pocock", url: "https://www.aihero.dev" },
        plugins: [{ name: "mattpocock-skills", source: "./" }],
      }),
    ),
  );
  assert.equal(marketplace.name, "deslop-pocock");
  assert.equal(marketplace.owner.name, "Design x Develop");
  assert.equal(marketplace.plugins[0].name, "deslop-pocock");
});

test("injects a README banner that still credits upstream", () => {
  const out = rewriteReadme("# Skills For Real Engineers\n\nHello.\n");
  assert.match(out, /\*\*Deslop fork\*\*/);
  assert.match(out, /github\.com\/mattpocock\/skills/);
  assert.equal(rewriteReadme(out), out);
});
