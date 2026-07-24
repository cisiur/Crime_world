import { describe, expect, it } from "vitest";

import {
  canonicalMvpLocationDefinitions,
  canonicalMvpRecruitmentCandidateCharacterSeeds,
  canonicalMvpRecruitmentCandidateDefinitions,
  validateRecruitmentCandidateDefinitions,
  type LocationDefinition,
  type RecruitmentCandidateCharacterSeed,
  type RecruitmentCandidateDefinition,
  type RecruitmentCandidateDefinitionValidationErrorCode,
} from "./index";

describe("recruitment candidate definitions", () => {
  it("exports exactly four canonical MVP recruitable candidates with provisional trade-offs", () => {
    expect(canonicalMvpRecruitmentCandidateDefinitions).toEqual([
      {
        candidateCharacterId: "character:recruit_vera_kade",
        locationId: "location:bar_district",
        recruitmentCost: 60,
        minimumTrustRequirement: 35,
        maintenanceCostPreview: 5,
        opportunityDurationTicks: 432,
        reliabilityProfile: "experienced-unreliable",
      },
      {
        candidateCharacterId: "character:recruit_eli_navarro",
        locationId: "location:community_center",
        recruitmentCost: 25,
        minimumTrustRequirement: 15,
        maintenanceCostPreview: 5,
        opportunityDurationTicks: 576,
        reliabilityProfile: "loyal-inexperienced",
      },
      {
        candidateCharacterId: "character:recruit_nika_ross",
        locationId: "location:corner_store",
        recruitmentCost: 10,
        minimumTrustRequirement: 10,
        maintenanceCostPreview: 5,
        opportunityDurationTicks: 288,
        reliabilityProfile: "cheap-exposed",
      },
      {
        candidateCharacterId: "character:recruit_tomas_vek",
        locationId: "location:freight_terminal",
        recruitmentCost: 90,
        minimumTrustRequirement: 45,
        maintenanceCostPreview: 5,
        opportunityDurationTicks: 720,
        reliabilityProfile: "expensive-specialist",
      },
    ]);
    expect(canonicalMvpRecruitmentCandidateDefinitions).toHaveLength(4);
    expect(canonicalMvpRecruitmentCandidateDefinitions.length).toBeGreaterThanOrEqual(3);
    expect(canonicalMvpRecruitmentCandidateDefinitions.length).toBeLessThanOrEqual(5);
    expect(Object.isFrozen(canonicalMvpRecruitmentCandidateDefinitions)).toBe(true);
    expect(canonicalMvpRecruitmentCandidateDefinitions.every(Object.isFrozen)).toBe(true);
  });

  it("uses concrete unique character seeds and valid canonical MVP locations", () => {
    const result = validateRecruitmentCandidateDefinitions({
      definitions: canonicalMvpRecruitmentCandidateDefinitions,
      characterSeeds: canonicalMvpRecruitmentCandidateCharacterSeeds,
      locations: canonicalMvpLocationDefinitions,
    });

    expect(result).toEqual({ valid: true, errors: [] });
    expect(new Set(canonicalMvpRecruitmentCandidateDefinitions.map((item) => item.candidateCharacterId)).size).toBe(4);
    expect(canonicalMvpRecruitmentCandidateCharacterSeeds.map((seed) => seed.capabilityTags)).toEqual([
      ["streetwise", "force"],
      ["social"],
      ["stealth", "streetwise"],
      ["logistics", "social"],
    ]);
    expect(canonicalMvpRecruitmentCandidateCharacterSeeds.map((seed) => [
      seed.competence,
      seed.loyalty,
      seed.personalExposure,
    ])).toEqual([
      [75, 35, 30],
      [35, 80, 10],
      [50, 50, 65],
      [70, 60, 15],
    ]);
  });

  it.each([
    [
      "duplicate candidate",
      [
        definitionAt(0),
        { ...definitionAt(1), candidateCharacterId: definitionAt(0).candidateCharacterId },
        definitionAt(2),
        definitionAt(3),
      ],
      "DUPLICATE_CANDIDATE",
    ],
    [
      "invalid cost",
      [{ ...definitionAt(0), recruitmentCost: 0 }, definitionAt(1), definitionAt(2), definitionAt(3)],
      "INVALID_COST",
    ],
    [
      "invalid trust",
      [
        { ...definitionAt(0), minimumTrustRequirement: 101 },
        definitionAt(1),
        definitionAt(2),
        definitionAt(3),
      ],
      "INVALID_TRUST_REQUIREMENT",
    ],
    [
      "invalid maintenance",
      [
        { ...definitionAt(0), maintenanceCostPreview: -1 },
        definitionAt(1),
        definitionAt(2),
        definitionAt(3),
      ],
      "INVALID_MAINTENANCE_PREVIEW",
    ],
    [
      "invalid duration",
      [
        { ...definitionAt(0), opportunityDurationTicks: Number.MAX_SAFE_INTEGER + 1 },
        definitionAt(1),
        definitionAt(2),
        definitionAt(3),
      ],
      "INVALID_DURATION",
    ],
  ] as const)("rejects %s", (_caseName, definitions, expectedCode) => {
    expectValidationCode(definitions as readonly RecruitmentCandidateDefinition[], expectedCode);
  });

  it("rejects missing character seeds and missing canonical locations", () => {
    expectValidationCode(
      canonicalMvpRecruitmentCandidateDefinitions,
      "MISSING_CHARACTER_SEED",
      [],
      canonicalMvpLocationDefinitions,
    );
    expectValidationCode(
      canonicalMvpRecruitmentCandidateDefinitions,
      "MISSING_LOCATION",
      canonicalMvpRecruitmentCandidateCharacterSeeds,
      [],
    );
  });

  it("does not mutate input collections during validation", () => {
    const definitions = canonicalMvpRecruitmentCandidateDefinitions.map((definition) => ({
      ...definition,
    }));
    const before = JSON.stringify(definitions);

    validateRecruitmentCandidateDefinitions({
      definitions,
      characterSeeds: canonicalMvpRecruitmentCandidateCharacterSeeds,
      locations: canonicalMvpLocationDefinitions,
    });

    expect(JSON.stringify(definitions)).toBe(before);
  });
});

function definitionAt(index: number): RecruitmentCandidateDefinition {
  const definition = canonicalMvpRecruitmentCandidateDefinitions[index];
  if (definition === undefined) {
    throw new Error(`Missing definition at index ${index}.`);
  }
  return definition;
}

function expectValidationCode(
  definitions: readonly RecruitmentCandidateDefinition[],
  expectedCode: RecruitmentCandidateDefinitionValidationErrorCode,
  characterSeeds: readonly RecruitmentCandidateCharacterSeed[] =
    canonicalMvpRecruitmentCandidateCharacterSeeds,
  locations: readonly LocationDefinition[] = canonicalMvpLocationDefinitions,
): void {
  const result = validateRecruitmentCandidateDefinitions({
    definitions,
    characterSeeds,
    locations,
  });

  expect(result.valid).toBe(false);
  expect(result.errors.map((error) => error.code)).toContain(expectedCode);
}
