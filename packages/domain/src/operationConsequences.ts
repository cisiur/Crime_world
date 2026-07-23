import {
  createCharacterAssignmentReleasedEvent,
  createCharacterHealthChangedEvent,
  createCharacterPersonalExposureChangedEvent,
  createOperationConsequencesAppliedEvent,
  createOrganizationOperationalCapacityReleasedEvent,
  type DomainEvent,
} from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { CharacterId, TransactionId } from "./entityIds";
import {
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  recordMoneyTransaction,
  type MoneyTransaction,
  type MoneyTransactionError,
} from "./moneyLedger";
import {
  OperationOutcomeCategory,
  isOperationOutcomeCategory,
  type ClassifiedOperationOutcome,
} from "./operationOutcomeClassification";
import { OperationStatus, type OperationState } from "./operationState";
import {
  createCharacterState,
  type AssignmentState,
  type CharacterHealthState,
  type CharacterState,
} from "./characterState";
import { createOrganizationState, type OrganizationState } from "./organizationState";
import type { SimulationTick } from "./simulationClock";

export type LocalCollectionHealthConsequence = "none" | "injured";

export interface LocalCollectionConsequenceDefinitionEntry {
  readonly category: OperationOutcomeCategory;
  readonly grossReward: number;
  readonly personalExposureDelta: number;
  readonly healthConsequence: LocalCollectionHealthConsequence;
  readonly operationalCapacityRelease: number;
}

export interface AppliedOperationConsequences {
  readonly operationId: OperationState["operationId"];
  readonly operationTemplateId: OperationState["operationTemplateId"];
  readonly organizationId: OperationState["organizationId"];
  readonly assignedCharacterId: CharacterId;
  readonly releasedCharacterIds: readonly CharacterId[];
  readonly category: OperationOutcomeCategory;
  readonly grossReward: number;
  readonly grossRewardTransactionId?: TransactionId;
  readonly previousOrganizationMoney: number;
  readonly currentOrganizationMoney: number;
  readonly moneyDelta: number;
  readonly requestedPersonalExposureDelta: number;
  readonly actualPersonalExposureDelta: number;
  readonly previousPersonalExposure: number;
  readonly currentPersonalExposure: number;
  readonly personalExposureClamped: boolean;
  readonly healthConsequence: LocalCollectionHealthConsequence;
  readonly previousHealthState: CharacterHealthState;
  readonly currentHealthState: CharacterHealthState;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
  readonly operationalCapacityReleased: number;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
}

export interface ApplyLocalCollectionConsequencesInput {
  readonly operation: OperationState;
  readonly classifiedOutcome: ClassifiedOperationOutcome;
  readonly consequenceDefinition: readonly LocalCollectionConsequenceDefinitionEntry[];
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly appliedConsequences: readonly AppliedOperationConsequences[];
  readonly transactions: readonly MoneyTransaction[];
  readonly recordedAtTick: SimulationTick;
  readonly grossRewardTransactionId?: TransactionId;
}

export interface ApplyLocalCollectionConsequencesSuccess {
  readonly organization: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly assignedCharacter: CharacterState;
  readonly characters: readonly CharacterState[];
  readonly appliedConsequence: AppliedOperationConsequences;
  readonly appliedConsequences: readonly AppliedOperationConsequences[];
  readonly grossRewardTransaction?: MoneyTransaction;
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
}

export interface LocalCollectionConsequenceDefinitionEmptyError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionEmpty;
}

export interface LocalCollectionConsequenceDefinitionCategoryUnsupportedError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryUnsupported;
  readonly index: number;
  readonly category: string;
}

export interface LocalCollectionConsequenceDefinitionCategoryDuplicatedError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryDuplicated;
  readonly category: OperationOutcomeCategory;
  readonly firstIndex: number;
  readonly duplicateIndex: number;
}

export interface LocalCollectionConsequenceDefinitionCategoryMissingError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryMissing;
  readonly category: OperationOutcomeCategory;
}

export interface LocalCollectionConsequenceDefinitionValueInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid;
  readonly index: number;
  readonly category: OperationOutcomeCategory;
  readonly field: "grossReward" | "personalExposureDelta" | "operationalCapacityRelease";
  readonly expected: string | number;
  readonly actual: number;
}

