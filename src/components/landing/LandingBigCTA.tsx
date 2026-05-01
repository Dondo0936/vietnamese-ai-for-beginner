import Link from "next/link";

/**
 * The closing CTA — black card, huge italic headline, primary + ghost
 * buttons, meta strip with license and tracking disclaimers.
 */
export function LandingBigCTA() {
  return (
    <section className="ld-cta" id="cta">
      <span className="ld-cta__eyebrow">(08) bắt đầu</span>
      <h2 className="ld-cta__h">
        Thôi nào,<br />
        <em>học thử đi.</em>
      </h2>
      <p>Không cần email. Tiến độ lưu ẩn danh. 30 giây là vào bài đầu tiên.</p>
      <div className="ld-cta__buttons">
        <Link href="/browse" className="ld-cta__primary">
          Mở udemi.tech →
        </Link>
        <Link href="/demo" className="ld-cta__ghost">
          Xem demo 30s ▶
        </Link>
      </div>
      <div className="ld-cta__meta">
        <span>MIT license</span>
        <span>·</span>
        <span>không quảng cáo</span>
        <span>·</span>
        <span>không tracking</span>
        <span>·</span>
        <span>chạy trên Vercel</span>
      </div>
    </section>
  );
}
