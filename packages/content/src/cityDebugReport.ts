import type { DistrictProperties } from "@crimeworld/domain";

import type { CityDefinition, DistrictBaselineProfile } from "./cityDefinition";
import {
  deriveDistrictAdjacency,
  type CityDefinitionValidationEntityRef,
  type CityDefinitionValidationResult,
} from "./cityDefinitionValidation";

export interface CityDebugReportOptions {
  readonly validationResult?: CityDefinitionValidationResult;
  readonly runtimeDistrictProperties?: readonly DistrictProperties[];
}

export function formatCityDebugReport(
  cityDefinition: CityDefinition,
  options: CityDebugReportOptions = {},
): string {
  const lines: string[] = [];
  const locationCountsByDistrictId = new Map<string, number>();
  const adjacencyByDistrictId = new Map(
    deriveDistrictAdjacency(cityDefinition.districts, cityDefinition.routes).map((adjacency) => [
      adjacency.districtId,
      adjacency.adjacentDistrictIds,
    ]),
  );
  const runtimePropertiesByDistrictId = new Map(
    (options.runtimeDistrictProperties ?? []).map((districtProperties) => [
      districtProperties.districtId,
      districtProperties,
    ]),
  );

  for (const location of cityDefinition.locations) {
    locationCountsByDistrictId.set(
      location.districtId,
      (locationCountsByDistrictId.get(location.districtId) ?? 0) + 1,
    );
  }

  lines.push("CrimeWorld City Debug Report");
  lines.push("City");
  lines.push(`  id: ${cityDefinition.id}`);
  lines.push(`  schemaVersion: ${cityDefinition.schemaVersion}`);
  lines.push(`  contentVersion: ${cityDefinition.contentVersion}`);
  lines.push(`  districts: ${cityDefinition.districts.length}`);
  lines.push(`  locations: ${cityDefinition.locations.length}`);
  lines.push(`  routes: ${cityDefinition.routes.length}`);
  lines.push("");

  appendValidationSection(lines, options.validationResult);
  lines.push("");

  lines.push("Districts");
  for (const district of cityDefinition.districts) {
    lines.push(`  - ${district.id}`);
    lines.push(`    name: ${district.name}`);
    lines.push(`    baseline: ${formatBaselineProfile(district.baselineProfile)}`);
    lines.push(`    locations: ${locationCountsByDistrictId.get(district.id) ?? 0}`);
    lines.push(`    neighbours: ${formatIdList(adjacencyByDistrictId.get(district.id) ?? [])}`);

    const runtimeProperties = runtimePropertiesByDistrictId.get(district.id);

    if (runtimeProperties !== undefined) {
      lines.push("    runtime");
      lines.push(`      currentTension: ${runtimeProperties.currentTension}`);
      lines.push(`      currentExposure: ${runtimeProperties.currentExposure}`);
      lines.push(
        `      currentPolicePresenceModifier: ${runtimeProperties.currentPolicePresenceModifier}`,
      );
      lines.push(`      baselinePolicePresence: ${runtimeProperties.baselinePolicePresence}`);
      lines.push(`      effectivePolicePresence: ${runtimeProperties.effectivePolicePresence}`);
    }
  }
  lines.push("");

  lines.push("Routes");
  for (const route of cityDefinition.routes) {
    lines.push(`  - ${route.id}`);
    lines.push(`    from: ${route.fromDistrictId}`);
    lines.push(`    to: ${route.toDistrictId}`);
    lines.push(`    direction: ${route.direction}`);
    lines.push(`    kind: ${route.kind}`);
  }

  return lines.join("\n");
}

function appendValidationSection(
  lines: string[],
  validationResult: CityDefinitionValidationResult | undefined,
): void {
  lines.push("Validation");

  if (validationResult === undefined) {
    lines.push("  status: NOT PROVIDED");
    return;
  }

  lines.push(`  status: ${validationResult.valid ? "VALID" : "INVALID"}`);

  if (validationResult.errors.length === 0) {
    return;
  }

  lines.push("  errors");

  for (const error of validationResult.errors) {
    lines.push(`    - code: ${error.code}`);
    lines.push(`      entity: ${formatValidationEntity(error.entity)}`);
    lines.push(`      message: ${error.message}`);
  }
}

function formatValidationEntity(entity: CityDefinitionValidationEntityRef): string {
  if (entity.id === undefined) {
    return `kind=${entity.kind}`;
  }

  return `kind=${entity.kind}, id=${entity.id}`;
}

function formatBaselineProfile(baselineProfile: DistrictBaselineProfile): string {
  return [
    `wealth=${baselineProfile.wealth}`,
    `lawEnforcementPresence=${baselineProfile.lawEnforcementPresence}`,
    `civilianVisibility=${baselineProfile.civilianVisibility}`,
    `logisticsValue=${baselineProfile.logisticsValue}`,
    `criminalOpportunity=${baselineProfile.criminalOpportunity}`,
    `recruitmentOpportunity=${baselineProfile.recruitmentOpportunity}`,
    `politicalSensitivity=${baselineProfile.politicalSensitivity}`,
    `rivalPresence=${baselineProfile.rivalPresence}`,
  ].join(", ");
}

function formatIdList(ids: readonly string[]): string {
  if (ids.length === 0) {
    return "(none)";
  }

  return ids.join(", ");
}