export interface LocalCollectionConsequenceDefinitionHealthInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceDefinitionHealthInvalid;
  readonly index: number;
  readonly category: OperationOutcomeCategory;
  readonly expected: LocalCollectionHealthConsequence;
  readonly actual: string;
}

export interface LocalCollectionConsequenceApplicationAlreadyRecordedError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationAlreadyRecorded;
  readonly operationId: OperationState["operationId"];
  readonly existingRecordIndex: number;
}

export interface LocalCollectionConsequenceApplicationOperationNotResolvedError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationOperationNotResolved;
  readonly operationId: OperationState["operationId"];
  readonly status: OperationState["status"];
}

export interface LocalCollectionConsequenceApplicationOutcomeMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationOutcomeMismatch;
  readonly operationId: OperationState["operationId"];
  readonly classifiedOutcomeOperationId: OperationState["operationId"];
}

export interface LocalCollectionConsequenceApplicationOutcomeCategoryUnsupportedError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationOutcomeCategoryUnsupported;
  readonly category: string;
}

export interface LocalCollectionConsequenceApplicationMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationMissingOrganization;
  readonly organizationId: OperationState["organizationId"];
}

export interface LocalCollectionConsequenceApplicationInvalidAssignedCharacterCountError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationInvalidAssignedCharacterCount;
  readonly operationId: OperationState["operationId"];
  readonly expected: 1;
  readonly actual: number;
}

export interface LocalCollectionConsequenceApplicationMissingAssignedCharacterError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationMissingAssignedCharacter;
  readonly characterId: CharacterId;
}

export interface LocalCollectionConsequenceApplicationCharacterNotMemberError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotMember;
  readonly organizationId: OperationState["organizationId"];
  readonly characterId: CharacterId;
}

export interface LocalCollectionConsequenceApplicationCharacterNotAssignedError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotAssigned;
  readonly characterId: CharacterId;
  readonly expected: "assigned";
  readonly actual: AssignmentState;
}

export interface LocalCollectionConsequenceApplicationInvalidHealthError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationInvalidHealth;
  readonly characterId: CharacterId;
  readonly category: OperationOutcomeCategory;
  readonly expected: "healthy";
  readonly actual: CharacterHealthState;
}

export interface LocalCollectionConsequenceApplicationArithmeticInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationArithmeticInvalid;
  readonly field: "money" | "operationalCapacity" | "personalExposure";
  readonly previousValue: number;
  readonly delta: number;
}

export interface LocalCollectionConsequenceApplicationMissingRewardTransactionIdError
  extends DomainError {
  readonly code: typeof DomainErrorCode.LocalCollectionConsequenceApplicationMissingRewardTransactionId;
  readonly operationId: OperationState["operationId"];
  readonly grossReward: number;
}

export type LocalCollectionConsequenceApplicationError =
  | LocalCollectionConsequenceApplicationAlreadyRecordedError
  | LocalCollectionConsequenceApplicationArithmeticInvalidError
  | LocalCollectionConsequenceApplicationCharacterNotAssignedError
  | LocalCollectionConsequenceApplicationCharacterNotMemberError
  | LocalCollectionConsequenceApplicationInvalidAssignedCharacterCountError
  | LocalCollectionConsequenceApplicationInvalidHealthError
  | LocalCollectionConsequenceApplicationMissingAssignedCharacterError
  | LocalCollectionConsequenceApplicationMissingOrganizationError
  | LocalCollectionConsequenceApplicationMissingRewardTransactionIdError
  | LocalCollectionConsequenceApplicationOutcomeCategoryUnsupportedError
  | LocalCollectionConsequenceApplicationOperationNotResolvedError
  | LocalCollectionConsequenceApplicationOutcomeMismatchError
  | LocalCollectionConsequenceDefinitionCategoryDuplicatedError
  | LocalCollectionConsequenceDefinitionCategoryMissingError
  | LocalCollectionConsequenceDefinitionCategoryUnsupportedError
  | LocalCollectionConsequenceDefinitionEmptyError
  | LocalCollectionConsequenceDefinitionHealthInvalidError
  | LocalCollectionConsequenceDefinitionValueInvalidError
  | MoneyTransactionError;

