import { createBusinessOwnershipTransferredEvent, type DomainEvent } from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import { createBusinessState, type BusinessState } from "./businessState";
import type { BusinessId, OrganizationId } from "./entityIds";
import type { OrganizationState } from "./organizationState";

export interface TransferBusinessOwnershipInput {
  readonly businessId: BusinessId;
  readonly newOwnerOrganizationId: OrganizationId;
  readonly expectedCurrentOwnerOrganizationId?: OrganizationId | null;
  readonly businesses: readonly BusinessState[];
  readonly organizations: readonly OrganizationState[];
}

export interface TransferBusinessOwnershipSuccess {
  readonly business: BusinessState;
  readonly businesses: readonly BusinessState[];
  readonly events: readonly DomainEvent[];
}

export interface BusinessOwnershipMissingBusinessError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessOwnershipMissingBusiness;
  readonly businessId: BusinessId;
}

export interface BusinessOwnershipMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessOwnershipMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface BusinessOwnershipAlreadyOwnedBySameOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessOwnershipAlreadyOwnedBySameOrganization;
  readonly businessId: BusinessId;
  readonly organizationId: OrganizationId;
}

export interface BusinessOwnershipConflictingCurrentOwnerError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessOwnershipConflictingCurrentOwner;
  readonly businessId: BusinessId;
  readonly actualOwnerOrganizationId: OrganizationId | null;
  readonly expectedCurrentOwnerOrganizationId?: OrganizationId | null;
}

export type TransferBusinessOwnershipError =
  | BusinessOwnershipAlreadyOwnedBySameOrganizationError
  | BusinessOwnershipConflictingCurrentOwnerError
  | BusinessOwnershipMissingBusinessError
  | BusinessOwnershipMissingOrganizationError;

export type TransferBusinessOwnershipResult = DomainResult<
  TransferBusinessOwnershipSuccess,
  TransferBusinessOwnershipError
>;

export function transferBusinessOwnership(
  input: TransferBusinessOwnershipInput,
): TransferBusinessOwnershipResult {
  const businessIndex = input.businesses.findIndex(
    (business) => business.businessId === input.businessId,
  );
  if (businessIndex === -1) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipMissingBusiness,
      message: `Business "${input.businessId}" was not found for ownership transfer.`,
      businessId: input.businessId,
    });
  }

  const business = input.businesses[businessIndex];
  if (business === undefined) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipMissingBusiness,
      message: `Business "${input.businessId}" was not found for ownership transfer.`,
      businessId: input.businessId,
    });
  }

  if (
    !input.organizations.some(
      (organization) => organization.organizationId === input.newOwnerOrganizationId,
    )
  ) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipMissingOrganization,
      message: `Organization "${input.newOwnerOrganizationId}" was not found for ownership transfer.`,
      organizationId: input.newOwnerOrganizationId,
    });
  }

  if (business.ownerOrganizationId === input.newOwnerOrganizationId) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipAlreadyOwnedBySameOrganization,
      message: `Business "${input.businessId}" is already owned by organization "${input.newOwnerOrganizationId}".`,
      businessId: input.businessId,
      organizationId: input.newOwnerOrganizationId,
    });
  }

  if (
    business.ownerOrganizationId !== null &&
    input.expectedCurrentOwnerOrganizationId !== business.ownerOrganizationId
  ) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipConflictingCurrentOwner,
      message: `Business "${input.businessId}" is owned by another organization and the expected current owner did not match.`,
      businessId: input.businessId,
      actualOwnerOrganizationId: business.ownerOrganizationId,
      ...(input.expectedCurrentOwnerOrganizationId === undefined
        ? {}
        : { expectedCurrentOwnerOrganizationId: input.expectedCurrentOwnerOrganizationId }),
    });
  }

  if (
    input.expectedCurrentOwnerOrganizationId !== undefined &&
    input.expectedCurrentOwnerOrganizationId !== business.ownerOrganizationId
  ) {
    return failure({
      code: DomainErrorCode.BusinessOwnershipConflictingCurrentOwner,
      message: `Business "${input.businessId}" current owner did not match the expected owner.`,
      businessId: input.businessId,
      actualOwnerOrganizationId: business.ownerOrganizationId,
      expectedCurrentOwnerOrganizationId: input.expectedCurrentOwnerOrganizationId,
    });
  }

  const nextBusiness = createBusinessState({
    ...business,
    ownerOrganizationId: input.newOwnerOrganizationId,
  });
  const nextBusinesses = Object.freeze(
    input.businesses.map((candidate, index) =>
      index === businessIndex ? nextBusiness : candidate,
    ),
  );
  const events = Object.freeze([
    createBusinessOwnershipTransferredEvent({
      businessId: nextBusiness.businessId,
      locationId: nextBusiness.locationId,
      previousOwnerOrganizationId: business.ownerOrganizationId,
      newOwnerOrganizationId: input.newOwnerOrganizationId,
    }),
  ]);

  return success(
    Object.freeze({
      business: nextBusiness,
      businesses: nextBusinesses,
      events,
    }),
  );
}
