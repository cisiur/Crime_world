import { describe, expect, it } from "vitest";

import {
  OperationAvailabilityReason,
  createBusinessState,
  createCharacterState,
  createOrganizationState,
  evaluateOperationAvailability,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOperationTemplateId,
  parseOrganizationId,
  type BusinessState,
  type CharacterId,
  type CharacterState,
  type EvaluateOperationAvailabilityInput,
  type LocationState,
  type OperationAvailabilityLocationDefinitionInput,
  type OperationAvailabilityTemplateInput,
  type OrganizationState,
} from "./index";

describe("operation availability", () => {
  it("returns available for valid Local Collection prerequisites", () => {
    const result = evaluateOperationAvailability(createValidAvailabilityInput());

    expect(result).toEqual({
      available: true,
      reasons: [],
    });
  });

  it("rejects zero assigned characters with an invalid count reason", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toEqual([OperationAvailabilityReason.InvalidAssignedCharacterCount]);
  });

  it("allows exactly one valid assigned character to pass the count prerequisite", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [BOSS_ID],
      }),
    );

    expect(result.available).toBe(true);
    expect(result.reasons).not.toContain(OperationAvailabilityReason.InvalidAssignedCharacterCount);
  });

  it("rejects multiple valid available organization members", () => {
    const secondCharacterId = parseCharacterId("character:second_member");
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [BOSS_ID, secondCharacterId],
        organizations: [
          createStarterOrganization({
            memberCharacterIds: [BOSS_ID, secondCharacterId],
          }),
        ],
        characters: [
          createAvailableCharacter(BOSS_ID),
          createAvailableCharacter(secondCharacterId),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toEqual([OperationAvailabilityReason.InvalidAssignedCharacterCount]);
  });

  it("reports the invalid assigned character count once for many assigned characters", () => {
    const secondCharacterId = parseCharacterId("character:second_member");
    const thirdCharacterId = parseCharacterId("character:third_member");
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [BOSS_ID, secondCharacterId, thirdCharacterId],
        organizations: [
          createStarterOrganization({
            memberCharacterIds: [BOSS_ID, secondCharacterId, thirdCharacterId],
          }),
        ],
        characters: [
          createAvailableCharacter(BOSS_ID),
          createAvailableCharacter(secondCharacterId),
          createAvailableCharacter(thirdCharacterId),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(
      result.reasons.filter(
        (reason) => reason === OperationAvailabilityReason.InvalidAssignedCharacterCount,
      ),
    ).toHaveLength(1);
  });

  it("rejects insufficient organization money", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        organizations: [createStarterOrganization({ money: 19 })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.InsufficientMoney);
  });

  it("rejects insufficient operational capacity", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        organizations: [createStarterOrganization({ operationalCapacity: 0 })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.InsufficientOperationalCapacity);
  });

  it("rejects missing organizations", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        organizations: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.OrganizationMissing);
  });

  it("rejects missing characters", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [parseCharacterId("character:missing")],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterMissing);
  });

  it("rejects characters who are not organization members", () => {
    const outsiderId = parseCharacterId("character:outsider");
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [outsiderId],
        characters: [createAvailableCharacter(outsiderId)],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterNotMember);
  });

  it("rejects unavailable characters through the derived availability rule", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        characters: [createAvailableCharacter(BOSS_ID, { assignmentState: "assigned" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterUnavailable);
  });

  it("rejects injured characters", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        characters: [createAvailableCharacter(BOSS_ID, { healthState: "injured" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterUnavailable);
  });

  it("rejects detained or otherwise non-free characters", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        characters: [createAvailableCharacter(BOSS_ID, { legalState: "detained" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterUnavailable);
  });

  it("rejects assigned or busy characters", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        characters: [createAvailableCharacter(BOSS_ID, { assignmentState: "assigned" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.CharacterUnavailable);
  });

  it("rejects missing runtime locations", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        locationStates: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.InvalidTarget);
  });

  it("rejects missing authored locations", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        locationDefinitions: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.InvalidTarget);
  });

  it("rejects invalid target kinds", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        locationDefinitions: [createLocationDefinition({ kind: "hideout" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.InvalidTargetKind);
  });

  it("rejects explicit target ID mismatches", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        operationTemplates: [
          createLocalCollectionTemplate({
            allowedTargetIds: [parseLocationId("location:small_garage")],
          }),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.TemplateMismatch);
  });

  it("rejects missing operation templates", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        operationTemplates: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.TemplateMismatch);
  });

  it("rejects mismatched operation templates", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        operationTemplates: [
          createLocalCollectionTemplate({
            id: parseOperationTemplateId("operation-template:other"),
          }),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.TemplateMismatch);
  });

  it("rejects malformed operation templates", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        operationTemplates: [
          createLocalCollectionTemplate({
            startCost: -1,
          }),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.TemplateMismatch);
  });

  it("rejects targets already owned by the acting organization", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        locationStates: [
          createLocationState({
            ownerOrganizationId: STARTER_ORGANIZATION_ID,
          }),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.TargetAlreadyOwned);
  });

  it("rejects businesses already owned by the acting organization", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        businessStates: [
          createCornerStoreBusiness({ ownerOrganizationId: STARTER_ORGANIZATION_ID }),
        ],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toContain(OperationAvailabilityReason.BusinessAlreadyOwned);
  });

  it("accumulates multiple failures", () => {
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [parseCharacterId("character:missing")],
        organizations: [createStarterOrganization({ money: 0, operationalCapacity: 0 })],
        locationStates: [],
        locationDefinitions: [],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toEqual([
      OperationAvailabilityReason.InsufficientMoney,
      OperationAvailabilityReason.InsufficientOperationalCapacity,
      OperationAvailabilityReason.CharacterMissing,
      OperationAvailabilityReason.InvalidTarget,
    ]);
  });

  it("accumulates independent failures in deterministic order with invalid assigned count", () => {
    const outsiderId = parseCharacterId("character:outsider");
    const result = evaluateOperationAvailability(
      createValidAvailabilityInput({
        assignedCharacterIds: [outsiderId, parseCharacterId("character:missing")],
        organizations: [createStarterOrganization({ money: 0 })],
        characters: [createAvailableCharacter(outsiderId)],
        locationDefinitions: [createLocationDefinition({ kind: "hideout" })],
      }),
    );

    expect(result.available).toBe(false);
    expect(result.reasons).toEqual([
      OperationAvailabilityReason.InsufficientMoney,
      OperationAvailabilityReason.InvalidAssignedCharacterCount,
      OperationAvailabilityReason.CharacterNotMember,
      OperationAvailabilityReason.CharacterMissing,
      OperationAvailabilityReason.InvalidTargetKind,
    ]);
  });

  it("does not mutate inputs", () => {
    const input = createValidAvailabilityInput();
    const snapshot = JSON.stringify(input);

    evaluateOperationAvailability(input);

    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("returns identical results for repeated evaluation", () => {
    const input = createValidAvailabilityInput({
      organizations: [createStarterOrganization({ money: 0, operationalCapacity: 0 })],
    });

    expect(evaluateOperationAvailability(input)).toEqual(evaluateOperationAvailability(input));
  });
});

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const CORNER_STORE_LOCATION_ID = parseLocationId("location:corner_store");
const CORNER_STORE_BUSINESS_ID = parseBusinessId("business:corner_store");
const LOCAL_COLLECTION_TEMPLATE_ID = parseOperationTemplateId(
  "operation-template:local_collection",
);

