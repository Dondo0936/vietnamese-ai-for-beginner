"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

/* ── Constants ── */
const TOTAL_STEPS = 8;

interface Entity {
  text: string;
  type: "PER" | "LOC" | "ORG" | "DATE" | "O";
}

const ENTITY_COLORS: Record<string, string> = {
  PER: "#3b82f6",
  LOC: "#22c55e",
  ORG: "#f59e0b",
  DATE: "#8b5cf6",
};

const ENTITY_LABELS: Record<string, string> = {
  PER: "Người",
  LOC: "Địa điểm",
  ORG: "Tổ chức",
  DATE: "Thời gian",
};

const EXAMPLES: { title: string; entities: Entity[] }[] = [
  {
    title: "Tin công nghệ",
    entities: [
      { text: "VinAI", type: "ORG" },
      { text: " công bố ", type: "O" },
      { text: "PhoBERT", type: "ORG" },
      { text: " tại hội nghị ", type: "O" },
      { text: "ACL 2020", type: "DATE" },
      { text: " ở ", type: "O" },
      { text: "Seattle", type: "LOC" },
    ],
  },
  {
    title: "Tin thể thao",
    entities: [
      { text: "Nguyễn Quang Hải", type: "PER" },
      { text: " ghi bàn cho ", type: "O" },
      { text: "CLB Hà Nội", type: "ORG" },
      { text: " tại sân ", type: "O" },
      { text: "Mỹ Đình", type: "LOC" },
      { text: " ngày ", type: "O" },
      { text: "15/03/2024", type: "DATE" },
    ],
  },
  {
    title: "Tin kinh tế",
    entities: [
      { text: "Grab", type: "ORG" },
      { text: " và ", type: "O" },
      { text: "Shopee", type: "ORG" },
      { text: " mở rộng tại ", type: "O" },
      { text: "Hà Nội", type: "LOC" },
      { text: " và ", type: "O" },
      { text: "Sài Gòn", type: "LOC" },
      { text: " năm ", type: "O" },
      { text: "2024", type: "DATE" },
    ],
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Từ 'Apple' có thể là tổ chức (Apple Inc.) hoặc trái cây. NER xử lý thế nào?",
    options: [
      "Luôn gán nhãn ORG",
      "Dùng NGỮ CẢNH để phân biệt: 'Apple ra mắt iPhone' → ORG, 'Ăn apple mỗi sáng' → O",
      "Bỏ qua từ đó",
      "Gán cả hai nhãn cùng lúc",
    ],
    correct: 1,
    explanation:
      "Mô hình NER hiện đại (BERT-based) hiểu ngữ cảnh: 'Apple ra mắt iPhone' → ORG (cùng ngữ cảnh công nghệ). 'Ăn apple mỗi sáng' → O (ngữ cảnh thực phẩm).",
  },
  {
    question: "Sơ đồ gán nhãn IOB là gì?",
    options: [
      "Một loại mô hình NER",
      "B = Beginning, I = Inside, O = Outside — cách đánh dấu ranh giới thực thể",
      "Input-Output-Backward",
      "Phương pháp tiền xử lý",
    ],
    correct: 1,
    explanation:
      "IOB tagging: 'Nguyễn' = B-PER (bắt đầu), 'Quang' = I-PER (bên trong), 'Hải' = I-PER, 'ghi' = O (ngoài thực thể). Giúp xử lý thực thể nhiều từ!",
  },
  {
    question: "Mô hình nào cho kết quả NER tiếng Việt tốt nhất hiện nay?",
    options: [
      "Bag of Words + SVM",
      "PhoBERT + CRF — mô hình Transformer pre-trained cho tiếng Việt",
      "Word2Vec + LSTM",
      "TF-IDF + Random Forest",
    ],
    correct: 1,
    explanation:
      "PhoBERT (VinAI) pre-trained trên 20GB tiếng Việt + lớp CRF cho gán nhãn tuần tự đạt F1 > 90% trên PhoNER dataset. BERT hiểu ngữ cảnh, CRF đảm bảo nhãn hợp lệ.",
  },
];

