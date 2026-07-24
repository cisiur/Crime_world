import { describe, expect, it } from "vitest";

import {
  canonicalMvpBusinessLocationArchetypeDefinitions,
  canonicalMvpLocationDefinitions,
  getBusinessLocationArchetypeForLocationKind,
  validateBusinessLocationArchetypeDefinitions,
  type BusinessLocationArchetypeDefinition,
  type BusinessLocationArchetypeValidationErrorCode,
  type LocationKind,
} from "./index";

describe("business location archetype definitions", () => {
  it("exports exactly six immutable canonical definitions", () => {
    expect(canonicalMvpBusinessLocationArchetypeDefinitions).toHaveLength(6);
    expect(Object.isFrozen(canonicalMvpBusinessLocationArchetypeDefinitions)).toBe(true);

    for (const definition of canonicalMvpBusinessLocationArchetypeDefinitions) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.roles)).toBe(true);
    }

    expect(
      validateBusinessLocationArchetypeDefinitions(
        canonicalMvpBusinessLocationArchetypeDefinitions,
      ),
    ).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("defines the exact accepted IDs and LocationKind mappings", () => {
    expect(
      canonicalMvpBusinessLocationArchetypeDefinitions.map((definition) => [
        definition.id,
        definition.locationKind,
      ]),
    ).toEqual([
      ["business-location-archetype:hideout", "hideout"],
      ["business-location-archetype:safehouse", "safehouse"],
      ["business-location-archetype:small_shop_service", "shop-or-service"],
      ["business-location-archetype:nightlife_venue", "nightlife-venue"],
      ["business-location-archetype:warehouse_storage", "warehouse-or-storage"],
      ["business-location-archetype:workshop_transport", "workshop-or-transport"],
    ]);
  });

  it("defines the exact accepted roles and relative profiles", () => {
    expect(canonicalMvpBusinessLocationArchetypeDefinitions).toEqual([
      {
        id: "business-location-archetype:hideout",
        locationKind: "hideout",
        displayName: "Hideout",
        classification: "strategic-location",
        roles: ["organization-base", "operational-location", "district-presence"],
        incomePotential: "none",
        upkeepBurden: "medium",
        visibility: "low",
        vulnerability: "high",
        operationalUtility: "high",
      },
      {
        id: "business-location-archetype:safehouse",
        locationKind: "safehouse",
        displayName: "Safehouse",
        classification: "strategic-location",
        roles: ["recovery", "operational-location"],
        incomePotential: "none",
        upkeepBurden: "low",
        visibility: "low",
        vulnerability: "medium",
        operationalUtility: "medium",
      },
      {
        id: "business-location-archetype:small_shop_service",
        locationKind: "shop-or-service",
        displayName: "Small Shop or Service",
        classification: "business",
        roles: ["income-source", "legal-cover", "district-presence"],
        incomePotential: "low",
        upkeepBurden: "low",
        visibility: "medium",
        vulnerability: "medium",
        operationalUtility: "low",
      },
      {
        id: "business-location-archetype:nightlife_venue",
        locationKind: "nightlife-venue",
        displayName: "Restaurant or Nightlife Venue",
        classification: "business",
        roles: ["income-source", "information-access", "legal-cover", "district-presence"],
        incomePotential: "high",
        upkeepBurden: "high",
        visibility: "high",
        vulnerability: "high",
        operationalUtility: "medium",
      },
      {
        id: "business-location-archetype:warehouse_storage",
        locationKind: "warehouse-or-storage",
        displayName: "Warehouse or Storage Site",
        classification: "strategic-location",
        roles: ["storage", "logistics", "operational-location"],
        incomePotential: "none",
        upkeepBurden: "medium",
        visibility: "medium",
        vulnerability: "high",
        operationalUtility: "high",
      },
      {
        id: "business-location-archetype:workshop_transport",
        locationKind: "workshop-or-transport",
        displayName: "Workshop or Transport Business",
        classification: "business",
        roles: ["logistics", "operational-location", "income-source"],
        incomePotential: "medium",
        upkeepBurden: "high",
        visibility: "medium",
        vulnerability: "medium",
        operationalUtility: "high",
      },
    ]);
  });

  it.each([
    ["hideout", "business-location-archetype:hideout"],
    ["safehouse", "business-location-archetype:safehouse"],
    ["shop-or-service", "business-location-archetype:small_shop_service"],
    ["nightlife-venue", "business-location-archetype:nightlife_venue"],
    ["warehouse-or-storage", "business-location-archetype:warehouse_storage"],
    ["workshop-or-transport", "business-location-archetype:workshop_transport"],
  ] as const)("resolves %s deterministically", (locationKind, expectedArchetypeId) => {
    expect(getBusinessLocationArchetypeForLocationKind(locationKind)?.id).toBe(expectedArchetypeId);
    expect(getBusinessLocationArchetypeForLocationKind(locationKind)).toBe(
      getBusinessLocationArchetypeForLocationKind(locationKind),
    );
  });

  it.each(["police-institution", "medical-or-recovery", "municipal-or-legal", "landmark"] as const)(
    "returns null for non-business location kind %s",
    (locationKind) => {
      expect(getBusinessLocationArchetypeForLocationKind(locationKind)).toBeNull();
    },
  );

  it.each([
    [
      "duplicate ID",
      [
        { ...definitionAt(0) },
        { ...definitionAt(1), id: definitionAt(0).id },
        definitionAt(2),
        definitionAt(3),
        definitionAt(4),
        definitionAt(5),
      ],
      "DUPLICATE_ARCHETYPE_ID",
    ],
    [
      "duplicate kind",
      [
        definitionAt(0),
        { ...definitionAt(1), locationKind: definitionAt(0).locationKind },
        definitionAt(2),
        definitionAt(3),
        definitionAt(4),
        definitionAt(5),
      ],
      "DUPLICATE_LOCATION_KIND",
    ],
    [
      "missing required archetype",
      [definitionAt(0), definitionAt(1), definitionAt(2), definitionAt(3), definitionAt(4)],
      "MISSING_REQUIRED_ARCHETYPE",
    ],
    [
      "unsupported kind",
      [
        { ...definitionAt(0), locationKind: "landmark" },
        ...canonicalMvpBusinessLocationArchetypeDefinitions.slice(1),
      ],
      "UNSUPPORTED_LOCATION_KIND",
    ],
    [
      "empty roles",
      [
        { ...definitionAt(0), roles: [] },
        ...canonicalMvpBusinessLocationArchetypeDefinitions.slice(1),
      ],
      "EMPTY_ROLES",
    ],
    [
      "invalid profile value",
      [
        { ...definitionAt(0), visibility: "critical" },
        ...canonicalMvpBusinessLocationArchetypeDefinitions.slice(1),
      ],
      "INVALID_PROFILE_VALUE",
    ],
    [
      "hideout income role",
      [
        { ...definitionAt(0), roles: [...definitionAt(0).roles, "income-source"] },
        ...canonicalMvpBusinessLocationArchetypeDefinitions.slice(1),
      ],
      "HIDEOUT_SAFEHOUSE_INCOME_ROLE",
    ],
    [
      "safehouse income potential",
      [
        definitionAt(0),
        { ...definitionAt(1), incomePotential: "low" },
        ...canonicalMvpBusinessLocationArchetypeDefinitions.slice(2),
      ],
      "HIDEOUT_SAFEHOUSE_INCOME_POTENTIAL",
    ],
    [
      "business missing income role",
      [
        definitionAt(0),
        definitionAt(1),
        { ...definitionAt(2), roles: ["legal-cover", "district-presence"] },
        definitionAt(3),
        definitionAt(4),
        definitionAt(5),
      ],
      "BUSINESS_MISSING_INCOME_ROLE",
    ],
    [
      "wrong collection size",
      [...canonicalMvpBusinessLocationArchetypeDefinitions, definitionAt(0)],
      "CANONICAL_COLLECTION_SIZE",
    ],
  ] as const)("rejects %s", (_caseName, definitions, expectedCode) => {
    expectValidationCode(
      definitions as readonly BusinessLocationArchetypeDefinition[],
      expectedCode,
    );
  });

  it("evaluates every canonical MVP location without throwing", () => {
    expect(canonicalMvpLocationDefinitions).toHaveLength(29);

    const results = canonicalMvpLocationDefinitions.map((location) =>
      getBusinessLocationArchetypeForLocationKind(location.kind),
    );

    expect(results).toHaveLength(29);
  });

  it("resolves supported canonical location kinds to exactly one archetype", () => {
    for (const location of canonicalMvpLocationDefinitions) {
      const archetype = getBusinessLocationArchetypeForLocationKind(location.kind);

      if (isSupportedKind(location.kind)) {
        expect(archetype).not.toBeNull();
        expect(archetype?.locationKind).toBe(location.kind);
      }
    }
  });

  it("resolves institutional canonical locations and landmarks to null", () => {
    const institutionalAndLandmarkLocations = canonicalMvpLocationDefinitions.filter(
      (location) => !isSupportedKind(location.kind),
    );

    expect(institutionalAndLandmarkLocations.length).toBeGreaterThan(0);
    expect(
      institutionalAndLandmarkLocations.every(
        (location) => getBusinessLocationArchetypeForLocationKind(location.kind) === null,
      ),
    ).toBe(true);
  });

  it("bases the mapping on LocationKind rather than location names", () => {
    const misleadingNameKind: LocationKind = "shop-or-service";

    expect(getBusinessLocationArchetypeForLocationKind(misleadingNameKind)?.id).toBe(
      "business-location-archetype:small_shop_service",
    );
  });

  it("does not mutate input collections during validation", () => {
    const mutableCopy = canonicalMvpBusinessLocationArchetypeDefinitions.map((definition) => ({
      ...definition,
      roles: [...definition.roles],
    }));
    const beforeValidation = JSON.stringify(mutableCopy);

    validateBusinessLocationArchetypeDefinitions(mutableCopy);

    expect(JSON.stringify(mutableCopy)).toBe(beforeValidation);
  });

  it("leaves canonical MVP locations unchanged when resolving archetypes", () => {
    const beforeResolution = JSON.stringify(canonicalMvpLocationDefinitions);

    for (const location of canonicalMvpLocationDefinitions) {
      getBusinessLocationArchetypeForLocationKind(location.kind);
    }

    expect(JSON.stringify(canonicalMvpLocationDefinitions)).toBe(beforeResolution);
  });
});

function definitionAt(index: number): BusinessLocationArchetypeDefinition {
  const definition = canonicalMvpBusinessLocationArchetypeDefinitions[index];

  if (definition === undefined) {
    throw new Error(`Missing canonical archetype definition at index ${index}.`);
  }

  return definition;
}

function expectValidationCode(
  definitions: readonly BusinessLocationArchetypeDefinition[],
  expectedCode: BusinessLocationArchetypeValidationErrorCode,
): void {
  const result = validateBusinessLocationArchetypeDefinitions(definitions);

  expect(result.valid).toBe(false);
  expect(result.errors.map((error) => error.code)).toContain(expectedCode);
}

function isSupportedKind(locationKind: LocationKind): boolean {
  return (
    locationKind === "hideout" ||
    locationKind === "safehouse" ||
    locationKind === "shop-or-service" ||
    locationKind === "nightlife-venue" ||
    locationKind === "warehouse-or-storage" ||
    locationKind === "workshop-or-transport"
  );
}
