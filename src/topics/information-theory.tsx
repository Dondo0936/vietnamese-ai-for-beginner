"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "information-theory",
  title: "Information Theory",
  titleVi: "Lý thuyết thông tin",
  description:
    "Entropy, cross-entropy và KL divergence — đo lường thông tin và so sánh phân phối xác suất",
  category: "math-foundations",
  tags: ["entropy", "kl-divergence", "cross-entropy"],
  difficulty: "intermediate",
  relatedSlugs: ["loss-functions", "probability-statistics", "vae"],
  vizType: "interactive",
};

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

function klDivergence(p: number[], q: number[]): number {
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0 && q[i] > 0) {
      kl += p[i] * Math.log2(p[i] / q[i]);
    }
  }
  return kl;
}

export default function InformationTheoryTopic() {
  const [pA, setPa] = useState(0.7);
  const [qA, setQa] = useState(0.5);

  // Two-outcome distributions
  const distP = [pA, 1 - pA];
  const distQ = [qA, 1 - qA];

  const entropyP = entropy(distP);
  const entropyQ = entropy(distQ);
  const kl = klDivergence(distP, distQ);

  const svgW = 600;
  const svgH = 280;
  const pad = 40;
  const barW = 60;
  const maxBarH = 180;

  const labels = ["Sự kiện A", "Sự kiện B"];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy nghĩ về <strong>độ bất ngờ</strong>. Nếu ai đó nói{" "}
          &quot;<strong>Hà Nội nóng vào tháng 7</strong>&quot;, bạn không ngạc nhiên
          chút nào — đó là thông tin ít giá trị (low information). Nhưng nếu nghe{" "}
          &quot;<strong>Hà Nội có tuyết vào tháng 7</strong>&quot;, bạn sẽ sốc — đó
          là thông tin cực kỳ giá trị vì rất bất ngờ (high information).
        </p>
        <p>
          <strong>Entropy</strong> đo <em>độ bất ngờ trung bình</em> của một nguồn
          thông tin. Nếu mọi sự kiện đều có xác suất bằng nhau (như tung đồng xu công
          bằng), entropy cao nhất — bạn hoàn toàn không biết kết quả. Nếu kết quả gần
          như chắc chắn (xác suất 99%), entropy rất thấp — ít bất ngờ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Điều chỉnh hai phân phối P (xanh) và Q (cam). Quan sát entropy của mỗi
            phân phối và KL divergence giữa chúng.
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Title */}
            <text x={svgW / 2} y={20} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              So sánh phân phối P và Q
            </text>

            {/* P distribution bars */}
            {distP.map((p, i) => {
              const x = 80 + i * 150;
              const h = p * maxBarH;
              return (
                <g key={`p-${i}`}>
                  <rect
                    x={x}
                    y={svgH - pad - h}
                    width={barW}
                    height={h}
                    rx={4}
                    fill="#3b82f6"
                    opacity={0.7}
                  />
                  <text
                    x={x + barW / 2}
                    y={svgH - pad - h - 8}
                    textAnchor="middle"
                    fill="#3b82f6"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {(p * 100).toFixed(0)}%
                  </text>
                  <text
                    x={x + barW / 2}
                    y={svgH - pad + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                  >
                    {labels[i]}
                  </text>
                </g>
              );
            })}

            {/* Q distribution bars */}
            {distQ.map((q, i) => {
              const x = 80 + i * 150 + barW + 10;
              const h = q * maxBarH;
              return (
                <g key={`q-${i}`}>
                  <rect
                    x={x}
                    y={svgH - pad - h}
                    width={barW}
                    height={h}
                    rx={4}
                    fill="#f97316"
                    opacity={0.7}
                  />
                  <text
                    x={x + barW / 2}
                    y={svgH - pad - h - 8}
                    textAnchor="middle"
                    fill="#f97316"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {(q * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#475569" strokeWidth={1} />

            {/* Legend */}
            <rect x={400} y={35} width={15} height={15} rx={3} fill="#3b82f6" opacity={0.7} />
            <text x={420} y={47} fill="#94a3b8" fontSize="10">P (thực tế)</text>
            <rect x={400} y={55} width={15} height={15} rx={3} fill="#f97316" opacity={0.7} />
            <text x={420} y={67} fill="#94a3b8" fontSize="10">Q (mô hình)</text>

            {/* Entropy / KL info */}
            <rect x={400} y={85} width={180} height={80} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={490} y={105} textAnchor="middle" fill="#3b82f6" fontSize="10">
              H(P) = {entropyP.toFixed(3)} bit
            </text>
            <text x={490} y={122} textAnchor="middle" fill="#f97316" fontSize="10">
              H(Q) = {entropyQ.toFixed(3)} bit
            </text>
            <text x={490} y={142} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              KL(P||Q) = {kl.toFixed(4)}
            </text>
            <text x={490} y={158} textAnchor="middle" fill="#94a3b8" fontSize="8">
              KL = 0 khi P = Q
            </text>
          </svg>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                P(A) ={" "}
                <strong className="text-blue-400">{(pA * 100).toFixed(0)}%</strong>
                {" / "}P(B) = {((1 - pA) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0.01}
                max={0.99}
                step={0.01}
                value={pA}
                onChange={(e) => setPa(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>Chắc chắn A</span>
                <span>Cân bằng</span>
                <span>Chắc chắn B</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Q(A) ={" "}
                <strong className="text-orange-400">{(qA * 100).toFixed(0)}%</strong>
                {" / "}Q(B) = {((1 - qA) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0.01}
                max={0.99}
                step={0.01}
                value={qA}
                onChange={(e) => setQa(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>Chắc chắn A</span>
                <span>Cân bằng</span>
                <span>Chắc chắn B</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Entropy P</p>
              <p className="text-lg font-bold text-blue-400">{entropyP.toFixed(3)}</p>
              <p className="text-xs text-muted">bit</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">Entropy Q</p>
              <p className="text-lg font-bold text-orange-400">{entropyQ.toFixed(3)}</p>
              <p className="text-xs text-muted">bit</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted">KL Divergence</p>
              <p className="text-lg font-bold text-green-400">{kl.toFixed(4)}</p>
              <p className="text-xs text-muted">{kl < 0.01 ? "P ~ Q" : kl < 0.1 ? "Khá gần" : "Khá xa"}</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Lý thuyết thông tin</strong> do Claude Shannon sáng lập, cung cấp
          cách đo lường lượng thông tin và so sánh các phân phối xác suất — hai thứ
          cốt lõi trong machine learning.
        </p>

        <p>Các khái niệm quan trọng:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Entropy H(P):</strong> Đo độ bất định trung bình của phân phối P.
            Công thức: H(P) = -&Sigma; p(x) log&sub2; p(x). Entropy cao nhất khi mọi
            sự kiện xác suất bằng nhau. Entropy = 0 khi kết quả chắc chắn 100%.
          </li>
          <li>
            <strong>Cross-Entropy H(P, Q):</strong> Đo chi phí mã hóa dữ liệu từ
            phân phối thực P bằng phân phối dự đoán Q. Đây chính là{" "}
            <strong>hàm loss</strong> phổ biến nhất trong classification! Công thức:
            H(P, Q) = -&Sigma; p(x) log q(x).
          </li>
          <li>
            <strong>KL Divergence D_KL(P||Q):</strong> Đo khoảng cách giữa hai phân
            phối. KL = Cross-Entropy - Entropy = H(P,Q) - H(P). KL = 0 khi và chỉ
            khi P = Q. Lưu ý: KL không đối xứng — D_KL(P||Q) khác D_KL(Q||P).
          </li>
          <li>
            <strong>Mutual Information I(X;Y):</strong> Đo lượng thông tin mà X cho
            biết về Y (và ngược lại). I(X;Y) = H(X) + H(Y) - H(X,Y). Dùng trong
            feature selection và Information Bottleneck.
          </li>
        </ul>
        <p>
          <strong>Kết nối với ML:</strong> Khi huấn luyện mô hình phân loại, tối
          thiểu hóa cross-entropy loss tương đương với tối thiểu hóa KL divergence
          giữa phân phối thực và phân phối dự đoán. Nói cách khác, ta đang dạy mô
          hình &quot;dự đoán giống thực tế nhất có thể.&quot;
        </p>
      </ExplanationSection>
    </>
  );
}
