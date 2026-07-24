import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  assertDomainEventInvariant,
  createBusinessState,
  createOrganizationState,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  transferBusinessOwnership,
  type BusinessState,
  type OrganizationId,
  type OrganizationState,
} from "./index";

const businessAId = parseBusinessId("business:corner_store");
const businessBId = parseBusinessId("business:old_row_bar");
const locationAId = parseLocationId("location:corner_store");
const organizationAId = parseOrganizationId("organization:starter_crew");
const organizationBId = parseOrganizationId("organization:rival_crew");
const leaderAId = parseCharacterId("character:leader_a");
const leaderBId = parseCharacterId("character:leader_b");

describe("business ownership transfer", () => {
  it("transfers an unowned business to an organization", () => {
    const businesses = Object.freeze([makeBusiness(), makeBusiness({ businessId: businessBId })]);
    const result = transferBusinessOwnership({
      businessId: businessAId,
      newOwnerOrganizationId: organizationAId,
      businesses,
      organizations: makeOrganizations(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(result.value.business.ownerOrganizationId).toBe(organizationAId);
    expect(result.value.businesses.map((business) => business.businessId)).toEqual([
      businessAId,
      businessBId,
    ]);
    expect(result.value.businesses[1]).toBe(businesses[1]);
    expect(businesses[0]?.ownerOrganizationId).toBeNull();
    expect(result.value.events).toEqual([
      {
        type: DomainEventType.BusinessOwnershipTransferred,
        businessId: businessAId,
        locationId: locationAId,
        previousOwnerOrganizationId: null,
        newOwnerOrganizationId: organizationAId,
      },
    ]);
    expect(() => assertDomainEventInvariant(result.value.events[0]!)).not.toThrow();
  });

  it("transfers from the expected previous owner", () => {
    const businesses = Object.freeze([makeBusiness({ ownerOrganizationId: organizationAId })]);
    const result = transferBusinessOwnership({
      businessId: businessAId,
      newOwnerOrganizationId: organizationBId,
      expectedCurrentOwnerOrganizationId: organizationAId,
      businesses,
      organizations: makeOrganizations(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.events[0]).toMatchObject({
      previousOwnerOrganizationId: organizationAId,
      newOwnerOrganizationId: organizationBId,
    });
  });

  const rejectionCases: readonly OwnershipRejectionCase[] = [
    {
      caseName: "missing business",
      overrides: { businessId: parseBusinessId("business:missing") },
      expectedCode: DomainErrorCode.BusinessOwnershipMissingBusiness,
    },
    {
      caseName: "missing organization",
      overrides: { newOwnerOrganizationId: parseOrganizationId("organization:missing") },
      expectedCode: DomainErrorCode.BusinessOwnershipMissingOrganization,
    },
    {
      caseName: "same owner",
      overrides: { ownerOrganizationId: organizationAId },
      expectedCode: DomainErrorCode.BusinessOwnershipAlreadyOwnedBySameOrganization,
    },
    {
      caseName: "conflicting owner",
      overrides: { ownerOrganizationId: organizationBId },
      expectedCode: DomainErrorCode.BusinessOwnershipConflictingCurrentOwner,
    },
  ];

  it.each(rejectionCases)(
    "rejects $caseName without partial state",
    ({ overrides, expectedCode }) => {
      const businesses = Object.freeze([
        makeBusiness({ ownerOrganizationId: overrides.ownerOrganizationId ?? null }),
      ]);
      const result = transferBusinessOwnership({
        businessId: overrides.businessId ?? businessAId,
        newOwnerOrganizationId: overrides.newOwnerOrganizationId ?? organizationAId,
        businesses,
        organizations: makeOrganizations(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(expectedCode);
      expect(businesses[0]?.ownerOrganizationId).toBe(overrides.ownerOrganizationId ?? null);
    },
  );
});

interface OwnershipRejectionCase {
  readonly caseName: string;
  readonly overrides: {
    readonly businessId?: typeof businessAId;
    readonly newOwnerOrganizationId?: OrganizationId;
    readonly ownerOrganizationId?: OrganizationId;
  };
  readonly expectedCode: DomainErrorCode;
}

function makeBusiness(overrides: Partial<BusinessState> = {}): BusinessState {
  return createBusinessState({
    businessId: businessAId,
    locationId: locationAId,
    ownerOrganizationId: null,
    ...overrides,
  });
}

function makeOrganizations(): readonly OrganizationState[] {
  return Object.freeze([
    createOrganizationState({
      organizationId: organizationAId,
      displayName: "Starter Crew",
      leaderCharacterId: leaderAId,
      memberCharacterIds: [leaderAId],
      money: 100,
      operationalCapacity: 2,
    }),
    createOrganizationState({
      organizationId: organizationBId,
      displayName: "Rival Crew",
      leaderCharacterId: leaderBId,
      memberCharacterIds: [leaderBId],
      money: 100,
      operationalCapacity: 2,
    }),
  ]);
}
