import js from "@eslint/js";
import tseslint from "typescript-eslint";

const domainForbiddenImports = [
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
          patterns: ["react", "react-dom", "konva", "react-konva", "@tauri-apps/*"],
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
          patterns: ["@tauri-apps/*"],
        },
      ],
    },
  },
);
