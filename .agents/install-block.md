# The canonical install block

One install story, one wording. `README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here first, then propagate.

`deslop-pocock` is a deslop fork of Matt Pocock's skills. It is not on Anthropic's official marketplace. Add this GitHub repo as a marketplace, then install the plugin. Hourly sync tracks upstream `main` and publishes a GitHub release when the upstream version changes.

## Claude Code: the plugin

<canonical-block name="claude-code">

```bash
claude plugin marketplace add designxdevelop/deslop-pocock
claude plugin install deslop-pocock@deslop-pocock
```

Or, from inside a session:

```
/plugin marketplace add designxdevelop/deslop-pocock
/plugin install deslop-pocock@deslop-pocock
```

This fork is not on Anthropic's official marketplace. Add it as a marketplace, then install. GitHub Actions republish when upstream ships.

</canonical-block>

## Codex, and other agents: skills.sh

The plugin is Claude Code only. Everywhere else, [skills.sh](https://skills.sh/designxdevelop/deslop-pocock) copies editable skill files into the project. Use the whole-set form on `README.md`:

<canonical-block name="skills-sh-whole-set">

```bash
npx skills@latest add designxdevelop/deslop-pocock
```

Pick the skills you want, and which coding agents to install them on. **The installer lets you choose which skills to take: make sure `setup-matt-pocock-skills` is one of them.**

</canonical-block>

…and the single-skill form wherever one skill is named on its own. Note that **`docs/` pages are not a consumer of this block**: ai-hero renders the install widget above the body, so a page that writes the commands out duplicates it. See [writing-docs.md](./writing-docs.md).

<canonical-block name="skills-sh-one-skill">

```bash
npx skills@latest add designxdevelop/deslop-pocock --skill=<name>
```

```bash
npx skills@latest update <name>
```

</canonical-block>

`skills@latest` is the pinned spelling in all three. The pages under `docs/` used to carry their own copy of these commands; those blocks are now deleted rather than corrected, because the site renders the install commands itself.

## The two routes are exclusive

The plugin is a managed, read-only bundle you subscribe to. skills.sh writes files you own and edit. Installing both leaves the user with every skill twice: always say "pick one".

## Not the install story

`.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace (`/plugin marketplace add designxdevelop/deslop-pocock`, then `/plugin install deslop-pocock@deslop-pocock`). The official listing supersedes it. It is kept as a fallback for installing the repo directly (an unreleased commit, or a fork), and is **not** documented to users.
