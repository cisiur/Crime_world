import { describe, expect, it } from "vitest";

import {
  InvalidBusinessStateError,
  createBusinessState,
  parseBusinessId,
  parseLocationId,
  parseOrganizationId,
  type BusinessState,
  type CreateBusinessStateInput,
  type InvalidBusinessStateField,
} from "./index";

describe("business state", () => {
  it("creates a valid owned business", () => {
    const businessState = createBusinessState(createValidBusinessInput());

    expect(businessState).toEqual({
      businessId: parseBusinessId("business:old_row_bar"),
      locationId: parseLocationId("location:old_row_bar"),
      ownerOrganizationId: parseOrganizationId("organization:starter_crew"),
    });
  });

  it("creates a valid unowned business", () => {
    const businessState = createBusinessState(
      createValidBusinessInput({
        ownerOrganizationId: null,
      }),
    );

    expect(businessState.ownerOrganizationId).toBeNull();
  });

  it("rejects invalid runtime business IDs", () => {
    expectInvalidBusinessStateError(
      () =>
        createBusinessState(
          createValidBusinessInput({
            businessId: 42 as unknown as CreateBusinessStateInput["businessId"],
          }),
        ),
      "businessId",
    );
  });

  it("rejects invalid runtime location IDs", () => {
    expectInvalidBusinessStateError(
      () =>
        createBusinessState(
          createValidBusinessInput({
            locationId: 42 as unknown as CreateBusinessStateInput["locationId"],
          }),
        ),
      "locationId",
    );
  });

  it("rejects invalid runtime owner organization IDs", () => {
    expectInvalidBusinessStateError(
      () =>
        createBusinessState(
          createValidBusinessInput({
            ownerOrganizationId: 42 as unknown as CreateBusinessStateInput["ownerOrganizationId"],
          }),
        ),
      "ownerOrganizationId",
    );
  });

  it("returns a fresh object with the BusinessState shape", () => {
    const input = createValidBusinessInput();
    const businessState: BusinessState = createBusinessState(input);

    expect(businessState).not.toBe(input);
    expect(businessState).toEqual({
      businessId: input.businessId,
      locationId: input.locationId,
      ownerOrganizationId: input.ownerOrganizationId,
    });
  });
});

function createValidBusinessInput(
  overrides: Partial<CreateBusinessStateInput> = {},
): CreateBusinessStateInput {
  return {
    businessId: parseBusinessId("business:old_row_bar"),
    locationId: parseLocationId("location:old_row_bar"),
    ownerOrganizationId: parseOrganizationId("organization:starter_crew"),
    ...overrides,
  };
}

function expectInvalidBusinessStateError(
  act: () => BusinessState,
  expectedField: InvalidBusinessStateField,
): void {
  try {
    act();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidBusinessStateError);
    expect((error as InvalidBusinessStateError).field).toBe(expectedField);
    return;
  }

  throw new Error("Expected InvalidBusinessStateError.");
}
