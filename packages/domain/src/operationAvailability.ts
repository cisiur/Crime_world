import type { BusinessState } from "./businessState";
import type { CharacterState } from "./characterState";
import { isCharacterAvailable } from "./characterState";
import type { LocationState } from "./cityState";
import type { CharacterId, LocationId, OperationTemplateId, OrganizationId } from "./entityIds";
import type { OrganizationState } from "./organizationState";

export const OperationAvailabilityReason = {
  OrganizationMissing: "OrganizationMissing",
  InsufficientMoney: "InsufficientMoney",
  InsufficientOperationalCapacity: "InsufficientOperationalCapacity",
  CharacterMissing: "CharacterMissing",
  CharacterNotMember: "CharacterNotMember",
  CharacterUnavailable: "CharacterUnavailable",
  InvalidTarget: "InvalidTarget",
  InvalidTargetKind: "InvalidTargetKind",
  TargetAlreadyOwned: "TargetAlreadyOwned",
  BusinessAlreadyOwned: "BusinessAlreadyOwned",
  TemplateMismatch: "TemplateMismatch",
} as const;

export type OperationAvailabilityReason =
  (typeof OperationAvailabilityReason)[keyof typeof OperationAvailabilityReason];

export interface OperationAvailabilityTemplateInput {
  readonly id: OperationTemplateId;
  readonly allowedTargetKinds: readonly string[];
  readonly allowedTargetIds: readonly LocationId[];
  readonly startCost: number;
  readonly operationalCapacityCost: number;
}

export interface OperationAvailabilityLocationDefinitionInput {
  readonly id: LocationId;
  readonly kind: string;
}

export interface EvaluateOperationAvailabilityInput {
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly operationTemplates: readonly OperationAvailabilityTemplateInput[];
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly locationStates: readonly LocationState[];
  readonly locationDefinitions: readonly OperationAvailabilityLocationDefinitionInput[];
  readonly businessStates: readonly BusinessState[];
}

export interface OperationAvailabilityResult {
  readonly available: boolean;
  readonly reasons: readonly OperationAvailabilityReason[];
}

export function evaluateOperationAvailability(
  input: EvaluateOperationAvailabilityInput,
): OperationAvailabilityResult {
  const reasons: OperationAvailabilityReason[] = [];
  const template = findById(input.operationTemplates, "id", input.operationTemplateId);
  const organization = findById(input.organizations, "organizationId", input.organizationId);
  const locationState = findById(input.locationStates, "locationId", input.targetLocationId);
  const locationDefinition = findById(input.locationDefinitions, "id", input.targetLocationId);

  if (!template || !isTemplateStructurallyValid(template, input.operationTemplateId)) {
    addReason(reasons, OperationAvailabilityReason.TemplateMismatch);
  }

  if (!organization) {
    addReason(reasons, OperationAvailabilityReason.OrganizationMissing);
  }

  if (template && organization && isTemplateCostStructurallyValid(template)) {
    evaluateOrganizationPrerequisites(template, organization, reasons);
  }

  evaluateAssignedCharacterPrerequisites(
    input.assignedCharacterIds,
    input.characters,
    organization,
    reasons,
  );
  evaluateTargetPrerequisites(
    input.targetLocationId,
    template,
    locationState,
    locationDefinition,
    input.businessStates,
    input.organizationId,
    reasons,
  );

  return Object.freeze({
    available: reasons.length === 0,
    reasons: Object.freeze([...reasons]),
  });
}

function evaluateOrganizationPrerequisites(
  template: OperationAvailabilityTemplateInput,
  organization: OrganizationState,
  reasons: OperationAvailabilityReason[],
): void {
  if (organization.money < template.startCost) {
    addReason(reasons, OperationAvailabilityReason.InsufficientMoney);
  }

  if (organization.operationalCapacity < template.operationalCapacityCost) {
    addReason(reasons, OperationAvailabilityReason.InsufficientOperationalCapacity);
  }
}

