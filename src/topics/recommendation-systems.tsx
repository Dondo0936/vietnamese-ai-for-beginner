"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "recommendation-systems",
  title: "Recommendation Systems",
  titleVi: "Hệ thống gợi ý",
  description:
    "Hệ thống gợi ý sản phẩm, nội dung dựa trên lọc cộng tác, lọc nội dung và phương pháp lai",
  category: "applied-ai",
  tags: ["collaborative-filtering", "content-based", "personalization"],
  difficulty: "intermediate",
  relatedSlugs: ["embedding-model", "multi-armed-bandit", "k-means"],
  vizType: "interactive",
};

const users = ["An", "Bình", "Cúc", "Dũng", "Bạn"];
const items = ["Avengers", "John Wick", "Frozen", "Parasite", "Tenet"];

const initialRatings: (number | null)[][] = [
  [5, 4, 1, 3, 5],
  [4, 5, 2, null, 4],
  [1, 2, 5, 4, 1],
  [2, null, 4, 5, 2],
  [null, null, null, null, null],
];

export default function RecommendationSystemsTopic() {
  const [ratings, setRatings] = useState<(number | null)[][]>(
    initialRatings.map((row) => [...row])
  );

  const userIdx = 4; // "Bạn"

  const handleRate = (col: number) => {
    setRatings((prev) => {
      const next = prev.map((row) => [...row]);
      const current = next[userIdx][col];
      if (current === null) {
        next[userIdx][col] = 3;
      } else if (current < 5) {
        next[userIdx][col] = current + 1;
      } else {
        next[userIdx][col] = null;
      }
      return next;
    });
  };

  // Simple collaborative filtering: find most similar user to "Bạn"
  const yourRatings = ratings[userIdx];
  const ratedCols = yourRatings
    .map((r, i) => (r !== null ? i : -1))
    .filter((i) => i >= 0);

  let bestSim = -1;
  let bestUser = 0;
  for (let u = 0; u < userIdx; u++) {
    if (ratedCols.length === 0) break;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (const c of ratedCols) {
      const a = yourRatings[c]!;
      const b = ratings[u][c];
      if (b !== null) {
        dot += a * b;
        magA += a * a;
        magB += b * b;
      }
    }
    const sim = magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
    if (sim > bestSim) {
      bestSim = sim;
      bestUser = u;
    }
  }

  // Predict missing ratings
  const predictions = items.map((_, col) => {
    if (yourRatings[col] !== null) return null;
    const val = ratings[bestUser][col];
    return val;
  });

  const cellW = 80;
  const cellH = 32;
  const labelW = 60;
  const labelH = 28;
  const svgW = labelW + items.length * cellW + 10;
  const svgH = labelH + users.length * cellH + 60;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>người bạn rất hiểu gu phim</strong> của bạn.
          Mỗi khi bạn hỏi &quot;Nên xem phim gì?&quot;, họ sẽ nói:{" "}
          <em>
            &quot;Bạn thích phim hành động của Marvel, nên chắc bạn cũng sẽ thích John
            Wick!&quot;
          </em>
        </p>
        <p>
          Người bạn này dùng hai chiến lược: <strong>Lọc cộng tác</strong> — xem những người
          có gu tương tự bạn thích gì (giống như hỏi ý kiến nhóm bạn cùng gu);{" "}
          <strong>Lọc theo nội dung</strong> — phân tích đặc điểm phim bạn thích (hành động,
          gay cấn, diễn viên yêu thích) rồi tìm phim tương tự. Hệ thống gợi ý trên Shopee,
          Netflix hay Spotify hoạt động đúng như vậy!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Nhấp vào ô trong hàng <strong>&quot;Bạn&quot;</strong> để đánh giá phim (1–5 sao,
            nhấp tiếp để xoá). Hệ thống sẽ tìm người dùng tương tự và dự đoán phim bạn có
            thể thích.
          </p>
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full max-w-2xl mx-auto rounded-lg border border-border bg-background"
          >
            {/* Column headers — movie names */}
            {items.map((item, col) => (
              <text
                key={`h-${col}`}
                x={labelW + col * cellW + cellW / 2}
                y={labelH - 8}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                fontWeight="bold"
              >
                {item}
              </text>
            ))}

            {/* Rows */}
            {users.map((user, row) => (
              <g key={`row-${row}`}>
                {/* Row label */}
                <text
                  x={labelW - 8}
                  y={labelH + row * cellH + cellH / 2 + 4}
                  textAnchor="end"
                  fill={row === userIdx ? "#f59e0b" : "#e2e8f0"}
                  fontSize={10}
                  fontWeight={row === userIdx ? "bold" : "normal"}
                >
                  {user}
                </text>

                {/* Cells */}
                {items.map((_, col) => {
                  const val = ratings[row][col];
                  const isPrediction =
                    row === userIdx && val === null && predictions[col] !== null;
                  const isUserRow = row === userIdx;
                  const isHighlightedUser = row === bestUser && ratedCols.length > 0;
                  return (
                    <g
                      key={`cell-${row}-${col}`}
                      onClick={isUserRow ? () => handleRate(col) : undefined}
                      style={isUserRow ? { cursor: "pointer" } : undefined}
                    >
                      <rect
                        x={labelW + col * cellW + 2}
                        y={labelH + row * cellH + 2}
                        width={cellW - 4}
                        height={cellH - 4}
                        rx={4}
                        fill={
                          isHighlightedUser
                            ? "#1e3a5f"
                            : isUserRow
                              ? "#2d2006"
                              : "#1e293b"
                        }
                        stroke={
                          isPrediction
                            ? "#22c55e"
                            : isHighlightedUser
                              ? "#3b82f6"
                              : isUserRow
                                ? "#f59e0b"
                                : "#334155"
                        }
                        strokeWidth={isPrediction || isUserRow ? 1.5 : 0.5}
                        strokeDasharray={isPrediction ? "4,2" : "none"}
                      />
                      <text
                        x={labelW + col * cellW + cellW / 2}
                        y={labelH + row * cellH + cellH / 2 + 4}
                        textAnchor="middle"
                        fill={
                          isPrediction
                            ? "#22c55e"
                            : val !== null
                              ? "#e2e8f0"
                              : "#475569"
                        }
                        fontSize={10}
                        fontWeight={isPrediction ? "bold" : "normal"}
                      >
                        {isPrediction
                          ? `${predictions[col]}★?`
                          : val !== null
                            ? `${"★".repeat(val)}`
                            : "—"}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Legend */}
            {ratedCols.length > 0 && (
              <g>
                <rect x={labelW} y={labelH + users.length * cellH + 10} width={10} height={10} rx={2} fill="#1e3a5f" stroke="#3b82f6" strokeWidth={1} />
                <text x={labelW + 15} y={labelH + users.length * cellH + 19} fill="#94a3b8" fontSize={8}>
                  Người dùng tương tự nhất: {users[bestUser]} (sim={bestSim.toFixed(2)})
                </text>

                <rect x={labelW + 250} y={labelH + users.length * cellH + 10} width={10} height={10} rx={2} fill="none" stroke="#22c55e" strokeWidth={1} strokeDasharray="3,1" />
                <text x={labelW + 265} y={labelH + users.length * cellH + 19} fill="#94a3b8" fontSize={8}>
                  Dự đoán từ lọc cộng tác
                </text>
              </g>
            )}
          </svg>
          <button
            onClick={() => setRatings(initialRatings.map((row) => [...row]))}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hệ thống gợi ý (Recommendation Systems)</strong> là công nghệ AI giúp
          dự đoán sản phẩm, nội dung hoặc dịch vụ mà người dùng có thể quan tâm. Đây là
          công nghệ đằng sau gợi ý phim trên Netflix, sản phẩm trên Shopee và bài hát trên
          Spotify.
        </p>
        <p>Các phương pháp chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lọc cộng tác (Collaborative Filtering):</strong> Dựa trên hành vi của
            những người dùng tương tự. &quot;Người giống bạn cũng thích sản phẩm này&quot; —
            không cần biết nội dung sản phẩm, chỉ cần mẫu đánh giá.
          </li>
          <li>
            <strong>Lọc theo nội dung (Content-Based):</strong> Phân tích đặc điểm của sản
            phẩm bạn đã thích (thể loại, đạo diễn, diễn viên) rồi tìm sản phẩm có đặc
            điểm tương tự.
          </li>
          <li>
            <strong>Phương pháp lai (Hybrid):</strong> Kết hợp cả hai — Netflix dùng cách
            này để tận dụng ưu điểm của cả hai phương pháp.
          </li>
          <li>
            <strong>Phân rã ma trận (Matrix Factorization):</strong> Biến ma trận đánh giá
            thưa thớt thành tích của hai ma trận nhỏ hơn, giúp phát hiện &quot;đặc trưng
            ẩn&quot; (latent features) mà người dùng và sản phẩm chia sẻ.
          </li>
        </ol>
        <p>
          <strong>Vấn đề khởi đầu lạnh (Cold Start):</strong> Khi người dùng mới hoặc sản
          phẩm mới chưa có dữ liệu đánh giá, hệ thống không có cơ sở để gợi ý. Giải pháp
          thường dùng: hỏi sở thích ban đầu, gợi ý sản phẩm phổ biến, hoặc dùng thông tin
          nhân khẩu học.
        </p>
      </ExplanationSection>
    </>
  );
}
