import { AppShell } from "@crimeworld/presentation";
import React from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("CrimeWorld desktop root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);
