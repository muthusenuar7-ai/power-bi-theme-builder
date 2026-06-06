// components/landing/LandingPage.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./Landing.module.css";
import { landingContent } from "@/content/landingContent";
import type { ThemePreset } from "@/types/landing";
import {
  CheckGlyph,
  LogoGlyph,
  productGlyph,
  LinkedInGlyph,
  YouTubeGlyph,
} from "./Glyph";

/**
 * Datacense Theme Studio — Landing Page
 * Fully data-driven from content/landingContent.ts.
 *
 * Integration notes:
 * - Product card links (`/icons`, `/editor`, `/layout-builder`) point at
 *   your existing app routes — adjust hrefs in landingContent.ts if they differ.
 * - `onApplyPreset` lets you push a selected preset into your Zustand theme store
 *   (e.g. useThemeStore.getState().applyPreset(preset)). If omitted, selection is
 *   local UI state only.
 */
export interface LandingPageProps {
  onApplyPreset?: (preset: ThemePreset) => void;
  onSubscribe?: (email: string) => void;
}

const accentClass: Record<string, string> = {
  cyan: styles.icCyan,
  gold: styles.icGold,
  navy: styles.icNavy,
};

const cellSymbol = { yes: "✓", no: "—", partial: "✓" } as const;
const cellClass = { yes: styles.yes, no: styles.no, partial: styles.partial } as const;