function evaluateAssignedCharacterPrerequisites(
  assignedCharacterIds: readonly CharacterId[],
  characters: readonly CharacterState[],
  organization: OrganizationState | undefined,
  reasons: OperationAvailabilityReason[],
): void {
  if (assignedCharacterIds.length === 0) {
    addReason(reasons, OperationAvailabilityReason.CharacterMissing);
    return;
  }

  for (const characterId of assignedCharacterIds) {
    const character = findById(characters, "characterId", characterId);

    if (!character) {
      addReason(reasons, OperationAvailabilityReason.CharacterMissing);
      continue;
    }

    if (organization && !organization.memberCharacterIds.includes(character.characterId)) {
      addReason(reasons, OperationAvailabilityReason.CharacterNotMember);
    }

    if (!isCharacterAvailable(character)) {
      addReason(reasons, OperationAvailabilityReason.CharacterUnavailable);
    }
  }
}

function evaluateTargetPrerequisites(
  targetLocationId: LocationId,
  template: OperationAvailabilityTemplateInput | undefined,
  locationState: LocationState | undefined,
  locationDefinition: OperationAvailabilityLocationDefinitionInput | undefined,
  businessStates: readonly BusinessState[],
  organizationId: OrganizationId,
  reasons: OperationAvailabilityReason[],
): void {
  if (!locationState || !locationDefinition) {
    addReason(reasons, OperationAvailabilityReason.InvalidTarget);
  }

  if (template && isTemplateTargetConfigurationStructurallyValid(template)) {
    evaluateTemplateTargetPrerequisites(template, targetLocationId, locationDefinition, reasons);
  }

  if (locationState?.ownerOrganizationId === organizationId) {
    addReason(reasons, OperationAvailabilityReason.TargetAlreadyOwned);
  }

  const businessState = findBusinessAtLocation(locationState, targetLocationId, businessStates);

  if (businessState?.ownerOrganizationId === organizationId) {
    addReason(reasons, OperationAvailabilityReason.BusinessAlreadyOwned);
  }
}

function evaluateTemplateTargetPrerequisites(
  template: OperationAvailabilityTemplateInput,
  targetLocationId: LocationId,
  locationDefinition: OperationAvailabilityLocationDefinitionInput | undefined,
  reasons: OperationAvailabilityReason[],
): void {
  if (
    locationDefinition &&
    template.allowedTargetKinds.length > 0 &&
    !template.allowedTargetKinds.includes(locationDefinition.kind)
  ) {
    addReason(reasons, OperationAvailabilityReason.InvalidTargetKind);
  }

  if (
    template.allowedTargetIds.length > 0 &&
    !template.allowedTargetIds.includes(targetLocationId)
  ) {
    addReason(reasons, OperationAvailabilityReason.TemplateMismatch);
  }
}

function findBusinessAtLocation(
  locationState: LocationState | undefined,
  targetLocationId: LocationId,
  businessStates: readonly BusinessState[],
): BusinessState | undefined {
  if (locationState?.businessId) {
    const businessById = findById(businessStates, "businessId", locationState.businessId);

    if (businessById) {
      return businessById;
    }
  }

  return findById(businessStates, "locationId", targetLocationId);
}

function isTemplateStructurallyValid(
  template: OperationAvailabilityTemplateInput,
  expectedTemplateId: OperationTemplateId,
): boolean {
  return (
    template.id === expectedTemplateId &&
    isTemplateCostStructurallyValid(template) &&
    isTemplateTargetConfigurationStructurallyValid(template)
  );
}

function isTemplateCostStructurallyValid(template: OperationAvailabilityTemplateInput): boolean {
  return (
    isNonNegativeInteger(template.startCost) &&
    isNonNegativeInteger(template.operationalCapacityCost)
  );
}

function isTemplateTargetConfigurationStructurallyValid(
  template: OperationAvailabilityTemplateInput,
): boolean {
  return Array.isArray(template.allowedTargetKinds) && Array.isArray(template.allowedTargetIds);
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
}

function findById<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
  id: TItem[TKey],
): TItem | undefined {
  return items.find((item) => item[key] === id);
}

function addReason(
  reasons: OperationAvailabilityReason[],
  reason: OperationAvailabilityReason,
): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}
