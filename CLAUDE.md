This repository is an automated deslop mirror of https://github.com/mattpocock/skills.

Do not edit skill files, docs, or upstream manifests by hand. Hourly GitHub Actions copies upstream `main`, replaces em dashes with ordinary punctuation, retargets install metadata, and publishes a GitHub release when the upstream version changes.

Fork tooling lives in `deslop/`. Overlays that sync will not clobber: `deslop/`, `.github/workflows/`, `NOTICE`, `AGENTS.md`, and `CLAUDE.md`.
