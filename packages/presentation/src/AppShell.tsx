import {
  LOCAL_COLLECTION_PLAYTEST_SEED_PRESETS,
  applyLocalCollectionPlaytestConsequences,
  advanceLocalCollectionPlaytestTime,
  classifyLocalCollectionPlaytestOutcome,
  createLocalCollectionPlaytestSession,
  planLocalCollectionPlaytestOperation,
  reduceLocalCollectionPlaytestSession,
  resetLocalCollectionPlaytestSession,
  runFullLocalCollectionPlaytestOperation,
  setLocalCollectionPlaytestInitialExposure,
  setLocalCollectionPlaytestSeed,
  type LocalCollectionEventTimelineItem,
  type LocalCollectionOutcomePreview,
  type LocalCollectionPlaytestActionResult,
  type LocalCollectionPlaytestError,
  type LocalCollectionPlaytestSession,
} from "@crimeworld/application";
import { useMemo, useState, type ReactNode } from "react";

type ActionRunner = () => LocalCollectionPlaytestActionResult;

const initialSession = createInitialSession();

export function AppShell() {
  const [session, setSession] = useState<LocalCollectionPlaytestSession>(initialSession);
  const [seedInput, setSeedInput] = useState(String(initialSession.seed));
  const [exposureInput, setExposureInput] = useState(String(initialSession.initialExposure));
  const [error, setError] = useState<LocalCollectionPlaytestError | null>(null);
  const character = session.characters[0];
  const classifiedOutcome = session.classifiedOutcome;
  const appliedConsequence = session.appliedConsequences[0] ?? null;
  const operationStatus =
    session.operation.status === "not-planned" ? "Not planned" : session.operation.status;

  function applyResult(result: LocalCollectionPlaytestActionResult): void {
    setSession(result.session);
    setError(result.ok ? null : result.error);
    setSeedInput(String(result.session.seed));
    setExposureInput(String(result.session.initialExposure));
  }

  function runAction(action: ActionRunner): void {
    applyResult(action());
  }

  function applySeedInput(): void {
    const seed = Number(seedInput);
    runAction(() => setLocalCollectionPlaytestSeed(session, seed));
  }

  function applyExposureInput(): void {
    const exposure = Number(exposureInput);
    runAction(() => setLocalCollectionPlaytestInitialExposure(session, exposure));
  }

  function resetScenario(): void {
    const result = resetLocalCollectionPlaytestSession(session, {
      seed: session.seed,
      initialExposure: 0,
    });
    applyResult(result);
  }

  const rawRandomState = useMemo(() => JSON.stringify(session.randomState), [session.randomState]);

  return (
    <main className="app-shell">
      <header className="status-bar">
        <div>
          <p className="eyebrow">Developer vertical slice</p>
          <h1>CrimeWorld — Local Collection Playtest</h1>
        </div>
        <dl className="status-strip" aria-label="Playtest status">
          <div>
            <dt>Phase</dt>
            <dd>{session.phaseLabel}</dd>
          </div>
          <div>
            <dt>Tick</dt>
            <dd>{session.currentTick}</dd>
          </div>
          <div>
            <dt>Seed</dt>
            <dd>{session.seed}</dd>
          </div>
          <div>
            <dt>Operation</dt>
            <dd>{operationStatus}</dd>
          </div>
        </dl>
        <button type="button" className="button button-secondary" onClick={resetScenario}>
          Reset Scenario
        </button>
      </header>

      {error ? (
        <section className="error-banner" role="alert" aria-live="assertive">
          <div>
            <strong>{error.message}</strong>
            <span>{error.code}</span>
            {error.detail ? <p>{error.detail}</p> : null}
          </div>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              const result = reduceLocalCollectionPlaytestSession(session, {
                type: "dismiss-error",
              });
              applyResult(result);
            }}
          >
            Dismiss
          </button>
        </section>
      ) : null}

      <section className="setup-panel" aria-label="Deterministic setup controls">
        <div className="field-group">
          <label htmlFor="seed-input">Seed</label>
          <div className="inline-control">
            <input
              id="seed-input"
              inputMode="numeric"
              value={seedInput}
              disabled={!session.operation.canEditSetup}
              onChange={(event) => setSeedInput(event.target.value)}
            />
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canEditSetup}
              onClick={applySeedInput}
            >
              Apply Seed
            </button>
          </div>
        </div>

        <div className="preset-row" aria-label="Seed presets">
          {LOCAL_COLLECTION_PLAYTEST_SEED_PRESETS.map((preset) => (
            <button
              key={preset.seed}
              type="button"
              className="button button-ghost"
              disabled={!session.operation.canEditSetup}
              onClick={() => runAction(() => setLocalCollectionPlaytestSeed(session, preset.seed))}
            >
              {preset.label} ({preset.seed}) roll {preset.expectedRoll}
            </button>
          ))}
        </div>

        <div className="field-group">
          <label htmlFor="exposure-input">Initial exposure</label>
          <div className="inline-control">
            <input
              id="exposure-input"
              inputMode="numeric"
              min={0}
              max={100}
              value={exposureInput}
              disabled={!session.operation.canEditSetup}
              onChange={(event) => setExposureInput(event.target.value)}
            />
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canEditSetup}
              onClick={applyExposureInput}
            >
              Apply Exposure
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Scenario state">
        <Panel title="Organization">
          <Metric label="Name" value={session.organization.name} />
          <Metric label="Money" value={session.organization.money} tone="money" />
          <Metric label="Capacity" value={session.organization.capacityLabel} />
          <Metric
            label="Reserved"
            value={session.organization.reservedOperationalCapacity}
            tone={session.organization.reservedOperationalCapacity > 0 ? "warning" : "normal"}
          />
        </Panel>

        <Panel title="Operation & Target">
          <button
            type="button"
            className={`select-card ${session.target.selected ? "is-selected" : ""}`}
            disabled={!session.operation.canEditSetup}
            onClick={() =>
              runAction(() =>
                reduceLocalCollectionPlaytestSession(session, {
                  type: "select-target",
                  locationId: session.target.id,
                }),
              )
            }
          >
            <span>{session.target.name}</span>
            <small>
              {session.target.kind} in {session.target.districtName}
            </small>
          </button>
          <Metric label="Template" value={session.operation.displayName} />
          <Metric label="Start cost" value={session.operation.startCost} tone="money" />
          <Metric label="Duration" value={`${session.operation.durationMinutes} minutes`} />
          <Metric label="Capacity cost" value={session.operation.operationalCapacityCost} />
          <Metric label="Gross reward" value={session.operation.grossRewardRange} />
          <p className="hint">{session.operation.riskSummary}</p>
        </Panel>

        <Panel title="Character">
          {character ? (
            <>
              <button
                type="button"
                className={`select-card ${character.selected ? "is-selected" : ""}`}
                disabled={!session.operation.canEditSetup}
                onClick={() =>
                  runAction(() =>
                    reduceLocalCollectionPlaytestSession(session, {
                      type: "select-character",
                      characterId: character.id,
                    }),
                  )
                }
              >
                <span>{character.name}</span>
                <small>{character.capabilityTags.join(", ")}</small>
              </button>
              <Metric label="Competence" value={character.competence} />
              <Metric label="Loyalty" value={character.loyalty} />
              <Metric
                label="Health"
                value={character.healthState}
                tone={healthTone(character.healthState)}
              />
              <Metric label="Legal" value={character.legalState} />
              <Metric
                label="Assignment"
                value={character.assignmentState}
                tone={character.assignmentState === "assigned" ? "warning" : "success"}
              />
              <Metric
                label="Exposure"
                value={character.personalExposure}
                tone={character.personalExposure >= 90 ? "warning" : "normal"}
              />
            </>
          ) : (
            <p className="hint">No character in scenario.</p>
          )}
        </Panel>
      </section>

      <section className="playtest-main">
        <Panel title="Actions">
          <div className="action-grid">
            <button
              type="button"
              className="button button-primary"
              disabled={!session.operation.canPlan}
              title={session.operation.disabledReason ?? undefined}
              onClick={() => runAction(() => planLocalCollectionPlaytestOperation(session))}
            >
              Plan Operation
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canRunFullOperation}
              title={session.operation.disabledReason ?? undefined}
              onClick={() => runAction(() => runFullLocalCollectionPlaytestOperation(session))}
            >
              Run Full Operation
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canAdvanceOneTick}
              onClick={() =>
                runAction(() => advanceLocalCollectionPlaytestTime(session, "one-tick"))
              }
            >
              Advance 1 Tick
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canAdvanceToStart}
              onClick={() =>
                runAction(() => advanceLocalCollectionPlaytestTime(session, "to-start"))
              }
            >
              Advance to Start
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={!session.operation.canAdvanceToCompletion}
              onClick={() =>
                runAction(() => advanceLocalCollectionPlaytestTime(session, "to-completion"))
              }
            >
              Advance to Completion
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={!session.operation.canClassify}
              onClick={() => runAction(() => classifyLocalCollectionPlaytestOutcome(session))}
            >
              Roll Outcome
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={!session.operation.canApplyConsequences}
              onClick={() => runAction(() => applyLocalCollectionPlaytestConsequences(session))}
            >
              Apply Consequences
            </button>
          </div>
          <div className="availability-box">
            <strong>{session.availability.available ? "Available" : "Unavailable"}</strong>
            {session.availability.reasons.length > 0 ? (
              <ul>
                {session.availability.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p>Prerequisites are satisfied.</p>
            )}
          </div>
        </Panel>

        <Panel title="Outcome Preview">
          <div className="outcome-table" role="table" aria-label="Possible outcomes">
            <div role="row" className="outcome-row outcome-head">
              <span>Outcome</span>
              <span>Probability</span>
              <span>Reward</span>
              <span>Exposure</span>
              <span>Health</span>
            </div>
            {session.operation.outcomePreview.map((outcome) => (
              <OutcomePreviewRow key={outcome.category} outcome={outcome} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="details-grid" aria-label="Outcome and event details">
        <Panel title="Outcome & Consequences">
          {classifiedOutcome ? (
            <div className="result-block">
              <h3 className={`outcome-title outcome-${classifiedOutcome.category}`}>
                {formatOutcome(classifiedOutcome.category)}
              </h3>
              <Metric label="Roll" value={classifiedOutcome.percentileRoll} />
              <Metric
                label="Selected band"
                value={`${classifiedOutcome.selectedBandLowerBound}-${classifiedOutcome.selectedBandUpperBound}`}
              />
              <div className="modifier-grid">
                {Object.entries(classifiedOutcome.modifierContributions).map(([key, value]) => (
                  <Metric key={key} label={key} value={value} />
                ))}
              </div>
              <details>
                <summary>RNG state</summary>
                <pre>
                  {JSON.stringify(
                    {
                      before: classifiedOutcome.previousRandomState,
                      after: classifiedOutcome.nextRandomState,
                      current: session.randomState,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          ) : (
            <p className="hint">Outcome not rolled yet.</p>
          )}

          {appliedConsequence ? (
            <div className="consequence-grid">
              <Metric label="Gross reward" value={appliedConsequence.grossReward} tone="money" />
              <Metric
                label="Money"
                value={`${appliedConsequence.previousOrganizationMoney} -> ${appliedConsequence.currentOrganizationMoney}`}
                tone="money"
              />
              <Metric
                label="Exposure requested"
                value={`+${appliedConsequence.requestedPersonalExposureDelta}`}
              />
              <Metric
                label="Exposure actual"
                value={`+${appliedConsequence.actualPersonalExposureDelta}`}
                tone={appliedConsequence.personalExposureClamped ? "warning" : "normal"}
              />
              <Metric
                label="Exposure"
                value={`${appliedConsequence.previousPersonalExposure} -> ${appliedConsequence.currentPersonalExposure}`}
              />
              <Metric
                label="Clamped"
                value={appliedConsequence.personalExposureClamped ? "yes" : "no"}
                tone={appliedConsequence.personalExposureClamped ? "warning" : "normal"}
              />
              <Metric
                label="Health"
                value={`${appliedConsequence.previousHealthState} -> ${appliedConsequence.currentHealthState}`}
                tone={healthTone(appliedConsequence.currentHealthState)}
              />
              <Metric
                label="Assignment"
                value={`${appliedConsequence.previousAssignmentState} -> ${appliedConsequence.currentAssignmentState}`}
              />
              <Metric
                label="Capacity"
                value={`${appliedConsequence.previousOperationalCapacity} -> ${appliedConsequence.currentOperationalCapacity}`}
              />
            </div>
          ) : null}

          <details>
            <summary>Current random state</summary>
            <pre>{rawRandomState}</pre>
          </details>
        </Panel>

        <Panel title="Event Timeline">
          {session.eventTimeline.length > 0 ? (
            <ol className="event-list">
              {session.eventTimeline.map((item) => (
                <EventTimelineItem key={item.sequence} item={item} />
              ))}
            </ol>
          ) : (
            <p className="hint">No events yet. Plan the operation to begin the chronology.</p>
          )}
        </Panel>
      </section>
    </main>
  );
}

function createInitialSession(): LocalCollectionPlaytestSession {
  const result = createLocalCollectionPlaytestSession();

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.session;
}

function Panel({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "normal",
}: {
  readonly label: string;
  readonly value: ReactNode;
  readonly tone?: "normal" | "money" | "success" | "warning" | "danger";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OutcomePreviewRow({ outcome }: { readonly outcome: LocalCollectionOutcomePreview }) {
  return (
    <div role="row" className="outcome-row">
      <span>{outcome.label}</span>
      <span>{outcome.probabilityPercent}%</span>
      <span>{outcome.grossReward > 0 ? `+${outcome.grossReward}` : "0"}</span>
      <span>+{outcome.exposureDelta}</span>
      <span>{outcome.healthConsequence}</span>
    </div>
  );
}

function EventTimelineItem({ item }: { readonly item: LocalCollectionEventTimelineItem }) {
  return (
    <li>
      <div>
        <span className="event-number">{item.sequence}.</span>
        <strong>{item.type}</strong>
      </div>
      <p>{item.summary}</p>
      <details>
        <summary>Payload</summary>
        <pre>{JSON.stringify(item.event, null, 2)}</pre>
      </details>
    </li>
  );
}

function formatOutcome(category: string): string {
  return category
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function healthTone(health: string): "success" | "warning" | "danger" | "normal" {
  if (health === "healthy") {
    return "success";
  }

  if (health === "injured") {
    return "danger";
  }

  return "warning";
}