export type ApplyLocalCollectionConsequencesResult = DomainResult<
  ApplyLocalCollectionConsequencesSuccess,
  LocalCollectionConsequenceApplicationError
>;

const LOCAL_COLLECTION_CONSEQUENCE_CONTRACT: ReadonlyMap<
  OperationOutcomeCategory,
  Readonly<{
    grossReward: number;
    personalExposureDelta: number;
    healthConsequence: LocalCollectionHealthConsequence;
    operationalCapacityRelease: number;
  }>
> = new Map([
  [
    OperationOutcomeCategory.Success,
    {
      grossReward: 80,
      personalExposureDelta: 4,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
  ],
  [
    OperationOutcomeCategory.PartialSuccess,
    {
      grossReward: 40,
      personalExposureDelta: 10,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
  ],
  [
    OperationOutcomeCategory.Failure,
    {
      grossReward: 0,
      personalExposureDelta: 14,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
  ],
  [
    OperationOutcomeCategory.CriticalFailure,
    {
      grossReward: 0,
      personalExposureDelta: 25,
      healthConsequence: "injured",
      operationalCapacityRelease: 1,
    },
  ],
]);

const LOCAL_COLLECTION_CONSEQUENCE_CATEGORY_ORDER = Object.freeze([
  OperationOutcomeCategory.Success,
  OperationOutcomeCategory.PartialSuccess,
  OperationOutcomeCategory.Failure,
  OperationOutcomeCategory.CriticalFailure,
]);

const MAX_PERSONAL_EXPOSURE = 100;

export function applyLocalCollectionConsequences(
  input: ApplyLocalCollectionConsequencesInput,
): ApplyLocalCollectionConsequencesResult {
  const definitionResult = validateLocalCollectionConsequenceDefinition(
    input.consequenceDefinition,
  );
  if (!definitionResult.ok) {
    return definitionResult;
  }

  const existingRecordIndex = input.appliedConsequences.findIndex(
    (record) => record.operationId === input.operation.operationId,
  );
  if (existingRecordIndex !== -1) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationAlreadyRecorded,
      message: `Consequences for operation "${input.operation.operationId}" have already been applied.`,
      operationId: input.operation.operationId,
      existingRecordIndex,
    });
  }

  if (input.operation.status !== OperationStatus.Resolved) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationOperationNotResolved,
      message: `Operation "${input.operation.operationId}" must be resolved before consequences can be applied.`,
      operationId: input.operation.operationId,
      status: input.operation.status,
    });
  }

  if (input.classifiedOutcome.operationId !== input.operation.operationId) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationOutcomeMismatch,
      message: "Classified outcome must refer to the same operation as consequence application.",
      operationId: input.operation.operationId,
      classifiedOutcomeOperationId: input.classifiedOutcome.operationId,
    });
  }

  if (!isOperationOutcomeCategory(input.classifiedOutcome.category)) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationOutcomeCategoryUnsupported,
      message: `Classified outcome category "${String(
        input.classifiedOutcome.category,
      )}" is not supported.`,
      category: String(input.classifiedOutcome.category),
    });
  }

  if (input.operation.assignedCharacterIds.length !== 1) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationInvalidAssignedCharacterCount,
      message: "Local Collection consequence application requires exactly one assigned character.",
      operationId: input.operation.operationId,
      expected: 1,
      actual: input.operation.assignedCharacterIds.length,
    });
  }

  const organization = input.organizations.find(
    (candidate) => candidate.organizationId === input.operation.organizationId,
  );
  if (organization === undefined) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationMissingOrganization,
      message: `Organization "${input.operation.organizationId}" was not found.`,
      organizationId: input.operation.organizationId,
    });
  }

  const assignedCharacterId = input.operation.assignedCharacterIds[0] as CharacterId;
  const assignedCharacter = input.characters.find(
    (candidate) => candidate.characterId === assignedCharacterId,
  );
  if (assignedCharacter === undefined) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationMissingAssignedCharacter,
      message: `Assigned character "${assignedCharacterId}" was not found.`,
      characterId: assignedCharacterId,
    });
  }

  if (!organization.memberCharacterIds.includes(assignedCharacterId)) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotMember,
      message: `Character "${assignedCharacterId}" is not a member of organization "${organization.organizationId}".`,
      organizationId: organization.organizationId,
      characterId: assignedCharacterId,
    });
  }

  if (assignedCharacter.assignmentState !== "assigned") {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotAssigned,
      message: `Character "${assignedCharacterId}" must be assigned before Local Collection consequences can be applied.`,
      characterId: assignedCharacterId,
      expected: "assigned",
      actual: assignedCharacter.assignmentState,
    });
  }

  const consequence = definitionResult.value.find(
    (entry) => entry.category === input.classifiedOutcome.category,
  ) as LocalCollectionConsequenceDefinitionEntry;

  if (assignedCharacter.healthState !== "healthy") {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationInvalidHealth,
      message: `Character "${assignedCharacterId}" must be healthy before Local Collection consequences can be applied.`,
      characterId: assignedCharacterId,
      category: input.classifiedOutcome.category,
      expected: "healthy",
      actual: assignedCharacter.healthState,
    });
  }

  const nextOperationalCapacity =
    organization.operationalCapacity + consequence.operationalCapacityRelease;
  if (!Number.isSafeInteger(nextOperationalCapacity)) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationArithmeticInvalid,
      message: "Operational capacity release would exceed safe integer bounds.",
      field: "operationalCapacity",
      previousValue: organization.operationalCapacity,
      delta: consequence.operationalCapacityRelease,
    });
  }

  const unclampedExposure = assignedCharacter.personalExposure + consequence.personalExposureDelta;
  if (!Number.isSafeInteger(unclampedExposure)) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationArithmeticInvalid,
      message: "Personal exposure consequence would exceed safe integer bounds.",
      field: "personalExposure",
      previousValue: assignedCharacter.personalExposure,
      delta: consequence.personalExposureDelta,
    });
  }

  const nextPersonalExposure = Math.min(MAX_PERSONAL_EXPOSURE, unclampedExposure);
  const actualPersonalExposureDelta = nextPersonalExposure - assignedCharacter.personalExposure;
  const nextHealthState =
    consequence.healthConsequence === "injured" ? "injured" : assignedCharacter.healthState;
  const rewardTransactionResult =
    consequence.grossReward > 0
      ? recordGrossRewardTransaction({
          input,
          consequence,
          organization,
        })
      : success(undefined);
  if (!rewardTransactionResult.ok) {
    return rewardTransactionResult;
  }

  const moneyUpdatedOrganization = rewardTransactionResult.value?.organization ?? organization;
  const nextAssignedCharacter = createCharacterState({
    ...assignedCharacter,
    healthState: nextHealthState,
    assignmentState: "idle",
    personalExposure: nextPersonalExposure,
  });
  const nextOrganization = createOrganizationState({
    ...moneyUpdatedOrganization,
    operationalCapacity: nextOperationalCapacity,
  });
  const appliedConsequence = createAppliedOperationConsequences({
    operation: input.operation,
    assignedCharacterId,
    category: input.classifiedOutcome.category,
    consequence,
    ...(rewardTransactionResult.value === undefined
      ? {}
      : { grossRewardTransaction: rewardTransactionResult.value.transaction }),
    organization,
    nextOrganization,
    assignedCharacter,
    nextAssignedCharacter,
    actualPersonalExposureDelta,
  });
  const events = createConsequenceEvents({
    operation: input.operation,
    assignedCharacterId,
    category: input.classifiedOutcome.category,
    consequence,
    organization,
    nextOrganization,
    assignedCharacter,
    nextAssignedCharacter,
    actualPersonalExposureDelta,
    clamped: nextPersonalExposure !== unclampedExposure,
    moneyEvents: rewardTransactionResult.value?.events ?? [],
  });
  const nextTransactions =
    rewardTransactionResult.value?.transactions ?? freezeTransactionCollection(input.transactions);

  return success(
    Object.freeze({
      organization: nextOrganization,
      organizations: replaceById(
        input.organizations,
        "organizationId",
        nextOrganization.organizationId,
        nextOrganization,
      ),
      assignedCharacter: nextAssignedCharacter,
      characters: replaceById(
        input.characters,
        "characterId",
        nextAssignedCharacter.characterId,
        nextAssignedCharacter,
      ),
      appliedConsequence,
      appliedConsequences: Object.freeze([...input.appliedConsequences, appliedConsequence]),
      ...(rewardTransactionResult.value === undefined
        ? {}
        : { grossRewardTransaction: rewardTransactionResult.value.transaction }),
      transactions: nextTransactions,
      events,
    }),
  );
}

