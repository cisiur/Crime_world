# CrimeWorld

CrimeWorld is a desktop-first grand-strategy crime sandbox about building and maintaining a criminal organization inside a living city simulation.

The repository contains the complete design foundation, the AI-assisted implementation workflow, the TypeScript / React / Vite / Tauri workspace scaffold, the deterministic domain kernel, and the controlled MVP city shell.

## Start here

For a new ChatGPT / PM session, read:

1. [`CONTEXT.md`](CONTEXT.md) — current project state, workflow, architecture rules, and next task
2. [`docs/BUILD_ROADMAP.md`](docs/BUILD_ROADMAP.md) — implementation epics and task order
3. [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) — architecture constitution
4. [`docs/GDD_INDEX.md`](docs/GDD_INDEX.md) — complete design-document reading order

## Development workflow

- The project owner makes product decisions.
- ChatGPT acts as PM / Technical Lead.
- Codex implements accepted tasks.
- Active work happens on `main` unless the owner explicitly changes the workflow.
- ChatGPT proposes scope and acceptance criteria first.
- Codex prompts are created only after owner acceptance.
- Every Codex push is reviewed before the next task begins.

## Current status

- Design bible: complete enough for implementation.
- MVP definition and architecture: validated.
- AI-assisted build roadmap: created.
- Technology stack: selected and recorded in [`docs/TECH_STACK.md`](docs/TECH_STACK.md).
- Repository scaffold: created and covered by GitHub Actions CI.
- EPIC 1 domain kernel: complete.
- EPIC 2 controlled city shell: complete.
- Node.js: `24.15.0`.
- Test seed override: `CRIMEWORLD_TEST_SEED` with default `12648430`.
- Gameplay logic: not implemented yet.

Current next task:

> **E3-01 — define MVP character state and traits.**

See [`docs/BUILD_ROADMAP.md`](docs/BUILD_ROADMAP.md) for the complete implementation sequence.