/* ── Main Component ── */
export default function NerTopic() {
  const [exampleIdx, setExampleIdx] = useState(0);

  const example = EXAMPLES[exampleIdx];
  const namedEntities = useMemo(
    () => example.entities.filter((e) => e.type !== "O"),
    [example]
  );

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Đọc tin: "Nguyễn Quang Hải ghi bàn cho CLB Hà Nội tại sân Mỹ Đình". Có bao nhiêu THỰC THỂ (tên riêng)?`}
          options={["2 thực thể", "3 thực thể", "4 thực thể"]}
          correct={1}
          explanation={`Có 3 thực thể: "Nguyễn Quang Hải" (NGƯỜI), "CLB Hà Nội" (TỔ CHỨC), "Mỹ Đình" (ĐỊA ĐIỂM). Bạn vừa làm NER bằng tay! NER tự động hóa quá trình này — quét hàng triệu bài báo, tự gạch chân và phân loại tên người, địa điểm, tổ chức.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Chọn ví dụ bên dưới để xem NER tự động nhận dạng thực thể trong tin tức tiếng Việt. Mỗi màu = 1 loại thực thể!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Example selector */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button key={i} type="button" onClick={() => setExampleIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    exampleIdx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {ex.title}
                </button>
              ))}
            </div>

            {/* Annotated text */}
            <div className="rounded-xl bg-background/50 border border-border p-5">
              <p className="text-base leading-loose">
                {example.entities.map((entity, i) =>
                  entity.type === "O" ? (
                    <span key={i} className="text-foreground">{entity.text}</span>
                  ) : (
                    <span key={i}
                      className="rounded px-1.5 py-0.5 font-semibold text-white mx-0.5 inline-block"
                      style={{ backgroundColor: ENTITY_COLORS[entity.type] }}>
                      {entity.text}
                      <span className="ml-1 text-[10px] opacity-80 uppercase">
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
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: ENTITY_COLORS[type] }} />
                  <span className="text-xs text-muted">{type}: {label}</span>
                </div>
              ))}
            </div>

            {/* Extracted entities */}
            <div className="rounded-lg bg-background/50 border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Thực thể được trích xuất ({namedEntities.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {namedEntities.map((entity, i) => (
                  <div key={i}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    style={{ borderColor: ENTITY_COLORS[entity.type] + "60", backgroundColor: ENTITY_COLORS[entity.type] + "10" }}>
                    <span className="font-semibold" style={{ color: ENTITY_COLORS[entity.type] }}>{entity.text}</span>
                    <span className="text-xs text-muted ml-1">({ENTITY_LABELS[entity.type]})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>NER</strong>{" "}
            tự động {'"gạch chân"'} và phân loại tên người, địa điểm, tổ chức trong văn bản — giống biên tập viên báo chí đánh dấu bằng bút highlight!
          </p>
          <p className="text-sm text-muted mt-1">
            Ứng dụng: xây dựng knowledge graph, hỗ trợ tìm kiếm, tự động phân loại tin tức, chatbot hiểu tên sản phẩm trên Shopee.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`"Vinamilk công bố doanh thu tại Hà Nội" — IOB tagging cho "Vinamilk" và "Hà Nội" là gì?`}
          options={[
            "Vinamilk = B-ORG, Hà = B-LOC, Nội = I-LOC",
            "Vinamilk = ORG, Hà Nội = LOC (không cần IOB)",
            "Vinamilk = I-ORG, Hà = I-LOC, Nội = I-LOC",
          ]}
          correct={0}
          explanation={`IOB: "Vinamilk" = B-ORG (bắt đầu tổ chức, 1 từ). "Hà" = B-LOC (bắt đầu địa điểm). "Nội" = I-LOC (bên trong địa điểm). "công bố doanh thu tại" = O (ngoài thực thể).`}
        />
      </LessonSection>

      {/* ── Step 5: IOB Tagging Visual ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="IOB Tagging">
        <div className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            IOB (Inside-Outside-Beginning) giải quyết thực thể nhiều từ. Mỗi token nhận 1 nhãn:
          </p>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max justify-center">
              {[
                { word: "Nguyễn", tag: "B-PER", color: "#3b82f6" },
                { word: "Quang", tag: "I-PER", color: "#3b82f6" },
                { word: "Hải", tag: "I-PER", color: "#3b82f6" },
                { word: "ghi", tag: "O", color: "#64748b" },
                { word: "bàn", tag: "O", color: "#64748b" },
                { word: "cho", tag: "O", color: "#64748b" },
                { word: "CLB", tag: "B-ORG", color: "#f59e0b" },
                { word: "Hà", tag: "I-ORG", color: "#f59e0b" },
                { word: "Nội", tag: "I-ORG", color: "#f59e0b" },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-1">
                  <div className="rounded-lg px-2 py-1.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: item.color }}>
                    {item.word}
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: item.color }}>
                    {item.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center text-xs text-muted">
            <span><strong>B</strong> = Beginning (bắt đầu)</span>
            <span><strong>I</strong> = Inside (bên trong)</span>
            <span><strong>O</strong> = Outside (ngoài)</span>
          </div>
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Named Entity Recognition (NER)</strong>{" "}
            là tác vụ gán nhãn thực thể cho từng token trong văn bản. Nền tảng cho trích xuất thông tin, xây dựng knowledge graph, và chatbot.
          </p>

          <Callout variant="insight" title="Kiến trúc BERT + CRF cho NER">
            <div className="space-y-2">
              <p>
                <strong>BERT:</strong>{" "}
                Mã hóa ngữ cảnh hai chiều → vector cho mỗi token.
              </p>
              <p>
                <strong>CRF (Conditional Random Field):</strong>{" "}
                Đảm bảo nhãn hợp lệ (I-PER không xuất hiện sau B-LOC).
              </p>
              <LaTeX display>{`P(\\mathbf{y}|\\mathbf{x}) = \\frac{\\exp(\\sum_t s(y_t, \\mathbf{x}) + T(y_{t-1}, y_t))}{\\sum_{\\mathbf{y'}} \\exp(\\sum_t s(y'_t, \\mathbf{x}) + T(y'_{t-1}, y'_t))}`}</LaTeX>
              <p className="text-sm">
                Trong đó s = emission score (BERT), T = transition score (CRF). CRF học rằng I-PER chỉ hợp lệ sau B-PER hoặc I-PER.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="ner_vietnamese.py">
{`from transformers import pipeline

# NER tiếng Việt với PhoBERT
ner = pipeline("token-classification",
               model="NlpHUST/ner-vietnamese-electra-base",
               aggregation_strategy="simple")

text = "Nguyễn Quang Hải ghi bàn cho CLB Hà Nội tại Mỹ Đình"
entities = ner(text)

for ent in entities:
    print(f"  {ent['word']:>20} → {ent['entity_group']} "
          f"({ent['score']:.2%})")
# Nguyễn Quang Hải → PER (98.5%)
#        CLB Hà Nội → ORG (96.2%)
#          Mỹ Đình → LOC (97.8%)

# Ứng dụng: tự động trích xuất từ tin tức VnExpress
# → Xây knowledge graph: Quang Hải --chơi cho--> CLB Hà Nội
#                         CLB Hà Nội --sân nhà--> Mỹ Đình`}
          </CodeBlock>

          <Callout variant="tip" title="NER cho tiếng Việt">
            <p>
              Thách thức: tên người Việt 2-4 từ ({'"Nguyễn Quang Hải"'}), địa danh ghép ({'"Thành phố Hồ Chí Minh"'}). Dùng{" "}
              <strong>PhoBERT</strong>{" "}
              hoặc <strong>VnCoreNLP</strong>{" "}
              cho kết quả tốt nhất. Dataset: PhoNER (VinAI) — 15K câu tiếng Việt đã gán nhãn.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về NER"
          points={[
            "NER nhận dạng và phân loại thực thể: PER (người), LOC (nơi), ORG (tổ chức), DATE (thời gian).",
            "IOB tagging: B = bắt đầu, I = bên trong, O = ngoài thực thể — xử lý thực thể nhiều từ.",
            "Kiến trúc hiện đại: BERT (hiểu ngữ cảnh) + CRF (đảm bảo nhãn hợp lệ).",
            "PhoBERT + CRF đạt F1 > 90% cho NER tiếng Việt.",
            "Ứng dụng: knowledge graph, tìm kiếm, chatbot, phân tích tin tức tự động.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
