import { parseLocationId, parseOperationTemplateId } from "@crimeworld/domain";

import { createOperationTemplateDefinition } from "./operationTemplateDefinition";

export const localCollectionOperationTemplateDefinition = createOperationTemplateDefinition({
  id: parseOperationTemplateId("operation-template:local_collection"),
  displayName: "Local Collection",
  category: "one-off-income",
  allowedTargetKinds: ["shop-or-service"],
  allowedTargetIds: [parseLocationId("location:corner_store")],
  durationMinutes: 60,
  startCost: 20,
  operationalCapacityCost: 1,
});
