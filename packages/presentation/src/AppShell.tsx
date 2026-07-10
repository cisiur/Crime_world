import { getScaffoldStatusView } from "@crimeworld/application";

import { StrategicMapPlaceholder } from "./StrategicMapPlaceholder";

export function AppShell() {
  const status = getScaffoldStatusView();

  return (
    <main className="app-shell">
      <div className="app-shell__content">
        <h1>{status.title}</h1>
        <p>{status.message}</p>
        <StrategicMapPlaceholder />
      </div>
    </main>
  );
}
