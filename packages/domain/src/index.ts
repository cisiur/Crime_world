export interface DomainRuntimeDescriptor {
  readonly packageName: "@crimeworld/domain";
  readonly runtime: "headless";
  readonly ownsGameplayRules: true;
}

export function describeDomainRuntime(): DomainRuntimeDescriptor {
  return {
    packageName: "@crimeworld/domain",
    runtime: "headless",
    ownsGameplayRules: true,
  };
}
