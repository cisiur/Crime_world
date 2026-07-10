import { describe, expect, it } from "vitest";

import { describeDomainRuntime } from "../src/index";

describe("domain runtime", () => {
  it("runs headless without React, Tauri, or map renderer dependencies", () => {
    expect(describeDomainRuntime()).toEqual({
      packageName: "@crimeworld/domain",
      runtime: "headless",
      ownsGameplayRules: true,
    });
  });
});