export function validateLocalCollectionConsequenceDefinition(
  definition: readonly LocalCollectionConsequenceDefinitionEntry[],
): DomainResult<
  readonly LocalCollectionConsequenceDefinitionEntry[],
  LocalCollectionConsequenceApplicationError
> {
  if (definition.length === 0) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceDefinitionEmpty,
      message: "Local Collection consequence definition must contain one entry per category.",
    });
  }

  const seenCategories = new Map<OperationOutcomeCategory, number>();

  for (const [index, entry] of definition.entries()) {
    if (!isOperationOutcomeCategory(entry.category)) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryUnsupported,
        message: `Local Collection consequence entry at index ${index} uses unsupported category "${String(
          entry.category,
        )}".`,
        index,
        category: String(entry.category),
      });
    }

    const firstIndex = seenCategories.get(entry.category);
    if (firstIndex !== undefined) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryDuplicated,
        message: `Local Collection consequence category "${entry.category}" is duplicated.`,
        category: entry.category,
        firstIndex,
        duplicateIndex: index,
      });
    }
    seenCategories.set(entry.category, index);

    const valueResult = validateConsequenceEntryValues(index, entry);
    if (!valueResult.ok) {
      return valueResult;
    }
  }

  for (const [index, category] of LOCAL_COLLECTION_CONSEQUENCE_CATEGORY_ORDER.entries()) {
    const entry = definition[index];
    if (entry === undefined || entry.category !== category) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryMissing,
        message: `Local Collection consequence definition must include category "${category}" at index ${index}.`,
        category,
      });
    }

    const expected = LOCAL_COLLECTION_CONSEQUENCE_CONTRACT.get(category);
    if (expected === undefined) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryMissing,
        message: `Local Collection consequence contract is missing category "${category}".`,
        category,
      });
    }

    const canonicalResult = validateCanonicalConsequenceValues(index, entry, expected);
    if (!canonicalResult.ok) {
      return canonicalResult;
    }
  }

  return success(Object.freeze(definition.map((entry) => Object.freeze({ ...entry }))));
}

