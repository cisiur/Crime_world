import { describeDomainRuntime } from "@crimeworld/domain";

export interface ScaffoldStatusView {
  readonly title: "CrimeWorld";
  readonly message: "Repository scaffold completed.";
  readonly gameplayImplemented: false;
  readonly domainRuntime: "headless";
}

export function getScaffoldStatusView(): ScaffoldStatusView {
  return {
    title: "CrimeWorld",
    message: "Repository scaffold completed.",
    gameplayImplemented: false,
    domainRuntime: describeDomainRuntime().runtime,
  };
}
