import Link from "next/link";
import { SECTIONS } from "@/components/resources/data";

/**
 * Landing slot (06): "Editorial Library, shelf + index" placement
 * for the /resources catalog. Split card: left runs hero copy + stat
 * pills + decorative shelf SVG; right runs a 5-row Mục lục index
 * linking to anchors on /resources.
 *
 * Stats are derived live from `resources/data.ts`, so they cannot
 * drift from the catalog they advertise.
 */
export function LandingResources() {
  // Live counts from the catalog
  const allItems = SECTIONS.flatMap((s) =>
    s.kind === "list" ? s.cats.flatMap((c) => c.items) : [],
  );
  const totalCount = allItems.length;
  const paidCount = allItems.filter((i) =>
    i.tags?.some((t) => t.kind === "paid"),
  ).length;
  const freeCount = totalCount - paidCount;

  const indexRows: { num: string; label: string; preview: string }[] = [
    {
      num: "01",
      label: "Sách",
      preview: "Probabilistic ML · ISL · Deep Learning Book",
    },
    {
      num: "02",
      label: "Khoá học",
      preview: "Andrew Ng · fast.ai · MIT 6.S191",
    },
    {
      num: "03",
      label: "Blog và Podcast",
      preview: "Distill · Karpathy · Lilian Weng · TWIML",
    },
    {
      num: "04",
      label: "Lộ trình cho người mới",
      preview: "5 bước từ Coursera đến ESL",
    },
    {
      num: "05",
      label: "Sự kiện và Meetup",
      preview: "Toàn cầu · trực tuyến · miễn phí",
    },
  ];

  return (
    <section
      className="ld-resources"
      aria-labelledby="resources-title"
    >
      <div className="ld-resources__grid">
        {/* ── Left: editorial card ── */}
        <article className="ld-resources__card">
          <span className="ld-resources__eyebrow">§ 06 · Tài nguyên</span>

          <h2 className="ld-resources__title" id="resources-title">
            Tủ sách <em>được tuyển chọn</em>,
            <br />
            dịch sang tiếng Việt.
          </h2>

          <p className="ld-resources__lede">
            {totalCount}+ sách, khoá học, blog và podcast do cộng đồng{" "}
            <i>awesome-machine-learning</i> tổng hợp. Chỉ giữ lại nguồn
            còn được duy trì trong 12 tháng qua, mỗi mục có chú thích
            tiếng Việt.
          </p>

          <div className="ld-resources__stats">
            <span className="ld-resources__stat ld-resources__stat--free">
              Miễn phí · {freeCount}
            </span>
            <span className="ld-resources__stat ld-resources__stat--paid">
              Trả phí · {paidCount}
            </span>
            <span className="ld-resources__stat ld-resources__stat--fresh">
              Cập nhật 04 / 26
            </span>
          </div>

          <Link href="/resources" className="ld-resources__cta">
            <span>Mở thư mục Tài nguyên</span>
            <span aria-hidden="true">→</span>
          </Link>

          <ShelfSvg />
        </article>

        {/* ── Right: index ── */}
        <ol className="ld-resources__index" aria-label="Mục lục">
          <li className="ld-resources__indexHead">
            <span>Mục lục</span>
            <span className="ld-resources__source">
              nguồn:{" "}
              <a
                href="https://github.com/josephmisiti/awesome-machine-learning"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/josephmisiti/awesome-machine-learning
              </a>
            </span>
          </li>

          {indexRows.map((row) => {
            const id = ["books", "courses", "blogs", "curriculum", "events"][
              parseInt(row.num, 10) - 1
            ];
            return (
              <li key={row.num} className="ld-resources__indexItem">
                <Link href={`/resources#${id}`}>
                  <span className="ld-resources__indexNum">{row.num}</span>
                  <span className="ld-resources__indexBody">
                    <span className="ld-resources__indexLabel">
                      {row.label}
                    </span>
                    <span className="ld-resources__indexPreview">
                      {row.preview}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/**
 * Decorative book-shelf: vertical bars in alternating turquoise /
 * peach / neutral tones, with subtle height variance to read as a row
 * of book spines. Pure SVG so it scales and inherits color tokens.
 */
function ShelfSvg() {
  // Each bar: [height, color-class]
  const bars: Array<[number, string]> = [
    [78, "a"],
    [92, "n"],
    [60, "p"],
    [84, "a"],
    [70, "n"],
    [88, "a"],
    [54, "p"],
    [76, "n"],
    [82, "a"],
    [66, "p"],
    [90, "a"],
    [72, "n"],
  ];
  return (
    <svg
      className="ld-resources__shelf"
      viewBox="0 0 200 100"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map(([h, c], i) => (
        <rect
          key={i}
          x={i * 16 + 4}
          y={100 - h}
          width={10}
          height={h}
          rx={2}
          className={`ld-resources__bar ld-resources__bar--${c}`}
        />
      ))}
      <line
        x1={0}
        y1={99}
        x2={200}
        y2={99}
        className="ld-resources__shelfLine"
      />
    </svg>
  );
}