function recordGrossRewardTransaction(input: {
  readonly input: ApplyLocalCollectionConsequencesInput;
  readonly consequence: LocalCollectionConsequenceDefinitionEntry;
  readonly organization: OrganizationState;
}): DomainResult<
  {
    readonly organization: OrganizationState;
    readonly transaction: MoneyTransaction;
    readonly transactions: readonly MoneyTransaction[];
    readonly events: readonly DomainEvent[];
  },
  LocalCollectionConsequenceApplicationError
> {
  const transactionId = input.input.grossRewardTransactionId;
  if (transactionId === undefined) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceApplicationMissingRewardTransactionId,
      message: `Gross reward transaction ID is required for operation "${input.input.operation.operationId}" because the Local Collection reward is non-zero.`,
      operationId: input.input.operation.operationId,
      grossReward: input.consequence.grossReward,
    });
  }

  const result = recordMoneyTransaction({
    transactionId,
    organizationId: input.organization.organizationId,
    recordedAtTick: input.input.recordedAtTick,
    amount: input.consequence.grossReward,
    category: MoneyTransactionCategory.OperationReward,
    source: Object.freeze({
      type: MoneyTransactionSourceType.OperationGrossReward,
      operationId: input.input.operation.operationId,
    }),
    organizations: input.input.organizations,
    transactions: input.input.transactions,
  });

  if (!result.ok) {
    return result;
  }

  return success(
    Object.freeze({
      organization: result.value.organization,
      transaction: result.value.transaction,
      transactions: result.value.transactions,
      events: result.value.events,
    }),
  );
}

