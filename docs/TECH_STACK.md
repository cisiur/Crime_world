# Technology Stack — CrimeWorld

> **Status:** accepted implementation decision  
> **Decision owner:** project owner  
> **Applies to:** MVP and first playable vertical slice  
> **Active branch:** `main`

---

## 1. Decision

CrimeWorld will use the following primary implementation stack:

- **Language:** TypeScript
- **Management UI:** React
- **Desktop shell:** Tauri
- **Build tooling:** Vite
- **MVP strategic map renderer:** Konva.js through React integration
- **Future geographic map option:** Leaflet
- **Architecture:** modular monolith with a headless deterministic domain simulation

Exact dependency and runtime versions will be selected and pinned during repository scaffolding. This document records the architectural choice, not speculative version numbers.

---

## 2. Why this stack was selected

CrimeWorld is primarily a strategy and organization-management game. The player will spend most of the session reading state, comparing options, using panels, inspecting characters and districts, planning operations, and responding to systemic consequences.

The selected stack prioritizes:

- complex management UI,
- fast iteration on panels, lists, filters, tooltips, dialogs, and read models,
- straightforward headless domain tests,
- strong TypeScript boundaries between content, domain, application, presentation, and infrastructure,
- desktop-first distribution,
- practical solo-development workflow,
- strong compatibility with Codex-assisted implementation,
- and a replaceable map-rendering boundary.

A full game engine was not selected because CrimeWorld does not currently require physics, a scene-heavy world, large numbers of animated agents, or other engine-first capabilities strongly enough to justify the higher long-term cost of building management-heavy UI inside a game engine.

---

## 3. Responsibilities by technology

### TypeScript

TypeScript is the primary language for:

- domain state and rules,
- application commands and queries,
- deterministic simulation,
- content schemas and validation,
- save models and migrations,
- infrastructure adapters,
- and presentation code.

Gameplay correctness must not depend on browser globals, React lifecycle behavior, Tauri APIs, or Konva objects.

### React

React owns the management interface, including:

- campaign screens,
- organization and character panels,
- operation planning workflows,
- event feed and notifications,
- time controls,
- filters, lists, tables, dialogs, and tooltips,
- and presentation-level composition around the strategic map.

React components may send application commands and consume read models. They must not directly mutate authoritative domain state.

### Tauri

Tauri provides the desktop application shell and replaceable platform adapters for concerns such as:

- application lifecycle,
- desktop packaging,
- access to local save-file capabilities,
- native dialogs when required,
- and future platform integrations.

The domain and application layers must not import Tauri APIs.

### Konva.js

Konva.js is the accepted MVP map renderer. It is responsible only for presentation concerns such as:

- displaying the controlled city layout,
- rendering districts, routes, and strategic locations,
- pan and zoom,
- selection and hover states,
- map overlays,
- operation targeting feedback,
- and lightweight presentation animations.

Konva is not a source of gameplay truth.

Konva nodes, stages, layers, shapes, event objects, and coordinates must not appear in domain entities, application commands, save files, or content contracts intended to survive a renderer change.

### Leaflet as a future option

Leaflet is not part of the initial MVP implementation.

It remains an accepted future renderer option when CrimeWorld begins using geographically meaningful city data, real coordinates, GeoJSON, or OSM-derived definitions.

Moving from Konva to Leaflet must be possible by replacing presentation and mapping adapters rather than rewriting gameplay systems.

---

## 4. Map-renderer boundary

The city simulation must consume neutral game data rather than renderer-specific structures.

The long-lived model should use concepts such as:

- `CityDefinition`,
- `DistrictDefinition`,
- `RouteDefinition`,
- `LocationDefinition`,
- stable entity IDs,
- strategic adjacency,
- and renderer-neutral map placement metadata where presentation placement is needed.

The domain must not use:

- Konva nodes or shapes,
- Leaflet markers or layers,
- browser DOM elements,
- latitude/longitude as a mandatory gameplay concept,
- tile-layer identifiers,
- or renderer-owned object references.

For the handcrafted MVP city, presentation placement may use a neutral local coordinate system. These coordinates must be treated as content or presentation metadata, not as authoritative simulation rules.

A future OSM adapter may generate the same neutral city definition while additionally providing geographic metadata for a Leaflet-based renderer.

---

## 5. Architecture constraints

The repository must preserve the layers defined in `PROJECT_ARCHITECTURE.md`:

