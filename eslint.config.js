import js from "@eslint/js";
import tseslint from "typescript-eslint";

const domainForbiddenImports = [
  "@crimeworld/application",
  "@crimeworld/application/*",
  "@crimeworld/content",
  "@crimeworld/content/*",
  "@crimeworld/infrastructure",
  "@crimeworld/infrastructure/*",
  "@crimeworld/presentation",
  "@crimeworld/presentation/*",
  "@crimeworld/desktop",
  "@crimeworld/desktop/*",
  "react",
  "react-dom",
  "konva",
  "react-konva",
  "@tauri-apps/*",
  "fs",
  "path",
  "os",
  "process",
  "node:*",
  "**/packages/application/**",
  "**/packages/content/**",
  "**/packages/infrastructure/**",
  "**/packages/presentation/**",
  "**/apps/desktop/**",
];

const desktopForbiddenImports = [
  "@crimeworld/desktop",
  "@crimeworld/desktop/*",
  "**/apps/desktop/**",
];

const applicationForbiddenImports = [
  "react",
  "react-dom",
  "konva",
  "react-konva",
  "@tauri-apps/*",
  "@crimeworld/infrastructure",
  "@crimeworld/infrastructure/*",
  "@crimeworld/presentation",
  "@crimeworld/presentation/*",
  ...desktopForbiddenImports,
];

const contentForbiddenImports = [
  "react",
  "react-dom",
  "konva",
  "react-konva",
  "@tauri-apps/*",
  "@crimeworld/infrastructure",
  "@crimeworld/infrastructure/*",
  "@crimeworld/presentation",
  "@crimeworld/presentation/*",
  ...desktopForbiddenImports,
];

const presentationForbiddenImports = [
  "@crimeworld/infrastructure",
  "@crimeworld/infrastructure/*",
  "@tauri-apps/*",
  ...desktopForbiddenImports,
];

const infrastructureForbiddenImports = [
  "@crimeworld/presentation",
  "@crimeworld/presentation/*",
  "react",
  "react-dom",
  "konva",
  "react-konva",
  ...desktopForbiddenImports,
];

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/dist/**",
      "**/dist-types/**",
      "target/**",
      "**/target/**",
      "**/src-tauri/gen/**",
      "*.tsbuildinfo",
      "package-lock.json",
    ],
  },
  {
    files: ["packages/domain/src/**/*.ts", "packages/domain/test/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: domainForbiddenImports,
        },
      ],
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "localStorage",
        "sessionStorage",
        "fetch",
      ],
    },
  },
  {
    files: ["packages/application/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: applicationForbiddenImports,
        },
      ],
    },
  },
  {
    files: ["packages/content/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: contentForbiddenImports,
        },
      ],
    },
  },
  {
    files: ["packages/presentation/src/**/*.ts", "packages/presentation/src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: presentationForbiddenImports,
        },
      ],
    },
  },
  {
    files: ["packages/infrastructure/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: infrastructureForbiddenImports,
        },
      ],
    },
  },
);
