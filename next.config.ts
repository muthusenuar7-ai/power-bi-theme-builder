import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Layout Builder and Icon Studio PBIT export routes read base .pbit
  // templates from public/templates/**/ at runtime via node:fs. Next does not
  // trace public/ files into a serverless function automatically, so force-
  // include them for each export route's bundle (Vercel and any serverless target).
  outputFileTracingIncludes: {
    "/api/layout-builder/export/pbit": ["./public/templates/layout-builder/**"],
    "/api/layout-builder/visual-templates": ["./public/templates/layout-builder/**"],
    "/api/icon-studio/export/pbit": ["./public/templates/icon-studio/**"],
    // The combined exporter also reads the genuine icon SVGs + metadata from
    // public/icon-library/ at runtime via node:fs to render icon pages.
    "/api/layout-builder/export/combined-pbit": [
      "./public/templates/layout-builder/**",
      "./public/icon-library/**",
    ],
  },
};

export default nextConfig;