function validateConsequenceEntryValues(
  index: number,
  entry: LocalCollectionConsequenceDefinitionEntry,
): DomainResult<undefined, LocalCollectionConsequenceApplicationError> {
  for (const field of ["grossReward", "personalExposureDelta"] as const) {
    const value = entry[field];
    if (!Number.isFinite(value) || !Number.isSafeInteger(value) || value < 0) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        message: `Local Collection consequence ${field} for "${entry.category}" must be a non-negative safe integer.`,
        index,
        category: entry.category,
        field,
        expected: "non-negative safe integer",
        actual: value,
      });
    }
  }

  if (
    !Number.isFinite(entry.operationalCapacityRelease) ||
    !Number.isSafeInteger(entry.operationalCapacityRelease) ||
    entry.operationalCapacityRelease <= 0
  ) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
      message: `Local Collection consequence operationalCapacityRelease for "${entry.category}" must be a positive safe integer.`,
      index,
      category: entry.category,
      field: "operationalCapacityRelease",
      expected: "positive safe integer",
      actual: entry.operationalCapacityRelease,
    });
  }

  if (entry.healthConsequence !== "none" && entry.healthConsequence !== "injured") {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceDefinitionHealthInvalid,
      message: `Local Collection consequence healthConsequence for "${entry.category}" must be none or injured.`,
      index,
      category: entry.category,
      expected: entry.category === OperationOutcomeCategory.CriticalFailure ? "injured" : "none",
      actual: String(entry.healthConsequence),
    });
  }

  return success(undefined);
}

function validateCanonicalConsequenceValues(
  index: number,
  entry: LocalCollectionConsequenceDefinitionEntry,
  expected: Readonly<{
    grossReward: number;
    personalExposureDelta: number;
    healthConsequence: LocalCollectionHealthConsequence;
    operationalCapacityRelease: number;
  }>,
): DomainResult<undefined, LocalCollectionConsequenceApplicationError> {
  for (const field of [
    "grossReward",
    "personalExposureDelta",
    "operationalCapacityRelease",
  ] as const) {
    if (entry[field] !== expected[field]) {
      return failure({
        code: DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        message: `Local Collection consequence ${field} for "${entry.category}" must match the accepted canonical value.`,
        index,
        category: entry.category,
        field,
        expected: expected[field],
        actual: entry[field],
      });
    }
  }

  if (entry.healthConsequence !== expected.healthConsequence) {
    return failure({
      code: DomainErrorCode.LocalCollectionConsequenceDefinitionHealthInvalid,
      message: `Local Collection consequence healthConsequence for "${entry.category}" must match the accepted canonical value.`,
      index,
      category: entry.category,
      expected: expected.healthConsequence,
      actual: entry.healthConsequence,
    });
  }

  return success(undefined);
}

function createAppliedOperationConsequences(input: {
  readonly operation: OperationState;
  readonly assignedCharacterId: CharacterId;
  readonly category: OperationOutcomeCategory;
  readonly consequence: LocalCollectionConsequenceDefinitionEntry;
  readonly grossRewardTransaction?: MoneyTransaction;
  readonly organization: OrganizationState;
  readonly nextOrganization: OrganizationState;
  readonly assignedCharacter: CharacterState;
  readonly nextAssignedCharacter: CharacterState;
  readonly actualPersonalExposureDelta: number;
}): AppliedOperationConsequences {
  return Object.freeze({
    operationId: input.operation.operationId,
    operationTemplateId: input.operation.operationTemplateId,
    organizationId: input.operation.organizationId,
    assignedCharacterId: input.assignedCharacterId,
    releasedCharacterIds: Object.freeze([input.assignedCharacterId]),
    category: input.category,
    grossReward: input.consequence.grossReward,
    ...(input.grossRewardTransaction === undefined
      ? {}
      : { grossRewardTransactionId: input.grossRewardTransaction.transactionId }),
    previousOrganizationMoney: input.organization.money,
    currentOrganizationMoney: input.nextOrganization.money,
    moneyDelta: input.consequence.grossReward,
    requestedPersonalExposureDelta: input.consequence.personalExposureDelta,
    actualPersonalExposureDelta: input.actualPersonalExposureDelta,
    previousPersonalExposure: input.assignedCharacter.personalExposure,
    currentPersonalExposure: input.nextAssignedCharacter.personalExposure,
    personalExposureClamped:
      input.actualPersonalExposureDelta !== input.consequence.personalExposureDelta,
    healthConsequence: input.consequence.healthConsequence,
    previousHealthState: input.assignedCharacter.healthState,
    currentHealthState: input.nextAssignedCharacter.healthState,
    previousAssignmentState: input.assignedCharacter.assignmentState,
    currentAssignmentState: input.nextAssignedCharacter.assignmentState,
    operationalCapacityReleased: input.consequence.operationalCapacityRelease,
    previousOperationalCapacity: input.organization.operationalCapacity,
    currentOperationalCapacity: input.nextOrganization.operationalCapacity,
  });
}

