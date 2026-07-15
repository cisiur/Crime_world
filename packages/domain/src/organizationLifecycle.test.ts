import { describe, expect, it } from "vitest";

import {
  createBusinessState,
  createCharacterState,
  createCityState,
  createOrganizationState,
  createPlayerOrganization,
  isCharacterAvailable,
  parseBusinessId,
  parseCharacterId,
  parseCityId,
  parseDistrictId,
  parseLocationId,
  parseOrganizationId,
  parseRouteId,
  type BusinessState,
  type CharacterId,
  type CharacterState,
  type CityState,
  type CreateCharacterStateInput,
  type LocationState,
  type OrganizationState,
} from "./index";

describe("organization lifecycle integration", () => {
  it("keeps organization, business, city, and character references explicit", () => {
    const leader = createTestCharacter({
      characterId: parseCharacterId("character:boss_001"),
      displayName: "Mara Voss",
    });
    const organization = createTestOrganization({
      leaderCharacterId: leader.characterId,
      memberCharacterIds: [leader.characterId],
    });
    const business = createTestBusiness({
      ownerOrganizationId: organization.organizationId,
    });
    const city = createTestCityState();
    const ownedLocation = withOwnershipReferences(city.locationStates[0]!, {
      business,
      organization,
    });

    expect(organization.memberCharacterIds).toContain(organization.leaderCharacterId);
    expect(business.ownerOrganizationId).toBe(organization.organizationId);
    expect(ownedLocation.businessId).toBe(business.businessId);
    expect(ownedLocation.ownerOrganizationId).toBe(organization.organizationId);
  });

  it("creates a player organization with exactly one initial member", () => {
    const leaderCharacterId = parseCharacterId("character:player_boss");
    const organization = createPlayerOrganization({
      organizationId: parseOrganizationId("organization:player_crew"),
      displayName: "Player Crew",
      leaderCharacterId,
      money: 100,
      operationalCapacity: 1,
    });

    expect(organization.leaderCharacterId).toBe(leaderCharacterId);
    expect(organization.memberCharacterIds).toEqual([leaderCharacterId]);
    expect(organization.memberCharacterIds).toHaveLength(1);
  });

  it("derives character availability inside an organization scenario", () => {
    const idleMember = createTestCharacter({
      characterId: parseCharacterId("character:idle_member"),
      displayName: "Idle Member",
      assignmentState: "idle",
    });
    const assignedMember = createTestCharacter({
      characterId: parseCharacterId("character:assigned_member"),
      displayName: "Assigned Member",
      assignmentState: "assigned",
    });
    const organization = createTestOrganization({
      leaderCharacterId: idleMember.characterId,
      memberCharacterIds: [idleMember.characterId, assignedMember.characterId],
    });

    expect(organization.memberCharacterIds).toEqual([
      idleMember.characterId,
      assignedMember.characterId,
    ]);
    expect(isCharacterAvailable(idleMember)).toBe(true);
    expect(isCharacterAvailable(assignedMember)).toBe(false);
  });

  it("represents unowned and owned business and location references explicitly", () => {
    const organizationId = parseOrganizationId("organization:starter_crew");
    const city = createTestCityState();
    const unownedBusiness = createTestBusiness({
      businessId: parseBusinessId("business:neutral_bar"),
      locationId: parseLocationId("location:neutral_bar"),
      ownerOrganizationId: null,
    });
    const ownedBusiness = createTestBusiness({
      businessId: parseBusinessId("business:owned_garage"),
      locationId: parseLocationId("location:owned_garage"),
      ownerOrganizationId: organizationId,
    });
    const neutralLocation = city.locationStates[0]!;
    const ownedLocation = withOwnershipReferences(city.locationStates[1]!, {
      business: ownedBusiness,
      organization: { organizationId },
    });

    expect(unownedBusiness.ownerOrganizationId).toBeNull();
    expect(ownedBusiness.ownerOrganizationId).toBe(organizationId);
    expect(neutralLocation.ownerOrganizationId).toBeNull();
    expect(neutralLocation.businessId).toBeNull();
    expect(ownedLocation.ownerOrganizationId).toBe(organizationId);
    expect(ownedLocation.businessId).toBe(ownedBusiness.businessId);
  });
});

function createTestCharacter(
  overrides: Partial<CreateCharacterStateInput> & {
    readonly characterId: CharacterId;
    readonly displayName: string;
  },
): CharacterState {
  const { characterId, displayName, ...optionalOverrides } = overrides;

  return createCharacterState({
    characterId,
    displayName,
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: overrides.assignmentState ?? "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 0,
    ...optionalOverrides,
  });
}

function createTestOrganization(
  overrides: Pick<OrganizationState, "leaderCharacterId" | "memberCharacterIds">,
): OrganizationState {
  return createOrganizationState({
    organizationId: parseOrganizationId("organization:starter_crew"),
    displayName: "Starter Crew",
    leaderCharacterId: overrides.leaderCharacterId,
    memberCharacterIds: overrides.memberCharacterIds,
    money: 250,
    operationalCapacity: 2,
  });
}

function createTestBusiness(overrides: Partial<BusinessState> = {}): BusinessState {
  return createBusinessState({
    businessId: parseBusinessId("business:old_row_bar"),
    locationId: parseLocationId("location:old_row_bar"),
    ownerOrganizationId: parseOrganizationId("organization:starter_crew"),
    ...overrides,
  });
}

function createTestCityState(): CityState {
  const oldRowDistrictId = parseDistrictId("district:old_row");
  const freightYardDistrictId = parseDistrictId("district:freight_yard");

  return createCityState({
    id: parseCityId("city:test_harbor"),
    districts: [{ id: oldRowDistrictId }, { id: freightYardDistrictId }],
    locations: [
      { id: parseLocationId("location:neutral_bar") },
      { id: parseLocationId("location:owned_garage") },
    ],
    routes: [{ id: parseRouteId("route:old_row-freight_yard") }],
  });
}

function withOwnershipReferences(
  location: LocationState,
  references: {
    readonly business: Pick<BusinessState, "businessId">;
    readonly organization: Pick<OrganizationState, "organizationId">;
  },
): LocationState {
  return {
    ...location,
    businessId: references.business.businessId,
    ownerOrganizationId: references.organization.organizationId,
  };
}