function createValidAvailabilityInput(
  overrides: Partial<EvaluateOperationAvailabilityInput> = {},
): EvaluateOperationAvailabilityInput {
  return {
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId: CORNER_STORE_LOCATION_ID,
    assignedCharacterIds: [BOSS_ID],
    operationTemplates: [createLocalCollectionTemplate()],
    organizations: [createStarterOrganization()],
    characters: [createAvailableCharacter(BOSS_ID)],
    locationStates: [createLocationState()],
    locationDefinitions: [createLocationDefinition()],
    businessStates: [createCornerStoreBusiness()],
    ...overrides,
  };
}

function createLocalCollectionTemplate(
  overrides: Partial<OperationAvailabilityTemplateInput> = {},
): OperationAvailabilityTemplateInput {
  return {
    id: LOCAL_COLLECTION_TEMPLATE_ID,
    allowedTargetKinds: ["shop-or-service"],
    allowedTargetIds: [CORNER_STORE_LOCATION_ID],
    startCost: 20,
    operationalCapacityCost: 1,
    ...overrides,
  };
}

function createStarterOrganization(
  overrides: Partial<Parameters<typeof createOrganizationState>[0]> = {},
): OrganizationState {
  return createOrganizationState({
    organizationId: STARTER_ORGANIZATION_ID,
    displayName: "Starter Crew",
    leaderCharacterId: BOSS_ID,
    memberCharacterIds: [BOSS_ID],
    money: 100,
    operationalCapacity: 1,
    ...overrides,
  });
}

function createAvailableCharacter(
  characterId: CharacterId,
  overrides: Partial<Parameters<typeof createCharacterState>[0]> = {},
): CharacterState {
  return createCharacterState({
    characterId,
    displayName: "Mara Voss",
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 0,
    ...overrides,
  });
}

function createLocationState(overrides: Partial<LocationState> = {}): LocationState {
  return {
    locationId: CORNER_STORE_LOCATION_ID,
    enabled: true,
    ownerOrganizationId: null,
    businessId: CORNER_STORE_BUSINESS_ID,
    ...overrides,
  };
}

function createLocationDefinition(
  overrides: Partial<OperationAvailabilityLocationDefinitionInput> = {},
): OperationAvailabilityLocationDefinitionInput {
  return {
    id: CORNER_STORE_LOCATION_ID,
    kind: "shop-or-service",
    ...overrides,
  };
}

function createCornerStoreBusiness(overrides: Partial<BusinessState> = {}): BusinessState {
  return createBusinessState({
    businessId: CORNER_STORE_BUSINESS_ID,
    locationId: CORNER_STORE_LOCATION_ID,
    ownerOrganizationId: null,
    ...overrides,
  });
}