function createConsequenceEvents(input: {
  readonly operation: OperationState;
  readonly assignedCharacterId: CharacterId;
  readonly category: OperationOutcomeCategory;
  readonly consequence: LocalCollectionConsequenceDefinitionEntry;
  readonly organization: OrganizationState;
  readonly nextOrganization: OrganizationState;
  readonly assignedCharacter: CharacterState;
  readonly nextAssignedCharacter: CharacterState;
  readonly actualPersonalExposureDelta: number;
  readonly clamped: boolean;
  readonly moneyEvents: readonly DomainEvent[];
}): readonly DomainEvent[] {
  const events: DomainEvent[] = [...input.moneyEvents];

  events.push(
    createCharacterPersonalExposureChangedEvent({
      characterId: input.assignedCharacterId,
      operationId: input.operation.operationId,
      category: input.category,
      previousPersonalExposure: input.assignedCharacter.personalExposure,
      requestedDelta: input.consequence.personalExposureDelta,
      actualDelta: input.actualPersonalExposureDelta,
      currentPersonalExposure: input.nextAssignedCharacter.personalExposure,
      clamped: input.clamped,
    }),
  );

  if (input.assignedCharacter.healthState !== input.nextAssignedCharacter.healthState) {
    events.push(
      createCharacterHealthChangedEvent({
        characterId: input.assignedCharacterId,
        operationId: input.operation.operationId,
        category: input.category,
        previousHealthState: input.assignedCharacter.healthState,
        currentHealthState: input.nextAssignedCharacter.healthState,
      }),
    );
  }

  events.push(
    createCharacterAssignmentReleasedEvent({
      characterId: input.assignedCharacterId,
      operationId: input.operation.operationId,
      previousAssignmentState: input.assignedCharacter.assignmentState,
      currentAssignmentState: input.nextAssignedCharacter.assignmentState,
    }),
    createOrganizationOperationalCapacityReleasedEvent({
      organizationId: input.organization.organizationId,
      operationId: input.operation.operationId,
      previousOperationalCapacity: input.organization.operationalCapacity,
      currentOperationalCapacity: input.nextOrganization.operationalCapacity,
      delta: input.consequence.operationalCapacityRelease,
    }),
    createOperationConsequencesAppliedEvent({
      operationId: input.operation.operationId,
      operationTemplateId: input.operation.operationTemplateId,
      organizationId: input.operation.organizationId,
      targetLocationId: input.operation.targetLocationId,
      releasedCharacterIds: [input.assignedCharacterId],
      category: input.category,
      grossReward: input.consequence.grossReward,
      requestedPersonalExposureDelta: input.consequence.personalExposureDelta,
      actualPersonalExposureDelta: input.actualPersonalExposureDelta,
      healthConsequence: input.consequence.healthConsequence,
      operationalCapacityReleased: input.consequence.operationalCapacityRelease,
    }),
  );

  return Object.freeze(events);
}

function replaceById<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
  id: TItem[TKey],
  replacement: TItem,
): readonly TItem[] {
  return Object.freeze(items.map((item) => (item[key] === id ? replacement : item)));
}

function freezeTransactionCollection(
  transactions: readonly MoneyTransaction[],
): readonly MoneyTransaction[] {
  return Object.isFrozen(transactions) ? transactions : Object.freeze([...transactions]);
}
