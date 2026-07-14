import type { DistrictId } from "./entityIds";

export const MIN_DISTRICT_TENSION = 0;
export const MAX_DISTRICT_TENSION = 100;

export const MIN_DISTRICT_EXPOSURE = 0;
export const MAX_DISTRICT_EXPOSURE = 100;

export const MIN_DISTRICT_POLICE_PRESENCE_MODIFIER = -4;
export const MAX_DISTRICT_POLICE_PRESENCE_MODIFIER = 4;

export const MIN_EFFECTIVE_DISTRICT_POLICE_PRESENCE = 0;
export const MAX_EFFECTIVE_DISTRICT_POLICE_PRESENCE = 4;

export type DistrictBaselineOrdinal = 0 | 1 | 2 | 3 | 4;

export interface DistrictBaselineProfileInput {
  readonly wealth: DistrictBaselineOrdinal;
  readonly lawEnforcementPresence: DistrictBaselineOrdinal;
  readonly civilianVisibility: DistrictBaselineOrdinal;
  readonly logisticsValue: DistrictBaselineOrdinal;
  readonly criminalOpportunity: DistrictBaselineOrdinal;
  readonly recruitmentOpportunity: DistrictBaselineOrdinal;
  readonly politicalSensitivity: DistrictBaselineOrdinal;
  readonly rivalPresence: DistrictBaselineOrdinal;
}

export interface DistrictPropertiesDefinitionInput {
  readonly id: DistrictId;
  readonly baselineProfile: DistrictBaselineProfileInput;
}

export interface DistrictPropertiesStateInput {
  readonly districtId: DistrictId;
  readonly currentTension: number;
  readonly currentExposure: number;
  readonly currentPolicePresenceModifier: number;
}

export interface DistrictProperties {
  readonly districtId: DistrictId;
  readonly baselineProfile: DistrictBaselineProfileInput;
  readonly currentTension: number;
  readonly currentExposure: number;
  readonly currentPolicePresenceModifier: number;
  readonly baselinePolicePresence: number;
  readonly effectivePolicePresence: number;
}

export function deriveDistrictProperties(
  districtDefinition: DistrictPropertiesDefinitionInput,
  districtState: DistrictPropertiesStateInput,
): DistrictProperties {
  const currentPolicePresenceModifier = clampNumber(
    districtState.currentPolicePresenceModifier,
    MIN_DISTRICT_POLICE_PRESENCE_MODIFIER,
    MAX_DISTRICT_POLICE_PRESENCE_MODIFIER,
  );
  const baselinePolicePresence = districtDefinition.baselineProfile.lawEnforcementPresence;

  return {
    districtId: districtState.districtId,
    baselineProfile: copyBaselineProfile(districtDefinition.baselineProfile),
    currentTension: clampNumber(
      districtState.currentTension,
      MIN_DISTRICT_TENSION,
      MAX_DISTRICT_TENSION,
    ),
    currentExposure: clampNumber(
      districtState.currentExposure,
      MIN_DISTRICT_EXPOSURE,
      MAX_DISTRICT_EXPOSURE,
    ),
    currentPolicePresenceModifier,
    baselinePolicePresence,
    effectivePolicePresence: clampNumber(
      baselinePolicePresence + currentPolicePresenceModifier,
      MIN_EFFECTIVE_DISTRICT_POLICE_PRESENCE,
      MAX_EFFECTIVE_DISTRICT_POLICE_PRESENCE,
    ),
  };
}

function copyBaselineProfile(
  baselineProfile: DistrictBaselineProfileInput,
): DistrictBaselineProfileInput {
  return {
    wealth: baselineProfile.wealth,
    lawEnforcementPresence: baselineProfile.lawEnforcementPresence,
    civilianVisibility: baselineProfile.civilianVisibility,
    logisticsValue: baselineProfile.logisticsValue,
    criminalOpportunity: baselineProfile.criminalOpportunity,
    recruitmentOpportunity: baselineProfile.recruitmentOpportunity,
    politicalSensitivity: baselineProfile.politicalSensitivity,
    rivalPresence: baselineProfile.rivalPresence,
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
