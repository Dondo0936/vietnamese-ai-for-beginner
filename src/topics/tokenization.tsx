"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tokenization",
  title: "Tokenization",
  titleVi: "Tokenization - Tách từ",
  description:
    "Quá trình chia văn bản thành các đơn vị nhỏ hơn (token) để máy tính có thể xử lý ngôn ngữ tự nhiên.",
  category: "nlp",
  tags: ["nlp", "preprocessing", "text"],
  difficulty: "beginner",
  relatedSlugs: ["bag-of-words", "word-embeddings", "bert"],
  vizType: "interactive",
};

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

export default function TokenizationTopic() {
  const [text, setText] = useState("Tôi yêu học máy và trí tuệ nhân tạo");
  const [mode, setMode] = useState<"word" | "char">("word");

  const tokens = useMemo(() => {
    if (mode === "word") {
      return text.split(/\s+/).filter((t) => t.length > 0);
    }
    return text.split("").filter((t) => t !== " ");
  }, [text, mode]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn nhận được một <strong>bức thư dài</strong> viết
          bằng tiếng nước ngoài. Để dịch, bạn phải <strong>tách từng từ</strong>{" "}
          ra trước, rồi mới tra từ điển từng từ một.
        </p>
        <p>
          Tokenization cũng vậy — máy tính không hiểu cả câu cùng lúc. Nó phải{" "}
          <strong>cắt văn bản thành từng mảnh nhỏ</strong> (gọi là token), giống
          như bạn cắt bánh mì thành từng lát để ăn dễ hơn.
        </p>
        <p>
          Có nhiều cách cắt: theo <strong>từ</strong>, theo{" "}
          <strong>ký tự</strong>, hoặc theo <strong>từ phụ</strong> (subword).
          Mỗi cách có ưu nhược điểm riêng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Nhập văn bản để tách token
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="Nhập câu bất kỳ..."
            />
          </div>

          <div className="flex gap-2">
            {(["word", "char"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m === "word" ? "Tách theo từ" : "Tách theo ký tự"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => (
              <span
                key={`${token}-${i}`}
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              >
                {token}
              </span>
            ))}
          </div>

          <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
            <text x="10" y="30" fill="#94a3b8" fontSize="12">
              Đầu vào: &quot;{text.length > 40 ? text.slice(0, 40) + "..." : text}&quot;
            </text>
            <line x1="300" y1="40" x2="300" y2="60" stroke="#475569" strokeWidth="2" />
            <polygon points="295,58 305,58 300,66" fill="#475569" />
            <rect x="200" y="68" width="200" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <text x="300" y="88" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              Tokenizer ({mode === "word" ? "theo từ" : "theo ký tự"})
            </text>
            <line x1="300" y1="98" x2="300" y2="110" stroke="#475569" strokeWidth="2" />
            <polygon points="295,108 305,108 300,116" fill="#475569" />
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Số lượng token: <strong className="text-accent">{tokens.length}</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tokenization</strong> là bước đầu tiên và quan trọng nhất trong
          xử lý ngôn ngữ tự nhiên (NLP). Nó chuyển đổi văn bản thô thành chuỗi
          các đơn vị rời rạc mà mô hình có thể hiểu được.
        </p>
        <p>Có ba phương pháp chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tách theo từ (Word):</strong> Chia câu theo khoảng trắng và
            dấu câu. Đơn giản nhưng gặp vấn đề với từ mới (OOV).
          </li>
          <li>
            <strong>Tách theo ký tự (Character):</strong> Mỗi ký tự là một
            token. Không có OOV nhưng chuỗi rất dài, mất ngữ nghĩa.
          </li>
          <li>
            <strong>Tách theo từ phụ (Subword):</strong> Kết hợp ưu điểm của
            cả hai, ví dụ BPE (Byte-Pair Encoding) dùng trong GPT, WordPiece
            dùng trong BERT.
          </li>
        </ol>
        <p>
          Lựa chọn phương pháp tokenization ảnh hưởng trực tiếp đến{" "}
          <strong>kích thước từ vựng</strong> và <strong>hiệu suất</strong> của
          mô hình ngôn ngữ.
        </p>
      </ExplanationSection>
    </>
  );
}
