// types/landing.ts
// Type definitions for the Datacense Theme Studio landing page content.
// The landing page is fully data-driven: edit content/landingContent.ts,
// never the components, to change copy/links.

export type ModuleStatus = "live" | "soon";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavContent {
  brand: { name: string; sub: string };
  links: NavLink[];
  signInHref: string;
  cta: { label: string; href: string };
}

export interface HeroContent {
  pill: string;
  /** Headline lines; the last line is rendered in the gold accent color. */
  headingLines: string[];
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  microPoints: string[];
}

export interface TrustContent {
  lead: string;
  logos: string[];
}

export interface ComparisonContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  /** Column headers after the first ("Capability") column. */
  columns: { label: string; status: ModuleStatus }[];
  /**
   * Each row: feature label + a cell per column.
   * Cell values: "yes" | "no" | "partial".
   */
  rows: { feature: string; cells: ("yes" | "no" | "partial")[] }[];
}

export interface ProductCard {
  id: string;
  /** Maps to an icon component / glyph key. */
  iconKey: "icons" | "theme" | "layout";
  accent: "cyan" | "gold" | "navy";
  title: string;
  status: ModuleStatus;
  description: string;
  features: string[];
  link: { label: string; href: string };
}

export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  /** Ordered hex swatches, dark -> light. Also usable by the real Theme Builder. */
  palette: string[];
  default?: boolean;
}

export interface Step {
  title: string;
  description: string;
  gold?: boolean;
}

export interface HowItWorksContent {
  eyebrow: string;
  heading: string;
  steps: Step[];
}

export interface RoadmapItem {
  period: string;
  title: string;
  description: string;
  state: "done" | "next";
  badge?: string;
}

export interface RoadmapContent {
  eyebrow: string;
  heading: string;
  items: RoadmapItem[];
  highlight: {
    eyebrow: string;
    title: string;
    badge: string;
    description: string;
    cta: { label: string; href: string };
  };
}

export interface FinalCtaContent {
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface FooterContent {
  brand: { name: string; sub: string };
  blurb: string;
  columns: FooterColumn[];
  newsletter: { title: string; description: string; placeholder: string; cta: string };
  legal: string;
  legalLinks: string[];
}

export interface LandingContent {
  nav: NavContent;
  hero: HeroContent;
  trust: TrustContent;
  comparison: ComparisonContent;
  products: ProductCard[];
  themePresets: { eyebrow: string; heading: string; subtitle: string; presets: ThemePreset[] };
  howItWorks: HowItWorksContent;
  roadmap: RoadmapContent;
  finalCta: FinalCtaContent;
  footer: FooterContent;
}
