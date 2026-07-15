import type { BusinessId, LocationId, OrganizationId } from "./entityIds";

export interface BusinessState {
  readonly businessId: BusinessId;
  readonly locationId: LocationId;
  readonly ownerOrganizationId: OrganizationId | null;
}

export interface CreateBusinessStateInput {
  readonly businessId: BusinessId;
  readonly locationId: LocationId;
  readonly ownerOrganizationId: OrganizationId | null;
}

export type InvalidBusinessStateField = "businessId" | "locationId" | "ownerOrganizationId";

export class InvalidBusinessStateError extends Error {
  public constructor(
    public readonly field: InvalidBusinessStateField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid business state field "${field}": ${reason}.`);
    this.name = "InvalidBusinessStateError";
  }
}

export function createBusinessState(input: CreateBusinessStateInput): BusinessState {
  validateIdField("businessId", input.businessId);
  validateIdField("locationId", input.locationId);
  validateOwnerOrganizationId(input.ownerOrganizationId);

  return {
    businessId: input.businessId,
    locationId: input.locationId,
    ownerOrganizationId: input.ownerOrganizationId,
  };
}

function validateIdField(
  field: "businessId" | "locationId",
  value: unknown,
): asserts value is BusinessId | LocationId {
  if (typeof value !== "string") {
    throw new InvalidBusinessStateError(
      field,
      `expected an ID string, received ${describeValueType(value)}`,
      value,
    );
  }
}

function validateOwnerOrganizationId(
  ownerOrganizationId: unknown,
): asserts ownerOrganizationId is OrganizationId | null {
  if (ownerOrganizationId === null) {
    return;
  }

  if (typeof ownerOrganizationId !== "string") {
    throw new InvalidBusinessStateError(
      "ownerOrganizationId",
      `expected an organization ID string or null, received ${describeValueType(ownerOrganizationId)}`,
      ownerOrganizationId,
    );
  }
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}
