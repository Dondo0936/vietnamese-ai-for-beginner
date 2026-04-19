/**
 * Stack strip — the real production stack, no filler.
 */
const ITEMS = [
  "Next.js 16",
  "React 19",
  "Supabase",
  "Tailwind v4",
  "Framer Motion",
  "KaTeX",
  "Fuse.js",
  "Remotion 4",
  "Vercel",
];

export function LandingStack() {
  return (
    <section className="ld-stack">
      <div className="ld-stack__left">
        <span className="ld-section__eyebrow">(05) xây bằng</span>
        <h3>Stack hiện đại. Code mở. Không tracking.</h3>
      </div>
      <div className="ld-stack__logos">
        {ITEMS.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </section>
  );
}
