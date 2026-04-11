"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "batch-normalization",
  title: "Batch Normalization",
  titleVi: "Chuẩn hóa theo lô",
  description:
    "Kỹ thuật chuẩn hóa đầu vào mỗi lớp để ổn định và tăng tốc quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "techniques", "normalization"],
  difficulty: "intermediate",
  relatedSlugs: ["mlp", "vanishing-exploding-gradients", "regularization"],
  vizType: "static",
};

export default function BatchNormalizationTopic() {
  // Static diagram data
  const beforeValues = [2.1, 8.5, -3.2, 15.0, 0.7, -1.5, 12.3, 5.6];
  const mean = beforeValues.reduce((s, v) => s + v, 0) / beforeValues.length;
  const variance = beforeValues.reduce((s, v) => s + (v - mean) * (v - mean), 0) / beforeValues.length;
  const std = Math.sqrt(variance);
  const normalized = beforeValues.map((v) => (v - mean) / (std + 1e-5));
  // Scale and shift with gamma=1.2, beta=0.5
  const gamma = 1.2;
  const beta = 0.5;
  const scaled = normalized.map((v) => v * gamma + beta);

  const svgW = 500;
  const svgH = 380;

  // Bar chart helper
  function drawBars(
    values: number[],
    y0: number,
    maxAbs: number,
    color: string,
    label: string,
    showValues: boolean = true
  ) {
    const barW = 36;
    const gap = 8;
    const totalW = values.length * (barW + gap) - gap;
    const startX = (svgW - totalW) / 2;
    const barMaxH = 40;

    return (
      <g>
        {/* Label */}
        <text x={svgW / 2} y={y0 - barMaxH - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
          {label}
        </text>
        {/* Zero line */}
        <line x1={startX - 5} y1={y0} x2={startX + totalW + 5} y2={y0} stroke="#334155" strokeWidth="0.5" />
        {/* Bars */}
        {values.map((v, i) => {
          const x = startX + i * (barW + gap);
          const h = (Math.abs(v) / maxAbs) * barMaxH;
          const barY = v >= 0 ? y0 - h : y0;
          return (
            <g key={`bar-${label}-${i}`}>
              <rect x={x} y={barY} width={barW} height={Math.max(1, h)} rx={3} fill={color} opacity={0.8} />
              {showValues && (
                <text
                  x={x + barW / 2}
                  y={v >= 0 ? barY - 3 : barY + h + 10}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="7"
                >
                  {v.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giáo viên chấm bài</strong> cho nhiều lớp
          khác nhau. Lớp A cho điểm trên thang 100, lớp B cho điểm trên thang 10, lớp
          C dùng điểm chữ A-F.
        </p>
        <p>
          Để so sánh công bằng, bạn phải <strong>chuẩn hóa</strong> tất cả về cùng một
          thang &mdash; ví dụ, quy về điểm trung bình 0 và độ lệch chuẩn 1. Sau đó,
          mỗi giáo viên có thể <strong>điều chỉnh lại</strong> (scale &amp; shift) theo
          nhu cầu riêng.
        </p>
        <p>
          Batch Normalization làm điều tương tự với dữ liệu ở mỗi lớp trong mạng
          nơ-ron: chuẩn hóa đầu vào về phân phối chuẩn, rồi cho mạng tự học cách
          điều chỉnh phù hợp nhất.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-center text-muted">
            Quy trình Batch Normalization: Chuẩn hóa &rarr; Điều chỉnh
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            {/* Step 1: Before normalization */}
            {drawBars(beforeValues, 70, 16, "#ef4444", "1. Trước chuẩn hóa (phân bổ rộng)")}

            {/* Arrow */}
            <g>
              <line x1={svgW / 2} y1={85} x2={svgW / 2} y2={105} stroke="#475569" strokeWidth="1.5" />
              <polygon points={`${svgW / 2 - 4},105 ${svgW / 2 + 4},105 ${svgW / 2},112`} fill="#475569" />
              <text x={svgW / 2 + 30} y={100} fill="#64748b" fontSize="8">
                x\u0302 = (x - \u03BC) / \u03C3
              </text>
            </g>

            {/* Step 2: After normalization */}
            {drawBars(normalized, 190, 2.5, "#3b82f6", "2. Sau chuẩn hóa (trung bình \u2248 0, std \u2248 1)")}

            {/* Arrow */}
            <g>
              <line x1={svgW / 2} y1={205} x2={svgW / 2} y2={225} stroke="#475569" strokeWidth="1.5" />
              <polygon points={`${svgW / 2 - 4},225 ${svgW / 2 + 4},225 ${svgW / 2},232`} fill="#475569" />
              <text x={svgW / 2 + 30} y={220} fill="#64748b" fontSize="8">
                y = \u03B3 \u00B7 x\u0302 + \u03B2
              </text>
            </g>

            {/* Step 3: Scale and shift */}
            {drawBars(scaled, 310, 3, "#22c55e", `3. Scale (\u03B3=${gamma}) & Shift (\u03B2=${beta})`)}

            {/* Stats boxes */}
            <rect x="10" y={340} width="110" height="30" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="65" y={352} textAnchor="middle" fill="#94a3b8" fontSize="8">
              \u03BC = {mean.toFixed(2)}, \u03C3 = {std.toFixed(2)}
            </text>
            <text x="65" y={363} textAnchor="middle" fill="#64748b" fontSize="7">
              Tính từ mini-batch
            </text>

            <rect x="380" y={340} width="110" height="30" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="435" y={352} textAnchor="middle" fill="#94a3b8" fontSize="8">
              \u03B3, \u03B2: tham số học được
            </text>
            <text x="435" y={363} textAnchor="middle" fill="#64748b" fontSize="7">
              Cập nhật qua backprop
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Batch Normalization</strong> (BN) là kỹ thuật do Ioffe &amp; Szegedy
          giới thiệu năm 2015, giúp ổn định và tăng tốc quá trình huấn luyện mạng nơ-ron.
        </p>
        <p>Quy trình BN tại mỗi lớp gồm 4 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            Tính <strong>trung bình (&mu;)</strong> và <strong>phương sai (&sigma;&sup2;)</strong>{" "}
            của đầu vào trên mini-batch hiện tại.
          </li>
          <li>
            <strong>Chuẩn hóa:</strong> Trừ trung bình, chia cho độ lệch chuẩn. Kết quả
            có trung bình = 0, std = 1.
          </li>
          <li>
            <strong>Scale và shift:</strong> Nhân với &gamma; (scale) và cộng &beta; (shift)
            &mdash; hai tham số này được mạng tự học.
          </li>
          <li>
            Khi inference, dùng <strong>running mean/variance</strong> tích lũy từ quá trình
            huấn luyện thay vì tính trên batch hiện tại.
          </li>
        </ol>
        <p>Lợi ích của Batch Normalization:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Giảm <strong>Internal Covariate Shift</strong> (phân phối đầu vào thay đổi liên tục).</li>
          <li>Cho phép dùng <strong>learning rate lớn hơn</strong>, tăng tốc huấn luyện.</li>
          <li>Giảm nhẹ <strong>overfitting</strong> (có tác dụng regularization nhẹ).</li>
          <li>Giảm phụ thuộc vào <strong>weight initialization</strong>.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
