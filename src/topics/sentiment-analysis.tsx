"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "sentiment-analysis",
  title: "Sentiment Analysis",
  titleVi: "Phân tích cảm xúc văn bản",
  description:
    "Tác vụ xác định cảm xúc (tích cực, tiêu cực, trung tính) được thể hiện trong văn bản.",
  category: "nlp",
  tags: ["nlp", "classification", "opinion-mining"],
  difficulty: "beginner",
  relatedSlugs: ["text-classification", "bert", "bag-of-words"],
  vizType: "interactive",
};

const POSITIVE_WORDS = ["yêu", "thích", "tuyệt", "vời", "xuất", "sắc", "tốt", "hay", "đẹp", "giỏi", "hạnh", "phúc", "vui"];
const NEGATIVE_WORDS = ["ghét", "tệ", "xấu", "dở", "chán", "buồn", "thất", "bại", "kém", "tồi", "khó", "chịu"];

export default function SentimentAnalysisTopic() {
  const [text, setText] = useState("Bộ phim này rất hay và cảm động, tôi rất thích");

  const analysis = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/);
    let pos = 0;
    let neg = 0;
    for (const w of words) {
      if (POSITIVE_WORDS.some((pw) => w.includes(pw))) pos++;
      if (NEGATIVE_WORDS.some((nw) => w.includes(nw))) neg++;
    }
    const total = pos + neg || 1;
    const score = (pos - neg) / total;
    return { pos, neg, score, total };
  }, [text]);

  const sentiment =
    analysis.score > 0.2 ? "positive" : analysis.score < -0.2 ? "negative" : "neutral";

  const COLORS = { positive: "#22c55e", negative: "#ef4444", neutral: "#f59e0b" };
  const LABELS = { positive: "Tích cực", negative: "Tiêu cực", neutral: "Trung tính" };
  const EMOJIS = { positive: ":)", negative: ":(", neutral: ":|" };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn quản lý một <strong>nhà hàng</strong> và đọc đánh
          giá của khách hàng. Bạn nhanh chóng phân loại: &quot;Đồ ăn ngon tuyệt vời&quot;
          là <strong>khen</strong>, &quot;Phục vụ quá chậm&quot; là <strong>chê</strong>.
        </p>
        <p>
          Phân tích cảm xúc giúp máy tính làm điều tương tự — đọc hàng triệu
          đánh giá và tự động xác định khách hàng{" "}
          <strong>hài lòng hay không hài lòng</strong>. Giống như bạn &quot;đọc vị&quot;
          cảm xúc qua lời nói, máy tính &quot;đọc vị&quot; qua từ ngữ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Nhập văn bản để phân tích cảm xúc
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none resize-none"
              placeholder="Nhập câu bất kỳ..."
            />
          </div>

          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Sentiment meter */}
            <text x="300" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Thang cảm xúc
            </text>

            {/* Background bar */}
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <rect x="80" y="40" width="440" height="24" rx="12" fill="url(#sentGrad)" opacity={0.3} />

            {/* Indicator */}
            {(() => {
              const indicatorX = 300 + analysis.score * 200;
              return (
                <>
                  <circle cx={indicatorX} cy="52" r="14" fill={COLORS[sentiment]} />
                  <text x={indicatorX} y="57" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    {EMOJIS[sentiment]}
                  </text>
                </>
              );
            })()}

            {/* Labels */}
            <text x="80" y="85" fill="#ef4444" fontSize="10">Tiêu cực</text>
            <text x="280" y="85" fill="#f59e0b" fontSize="10">Trung tính</text>
            <text x="480" y="85" fill="#22c55e" fontSize="10">Tích cực</text>

            {/* Stats */}
            <rect x="120" y="105" width="140" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="190" y="125" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Từ tích cực: {analysis.pos}
            </text>
            <text x="190" y="145" textAnchor="middle" fill="#64748b" fontSize="10">
              yêu, thích, hay...
            </text>

            <rect x="340" y="105" width="140" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="410" y="125" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              Từ tiêu cực: {analysis.neg}
            </text>
            <text x="410" y="145" textAnchor="middle" fill="#64748b" fontSize="10">
              ghét, tệ, xấu...
            </text>
          </svg>

          <div
            className="rounded-lg border p-4 text-center"
            style={{
              borderColor: COLORS[sentiment],
              backgroundColor: `${COLORS[sentiment]}10`,
            }}
          >
            <p className="text-lg font-bold" style={{ color: COLORS[sentiment] }}>
              {LABELS[sentiment]}
            </p>
            <p className="text-sm text-muted">
              Điểm cảm xúc: {analysis.score.toFixed(2)} (từ -1.0 đến +1.0)
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Sentiment Analysis</strong> (Phân tích cảm xúc) là tác vụ
          xác định thái độ, ý kiến hoặc cảm xúc được thể hiện trong văn bản.
          Đây là một trong những ứng dụng NLP phổ biến và thực tiễn nhất.
        </p>
        <p>Các cấp độ phân tích:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phân loại nhị phân:</strong> Tích cực hoặc tiêu cực (ví
            dụ: đánh giá sản phẩm).
          </li>
          <li>
            <strong>Phân loại đa lớp:</strong> Tích cực, trung tính, tiêu cực
            (hoặc thang 1-5 sao).
          </li>
          <li>
            <strong>Phân tích khía cạnh (Aspect-based):</strong> Xác định cảm
            xúc cho từng khía cạnh — &quot;đồ ăn ngon nhưng phục vụ chậm&quot;.
          </li>
        </ol>
        <p>
          Phương pháp đơn giản dùng từ điển cảm xúc (như demo trên), nhưng mô
          hình hiện đại sử dụng <strong>deep learning</strong> (BERT, RoBERTa)
          để hiểu ngữ cảnh, xử lý mỉa mai, phủ định và ngôn ngữ phức tạp.
        </p>
      </ExplanationSection>
    </>
  );
}
