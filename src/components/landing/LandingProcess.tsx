import Link from "next/link";

/**
 * The 8-step LessonSection template rendered as a 4×2 bordered grid.
 */

const STEPS: [string, string, string][] = [
  ["01", "Dự đoán", "Đoán kết quả trước khi học — não ghi nhớ tốt hơn khi đã cam kết."],
  ["02", "Ẩn dụ", "So với chợ, phở, Grab, Shopee. Khái niệm kỹ thuật đầu tiên phải chạm đời sống."],
  ["03", "Trực quan", "Slider, drag-drop, toggle-compare. Bạn tự kéo; không phải xem."],
  ["04", "Khoảnh khắc à-ha", "Một dòng chốt ý — thời điểm mọi thứ click vào vị trí."],
  ["05", "Thử thách", "Tự làm trong 30 giây. Sai cũng không sao — có feedback ngay."],
  ["06", "Giải thích", "Lý thuyết đủ dùng. Không ngập ký hiệu toán trừ khi cần."],
  ["07", "Tóm tắt", "Một dòng mang về. Nếu chỉ nhớ một thứ, là thứ này."],
  ["08", "Quiz", "3 câu kiểm tra. Không phải để chấm — để neo kiến thức."],
];

export function LandingProcess() {
  return (
    <section className="ld-process" id="process">
      <div className="ld-section__head">
        <span className="ld-section__eyebrow">
          (03) cách một bài học hoạt động
        </span>
        <h2 className="ld-section__title">
          Tám bước.<br />
          <em>Mỗi bài đi qua đủ tám.</em>
        </h2>
        <Link href="/topics/what-is-ml" className="ld-section__link">
          Xem bài mẫu →
        </Link>
      </div>
      <div className="ld-process__grid">
        {STEPS.map(([n, t, d], i) => (
          <div key={n} className="ld-step">
            <div className="ld-step__head">
              <span className="ld-step__n">/ {n}</span>
              {i < STEPS.length - 1 && (
                <span className="ld-step__arrow" aria-hidden="true">→</span>
              )}
            </div>
            <h4>{t}</h4>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
