import { describe, expect, it } from "vitest";

import {
  MAX_DISTRICT_EXPOSURE,
  MAX_DISTRICT_POLICE_PRESENCE_MODIFIER,
  MAX_DISTRICT_TENSION,
  MAX_EFFECTIVE_DISTRICT_POLICE_PRESENCE,
  MIN_DISTRICT_EXPOSURE,
  MIN_DISTRICT_POLICE_PRESENCE_MODIFIER,
  MIN_DISTRICT_TENSION,
  MIN_EFFECTIVE_DISTRICT_POLICE_PRESENCE,
  DomainErrorCode,
  deriveDistrictProperties,
  parseDistrictId,
  type DeriveDistrictPropertiesResult,
  type DistrictBaselineProfileInput,
  type DistrictProperties,
  type DistrictPropertiesDefinitionInput,
  type DistrictPropertiesStateInput,
} from "../src/index";

describe("district properties", () => {
  it("derives a runtime snapshot from authored baseline and runtime state", () => {
    const districtDefinition = createDistrictDefinition({
      lawEnforcementPresence: 2,
    });
    const districtState = createDistrictState({
      currentTension: 35,
      currentExposure: 12,
      currentPolicePresenceModifier: 1,
    });

    const districtProperties = expectDistrictPropertiesSuccess(
      deriveDistrictProperties(districtDefinition, districtState),
    );

    expect(districtProperties).toEqual({
      districtId: districtState.districtId,
      baselineProfile: districtDefinition.baselineProfile,
      currentTension: 35,
      currentExposure: 12,
      currentPolicePresenceModifier: 1,
      baselinePolicePresence: 2,
      effectivePolicePresence: 3,
    });
  });

  it("preserves every authored baseline value in a copied snapshot", () => {
    const districtDefinition = createDistrictDefinition({
      wealth: 4,
      lawEnforcementPresence: 3,
      civilianVisibility: 2,
      logisticsValue: 1,
      criminalOpportunity: 4,
      recruitmentOpportunity: 0,
      politicalSensitivity: 3,
      rivalPresence: 2,
    });

    const districtProperties = expectDistrictPropertiesSuccess(
      deriveDistrictProperties(districtDefinition, createDistrictState()),
    );

    expect(districtProperties.baselineProfile).toEqual(districtDefinition.baselineProfile);
    expect(districtProperties.baselineProfile).not.toBe(districtDefinition.baselineProfile);
  });

  it("does not mutate authored baseline or runtime state inputs", () => {
    const districtDefinition = createDistrictDefinition({
      lawEnforcementPresence: 1,
    });
    const districtState = createDistrictState({
      currentTension: 9,
      currentExposure: 8,
      currentPolicePresenceModifier: 2,
    });
    const originalDistrictDefinition = {
      ...districtDefinition,
      baselineProfile: { ...districtDefinition.baselineProfile },
    };
    const originalDistrictState = { ...districtState };

    deriveDistrictProperties(districtDefinition, districtState);

    expect(districtDefinition).toEqual(originalDistrictDefinition);
    expect(districtState).toEqual(originalDistrictState);
  });

  it("clamps tension to the supported runtime range", () => {
    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition(),
          createDistrictState({ currentTension: MIN_DISTRICT_TENSION - 1 }),
        ),
      ).currentTension,
    ).toBe(MIN_DISTRICT_TENSION);

    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition(),
          createDistrictState({ currentTension: MAX_DISTRICT_TENSION + 1 }),
        ),
      ).currentTension,
    ).toBe(MAX_DISTRICT_TENSION);
  });

  it("clamps exposure to the supported runtime range", () => {
    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition(),
          createDistrictState({ currentExposure: MIN_DISTRICT_EXPOSURE - 1 }),
        ),
      ).currentExposure,
    ).toBe(MIN_DISTRICT_EXPOSURE);

    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition(),
          createDistrictState({ currentExposure: MAX_DISTRICT_EXPOSURE + 1 }),
        ),
      ).currentExposure,
    ).toBe(MAX_DISTRICT_EXPOSURE);
  });

  it("clamps police modifier below the supported range", () => {
    const districtProperties = expectDistrictPropertiesSuccess(
      deriveDistrictProperties(
        createDistrictDefinition({ lawEnforcementPresence: 2 }),
        createDistrictState({
          currentPolicePresenceModifier: MIN_DISTRICT_POLICE_PRESENCE_MODIFIER - 1,
        }),
      ),
    );

    expect(districtProperties.currentPolicePresenceModifier).toBe(
      MIN_DISTRICT_POLICE_PRESENCE_MODIFIER,
    );
    expect(districtProperties.effectivePolicePresence).toBe(MIN_EFFECTIVE_DISTRICT_POLICE_PRESENCE);
  });

  it("clamps police modifier above the supported range", () => {
    const districtProperties = expectDistrictPropertiesSuccess(
      deriveDistrictProperties(
        createDistrictDefinition({ lawEnforcementPresence: 2 }),
        createDistrictState({
          currentPolicePresenceModifier: MAX_DISTRICT_POLICE_PRESENCE_MODIFIER + 1,
        }),
      ),
    );

    expect(districtProperties.currentPolicePresenceModifier).toBe(
      MAX_DISTRICT_POLICE_PRESENCE_MODIFIER,
    );
    expect(districtProperties.effectivePolicePresence).toBe(MAX_EFFECTIVE_DISTRICT_POLICE_PRESENCE);
  });

  it("clamps effective police presence to minimum and maximum bounds", () => {
    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition({ lawEnforcementPresence: 0 }),
          createDistrictState({
            currentPolicePresenceModifier: MIN_DISTRICT_POLICE_PRESENCE_MODIFIER,
          }),
        ),
      ).effectivePolicePresence,
    ).toBe(MIN_EFFECTIVE_DISTRICT_POLICE_PRESENCE);

    expect(
      expectDistrictPropertiesSuccess(
        deriveDistrictProperties(
          createDistrictDefinition({ lawEnforcementPresence: 4 }),
          createDistrictState({
            currentPolicePresenceModifier: MAX_DISTRICT_POLICE_PRESENCE_MODIFIER,
          }),
        ),
      ).effectivePolicePresence,
    ).toBe(MAX_EFFECTIVE_DISTRICT_POLICE_PRESENCE);
  });

  it("is deterministic for repeated calls", () => {
    const districtDefinition = createDistrictDefinition({
      lawEnforcementPresence: 3,
      criminalOpportunity: 4,
    });
    const districtState = createDistrictState({
      currentTension: 14,
      currentExposure: 23,
      currentPolicePresenceModifier: -1,
    });

    expect(deriveDistrictProperties(districtDefinition, districtState)).toEqual(
      deriveDistrictProperties(districtDefinition, districtState),
    );
  });

  it("returns success for matching district IDs", () => {
    const result = deriveDistrictProperties(createDistrictDefinition(), createDistrictState());

    expect(result.ok).toBe(true);
    expect(result).toHaveProperty("value");
  });

  it("returns failure for mismatched authored and runtime district IDs", () => {
    const authoredDistrictId = parseDistrictId("district:authored_properties");
    const runtimeDistrictId = parseDistrictId("district:runtime_properties");
    const result = deriveDistrictProperties(
      createDistrictDefinition({}, authoredDistrictId),
      createDistrictState({ districtId: runtimeDistrictId }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.DistrictPropertyInputMismatch,
        authoredDistrictId,
        runtimeDistrictId,
        message: `Cannot derive district properties for authored district "${authoredDistrictId}" with runtime state "${runtimeDistrictId}".`,
      },
    });
    expect(result).not.toHaveProperty("value");
  });
});

function createDistrictDefinition(
  baselineOverrides: Partial<DistrictBaselineProfileInput> = {},
  id = parseDistrictId("district:test_properties"),
): DistrictPropertiesDefinitionInput {
  return {
    id,
    baselineProfile: {
      wealth: 1,
      lawEnforcementPresence: 1,
      civilianVisibility: 1,
      logisticsValue: 1,
      criminalOpportunity: 1,
      recruitmentOpportunity: 1,
      politicalSensitivity: 1,
      rivalPresence: 1,
      ...baselineOverrides,
    },
  };
}

function createDistrictState(
  overrides: Partial<DistrictPropertiesStateInput> = {},
): DistrictPropertiesStateInput {
  return {
    districtId: parseDistrictId("district:test_properties"),
    currentTension: 0,
    currentExposure: 0,
    currentPolicePresenceModifier: 0,
    ...overrides,
  };
}

function expectDistrictPropertiesSuccess(
  result: DeriveDistrictPropertiesResult,
): DistrictProperties {
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}
