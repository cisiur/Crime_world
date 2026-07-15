import {
  parseCharacterId,
  parseOrganizationId,
  type CharacterId,
  type OrganizationId,
} from "@crimeworld/domain";

export interface OrganizationSeed {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly leaderCharacterId: CharacterId;
  readonly startingMoney: number;
  readonly startingOperationalCapacity: number;
}

export const rivalOrganizationSeeds = [
  {
    organizationId: parseOrganizationId("organization:iron_quay_crew"),
    displayName: "Iron Quay Crew",
    leaderCharacterId: parseCharacterId("character:iron_quay_boss"),
    startingMoney: 1_200,
    startingOperationalCapacity: 3,
  },
  {
    organizationId: parseOrganizationId("organization:night_market_syndicate"),
    displayName: "Night Market Syndicate",
    leaderCharacterId: parseCharacterId("character:night_market_boss"),
    startingMoney: 1_500,
    startingOperationalCapacity: 4,
  },
] as const satisfies readonly OrganizationSeed[];
