# Agent Instructions

## Workflow

- Work directly on `main` unless the owner explicitly changes the workflow.
- Read the relevant documentation before implementation.
- Implement only the accepted scope and avoid unrelated refactors.
- Run the required verification commands for the task.
- Create one focused commit, push it to `main`, and report test/build results.
- Do not claim implementation exists in documentation before review confirms it.

## Required Documents

Read these before implementation work:

- `CONTEXT.md`
- `docs/BUILD_ROADMAP.md`
- `docs/PROJECT_ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- the design document directly related to the task

## Package Boundaries

- `packages/domain` owns pure headless gameplay rules and authoritative state.
- `packages/application` owns commands, queries, orchestration, and read models.
- `packages/content` owns immutable authored definitions.
- `packages/infrastructure` owns storage and platform adapters.
- `packages/presentation` owns React UI and map presentation.
- `apps/desktop` is the composition root and Tauri desktop shell.

`packages/domain` must not depend on React, Tauri, Konva, Node APIs, filesystem APIs, browser globals, presentation packages, infrastructure packages, application packages, content packages, or `apps/desktop`.

Konva is an MVP presentation adapter. It must not leak into domain models, application commands, content schemas, or save formats.

## Guardrails

- Prefer the smallest implementation needed for the first playable vertical slice.
- Do not create speculative general frameworks.
- Do not introduce OSM or Leaflet during MVP Konva work unless explicitly accepted.
- Do not treat long-term GDD documents as automatic MVP scope.
- Do not implement gameplay systems before the relevant accepted task.
