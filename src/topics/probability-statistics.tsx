"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "probability-statistics",
  title: "Probability & Statistics",
  titleVi: "Xác suất & Thống kê cơ bản",
  description:
    "Phân phối xác suất, kỳ vọng, phương sai và định lý Bayes — công cụ cốt lõi cho ML",
  category: "math-foundations",
  tags: ["probability", "distribution", "bayes"],
  difficulty: "beginner",
  relatedSlugs: ["naive-bayes", "logistic-regression", "loss-functions"],
  vizType: "interactive",
};

function normalPdf(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * ((x - mu) / sigma) ** 2;
  return coeff * Math.exp(exponent);
}

export default function ProbabilityStatisticsTopic() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);

  const svgW = 600;
  const svgH = 300;
  const pad = 40;
  const xMin = -6;
  const xMax = 6;

  // Generate curve
  const steps = 200;
  const maxY = normalPdf(mean, mean, stdDev);
  const yMax = maxY * 1.3;

  const toX = (x: number) =>
    pad + ((x - xMin) / (xMax - xMin)) * (svgW - 2 * pad);
  const toY = (y: number) =>
    svgH - pad - (y / yMax) * (svgH - 2 * pad);

  const curvePoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = normalPdf(x, mean, stdDev);
    curvePoints.push(`${toX(x)},${toY(y)}`);
  }

  // Area under +/- 1 std dev
  const areaPoints: string[] = [];
  const aStart = Math.max(xMin, mean - stdDev);
  const aEnd = Math.min(xMax, mean + stdDev);
  areaPoints.push(`${toX(aStart)},${toY(0)}`);
  for (let i = 0; i <= 80; i++) {
    const x = aStart + (i / 80) * (aEnd - aStart);
    const y = normalPdf(x, mean, stdDev);
    areaPoints.push(`${toX(x)},${toY(y)}`);
  }
  areaPoints.push(`${toX(aEnd)},${toY(0)}`);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>dự báo thời tiết ở TP. Hồ Chí Minh</strong>.
          Khi nghe &quot;70% khả năng mưa vào buổi chiều&quot;, đó chính là một{" "}
          <strong>phân phối xác suất</strong> — một cách gán con số cho mức độ chắc
          chắn của sự kiện.
        </p>
        <p>
          Bây giờ, nếu bạn nhìn ra ngoài thấy <strong>trời đang u ám</strong>, bạn
          cập nhật: &quot;Hmm, có mây rồi, chắc 90% sẽ mưa.&quot; Đó chính là{" "}
          <strong>định lý Bayes</strong> — cập nhật niềm tin khi có bằng chứng mới.
          P(mưa | mây) &gt; P(mưa) vì bằng chứng &quot;mây&quot; làm tăng xác suất mưa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Điều chỉnh trung bình (&mu;) và độ lệch chuẩn (&sigma;) để xem phân phối
            chuẩn thay đổi. Vùng tô màu = 68.2% dữ liệu nằm trong &plusmn;1&sigma;.
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* X axis */}
            <line
              x1={pad}
              y1={toY(0)}
              x2={svgW - pad}
              y2={toY(0)}
              stroke="#64748b"
              strokeWidth={1}
            />

            {/* Tick marks */}
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((v) => (
              <g key={`tick-${v}`}>
                <line
                  x1={toX(v)}
                  y1={toY(0)}
                  x2={toX(v)}
                  y2={toY(0) + 5}
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <text
                  x={toX(v)}
                  y={toY(0) + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Shaded area ±1σ */}
            <polygon
              points={areaPoints.join(" ")}
              fill="#3b82f6"
              opacity={0.2}
            />

            {/* Bell curve */}
            <polyline
              points={curvePoints.join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Mean line */}
            <line
              x1={toX(mean)}
              y1={toY(0)}
              x2={toX(mean)}
              y2={toY(maxY)}
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={toX(mean)}
              y={toY(maxY) - 8}
              textAnchor="middle"
              fill="#f97316"
              fontSize="10"
              fontWeight="bold"
            >
              &mu; = {mean.toFixed(1)}
            </text>

            {/* Std dev markers */}
            {mean - stdDev >= xMin && (
              <line
                x1={toX(mean - stdDev)}
                y1={toY(0)}
                x2={toX(mean - stdDev)}
                y2={toY(normalPdf(mean - stdDev, mean, stdDev))}
                stroke="#22c55e"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}
            {mean + stdDev <= xMax && (
              <line
                x1={toX(mean + stdDev)}
                y1={toY(0)}
                x2={toX(mean + stdDev)}
                y2={toY(normalPdf(mean + stdDev, mean, stdDev))}
                stroke="#22c55e"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}

            {/* Label for 68.2% */}
            <text
              x={toX(mean)}
              y={toY(maxY * 0.3)}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="11"
              fontWeight="bold"
            >
              68.2%
            </text>

            {/* Labels */}
            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              Giá trị (x)
            </text>
            <text
              x={15}
              y={svgH / 2}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              transform={`rotate(-90, 15, ${svgH / 2})`}
            >
              Mật độ xác suất
            </text>

            {/* Info box */}
            <rect x={svgW - 170} y={10} width={155} height={50} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={svgW - 92} y={30} textAnchor="middle" fill="#e2e8f0" fontSize="10">
              &sigma; = {stdDev.toFixed(1)}
            </text>
            <text x={svgW - 92} y={48} textAnchor="middle" fill="#94a3b8" fontSize="9">
              Phương sai = {(stdDev * stdDev).toFixed(2)}
            </text>
          </svg>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Trung bình (&mu;):{" "}
                <strong className="text-foreground">{mean.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={mean}
                onChange={(e) => setMean(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Độ lệch chuẩn (&sigma;):{" "}
                <strong className="text-foreground">{stdDev.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={0.3}
                max={3}
                step={0.1}
                value={stdDev}
                onChange={(e) => setStdDev(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>Tập trung</span>
                <span>Phân tán</span>
              </div>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Xác suất và thống kê</strong> là ngôn ngữ toán học mà machine
          learning sử dụng để mô hình hóa sự không chắc chắn trong dữ liệu và dự
          đoán.
        </p>

        <p>Các khái niệm quan trọng:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Biến ngẫu nhiên (Random Variable):</strong> Đại lượng mà giá trị
            phụ thuộc vào kết quả ngẫu nhiên. Ví dụ: nhiệt độ ngày mai ở Đà Nẵng.
          </li>
          <li>
            <strong>Phân phối chuẩn (Normal Distribution):</strong> Đường cong hình
            chuông — mô hình hóa nhiều hiện tượng tự nhiên. 68.2% dữ liệu nằm trong
            &plusmn;1&sigma; và 95.4% nằm trong &plusmn;2&sigma;.
          </li>
          <li>
            <strong>Phân phối nhị thức (Binomial):</strong> Đếm số lần &quot;thành
            công&quot; trong n phép thử. Ví dụ: tung đồng xu 10 lần, bao nhiêu lần
            ra mặt ngửa?
          </li>
          <li>
            <strong>Kỳ vọng (Mean) &amp; Phương sai (Variance):</strong> Kỳ vọng là
            giá trị trung bình dài hạn, phương sai đo mức độ dao động quanh kỳ vọng.
          </li>
          <li>
            <strong>Định lý Bayes:</strong> P(A|B) = P(B|A) &times; P(A) / P(B). Cho
            phép cập nhật niềm tin khi có bằng chứng mới. Đây là nền tảng của{" "}
            <strong>Naive Bayes classifier</strong> và nhiều mô hình sinh (generative
            models).
          </li>
          <li>
            <strong>Xác suất có điều kiện:</strong> P(mưa | mây) — xác suất mưa BIẾT
            RẰNG trời đã có mây. Khác với P(mưa) vì đã có thêm thông tin.
          </li>
        </ul>
        <p>
          Trong ML, hàm loss <strong>cross-entropy</strong> chính là từ lý thuyết xác
          suất, và quá trình training thực chất là tìm phân phối xác suất phù hợp
          nhất với dữ liệu.
        </p>
      </ExplanationSection>
    </>
  );
}
