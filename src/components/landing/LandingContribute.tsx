import Link from "next/link";

/**
 * Contribute section — GitHub CTA + primitives link.
 *
 * Anchors the audience's secondary intent (devs looking for a content
 * base to contribute to) in the same page the learners see.
 */
export function LandingContribute() {
  return (
    <section className="ld-contribute" id="contribute">
      <div className="ld-contribute__inner">
        <div>
          <span className="ld-section__eyebrow">(06) không tìm thấy?</span>
          <h2>
            Góp bài.<br />
            <em>Mỗi topic là một file React.</em>
          </h2>
        </div>
        <div className="ld-contribute__body">
          <p>
            Mỗi chủ đề sống ở <code>src/topics/*.tsx</code> — export một component{" "}
            <code>&quot;use client&quot;</code> kèm <code>metadata</code> riêng. Pull request
            chào đón. Có template sẵn ở <code>src/topics/_template.tsx</code> theo bố cục 8
            bước.
          </p>
          <div className="ld-contribute__cta">
            <a
              href="https://github.com/anthropics/ai-edu-v2/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer noopener"
              className="ld-btn ld-btn--primary"
              style={{ padding: "14px 22px", fontSize: 15 }}
            >
              Đọc CONTRIBUTING.md →
            </a>
            <Link href="/claude" className="ld-link">
              Xem 47 primitive sẵn có →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