1. **Content** — immutable definitions and balance data.
2. **Domain** — authoritative state, rules, deterministic simulation, and domain events.
3. **Application** — commands, queries, use cases, tick orchestration, and read-model construction.
4. **Presentation** — React UI and Konva map rendering.
5. **Infrastructure** — Tauri adapters, persistence, serialization, migrations, logging, and future import adapters.

Dependency direction must point inward.

In particular:

- domain must not depend on React, Konva, Tauri, filesystem APIs, or browser APIs,
- application must not depend on React components or Konva nodes,
- presentation must communicate through application commands and read models,
- infrastructure must implement interfaces owned by inner layers,
- and map-renderer replacement must not require changes to operation, economy, pressure, organization, or AI rules.

---

## 6. Repository structure direction

The scaffold should use a workspace structure that makes architectural boundaries visible without turning the modular monolith into distributed services.

The initial target structure is:

```text
apps/
  desktop/

packages/
  domain/
  application/
  content/
  infrastructure/
  presentation/
```

This structure is a direction for E0-04, not permission to create speculative packages or abstractions.

Only packages required by the accepted scaffold and first playable path should be created. Empty future-system packages must not be added merely to mirror the full design bible.

The final names may be adjusted during E0-04 if tooling constraints justify a change, but the dependency boundaries must remain intact.

---

## 7. Testing and determinism expectations

The selected stack must support tests that run without launching Tauri, React, or Konva.

The repository foundation must eventually provide:

- one documented install command,
- one documented test command,
- one documented production-build command,
- headless domain unit tests,
- application-level integration tests,
- seeded randomness behind an injected interface,
- stable and explicitly tested simulation phase order,
- deterministic replay tests,
- and renderer-independent tests for city, operation, and campaign behavior.

React and map tests should verify presentation behavior, but they must not replace domain tests.

---

## 8. Explicit non-decisions

This decision does not yet select:

- exact package versions,
- package manager,
- test runner,
- schema-validation library,
- state-management library for presentation,
- styling system,
- component library,
- save-file encoding,
- CI provider configuration,
- map artwork format,
- or the exact Tauri plugin set.

These choices should be made only when required by the scaffold or a bounded implementation task.

The project must not add Redux, an ORM, a database, a backend service, a Rust domain layer, or a large UI component framework by default. Each additional dependency requires a concrete current need.

---

## 9. Rejected primary alternatives

### Godot 4 + C#

Godot remains a viable technology for map-centric strategy games, but it was not selected because CrimeWorld's long-term implementation cost is expected to be dominated by management UI rather than scene rendering.

Its advantages in 2D rendering did not outweigh the expected cost of implementing and maintaining table-, panel-, filter-, tooltip-, and workflow-heavy interfaces.

### Unity + C#

Unity was rejected because its engine scope, commercial dependency, and workflow overhead are not justified by the current CrimeWorld requirements.

### Electron + React

Electron remains a fallback desktop shell if Tauri creates blocking integration or packaging problems that cannot be resolved economically.

It is not the default because the project prefers a lighter desktop shell. A move to Electron must not alter the domain, application, React, or map-renderer architecture.

### Python + Pygame

Python and Pygame were rejected as the primary production stack because they provide insufficient advantages for a long-lived, UI-heavy desktop strategy project and would require more custom UI and packaging work.

---

## 10. Change conditions

The accepted stack should not be reopened because of minor friction or unfamiliarity.

A technology decision may be revisited only when repository evidence shows a blocking problem, for example:

- Tauri cannot satisfy required desktop behavior at an acceptable cost,
- Konva cannot meet measured map performance or interaction requirements,
- the chosen tooling prevents reliable headless tests,
- packaging or platform support becomes a material product blocker,
- or real-city geographic rendering becomes an immediate accepted scope requirement.

Konva-to-Leaflet migration is an anticipated presentation change, not a change of the primary stack.

Any proposed change must include measured evidence, migration cost, affected architectural boundaries, and an explanation of why a smaller fix is insufficient.

---

## 11. Current roadmap position

The stack is accepted and implemented in the repository scaffold.

EPIC 0, EPIC 1, and EPIC 2 are complete. The next implementation-planning task is:

> **E3-01 — Define MVP character state and traits.**

Before Codex receives an implementation prompt, the PM must define the bounded character-state scope, package ownership, validation and test expectations, and explicit exclusions for organization behavior, recruitment gameplay, operation assignment, and UI.
