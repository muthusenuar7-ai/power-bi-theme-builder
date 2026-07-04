// content/landingContent.ts
// === EDIT THIS FILE to change any copy, link, product, preset, or roadmap item. ===
// The components read from here; you should not need to touch the JSX to update content.
//
// Theme presets share the SAME palette shape used by your Theme Builder / Zustand store,
// so you can import `landingContent.themePresets.presets` directly where presets are needed.

import type { LandingContent } from "@/types/landing";

export const landingContent: LandingContent = {
  nav: {
    brand: { name: "DATACENSE", sub: "THEME STUDIO" },
    links: [
      { label: "Product", href: "#products" },
      { label: "Solutions", href: "#how" },
      { label: "Resources", href: "#themes" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Pricing", href: "/pricing" },
    ],
    signInHref: "/sign-in",
    cta: { label: "Start Free Trial", href: "/signup" },
  },

  hero: {
    pill: "Designed for Power BI professionals",
    headingLines: ["Design consistent.", "Build beautiful.", "Deliver impact."],
    subtitle:
      "A unified platform to design, manage, and standardize your Power BI visuals — icons, themes, and report layouts — so every dashboard looks exceptional and stays on-brand.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "Watch Overview", href: "#how" },
    microPoints: ["No credit card required", "Built for Power BI", "Free to start"],
  },

  trust: {
    lead: "Trusted by data teams building enterprise-grade Power BI",
    logos: ["NORTHWIND", "FINCORE", "BLUEPEAK", "AURORA", "DATAWISE", "INSIGHT"],
  },

  comparison: {
    eyebrow: "One platform · Three modules",
    heading: "Everything you need for consistent, scalable Power BI design",
    subtitle:
      "From searchable icons to brand-perfect themes to downloadable report layouts — built to work together.",
    columns: [
      { label: "Icons Library", status: "live" },
      { label: "Theme Builder", status: "live" },
      { label: "Power BI Layout Builder", status: "soon" },
    ],
    rows: [
      { feature: "Pre-built, searchable assets", cells: ["yes", "yes", "yes"] },
      { feature: "Brand-consistent theming", cells: ["no", "yes", "yes"] },
      { feature: "Drag-and-drop report layouts", cells: ["no", "no", "partial"] },
      { feature: "Direct downloadable layouts (.pbit / PBIX)", cells: ["no", "no", "partial"] },
      { feature: "One-click export to Power BI", cells: ["yes", "yes", "partial"] },
    ],
  },

  products: [
    {
      id: "icons",
      iconKey: "icons",
      accent: "cyan",
      title: "Icons Library",
      status: "live",
      description:
        "Thousands of professionally crafted, Power BI-optimized icons across every business category.",
      features: [
        "Search by keyword or category",
        "Consistent line weights & styles",
        "Copy as SVG, PNG or base64",
      ],
      link: { label: "Explore Icons", href: "/icons" },
    },
    {
      id: "theme",
      iconKey: "theme",
      accent: "gold",
      title: "Theme Builder",
      status: "live",
      description:
        "Create and manage brand-aligned themes in minutes — colors, typography, visuals and effects.",
      features: [
        "Global colors, typography & effects",
        "Pre-built chart & visual styles",
        "One-click theme.json export",
      ],
      link: { label: "Build a Theme", href: "/theme-builder" },
    },
    {
      id: "layout",
      iconKey: "layout",
      accent: "navy",
      title: "Layout Builder",
      status: "soon",
      description:
        "Design report layouts visually and download them directly for Power BI in just a few clicks.",
      features: [
        "Drag-and-drop layout canvas",
        "Pre-built containers & sections",
        "Directly downloadable layouts",
      ],
      link: { label: "Join the Waitlist", href: "/layout-builder" },
    },
  ],

  themePresets: {
    eyebrow: "Theme Builder · Presets",
    heading: "Start from a beautiful preset — or build your own",
    subtitle: "Brand-ready palettes you can apply in one click, then fine-tune in the Theme Builder.",
    presets: [
      { id: "corporate-gold", name: "Corporate Gold", category: "Default", default: true, palette: ["#1B3A6B", "#0093B2", "#9FB0C8", "#F2C811"] },
      { id: "oceanic-blue", name: "Oceanic Blue", category: "Cool", palette: ["#0A2540", "#1C5D99", "#3B9ED9", "#A8D8F0"] },
      { id: "midnight", name: "Midnight", category: "Dark", palette: ["#101418", "#2A3340", "#5B6878", "#C7D0DB"] },
      { id: "forest", name: "Forest", category: "Natural", palette: ["#1E3A24", "#3D6B3F", "#7AA066", "#C9D8A8"] },
      { id: "sunset", name: "Sunset", category: "Warm", palette: ["#7A2E1E", "#D05A2E", "#F0A868", "#FBE0C4"] },
      { id: "monochrome", name: "Monochrome", category: "Neutral", palette: ["#1A1A1A", "#4D4D4D", "#8C8C8C", "#D9D9D9"] },
    ],
  },

  howItWorks: {
    eyebrow: "How it works",
    heading: "A simple workflow for stunning, on-brand reports",
    steps: [
      { title: "Discover", description: "Explore thousands of icons and visual assets in one place." },
      { title: "Design", description: "Build and customize themes that reflect your brand." },
      { title: "Apply", description: "Apply themes and assets consistently across every report." },
      { title: "Deliver", description: "Publish polished, impactful reports with confidence.", gold: true },
    ],
  },

  roadmap: {
    eyebrow: "Product roadmap",
    heading: "The road ahead",
    items: [
      { period: "AVAILABLE NOW", title: "Icons Library", state: "done", description: "A growing library of professional, Power BI-ready icons with search and categories." },
      { period: "AVAILABLE NOW", title: "Theme Builder", state: "done", description: "Create and manage brand-aligned themes with global styles and one-click export." },
      { period: "Q3 2025", title: "Power BI Layout Builder", state: "next", badge: "BETA", description: "Design report layouts visually and download them directly for Power BI." },
      { period: "Q4 2025", title: "Direct Power BI Integration", state: "next", description: "Push themes, icons and layouts straight into Power BI Desktop." },
    ],
    highlight: {
      eyebrow: "The next big thing",
      title: "Power BI Layout Builder",
      badge: "COMING SOON",
      description:
        "Design, preview, and download professional report layouts directly for Power BI. Faster. Smarter. Consistent — with directly downloadable Power BI layouts coming soon.",
      cta: { label: "Join the Waitlist", href: "/layout-builder" },
    },
  },

  finalCta: {
    heading: "Ready to elevate your Power BI reports?",
    subtitle: "Start free — no credit card required. Design consistent, deliver impact.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "Schedule a Demo", href: "/demo" },
  },

  footer: {
    brand: { name: "DATACENSE", sub: "THEME STUDIO" },
    blurb:
      "Empowering Power BI professionals to create consistent, impactful, and beautiful data experiences.",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Icons Library", href: "/icons" },
          { label: "Theme Builder", href: "/theme-builder" },
          { label: "Layout Builder (Soon)", href: "/layout-builder" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "Tutorials", href: "/tutorials" },
          { label: "Blog", href: "/blog" },
          { label: "Support Center", href: "/support" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Partners", href: "/partners" },
          { label: "Contact Us", href: "/contact" },
        ],
      },
    ],
    newsletter: {
      title: "Stay in the loop",
      description: "Get product updates, tips, and best practices.",
      placeholder: "Enter your email",
      cta: "Subscribe",
    },
    legal: "© 2025 Datacense Theme Studio. All rights reserved.",
    legalLinks: ["Privacy Policy", "Terms of Service", "Security"],
  },
};
