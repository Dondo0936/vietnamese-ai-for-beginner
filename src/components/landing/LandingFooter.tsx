import Link from "next/link";

/**
 * Landing footer — trimmed version of the design.
 *
 * User-requested deltas vs. the design bundle:
 *   - Remove "Type: Space Grotesk · Inter Tight · Be Vietnam Pro"
 *   - Remove "Built with Claude Opus 4.7"
 *
 * Keep only the © + MIT License line at the bottom.
 */
export function LandingFooter() {
  return (
    <footer className="ld-foot">
      <div className="ld-foot__top">
        <div className="ld-foot__brand">
          <span className="ld-star" aria-hidden="true">
            <i />
            <em />
          </span>
          <div>
            <b>udemi.tech</b>
            <span>AI cho mọi người · tiếng Việt</span>
          </div>
        </div>
        <div className="ld-foot__cols">
          <div>
            <h5>Lộ trình</h5>
            <Link href="/paths/student">Học sinh · SV</Link>
            <Link href="/paths/office">Văn phòng</Link>
            <Link href="/paths/ai-engineer">AI Engineer</Link>
            <Link href="/paths/ai-researcher">AI Researcher</Link>
          </div>
          <div>
            <h5>Nội dung</h5>
            <Link href="/browse">Tất cả chủ đề</Link>
            <Link href="/claude">Cẩm nang Claude</Link>
            <Link href="/paths/office">Ứng dụng thực tế</Link>
            <Link href="/browse">Mới tuần này</Link>
          </div>
          <div>
            <h5>Cộng đồng</h5>
            <a
              href="https://github.com/anthropics/ai-edu-v2"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub ↗
            </a>
            <a
              href="https://github.com/anthropics/ai-edu-v2/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer noopener"
            >
              Đóng góp bài
            </a>
            <a
              href="https://github.com/anthropics/ai-edu-v2/issues"
              target="_blank"
              rel="noreferrer noopener"
            >
              Báo lỗi
            </a>
          </div>
          <div>
            <h5>Giới thiệu</h5>
            <Link href="#process">Triết lý</Link>
            <Link href="/claude">Hệ thiết kế</Link>
            <Link href="/demo">Demo video</Link>
          </div>
        </div>
      </div>
      <div className="ld-foot__bot">
        <span>© 2026 @Dondo0936 · MIT License</span>
      </div>
    </footer>
  );
}