export default function LandingPage({ onApplyPreset, onSubscribe }: LandingPageProps) {
  const c = landingContent;
  const [activePreset, setActivePreset] = useState(
    c.themePresets.presets.find((p) => p.default)?.id ?? c.themePresets.presets[0].id
  );
  const [email, setEmail] = useState("");

  const handlePreset = (preset: ThemePreset) => {
    setActivePreset(preset.id);
    onApplyPreset?.(preset);
  };

  return (
    <div className={styles.page}>
      {/* ===== NAV ===== */}
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navRow}`}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}><LogoGlyph /></span>
            <span>{c.nav.brand.name}<span className={styles.logoSub}>{c.nav.brand.sub}</span></span>
          </Link>
          <div className={styles.navLinks}>
            {c.nav.links.map((l) => (
              <Link key={l.label} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div className={styles.navRight}>
            <Link href={c.nav.signInHref} className={styles.signin}>Sign in</Link>
            <Link href={c.nav.cta.href} className={`${styles.btn} ${styles.btnGold}`}>{c.nav.cta.label}</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className={styles.hero}>
        <span className={`${styles.glow} ${styles.glow1}`} />
        <span className={`${styles.glow} ${styles.glow2}`} />
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <div>
            <span className={styles.heroPill}><span className={styles.heroPillDot} />{c.hero.pill}</span>
            <h1 className={styles.heroH1}>
              {c.hero.headingLines.map((line, i) => (
                <React.Fragment key={i}>
                  <span className={i === c.hero.headingLines.length - 1 ? styles.gold : undefined}>{line}</span>
                  {i < c.hero.headingLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className={styles.heroSub}>{c.hero.subtitle}</p>
            <div className={styles.heroCtas}>
              <Link href={c.hero.primaryCta.href} className={`${styles.btn} ${styles.btnGold} ${styles.btnLg}`}>{c.hero.primaryCta.label} →</Link>
              <Link href={c.hero.secondaryCta.href} className={`${styles.btn} ${styles.btnGhost} ${styles.btnGhostLight} ${styles.btnLg}`}>▶ {c.hero.secondaryCta.label}</Link>
            </div>
            <div className={styles.heroMicro}>
              {c.hero.microPoints.map((m) => (
                <span key={m}><CheckGlyph size={15} />{m}</span>
              ))}
            </div>
          </div>

          {/* Coded product UI mockup (not an iframe / not embedded) */}
          <AppMockup activePreset={c.themePresets.presets.find((p) => p.id === activePreset)} />
        </div>
      </header>

      {/* ===== TRUST ===== */}
      <section className={styles.trust}>
        <div className={styles.wrap}>
          <p className={styles.trustLead}>{c.trust.lead}</p>
          <div className={styles.trustLogos}>
            {c.trust.logos.map((l) => <span key={l}>{l}</span>)}
          </div>
        </div>
      </section>

      {/* ===== COMPARISON + PRODUCTS ===== */}
      <section className={styles.section} id="products">
        <div className={styles.wrap}>
          <div className={styles.sHead}>
            <span className={styles.eyebrow}>{c.comparison.eyebrow}</span>
            <h2>{c.comparison.heading}</h2>
            <p>{c.comparison.subtitle}</p>
          </div>

          <div className={styles.cmp}>
            <div className={styles.cmpScroll}>
              <table>
                <thead>
                  <tr>
                    <th>Capability</th>
                    {c.comparison.columns.map((col) => (
                      <th key={col.label}>
                        {col.label}
                        {col.status === "soon" && <span className={styles.colsoon}>COMING SOON</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.comparison.rows.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      {row.cells.map((cell, i) => (
                        <td key={i} className={cellClass[cell]}>{cellSymbol[cell]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.prod}>
            {c.products.map((p) => {
              const Icon = productGlyph[p.iconKey];
              return (
                <div className={styles.pcard} key={p.id}>
                  <div className={`${styles.pico} ${accentClass[p.accent]}`}><Icon /></div>
                  <h3>{p.title} <span className={`${styles.badge} ${p.status === "live" ? styles.badgeLive : styles.badgeSoon}`}>{p.status === "live" ? "LIVE" : "COMING SOON"}</span></h3>
                  <p className={styles.pcardDesc}>{p.description}</p>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}>
                        <span style={{ color: p.status === "live" ? "var(--teal)" : "var(--gold-deep)", display: "inline-flex" }}><CheckGlyph size={16} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.link.href} className={`${styles.plink} ${p.status === "soon" ? styles.plinkSoon : ""}`}>{p.link.label} →</Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== THEME PRESETS ===== */}
      <section className={`${styles.section} ${styles.sectionSoft}`} id="themes">
        <div className={styles.wrap}>
          <div className={styles.sHead}>
            <span className={styles.eyebrow}>{c.themePresets.eyebrow}</span>
            <h2>{c.themePresets.heading}</h2>
            <p>{c.themePresets.subtitle}</p>
          </div>
          <div className={styles.themes}>
            {c.themePresets.presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`${styles.tcard} ${activePreset === preset.id ? styles.tcardActive : ""}`}
              >
                <div className={styles.tpal}>
                  {preset.palette.map((hex, i) => <i key={i} style={{ background: hex }} />)}
                </div>
                <div className={styles.tnm}>{preset.name}</div>
                <div className={styles.tct}>{preset.category}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className={styles.section} id="how">
        <div className={styles.wrap}>
          <div className={styles.sHead}>
            <span className={styles.eyebrow}>{c.howItWorks.eyebrow}</span>
            <h2>{c.howItWorks.heading}</h2>
          </div>
          <div className={styles.steps}>
            {c.howItWorks.steps.map((s, i) => (
              <div key={s.title} className={`${styles.step} ${s.gold ? styles.stepGold : ""}`}>
                <div className={styles.stepN}>{i + 1}</div>
                <h4>{s.title}</h4>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROADMAP ===== */}
      <section className={`${styles.section} ${styles.sectionSoft}`} id="roadmap">
        <div className={styles.wrap}>
          <div className={styles.roadmapWrap}>
            <div>
              <span className={styles.eyebrow}>{c.roadmap.eyebrow}</span>
              <h2 className={styles.roadmapHeading}>{c.roadmap.heading}</h2>
              <div className={styles.timeline}>
                {c.roadmap.items.map((item) => (
                  <div key={item.title} className={`${styles.tl} ${item.state === "done" ? styles.tlDone : styles.tlNext}`}>
                    <div className={styles.tlQ}>{item.period}</div>
                    <h4>{item.title} {item.badge && <span className={`${styles.badge} ${styles.badgeSoon}`}>{item.badge}</span>}</h4>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.roadmapCard}>
              <span className={styles.roadmapCardGlow} />
              <span className={styles.eyebrow}>{c.roadmap.highlight.eyebrow}</span>
              <h3>{c.roadmap.highlight.title} <span className={`${styles.badge} ${styles.badgeSoon}`}>{c.roadmap.highlight.badge}</span></h3>
              <p>{c.roadmap.highlight.description}</p>
              <Link href={c.roadmap.highlight.cta.href} className={`${styles.btn} ${styles.btnGold} ${styles.btnLg}`}>{c.roadmap.highlight.cta.label} →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.finalcta}>
            <div>
              <h3>{c.finalCta.heading}</h3>
              <p>{c.finalCta.subtitle}</p>
            </div>
            <div className={styles.finalctaBtns}>
              <Link href={c.finalCta.primaryCta.href} className={`${styles.btn} ${styles.btnGold} ${styles.btnLg}`}>{c.finalCta.primaryCta.label} →</Link>
              <Link href={c.finalCta.secondaryCta.href} className={`${styles.btn} ${styles.btnGhost} ${styles.btnLg}`}>{c.finalCta.secondaryCta.label}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerTop}>
            <div>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoMark}><LogoGlyph /></span>
                <span>{c.footer.brand.name}<span className={styles.logoSub}>{c.footer.brand.sub}</span></span>
              </Link>
              <p className={styles.footerBlurb}>{c.footer.blurb}</p>
              <div className={styles.social}>
                <a href="#" aria-label="LinkedIn" style={{ color: "#a9b6cc" }}><LinkedInGlyph /></a>
                <a href="#" aria-label="YouTube" style={{ color: "#a9b6cc" }}><YouTubeGlyph /></a>
              </div>
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title}>
                <h5>{col.title}</h5>
                <ul>
                  {col.links.map((l) => <li key={l.label}><Link href={l.href}>{l.label}</Link></li>)}
                </ul>
              </div>
            ))}
            <div className={styles.news}>
              <h5>{c.footer.newsletter.title}</h5>
              <p className={styles.newsDesc}>{c.footer.newsletter.description}</p>
              <input
                type="email"
                placeholder={c.footer.newsletter.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={() => onSubscribe?.(email)}>
                {c.footer.newsletter.cta}
              </button>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>{c.footer.legal}</span>
            <span>{c.footer.legalLinks.join(" · ")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---- Coded product UI mockup (decorative, reflects active preset) ---- */
function AppMockup({ activePreset }: { activePreset?: ThemePreset }) {
  const pal = activePreset?.palette ?? ["#1B3A6B", "#0093B2", "#9FB0C8", "#F2C811"];
  return (
    <div className={styles.app}>
      <div className={styles.appTop}>
        <span className={styles.appName}><span className={styles.appNameM} />Datacense Theme Studio</span>
        <span className={styles.appCrumb}>Theme Builder · <b style={{ color: "#cdd8e8" }}>{activePreset?.name ?? "Corporate Gold"}</b>
          <span className={styles.appPub}>Publish Theme</span>
        </span>
      </div>
      <div className={styles.appBody}>
        <div className={styles.appSide}>
          {["Layout Builder", "Theme Builder", "Icons Library"].map((label) => (
            <div key={label} className={`${styles.appIt} ${label === "Theme Builder" ? styles.appItOn : ""}`}>
              <span className={styles.appSq} />{label}
            </div>
          ))}
          <div style={{ height: 14 }} />
          {["My Assets", "Teams", "Settings"].map((label) => (
            <div key={label} className={styles.appIt}><span className={styles.appSq} />{label}</div>
          ))}
        </div>
        <div className={styles.appMain}>
          <div className={styles.appH}>{activePreset?.name ?? "Corporate Gold"}</div>
          <div className={styles.appTabs}>
            <span className={styles.appTabA}>Colors</span><span>Typography</span><span>Visuals</span><span>Settings</span>
          </div>
          <div className={styles.appLbl}>Primary palette</div>
          <div className={styles.swrow}>
            {[...pal, "#9fb0c8", "#eef2f8"].slice(0, 6).map((hex, i) => (
              <span key={i} className={styles.sw} style={{ background: hex }} />
            ))}
          </div>
          <div className={styles.appLbl}>Sample preview</div>
          <div className={styles.charts}>
            <div className={styles.cbox}>
              <div className={styles.ct}>Revenue by month</div>
              <div className={styles.bars}>
                {[45, 70, 55, 88, 62, 78].map((h, i) => (
                  <i key={i} style={{ height: `${h}%`, background: pal[i % pal.length] }} />
                ))}
              </div>
            </div>
            <div className={styles.cbox}>
              <div className={styles.ct}>Sales by region</div>
              <div
                className={styles.donut}
                style={{ background: `conic-gradient(${pal[0]} 0 42%, ${pal[1]} 42% 70%, ${pal[3]} 70% 88%, #cdd8e8 88% 100%)` }}
              >
                <div className={styles.donutHole} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
