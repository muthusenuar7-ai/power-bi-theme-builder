import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    ".claude/**",
    ".agents/**",
    ".codex/**",
    "next-env.d.ts",
    // Reference docs are not part of the app source
    "docs/**",
  ]),
]);

export default eslintConfig;
