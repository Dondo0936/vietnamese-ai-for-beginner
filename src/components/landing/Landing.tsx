import "./landing.css";
import { topicList } from "@/topics/registry";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingSearch } from "./LandingSearch";
import { LandingMarquee } from "./LandingMarquee";
import { LandingPaths } from "./LandingPaths";
import { LandingFeatured } from "./LandingFeatured";
import { LandingProcess } from "./LandingProcess";
import { LandingQuotes } from "./LandingQuotes";
import { LandingStack } from "./LandingStack";
import { LandingContribute } from "./LandingContribute";
import { LandingBigCTA } from "./LandingBigCTA";
import { LandingFooter } from "./LandingFooter";

/**
 * Landing page shell.
 *
 * Composed from the sections mocked in `Landing Page.html` from the
 * Anthropic design bundle (2026-04-19). Each section lives in its own
 * file so individual changes stay local.
 *
 * Mounted at `/` — intentionally NOT wrapped in `AppShell`, because
 * the landing ships its own `LandingNav` + `LandingFooter`.
 */
export default function Landing() {
  return (
    <div className="ld">
      <LandingNav />
      <main className="ld-main" id="main-content">
        <LandingHero />
        <LandingSearch topics={topicList} />
        <LandingMarquee />
        <LandingPaths />
        <LandingFeatured />
        <LandingProcess />
        <LandingQuotes />
        <LandingStack />
        <LandingContribute />
        <LandingBigCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
