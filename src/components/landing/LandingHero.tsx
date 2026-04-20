import Link from "next/link";
import { AttentionDemoCard } from "./AttentionDemoCard";

/**
 * Landing hero — split layout: editorial headline + stats counters
 * on the left, animated AttentionDemoCard on the right.
 *
 * The `<s>` on "đọc tường chữ." is a turquoise-struck design choice,
 * carried verbatim from `LandingDetail.jsx`.
 */
export function LandingHero() {
  return (
    <section className="ld-hero" id="hero">
      <div>
        <div className="ld-eyebrow">
          <span className="ld-dot" /> nền tảng giáo dục AI · mã nguồn mở · 2026
        </div>
        <h1 className="ld-h1">
          Học AI<br />
          không cần<br />
          <s className="ld-strike">biết tiếng Anh.</s>
        </h1>
        <p className="ld-lede">
          260+ chủ đề viết lại cho người Việt 
          Hình minh hoạ, bảng điều khiển, biểu đồ, giải thích. 
          Mỗi bài đi qua tám bước:
          đoán, hình, à-ha, thử, hiểu, tóm, quiz.
        </p>
        <div className="ld-cta-row">
          <Link
            href="/browse"
            className="ld-btn ld-btn--primary"
            style={{ padding: "14px 22px", fontSize: 15 }}
          >
            Mở udemi.tech →
          </Link>
          <Link href="#paths" className="ld-link">
            Xem 4 lộ trình →
          </Link>
          <span className="ld-cta-note">
            không cần email · tiến độ lưu ẩn danh
          </span>
        </div>
        <div className="ld-counters">
          {[
            ["260+", "chủ đề"],
            ["47", "primitive tương tác"],
            ["4", "lộ trình"],
            ["~278h", "nội dung"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="ld-counter__n">{n}</div>
              <div className="ld-counter__l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <AttentionDemoCard />
    </section>
  );
}
