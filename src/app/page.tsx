// app/page.tsx (App Router) — landing page entry point.
//
// Mounts the Datacense Theme Studio landing page. The two callbacks are
// optional; they are wired to lightweight handlers here. The primary CTAs
// ("Start Free Trial" / "Build a Theme") link to /editor via landingContent.ts.

"use client";

import LandingPage from "@/components/landing/LandingPage";
import type { ThemePreset } from "@/types/landing";

export default function HomePage() {
  const handleApplyPreset = (preset: ThemePreset) => {
    // The preset.palette array is dark -> light hex. Selection is tracked as
    // local UI state inside LandingPage; hook this up to the Theme Builder
    // store later if cross-page preset hand-off is needed.
    console.log("Apply preset:", preset.id, preset.palette);
  };

  const handleSubscribe = (email: string) => {
    // POST to your newsletter endpoint / API route.
    console.log("Subscribe:", email);
  };

  return <LandingPage onApplyPreset={handleApplyPreset} onSubscribe={handleSubscribe} />;
}
