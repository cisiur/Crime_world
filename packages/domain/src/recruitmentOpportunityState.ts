import type { CharacterId, LocationId, OrganizationId, RecruitmentOpportunityId } from "./entityIds";
import {
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
} from "./entityIds";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export const RecruitmentOpportunityStatus = {
  Active: "active",
  Expired: "expired",
  Consumed: "consumed",
} as const;

export type RecruitmentOpportunityStatus =
  (typeof RecruitmentOpportunityStatus)[keyof typeof RecruitmentOpportunityStatus];

export interface RecruitmentOpportunityState {
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly candidateCharacterId: CharacterId;
  readonly targetOrganizationId: OrganizationId;
  readonly locationId: LocationId;
  readonly createdAtTick: SimulationTick;
  readonly expiresAtTick: SimulationTick;
  readonly status: RecruitmentOpportunityStatus;
}

export interface CreateRecruitmentOpportunityStateInput {
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly candidateCharacterId: CharacterId;
  readonly targetOrganizationId: OrganizationId;
  readonly locationId: LocationId;
  readonly createdAtTick: SimulationTick;
  readonly expiresAtTick: SimulationTick;
  readonly status: RecruitmentOpportunityStatus;
}

export type InvalidRecruitmentOpportunityStateField =
  | "recruitmentOpportunityId"
  | "candidateCharacterId"
  | "targetOrganizationId"
  | "locationId"
  | "createdAtTick"
  | "expiresAtTick"
  | "status";

export class InvalidRecruitmentOpportunityStateError extends Error {
  public constructor(
    public readonly field: InvalidRecruitmentOpportunityStateField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid recruitment opportunity state field "${field}": ${reason}.`);
    this.name = "InvalidRecruitmentOpportunityStateError";
  }
}

export function createRecruitmentOpportunityState(
  input: CreateRecruitmentOpportunityStateInput,
): RecruitmentOpportunityState {
  assertValidField("recruitmentOpportunityId", () =>
    parseRecruitmentOpportunityId(input.recruitmentOpportunityId),
  );
  assertValidField("candidateCharacterId", () => parseCharacterId(input.candidateCharacterId));
  assertValidField("targetOrganizationId", () =>
    parseOrganizationId(input.targetOrganizationId),
  );
  assertValidField("locationId", () => parseLocationId(input.locationId));
  assertValidField("createdAtTick", () => parseSimulationTick(input.createdAtTick));
  assertValidField("expiresAtTick", () => parseSimulationTick(input.expiresAtTick));

  if (!isRecruitmentOpportunityStatus(input.status)) {
    throw new InvalidRecruitmentOpportunityStateError(
      "status",
      `unsupported status "${String(input.status)}"`,
      input.status,
    );
  }

  if (input.expiresAtTick <= input.createdAtTick) {
    throw new InvalidRecruitmentOpportunityStateError(
      "expiresAtTick",
      "expected expiresAtTick to be greater than createdAtTick",
      input,
    );
  }

  return Object.freeze({
    recruitmentOpportunityId: input.recruitmentOpportunityId,
    candidateCharacterId: input.candidateCharacterId,
    targetOrganizationId: input.targetOrganizationId,
    locationId: input.locationId,
    createdAtTick: input.createdAtTick,
    expiresAtTick: input.expiresAtTick,
    status: input.status,
  });
}

function isRecruitmentOpportunityStatus(value: unknown): value is RecruitmentOpportunityStatus {
  return (
    value === RecruitmentOpportunityStatus.Active ||
    value === RecruitmentOpportunityStatus.Expired ||
    value === RecruitmentOpportunityStatus.Consumed
  );
}

function assertValidField(
  field: InvalidRecruitmentOpportunityStateField,
  assertion: () => void,
): void {
  try {
    assertion();
  } catch (error) {
    throw new InvalidRecruitmentOpportunityStateError(
      field,
      error instanceof Error ? error.message : "parser rejected value",
      undefined,
    );
  }
}
