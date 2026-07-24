export interface OrganizationRoleCapacityDefinition {
  readonly operatorCapacityContribution: 0;
  readonly lieutenantCapacityContribution: 1;
  readonly maximumLieutenantsPerOrganization: 1;
}

export type InvalidOrganizationRoleCapacityDefinitionField =
  | "operatorCapacityContribution"
  | "lieutenantCapacityContribution"
  | "maximumLieutenantsPerOrganization";

export class InvalidOrganizationRoleCapacityDefinitionError extends Error {
  public constructor(
    public readonly field: InvalidOrganizationRoleCapacityDefinitionField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid organization role capacity definition field "${field}": ${reason}.`);
    this.name = "InvalidOrganizationRoleCapacityDefinitionError";
  }
}

export const canonicalMvpOrganizationRoleCapacityDefinition =
  createOrganizationRoleCapacityDefinition({
    operatorCapacityContribution: 0,
    lieutenantCapacityContribution: 1,
    maximumLieutenantsPerOrganization: 1,
  });

export function createOrganizationRoleCapacityDefinition(
  input: OrganizationRoleCapacityDefinition,
): OrganizationRoleCapacityDefinition {
  validateExact("operatorCapacityContribution", input.operatorCapacityContribution, 0);
  validateExact("lieutenantCapacityContribution", input.lieutenantCapacityContribution, 1);
  validateExact("maximumLieutenantsPerOrganization", input.maximumLieutenantsPerOrganization, 1);

  return Object.freeze({
    operatorCapacityContribution: input.operatorCapacityContribution,
    lieutenantCapacityContribution: input.lieutenantCapacityContribution,
    maximumLieutenantsPerOrganization: input.maximumLieutenantsPerOrganization,
  });
}

function validateExact(
  field: InvalidOrganizationRoleCapacityDefinitionField,
  value: unknown,
  expected: 0 | 1,
): void {
  if (value !== expected) {
    throw new InvalidOrganizationRoleCapacityDefinitionError(
      field,
      `expected canonical value ${expected}`,
      value,
    );
  }
}
