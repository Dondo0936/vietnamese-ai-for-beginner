"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ner",
  title: "Named Entity Recognition",
  titleVi: "NER - Nhận dạng thực thể có tên",
  description:
    "Tác vụ tự động nhận dạng và phân loại các thực thể trong văn bản như tên người, địa điểm, tổ chức.",
  category: "nlp",
  tags: ["nlp", "information-extraction", "sequence-labeling"],
  difficulty: "intermediate",
  relatedSlugs: ["tokenization", "bert", "text-classification"],
  vizType: "interactive",
};

interface Entity {
  text: string;
  type: "PER" | "LOC" | "ORG" | "DATE" | "O";
}

const ENTITY_COLORS: Record<string, string> = {
  PER: "#3b82f6",
  LOC: "#22c55e",
  ORG: "#f59e0b",
  DATE: "#8b5cf6",
  O: "transparent",
};

const ENTITY_LABELS: Record<string, string> = {
  PER: "Người",
  LOC: "Địa điểm",
  ORG: "Tổ chức",
  DATE: "Thời gian",
};

const EXAMPLES: Record<string, Entity[]> = {
  "Nguyễn Văn A làm việc tại Google ở Hà Nội từ năm 2020": [
    { text: "Nguyễn Văn A", type: "PER" },
    { text: " làm việc tại ", type: "O" },
    { text: "Google", type: "ORG" },
    { text: " ở ", type: "O" },
    { text: "Hà Nội", type: "LOC" },
    { text: " từ năm ", type: "O" },
    { text: "2020", type: "DATE" },
  ],
  "Tổng thống Biden gặp Chủ tịch Tập Cận Bình tại Bắc Kinh": [
    { text: "Tổng thống ", type: "O" },
    { text: "Biden", type: "PER" },
    { text: " gặp Chủ tịch ", type: "O" },
    { text: "Tập Cận Bình", type: "PER" },
    { text: " tại ", type: "O" },
    { text: "Bắc Kinh", type: "LOC" },
  ],
  "VinAI Research công bố nghiên cứu mới vào tháng 3 năm 2024": [
    { text: "VinAI Research", type: "ORG" },
    { text: " công bố nghiên cứu mới vào ", type: "O" },
    { text: "tháng 3 năm 2024", type: "DATE" },
  ],
};

const SENTENCES = Object.keys(EXAMPLES);

export default function NerTopic() {
  const [sentIdx, setSentIdx] = useState(0);

  const entities = useMemo(() => EXAMPLES[SENTENCES[sentIdx]], [sentIdx]);
  const namedEntities = entities.filter((e) => e.type !== "O");

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>biên tập viên báo chí</strong>. Khi
          đọc một bài báo, bạn tự động <strong>gạch chân</strong> các tên người
          bằng màu xanh, địa điểm bằng màu xanh lá, tổ chức bằng màu vàng.
        </p>
        <p>
          NER làm đúng việc đó — nó quét qua văn bản và tự động{" "}
          <strong>nhận dạng và phân loại</strong> các thực thể có tên. Giống như
          đôi mắt của biên tập viên kinh nghiệm, NER phân biệt được &quot;Apple&quot;
          là công ty hay trái táo dựa vào ngữ cảnh!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {SENTENCES.map((sent, i) => (
              <button
                key={i}
                onClick={() => setSentIdx(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sentIdx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                Ví dụ {i + 1}
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-base leading-relaxed">
              {entities.map((entity, i) =>
                entity.type === "O" ? (
                  <span key={i} className="text-foreground">
                    {entity.text}
                  </span>
                ) : (
                  <span
                    key={i}
                    className="rounded px-1.5 py-0.5 font-semibold text-white"
                    style={{ backgroundColor: ENTITY_COLORS[entity.type] }}
                  >
                    {entity.text}
                    <span className="ml-1 text-xs opacity-80">
                      [{ENTITY_LABELS[entity.type]}]
                    </span>
                  </span>
                )
              )}
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(ENTITY_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: ENTITY_COLORS[type] }}
                />
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>

          <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
            <text x="300" y="20" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Thực thể được trích xuất:
            </text>
            {namedEntities.map((entity, i) => {
              const x = 30 + i * (550 / namedEntities.length);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y="30"
                    width={530 / namedEntities.length - 10}
                    height="50"
                    rx="6"
                    fill={ENTITY_COLORS[entity.type]}
                    opacity={0.2}
                    stroke={ENTITY_COLORS[entity.type]}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + (530 / namedEntities.length - 10) / 2}
                    y="52"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {entity.text}
                  </text>
                  <text
                    x={x + (530 / namedEntities.length - 10) / 2}
                    y="70"
                    textAnchor="middle"
                    fill={ENTITY_COLORS[entity.type]}
                    fontSize="9"
                  >
                    {ENTITY_LABELS[entity.type]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Named Entity Recognition (NER)</strong> là tác vụ nhận dạng
          và phân loại các thực thể có tên trong văn bản. Đây là bước quan trọng
          trong trích xuất thông tin và xây dựng knowledge graph.
        </p>
        <p>Các loại thực thể phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>PER (Person):</strong> Tên người — Nguyễn Văn A, Biden.
          </li>
          <li>
            <strong>LOC (Location):</strong> Địa điểm — Hà Nội, Việt Nam.
          </li>
          <li>
            <strong>ORG (Organization):</strong> Tổ chức — Google, VinAI.
          </li>
          <li>
            <strong>DATE/TIME:</strong> Thời gian — 2024, tháng 3.
          </li>
        </ol>
        <p>
          Phương pháp hiện đại sử dụng mô hình Transformer tiền huấn luyện (như
          BERT) kết hợp lớp CRF để gán nhãn tuần tự, đạt F1-score trên 90%
          cho tiếng Anh và ngày càng tốt hơn cho tiếng Việt.
        </p>
      </ExplanationSection>
    </>
  );
}
