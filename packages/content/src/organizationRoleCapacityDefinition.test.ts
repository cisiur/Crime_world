import { describe, expect, it } from "vitest";

import {
  InvalidOrganizationRoleCapacityDefinitionError,
  canonicalMvpOrganizationRoleCapacityDefinition,
  createOrganizationRoleCapacityDefinition,
} from "./index";

describe("organization role capacity definition", () => {
  it("defines the canonical E5-07 role capacity values", () => {
    expect(canonicalMvpOrganizationRoleCapacityDefinition).toEqual({
      operatorCapacityContribution: 0,
      lieutenantCapacityContribution: 1,
      maximumLieutenantsPerOrganization: 1,
    });
    expect(Object.isFrozen(canonicalMvpOrganizationRoleCapacityDefinition)).toBe(true);
  });

  it("rejects non-canonical role capacity values", () => {
    expect(() =>
      createOrganizationRoleCapacityDefinition({
        operatorCapacityContribution: 1 as 0,
        lieutenantCapacityContribution: 1,
        maximumLieutenantsPerOrganization: 1,
      }),
    ).toThrow(InvalidOrganizationRoleCapacityDefinitionError);
    expect(() =>
      createOrganizationRoleCapacityDefinition({
        operatorCapacityContribution: 0,
        lieutenantCapacityContribution: 2 as 1,
        maximumLieutenantsPerOrganization: 1,
      }),
    ).toThrow(InvalidOrganizationRoleCapacityDefinitionError);
    expect(() =>
      createOrganizationRoleCapacityDefinition({
        operatorCapacityContribution: 0,
        lieutenantCapacityContribution: 1,
        maximumLieutenantsPerOrganization: 2 as 1,
      }),
    ).toThrow(InvalidOrganizationRoleCapacityDefinitionError);
  });
});
