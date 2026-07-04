// app/page.tsx  (App Router)  — or pages/index.tsx if you use the Pages Router
//
// This is the entry point that mounts the landing page. The two callbacks are
// optional; wire them to your existing Zustand store and newsletter handler.

"use client";

import LandingPage from "@/components/LandingPage";
import type { ThemePreset } from "@/types/landing";
// import { useThemeStore } from "@/store/themeStore"; // <- your existing store

export default function HomePage() {
  // const applyPreset = useThemeStore((s) => s.applyPreset);

  const handleApplyPreset = (preset: ThemePreset) => {
    // Hand the preset to your existing Theme Builder store.
    // The preset.palette array is dark -> light hex; map it to your
    // store's primary/secondary/accent/neutral slots as needed.
    // applyPreset(preset);
    console.log("Apply preset:", preset.id, preset.palette);
  };

  const handleSubscribe = (email: string) => {
    // POST to your newsletter endpoint / API route.
    console.log("Subscribe:", email);
  };

  return <LandingPage onApplyPreset={handleApplyPreset} onSubscribe={handleSubscribe} />;
}
