"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "re-ranking",
  title: "Re-ranking",
  titleVi: "Re-ranking - Xếp hạng lại kết quả",
  description:
    "Giai đoạn thứ hai trong pipeline tìm kiếm, sử dụng mô hình mạnh hơn để xếp hạng lại kết quả ban đầu.",
  category: "search-retrieval",
  tags: ["re-ranking", "cross-encoder", "retrieval", "pipeline"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "rag"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// TYPES cho phần Visualization
// ---------------------------------------------------------------------------

interface Candidate {
  id: string;
  title: string;
  snippet: string;
  biScore: number; // điểm bi-encoder (stage 1)
  crossScore: number; // điểm cross-encoder (stage 2)
  gold?: boolean; // tài liệu thực sự liên quan
}

interface RerankerSpec {
  name: string;
  family: string;
  latencyPerPair: number; // ms/pair trên 1 GPU T4
  ndcg10: number; // chất lượng NDCG@10 trên MS MARCO
  multilingual: boolean;
  cost: string;
  note: string;
}

// ---------------------------------------------------------------------------
// DATA — danh sách ứng viên mô phỏng từ stage 1
// ---------------------------------------------------------------------------

const CANDIDATES: Candidate[] = [
  {
    id: "D1",
    title: "Luật lao động 2019: chương quyền lao động",
    snippet:
      "Điều 5 quy định các quyền cơ bản của người lao động: được trả lương công bằng, nghỉ phép, bảo hiểm xã hội...",
    biScore: 0.82,
    crossScore: 0.94,
    gold: true,
  },
  {
    id: "D2",
    title: "Lao động nước ngoài xin giấy phép thế nào",
    snippet:
      "Quy trình xin work permit cho chuyên gia nước ngoài tại Việt Nam bao gồm 5 bước chính...",
    biScore: 0.78,
    crossScore: 0.21,
    gold: false,
  },
  {
    id: "D3",
    title: "Quyền lợi và nghĩa vụ người lao động — Bộ luật 45/2019",
    snippet:
      "Chương II nêu rõ 7 nhóm quyền cơ bản và 6 nghĩa vụ của người lao động, đi kèm ví dụ áp dụng...",
    biScore: 0.73,
    crossScore: 0.91,
    gold: true,
  },
  {
    id: "D4",
    title: "Lao động trẻ em ở Việt Nam giảm 30% trong 5 năm",
    snippet:
      "Theo thống kê của Tổng cục thống kê, tỷ lệ lao động trẻ em đã giảm đáng kể nhờ các chương trình...",
    biScore: 0.71,
    crossScore: 0.18,
    gold: false,
  },
  {
    id: "D5",
    title: "Quyền đình công và tranh chấp lao động tập thể",
    snippet:
      "Đình công là quyền hợp pháp của người lao động trong một số tình huống được luật định...",
    biScore: 0.68,
    crossScore: 0.79,
    gold: true,
  },
  {
    id: "D6",
    title: "Giá vàng hôm nay tăng mạnh — người lao động khóc ròng",
    snippet:
      "Giá vàng SJC đạt đỉnh 85 triệu/lượng, ảnh hưởng tới tiền tiết kiệm của nhiều công nhân...",
    biScore: 0.66,
    crossScore: 0.04,
    gold: false,
  },
  {
    id: "D7",
    title: "Hợp đồng lao động — mẫu và hướng dẫn ký kết",
    snippet:
      "Mẫu hợp đồng theo thông tư mới kèm danh sách các điều khoản bắt buộc phải có...",
    biScore: 0.64,
    crossScore: 0.47,
    gold: false,
  },
  {
    id: "D8",
    title: "Công ước ILO về quyền tự do hiệp hội ở Việt Nam",
    snippet:
      "Công ước 87 và 98 của ILO liên quan trực tiếp tới quyền lao động tập thể...",
    biScore: 0.61,
    crossScore: 0.83,
    gold: true,
  },
  {
    id: "D9",
    title: "Tin tức thể thao: cầu thủ lao động trên sân cỏ",
    snippet:
      "Đội tuyển Việt Nam thi đấu chăm chỉ trong trận tứ kết với sự hỗ trợ của CĐV...",
    biScore: 0.58,
    crossScore: 0.02,
    gold: false,
  },
  {
    id: "D10",
    title: "Hỏi đáp: tôi có quyền từ chối tăng ca quá 4 giờ/ngày không?",
    snippet:
      "Theo Điều 107 Bộ luật lao động, quyền từ chối tăng ca vượt mức giới hạn được quy định rõ...",
    biScore: 0.55,
    crossScore: 0.88,
    gold: true,
  },
];

// ---------------------------------------------------------------------------
// DATA — so sánh các re-ranker phổ biến
// ---------------------------------------------------------------------------

const RERANKERS: RerankerSpec[] = [
  {
    name: "MonoT5-3B",
    family: "Encoder-decoder",
    latencyPerPair: 45,
    ndcg10: 0.745,
    multilingual: false,
    cost: "Tự host GPU",
    note: "Generative scoring — decoder sinh token 'true'/'false', lấy log-prob làm score. Rất mạnh trên MS MARCO nhưng nặng.",
  },
  {
    name: "Cohere Rerank v3.5",
    family: "API managed",
    latencyPerPair: 8,
    ndcg10: 0.768,
    multilingual: true,
    cost: "$2/1M docs",
    note: "Đa ngôn ngữ 100+, bao gồm tiếng Việt. Không cần quản lý GPU. Thích hợp cho production khởi động nhanh.",
  },
  {
    name: "BGE-Reranker-v2-m3",
    family: "Cross-encoder mở",
    latencyPerPair: 12,
    ndcg10: 0.762,
    multilingual: true,
    cost: "Tự host GPU",
    note: "Open-source, đa ngôn ngữ, base của BAAI. Chất lượng rất gần Cohere nhưng bạn tự kiểm soát.",
  },
  {
    name: "ms-marco-MiniLM-L6-v2",
    family: "Cross-encoder nhẹ",
    latencyPerPair: 3,
    ndcg10: 0.701,
    multilingual: false,
    cost: "Tự host CPU",
    note: "Siêu nhẹ, có thể chạy CPU. Tiếng Anh là chủ yếu, chất lượng thấp hơn nhưng độ trễ rất tốt.",
  },
];

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// QUIZ — 8 câu theo yêu cầu
// ---------------------------------------------------------------------------

function buildQuiz(): QuizQuestion[] {
  return [
    {
      question:
        "Tại sao không dùng Cross-Encoder cho toàn bộ 10 triệu tài liệu trong kho?",
      options: [
        "Cross-Encoder không chính xác cho tập lớn",
        "Cross-Encoder phải chạy 1 forward pass cho mỗi cặp (query, doc) — 10M cặp sẽ mất hàng giờ",
        "Cross-Encoder chỉ hoạt động với tiếng Anh",
        "Cross-Encoder không có sẵn model open-source",
      ],
      correct: 1,
      explanation:
        "Cross-Encoder: O(N) mỗi query — không thể precompute vì phải xem cặp (q, d) cùng lúc. 10M docs × 10ms = 28 giờ. Vì vậy chỉ dùng cho top-100 từ stage 1: 100 × 10ms ≈ 1 giây.",
    },
    {
      question:
        "Re-ranking có thể thay đổi thứ tự kết quả từ stage 1 như thế nào?",
      options: [
        "Chỉ loại bỏ kết quả xấu, giữ nguyên thứ tự phần còn lại",
        "Tài liệu đứng hạng 5 ở stage 1 có thể lên hạng 1 sau re-rank vì Cross-Encoder chính xác hơn",
        "Thứ tự luôn giữ nguyên",
        "Re-ranking chỉ thêm tài liệu mới vào danh sách",
      ],
      correct: 1,
      explanation:
        "Bi-Encoder mã hóa query và doc riêng rẽ → bỏ lỡ tương tác token-level. Cross-Encoder mã hóa CÙNG LÚC [CLS] q [SEP] d [SEP] → nắm bắt độ liên quan chính xác hơn nhiều. Thứ tự có thể thay đổi hoàn toàn.",
    },
    {
      question: "Cohere Rerank API nhận input gì và trả output gì?",
      options: [
        "Input: vector embedding. Output: vector mới",
        "Input: query + danh sách documents. Output: relevance score cho mỗi doc",
        "Input: 1 document. Output: bản tóm tắt",
        "Input: 2 queries. Output: similarity score",
      ],
      correct: 1,
      explanation:
        "Rerank API nhận (query, [doc1, doc2, ...]) và trả relevance score cho mỗi doc. Đơn giản: 1 API call, không cần quản lý model. Sort theo score giảm dần là kết quả re-ranked.",
    },
    {
      question:
        "Đặt top_k của stage 1 quá nhỏ (ví dụ 10) thay vì 100 sẽ gây vấn đề gì với re-ranker?",
      options: [
        "Re-ranker sẽ tự động mở rộng tìm thêm",
        "Chất lượng không đổi vì re-ranker rất mạnh",
        "Recall giảm: tài liệu đúng có thể không nằm trong top-10 của stage 1 → re-ranker không có cách nào nhìn thấy",
        "Latency tăng đột biến",
      ],
      correct: 2,
      explanation:
        "Re-ranker KHÔNG tìm kiếm mới — chỉ xếp hạng lại những gì stage 1 đưa. Nếu tài liệu vàng nằm hạng 18, mà bạn chỉ lấy top-10, bạn sẽ không bao giờ recover được. Thực tế: top-50 đến top-100 là vùng sweet spot.",
    },
    {
      question: "Điểm khác biệt cốt lõi giữa MonoT5 và BGE-Reranker là gì?",
      options: [
        "MonoT5 dùng kiến trúc encoder-decoder và sinh token 'true'/'false'; BGE-Reranker là cross-encoder chỉ có encoder, output một logit",
        "Hai mô hình giống hệt nhau về kiến trúc",
        "MonoT5 dùng cho embedding, BGE-Reranker dùng cho classification",
        "BGE-Reranker không dùng Transformer",
      ],
      correct: 0,
      explanation:
        "MonoT5 tái dụng T5 dưới dạng generative: prompt 'Query: ... Document: ... Relevant:' → decoder sinh 'true'/'false'. Score = log-prob('true'). BGE-Reranker là cross-encoder thuần: concat q + d, pool [CLS], một linear head → 1 logit. Hai cách tiếp cận khác nhau nhưng đều 'nhìn cùng lúc' q và d.",
    },
    {
      question:
        "Một pipeline lấy top-100 từ stage 1 rồi re-rank. Bi-encoder mất 5 ms; re-ranker mất 10 ms/pair. Tổng latency xấp xỉ?",
      options: [
        "5 ms",
        "105 ms — cộng dồn retrieval và 100 cặp × 10 ms = 1005 ms? Không, chạy song song thì khác",
        "Khoảng 1 giây — do 100 cặp × 10 ms cộng với retrieval; có thể batch để giảm còn vài trăm ms",
        "1 ms",
      ],
      correct: 2,
      explanation:
        "Thực tế batch 100 cặp trên GPU có thể thực thi gần song song, vì vậy latency đo được thường là 200–400 ms trên T4, chứ không phải 1000 ms nối tiếp. Điểm quan trọng: hãy benchmark, đừng ước lượng bằng phép nhân thuần.",
    },
    {
      question:
        "Bạn đang xây hệ thống tiếng Việt cho chatbot pháp luật. Lựa chọn re-ranker nào hợp lý nhất?",
      options: [
        "ms-marco-MiniLM — vì nhẹ nhất",
        "MonoT5-base tiếng Anh — rồi dịch qua lại",
        "BGE-Reranker-v2-m3 hoặc Cohere Rerank v3.5 — cả hai hỗ trợ đa ngôn ngữ bao gồm tiếng Việt",
        "Không cần re-rank nếu đã có semantic search",
      ],
      correct: 2,
      explanation:
        "ms-marco-MiniLM chủ yếu được huấn luyện trên MS MARCO tiếng Anh, kết quả trên tiếng Việt yếu. BGE-Reranker-v2-m3 (m3 = multilingual) và Cohere Rerank đều hỗ trợ tiếng Việt tốt. Chọn theo ngân sách và hạ tầng: BGE nếu tự host GPU, Cohere nếu muốn khởi động nhanh.",
    },
    {
      type: "fill-blank",
      question:
        "Kiến trúc dùng cho re-ranking là {blank}, encode query và document cùng lúc. Vì tốn kém, nó chỉ chấm {blank} tài liệu do stage 1 trả về (thường 50–100).",
      blanks: [
        {
          answer: "cross-encoder",
          accept: [
            "cross encoder",
            "CrossEncoder",
            "cross-encoder Transformer",
          ],
        },
        {
          answer: "top-k",
          accept: ["top k", "top-K", "top K", "top-n", "top n"],
        },
      ],
      explanation:
        "Cross-encoder đưa [CLS] q [SEP] d [SEP] qua Transformer, nắm bắt tương tác chi tiết giữa query và document nên chính xác hơn bi-encoder. Nhưng O(N) mỗi query — vì vậy chỉ chạy trên top-K (50–100) từ stage 1 để giữ độ trễ dưới 1 giây.",
    },
  ];
}

// ---------------------------------------------------------------------------
// HELPERS — sắp xếp ứng viên
// ---------------------------------------------------------------------------

function rankByBi(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => b.biScore - a.biScore);
}

function rankByCross(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => b.crossScore - a.crossScore);
}

function movementLabel(prevIdx: number, newIdx: number): string {
  if (prevIdx === newIdx) return "giữ nguyên";
  const delta = prevIdx - newIdx;
  if (delta > 0) return `↑ ${delta}`;
  return `↓ ${Math.abs(delta)}`;
}

// ---------------------------------------------------------------------------
// COMPONENT chính của topic
// ---------------------------------------------------------------------------

export default function ReRankingTopic() {
  const [stage, setStage] = useState<"retrieve" | "rerank" | "final">(
    "retrieve",
  );
  const [topK, setTopK] = useState(10);
  const [rerankerIdx, setRerankerIdx] = useState(1); // Cohere làm mặc định

  const biRanked = useMemo(() => rankByBi(CANDIDATES), []);
  const crossRanked = useMemo(() => rankByCross(CANDIDATES), []);
  const finalTop5 = useMemo(() => crossRanked.slice(0, 5), [crossRanked]);

  const reranker = RERANKERS[rerankerIdx];
  const latencyMs = topK * reranker.latencyPerPair;

  const quiz = useMemo(() => buildQuiz(), []);

  return (
    <>
      {/* ================================================================
           BƯỚC 1 — DỰ ĐOÁN
           ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Chatbot pháp luật tìm 'quyền lao động Việt Nam'. Stage 1 (BM25 + Semantic) trả về 50 tài liệu. Nhưng tài liệu xếp hạng 1 chứa chữ 'lao động' xuất hiện nhiều lần mà không thực sự trả lời câu hỏi. Cần làm gì?"
          options={[
            "Thay đổi query thành câu dài hơn",
            "Dùng mô hình mạnh hơn (Cross-Encoder) để đánh giá lại 50 tài liệu và xếp hạng lại",
            "Bỏ BM25, chỉ dùng Semantic",
            "Tăng ngưỡng similarity lên 0.9",
          ]}
          correct={1}
          explanation="Re-ranking! Cross-Encoder xem xét CHI TIẾT tương tác giữa query và mỗi document (không phải so sánh vector riêng rẽ). Tài liệu thực sự trả lời câu hỏi sẽ lên đầu, kể cả khi lúc ban đầu nó không có nhiều từ khóa trùng."
        >
          <p className="mt-2 text-sm text-muted">
            Trong bài học này, bạn sẽ thấy pipeline 2 giai đoạn hoạt động như
            thế nào, vì sao nó tăng chất lượng 20–40% cho RAG, và cách chọn
            giữa MonoT5, Cohere Rerank và BGE-Reranker.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
           BƯỚC 2 — ẨN DỤ THỰC TẾ
           ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ thực tế">
        <p>
          Hãy tưởng tượng bạn đang tổ chức một{" "}
          <strong>cuộc thi tài năng 2 vòng</strong> cho một đài truyền hình. Có
          10 triệu người đăng ký. Bạn <em>không thể</em> để giám khảo chính
          chấm từng người — ông ấy sẽ mất cả đời. Giải pháp: dùng một vòng sơ
          loại nhanh để rút xuống 100 thí sinh, rồi giám khảo chính chỉ cần
          dành thời gian cho 100 người đó.
        </p>
        <p>
          <strong>Vòng sơ loại</strong> ở đây tương ứng với stage 1 của search
          pipeline — BM25 hoặc semantic search bằng bi-encoder. Nhanh nhưng hơi
          hời hợt: nhìn tổng thể người đó có ở đúng thể loại không, có từ khóa
          không, giọng có tương đồng không. Thí sinh xếp đầu vòng sơ loại chưa
          chắc là xuất sắc nhất — có thể chỉ là người có "profile" khớp tốt
          với yêu cầu.
        </p>
        <p>
          <strong>Vòng chung kết</strong> là stage 2 — re-ranking bằng
          cross-encoder. Giám khảo chính <em>ngồi xem</em> từng thí sinh trình
          diễn, đối chiếu chi tiết với yêu cầu, đánh giá kỹ năng ẩn mà vòng sơ
          loại không phát hiện ra. Vì dành nhiều thời gian hơn, giám khảo chấm
          chính xác hơn nhiều — và xếp hạng có thể đảo lộn hoàn toàn so với
          vòng 1.
        </p>
        <p>
          Trong AI/ML, điều này có nghĩa là một <strong>pipeline 2 tầng</strong>
          : tầng đầu tối ưu cho <em>tốc độ và recall</em> (không được bỏ sót),
          tầng hai tối ưu cho <em>độ chính xác</em> (xếp đúng thứ tự). Đây là
          kiến trúc chuẩn mà hầu hết hệ thống search hiện đại (Google, Bing,
          Perplexity, Cohere) đều dùng.
        </p>
        <p>
          Nếu không có re-ranking, hệ thống của bạn sẽ bị "lừa" bởi các tài
          liệu <em>trông</em> liên quan (nhiều từ khóa, embedding tương tự)
          nhưng <em>không thực sự</em> trả lời câu hỏi. Với RAG, điều đó dẫn
          tới LLM nhận context kém chất lượng, từ đó sinh ra hallucination
          hoặc câu trả lời lạc đề. Re-ranking là van chất lượng — lọc lại
          trước khi đưa vào LLM.
        </p>
      </LessonSection>

      {/* ================================================================
           BƯỚC 3 — VISUALIZATION TƯƠNG TÁC
           ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* ── Thanh điều khiển giai đoạn ── */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  {
                    key: "retrieve",
                    label: "1 · Retrieve top-100 (bi-encoder)",
                  },
                  {
                    key: "rerank",
                    label: "2 · Rerank top-10 (cross-encoder)",
                  },
                  { key: "final", label: "3 · Final top-5" },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    stage === s.key
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ── Sơ đồ pipeline tổng thể ── */}
            <svg
              viewBox="0 0 760 360"
              className="w-full max-w-4xl mx-auto"
              role="img"
              aria-label="Sơ đồ pipeline retrieval + rerank"
            >
              {/* Query */}
              <rect
                x="10"
                y="150"
                width="120"
                height="60"
                rx="10"
                fill="#0f172a"
                stroke="#60a5fa"
                strokeWidth="1.5"
              />
              <text
                x="70"
                y="175"
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="11"
                fontWeight="bold"
              >
                Query
              </text>
              <text x="70" y="192" textAnchor="middle" fill="#64748b" fontSize="11">
                &quot;quyền lao động&quot;
              </text>

              {/* Corpus */}
              <rect
                x="150"
                y="40"
                width="120"
                height="60"
                rx="10"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.2"
              />
              <text x="210" y="65" textAnchor="middle" fill="#94a3b8" fontSize="11">
                Corpus
              </text>
              <text x="210" y="82" textAnchor="middle" fill="#64748b" fontSize="11">
                10M tài liệu
              </text>

              <line
                x1="130"
                y1="180"
                x2="290"
                y2="180"
                stroke="#475569"
                strokeWidth="2"
                markerEnd="url(#rr-arrow)"
              />
              <line
                x1="210"
                y1="100"
                x2="210"
                y2="155"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#rr-arrow)"
              />

              {/* Stage 1 box */}
              <rect
                x="290"
                y="140"
                width="150"
                height="80"
                rx="10"
                fill="#0f172a"
                stroke={stage !== "retrieve" ? "#1e3a8a" : "#3b82f6"}
                strokeWidth={stage === "retrieve" ? "2.5" : "1.2"}
              />
              <text
                x="365"
                y="165"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="11"
                fontWeight="bold"
              >
                Stage 1 — Retrieve
              </text>
              <text x="365" y="183" textAnchor="middle" fill="#94a3b8" fontSize="11">
                Bi-encoder + ANN
              </text>
              <text x="365" y="200" textAnchor="middle" fill="#94a3b8" fontSize="11">
                10M → top-100 (5 ms)
              </text>

              <line
                x1="440"
                y1="180"
                x2="490"
                y2="180"
                stroke="#475569"
                strokeWidth="2"
                markerEnd="url(#rr-arrow)"
              />

              {/* Stage 2 box */}
              <rect
                x="490"
                y="140"
                width="150"
                height="80"
                rx="10"
                fill="#0f172a"
                stroke={stage !== "final" && stage !== "retrieve" ? "#78350f" : "#334155"}
                strokeWidth={stage === "rerank" ? "2.5" : "1.2"}
              />
              <text
                x="565"
                y="165"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="11"
                fontWeight="bold"
              >
                Stage 2 — Rerank
              </text>
              <text x="565" y="183" textAnchor="middle" fill="#94a3b8" fontSize="11">
                Cross-encoder
              </text>
              <text x="565" y="200" textAnchor="middle" fill="#94a3b8" fontSize="11">
                top-100 → top-10 ({reranker.latencyPerPair * 10} ms)
              </text>

              <line
                x1="640"
                y1="180"
                x2="685"
                y2="180"
                stroke="#475569"
                strokeWidth="2"
                markerEnd="url(#rr-arrow)"
              />

              {/* Final */}
              <rect
                x="685"
                y="150"
                width="70"
                height="60"
                rx="10"
                fill="#0f172a"
                stroke={stage === "final" ? "#22c55e" : "#334155"}
                strokeWidth={stage === "final" ? "2.5" : "1.2"}
              />
              <text
                x="720"
                y="175"
                textAnchor="middle"
                fill="#4ade80"
                fontSize="11"
                fontWeight="bold"
              >
                Top-5
              </text>
              <text x="720" y="192" textAnchor="middle" fill="#64748b" fontSize="11">
                cho LLM
              </text>

              {/* Candidate columns — vẽ theo stage */}
              {stage === "retrieve" &&
                biRanked.slice(0, 10).map((c, i) => (
                  <g key={c.id}>
                    <rect
                      x="10"
                      y={240 + i * 11}
                      width="140"
                      height="9"
                      rx="2"
                      fill="#1e293b"
                    />
                    <rect
                      x="10"
                      y={240 + i * 11}
                      width={140 * c.biScore}
                      height="9"
                      rx="2"
                      fill="#3b82f6"
                    />
                    <text
                      x="155"
                      y={248 + i * 11}
                      fill="#94a3b8"
                      fontSize="11"
                    >
                      {c.id} {c.biScore.toFixed(2)}
                    </text>
                  </g>
                ))}

              {stage === "rerank" &&
                biRanked.slice(0, 10).map((c, i) => {
                  const newIdx = crossRanked.findIndex((x) => x.id === c.id);
                  const shift = i - newIdx;
                  const color =
                    shift > 0 ? "#22c55e" : shift < 0 ? "#f87171" : "#94a3b8";
                  return (
                    <g key={c.id}>
                      <rect
                        x="10"
                        y={240 + i * 11}
                        width="140"
                        height="9"
                        rx="2"
                        fill="#1e293b"
                      />
                      <rect
                        x="10"
                        y={240 + i * 11}
                        width={140 * c.crossScore}
                        height="9"
                        rx="2"
                        fill="#f59e0b"
                      />
                      <text
                        x="155"
                        y={248 + i * 11}
                        fill={color}
                        fontSize="11"
                      >
                        {c.id} {c.crossScore.toFixed(2)} ({movementLabel(i, newIdx)})
                      </text>
                    </g>
                  );
                })}

              {stage === "final" &&
                finalTop5.map((c, i) => (
                  <g key={c.id}>
                    <rect
                      x="10"
                      y={240 + i * 16}
                      width="180"
                      height="13"
                      rx="3"
                      fill="#052e16"
                      stroke="#22c55e"
                      strokeWidth="1"
                    />
                    <text x="16" y={250 + i * 16} fill="#4ade80" fontSize="11">
                      {i + 1}. {c.id} — cross {c.crossScore.toFixed(2)}
                    </text>
                  </g>
                ))}

              {/* Caption */}
              <text
                x="380"
                y="340"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {stage === "retrieve" &&
                  "Top-10 theo bi-encoder — chú ý các tài liệu nhiễu (D2, D6, D9) vẫn lọt."}
                {stage === "rerank" &&
                  "Cross-encoder đã chấm lại — D6, D9 bị đẩy xuống; D8, D10 leo lên."}
                {stage === "final" &&
                  "Top-5 cuối cùng — 4/5 là tài liệu vàng (gold). Chính xác hơn hẳn stage 1."}
              </text>

              <defs>
                <marker
                  id="rr-arrow"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
              </defs>
            </svg>

            {/* ── Bảng score shifts chi tiết ── */}
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Score shifts: Bi-encoder → Cross-encoder
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="py-1">ID</th>
                      <th>Tiêu đề</th>
                      <th className="text-right">Bi</th>
                      <th className="text-right">Cross</th>
                      <th className="text-right">Δ hạng</th>
                      <th className="text-center">Gold?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biRanked.map((c, biIdx) => {
                      const crossIdx = crossRanked.findIndex(
                        (x) => x.id === c.id,
                      );
                      const delta = biIdx - crossIdx;
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-border/50"
                        >
                          <td className="py-1 font-mono text-muted">{c.id}</td>
                          <td className="max-w-[320px] truncate text-foreground/90">
                            {c.title}
                          </td>
                          <td className="text-right text-blue-400">
                            {c.biScore.toFixed(2)}
                          </td>
                          <td className="text-right text-amber-400">
                            {c.crossScore.toFixed(2)}
                          </td>
                          <td
                            className={`text-right font-semibold ${
                              delta > 0
                                ? "text-green-400"
                                : delta < 0
                                  ? "text-red-400"
                                  : "text-muted"
                            }`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </td>
                          <td className="text-center">
                            {c.gold ? "✓" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">
                D6 ("giá vàng") và D9 ("cầu thủ lao động") rơi sâu vì
                cross-encoder phát hiện chúng không thực sự liên quan tới
                <em> quyền</em> lao động. Ngược lại D8 và D10 leo lên top nhờ
                nội dung đúng chủ đề.
              </p>
            </div>

            {/* ── So sánh reranker + latency/quality ── */}
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Chọn reranker: latency × chất lượng
              </p>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">top_k của stage 1:</span>
                {[10, 50, 100, 200].map((k) => (
                  <button
                    key={k}
                    onClick={() => setTopK(k)}
                    className={`rounded-md px-2 py-1 text-xs ${
                      topK === k
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {RERANKERS.map((r, i) => (
                  <button
                    key={r.name}
                    onClick={() => setRerankerIdx(i)}
                    className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                      rerankerIdx === i
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <div className="font-semibold text-foreground">
                      {r.name}
                    </div>
                    <div className="text-muted">{r.family}</div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-muted">NDCG@10</span>
                      <span className="text-green-400">
                        {r.ndcg10.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">ms/pair</span>
                      <span className="text-amber-400">
                        {r.latencyPerPair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Đa ngữ</span>
                      <span
                        className={
                          r.multilingual ? "text-green-400" : "text-red-400"
                        }
                      >
                        {r.multilingual ? "có" : "không"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-border bg-background/80 p-3 text-xs">
                <p className="font-semibold text-foreground">
                  {reranker.name} · top_k={topK}
                </p>
                <p className="mt-1 text-muted">{reranker.note}</p>
                <p className="mt-2">
                  <span className="text-muted">Ước lượng latency:</span>{" "}
                  <span className="text-amber-400">{latencyMs} ms</span>{" "}
                  <span className="text-muted">
                    ({topK} cặp × {reranker.latencyPerPair} ms)
                  </span>
                </p>
                <p>
                  <span className="text-muted">Chất lượng NDCG@10:</span>{" "}
                  <span className="text-green-400">
                    {reranker.ndcg10.toFixed(3)}
                  </span>{" "}
                  <span className="text-muted">(MS MARCO dev)</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-background/50 border border-blue-500/30 p-3">
                <p className="text-sm font-semibold text-blue-400">
                  Bi-Encoder (Stage 1)
                </p>
                <p className="text-xs text-muted">
                  Mã hóa query và doc RIÊNG RẼ. Precompute doc embeddings.
                  Cosine + ANN. Rất nhanh (ms), tối ưu cho recall.
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-amber-500/30 p-3">
                <p className="text-sm font-semibold text-amber-400">
                  Cross-Encoder (Stage 2)
                </p>
                <p className="text-xs text-muted">
                  Mã hóa CÙNG LÚC (query, doc). Attention qua cả hai → chính
                  xác hơn 15–25% NDCG, nhưng O(N) mỗi query. Chỉ chạy trên
                  top-K.
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
           BƯỚC 4 — AHA MOMENT
           ================================================================ */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="Khoảnh khắc Aha"
      >
        <AhaMoment>
          <p>
            Re-ranking giống <strong>cuộc thi tài năng 2 vòng</strong>: vòng
            sơ loại (stage 1) lọc nhanh 10M xuống 100, vòng chung kết (stage
            2) để giám khảo chính <strong>đánh giá kỹ</strong> từng người
            trong 100. Kết quả: thí sinh thực sự giỏi nhất lên đầu — dù vòng
            sơ loại có thể xếp hạng khác hoàn toàn. Bí quyết không phải là
            "mô hình mạnh hơn" mà là <strong>chia nhỏ vấn đề</strong>: tốc
            độ cho việc dễ, độ chính xác cho việc quan trọng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
           BƯỚC 5 — 2 INLINE CHALLENGE
           ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Stage 1 trả về top-20. Re-ranker chấm xong, tài liệu tốt nhất đứng hạng 18. Nếu stage 1 chỉ trả top-10, re-ranker có tìm được tài liệu đó không?"
          options={[
            "Có, re-ranker tìm thêm trong toàn bộ database",
            "KHÔNG — re-ranker chỉ xếp hạng lại những gì stage 1 đưa. Top-K stage 1 quá nhỏ = mất kết quả tốt",
            "Re-ranker tự động mở rộng top-K khi cần",
            "Có, nhưng với latency tăng gấp 2",
          ]}
          correct={1}
          explanation="Re-ranker KHÔNG tìm kiếm mới — chỉ xếp hạng lại. Nếu stage 1 bỏ lỡ tài liệu tốt, re-ranker cũng không cứu được. Top-K stage 1 quá nhỏ = recall thấp. Thực tế: top-50 đến top-100 là vùng an toàn cho hầu hết pipeline."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn đang xây một chatbot nội bộ bằng RAG, latency yêu cầu < 500 ms, corpus 2 triệu tài liệu, chủ yếu tiếng Việt. Pipeline nào hợp lý nhất?"
          options={[
            "Chỉ BM25 — nhanh nhất",
            "Stage 1: hybrid search (BM25 + embedding) → top-100. Stage 2: BGE-Reranker-v2-m3 hoặc Cohere Rerank → top-5",
            "Chạy Cross-Encoder thẳng lên 2M tài liệu",
            "Bi-encoder thẳng không cần re-rank — vector đủ mạnh",
          ]}
          correct={1}
          explanation="Hybrid search cân bằng recall (BM25 bắt từ khóa hiếm, embedding bắt ý nghĩa). Top-100 đủ rộng cho re-ranker. BGE-Reranker-v2-m3 hoặc Cohere hỗ trợ tiếng Việt tốt. Với 100 cặp × ~10 ms ≈ 100–200 ms (batch), cộng retrieval 50–100 ms → tổng dưới 500 ms. Chạy Cross-Encoder thẳng 2M là bất khả thi (hàng giờ); chỉ bi-encoder thì chất lượng thua 20% điểm NDCG."
        />
      </LessonSection>

      {/* ================================================================
           BƯỚC 6 — EXPLANATION SÂU
           ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Re-ranking</strong> là bước xếp hạng lại kết quả từ stage
            1 (thường là{" "}
            <TopicLink slug="semantic-search">semantic search</TopicLink> hoặc
            <TopicLink slug="hybrid-search"> hybrid search</TopicLink>) bằng
            một mô hình mạnh hơn — gần như luôn là một
            <em> cross-encoder</em> Transformer. Nó đưa kết quả liên quan nhất
            lên đầu và là bước chuẩn trong mọi pipeline{" "}
            <TopicLink slug="rag">RAG</TopicLink> chất lượng cao.
          </p>

          <p>
            <strong>Định nghĩa toán học.</strong> Cho query <em>q</em> và
            document <em>d</em>, cross-encoder tính một score thực:
          </p>
          <LaTeX block>
            {
              "\\text{score}(q, d) = \\text{CrossEncoder}([\\text{CLS}] \\; q \\; [\\text{SEP}] \\; d \\; [\\text{SEP}])"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Query và document được concat rồi đi <em>cùng lúc</em> qua
            Transformer. Mỗi token query có thể attend đến mỗi token document
            (và ngược lại), nắm bắt tương tác chi tiết mà bi-encoder bỏ lỡ —
            ví dụ: q "quyền lao động" × d "Điều 5 quy định các quyền cơ bản
            của người lao động" sẽ match rất mạnh, trong khi d "giá vàng tăng
            mạnh — người lao động khóc ròng" match yếu.
          </p>

          <p>
            Bi-encoder, ngược lại, mã hóa riêng:
          </p>
          <LaTeX block>
            {
              "\\text{score}(q, d) = \\cos\\big(\\text{Enc}(q),\\; \\text{Enc}(d)\\big)"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Vì <em>độc lập</em>, ta có thể precompute <em>Enc(d)</em> cho cả
            corpus, rồi lookup cực nhanh bằng ANN (HNSW, IVF-PQ). Giá phải
            trả: không có tương tác token-to-token, dẫn tới sai lệch khi
            nhiều từ khóa bề mặt nhưng ngữ nghĩa lệch.
          </p>

          <Callout variant="insight" title="Bi-Encoder vs Cross-Encoder">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Bi-Encoder:</strong> Encode riêng. Precompute doc
                vectors. Cosine / dot-product. O(1) cho mỗi (query-doc) sau
                precompute. Tối ưu cho retrieval quy mô lớn.
              </p>
              <p>
                <strong>Cross-Encoder:</strong> Encode cùng. 1 forward pass
                mỗi cặp. Chính xác hơn 15–25% NDCG nhưng O(N) mỗi query. Dùng
                cho re-ranking top-K.
              </p>
              <p>
                <strong>Trade-off cốt lõi:</strong> precompute ⇔ interaction.
                Không có free lunch — muốn tương tác chi tiết, phải trả bằng
                compute lúc query.
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="3 sai lầm phổ biến với re-ranking">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Top-K stage 1 quá nhỏ.</strong> Nếu lấy top-10 mà tài
                liệu vàng ở hạng 18, re-ranker không thể cứu. Mặc định an
                toàn: top-100.
              </li>
              <li>
                <strong>Dùng reranker tiếng Anh cho tiếng Việt.</strong>{" "}
                ms-marco-MiniLM được train chủ yếu trên MS MARCO tiếng Anh.
                Dùng cho tiếng Việt sẽ cho kết quả tồi tệ. Chọn BGE-Reranker-v2-m3
                hoặc Cohere Rerank.
              </li>
              <li>
                <strong>Không batch.</strong> Gọi cross-encoder 100 lần riêng
                lẻ = hàng giây. Batch 100 cặp vào 1 forward pass = hàng trăm
                ms. GPU luôn thích batch lớn.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Ba họ reranker phổ biến">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Generative (MonoT5, RankT5):</strong> Tái dụng
                encoder-decoder để sinh token "true"/"false", lấy log-prob
                làm score. Thường có chất lượng rất cao nhưng nặng; gần đây
                hay dùng với LLM như ranker (RankGPT, RankLLaMA).
              </li>
              <li>
                <strong>Cross-encoder classic (BGE-Reranker, MiniLM):</strong>{" "}
                Encoder-only, pool [CLS], 1 linear head → 1 logit. Là mặc
                định của sentence-transformers, rất thân thiện để tự host.
              </li>
              <li>
                <strong>API managed (Cohere Rerank, Jina Reranker):</strong>{" "}
                Không quản lý GPU, giá theo lượng doc. Khởi động nhanh, phù
                hợp prototype và team nhỏ.
              </li>
            </ul>
          </Callout>

          <Callout variant="info" title="Đánh giá reranker bằng NDCG@10 và MRR">
            Hai metric chuẩn vàng: <em>NDCG@10</em> phạt nặng khi tài liệu
            liên quan nằm dưới; <em>MRR</em> tập trung vào vị trí của kết quả
            đúng ĐẦU TIÊN. Nên dùng cả hai. Với RAG, kết hợp thêm
            <em> Recall@K</em> ở stage 1 (recall phải cao trước khi rerank cải
            thiện precision). Một quy tắc cũ nhưng hữu dụng: Recall@100 của
            stage 1 phải &gt; 90% thì rerank mới đáng.
          </Callout>

          <p>
            <strong>Code mẫu 1 — Cohere Rerank (API managed).</strong> Đây là
            cách nhanh nhất để có một pipeline rerank hoạt động. Không cần
            GPU, không cần tải model; bạn chỉ truyền query và danh sách doc,
            service trả về score:
          </p>

          <CodeBlock language="python" title="Cohere Rerank v3.5">
            {`# pip install cohere
import cohere

co = cohere.Client("YOUR_COHERE_API_KEY")

query = "quyền lao động Việt Nam"
documents = [
    "Luật lao động 2019 quy định quyền cơ bản của người lao động...",
    "Giá vàng hôm nay tăng mạnh — người lao động khóc ròng",
    "Hợp đồng lao động — mẫu và hướng dẫn ký kết",
    "Công ước ILO 87 và 98 về quyền tự do hiệp hội ở Việt Nam",
    # ... top-100 từ stage 1 (bi-encoder / BM25 / hybrid)
]

result = co.rerank(
    query=query,
    documents=documents,
    model="rerank-v3.5",   # đa ngôn ngữ, bao gồm tiếng Việt
    top_n=5,                # chỉ lấy top-5 sau rerank
)

for hit in result.results:
    score = hit.relevance_score
    text = documents[hit.index]
    print(f"{score:.3f}\\t{text[:60]}...")

# Output (ví dụ):
# 0.942   Luật lao động 2019 quy định quyền cơ bản của người...
# 0.834   Công ước ILO 87 và 98 về quyền tự do hiệp hội...
# 0.471   Hợp đồng lao động — mẫu và hướng dẫn ký kết
# 0.041   Giá vàng hôm nay tăng mạnh — người lao động khóc...`}
          </CodeBlock>

          <p>
            <strong>Code mẫu 2 — BGE-Reranker local (open-source).</strong>{" "}
            Khi bạn muốn tự kiểm soát (on-prem, nhạy cảm dữ liệu, chi phí dài
            hạn), một cross-encoder open-source như BGE-Reranker-v2-m3 là
            lựa chọn cân bằng giữa chất lượng và tốc độ. Chú ý batch để tận
            dụng GPU:
          </p>

          <CodeBlock
            language="python"
            title="BGE-Reranker-v2-m3 + sentence-transformers"
          >
            {`# pip install sentence-transformers torch
from sentence_transformers import CrossEncoder
import torch

model = CrossEncoder(
    "BAAI/bge-reranker-v2-m3",
    max_length=512,
    device="cuda" if torch.cuda.is_available() else "cpu",
)

query = "quyền lao động Việt Nam"
candidates = [
    "Luật lao động 2019 quy định quyền cơ bản của người lao động...",
    "Giá vàng hôm nay tăng mạnh — người lao động khóc ròng",
    "Công ước ILO 87 và 98 về quyền tự do hiệp hội ở Việt Nam",
    # ... top-100 từ stage 1
]

# Tạo các cặp (query, doc) — batch tất cả vào 1 forward pass
pairs = [(query, doc) for doc in candidates]

# predict trả về logit thực. Sigmoid để về xác suất.
scores = model.predict(pairs, batch_size=32, show_progress_bar=False)

# Sắp xếp giảm dần theo score, lấy top-5
ranked = sorted(
    zip(candidates, scores),
    key=lambda x: x[1],
    reverse=True,
)[:5]

for doc, s in ranked:
    print(f"{s:+.3f}\\t{doc[:60]}...")

# Gợi ý production:
#   1. Luôn batch (batch_size 16–64 trên T4, 64–128 trên A100).
#   2. Cache score cho (query, doc_id) nếu query lặp.
#   3. Với max_length ngắn hơn (256), tốc độ tăng ~2x, chất lượng
#      giảm nhẹ trên tài liệu dài — hãy A/B test trên data của bạn.`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết: tại sao cross-encoder chính xác hơn — góc nhìn attention">
            <p>
              Trong một Transformer encoder, mỗi self-attention layer tính:
            </p>
            <LaTeX block>
              {
                "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right) V"
              }
            </LaTeX>
            <p>
              Với bi-encoder, query và doc đi qua model{" "}
              <em>độc lập</em>, nên các token query không bao giờ "nhìn thấy"
              các token doc bên trong attention. Vector cuối cùng chỉ là một
              tóm tắt cô lập — cosine similarity giữa hai tóm tắt mất mát thông
              tin fine-grained (ví dụ: từ "quyền" trong query nên match với
              "quyền cơ bản" ở doc, nhưng không với "giá vàng").
            </p>
            <p>
              Với cross-encoder, query và doc được concat, nên mỗi lớp
              attention cho phép token query attend sang token doc và ngược
              lại. Đây là lý do cross-encoder bắt được các phrase match chính
              xác và quan hệ ngữ pháp — chính điểm yếu của bi-encoder.
            </p>
            <p>
              Trade-off thuần túy: <em>expressiveness</em> ⇔{" "}
              <em>precomputation</em>. Gần đây có những kiến trúc lai (ColBERT,
              SPLADE) cố gắng giữ một phần tương tác token-level mà vẫn
              precompute được — đáng tham khảo nếu bạn đụng phải giới hạn
              latency của cross-encoder.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Nâng cao: LLM-as-a-reranker và pairwise ranking">
            <p>
              Một hướng mới: dùng LLM làm reranker bằng prompt. Ví dụ
              RankGPT hỏi LLM "đây là 20 tài liệu, hãy xếp hạng lại theo độ
              liên quan với query". Hai biến thể chính:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Pointwise:</strong> hỏi LLM từng cặp (q, d), cho điểm
                0–10. Đơn giản nhưng tốn token.
              </li>
              <li>
                <strong>Listwise / pairwise:</strong> cho LLM cả danh sách, yêu
                cầu sắp xếp. Chính xác hơn nhưng cần context dài, dễ bị
                positional bias (LLM ưu tiên doc ở đầu prompt).
              </li>
            </ul>
            <p>
              Chất lượng LLM-as-a-reranker có thể vượt cross-encoder truyền
              thống, nhưng chi phí và latency cao hơn 10–100 lần. Hiện tại
              chỉ hợp lý cho các pipeline chất lượng cao (search enterprise,
              legal, medical) hoặc khi bạn đã có LLM ở downstream.
            </p>
          </CollapsibleDetail>

          <p>
            <strong>Khi nào dùng.</strong> Hãy bật re-ranking khi:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              RAG với LLM — context chất lượng trực tiếp quyết định chất lượng
              câu trả lời.
            </li>
            <li>
              Ngôn ngữ hoặc domain đặc thù (tiếng Việt, y khoa, pháp luật)
              khiến embedding thuần không đủ tinh tế.
            </li>
            <li>
              Bi-encoder của bạn chưa fine-tune — rerank có thể cứu 10–20%
              NDCG ngay mà không cần train.
            </li>
          </ul>

          <p>
            <strong>Khi nào bỏ qua.</strong> Không phải lúc nào cũng cần
            rerank. Bỏ qua khi:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              Latency SLA rất chặt (&lt; 50 ms) và bạn không thể batch đủ lớn.
            </li>
            <li>
              Corpus bé (&lt; 10K) và bi-encoder đã fine-tune tốt trên domain.
            </li>
            <li>
              Use case là autocomplete / suggest — người dùng gõ liên tục,
              chi phí rerank nhân lên nhanh.
            </li>
          </ul>

          <p>
            <strong>Trong thực tế:</strong> một pipeline RAG điển hình năm
            2024–2025 trông như sau: <em>query rewrite</em> → <em>hybrid search (BM25 + bi-encoder)</em> → top-100 →{" "}
            <em>cross-encoder rerank</em> → top-5 → LLM. Chỉ chi phí và
            latency từ rerank thường chiếm 20–40% toàn pipeline, nhưng chất
            lượng câu trả lời cuối cùng cải thiện rõ rệt — và đó là lý do nó
            trở thành mặc định.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
           BƯỚC 7 — TÓM TẮT (6 điểm)
           ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Re-ranking"
          points={[
            "Re-ranking là stage 2 của pipeline: bi-encoder retrieve top-100 → cross-encoder rerank → top-5 cho LLM.",
            "Cross-encoder mã hóa (query, doc) CÙNG LÚC nên chính xác hơn 15–25% NDCG, đổi lại O(N) mỗi query.",
            "Top-K stage 1 quyết định trần recall — quá nhỏ (10) sẽ đánh mất tài liệu tốt; mặc định an toàn là 50–100.",
            "Ba họ reranker chính: generative (MonoT5), cross-encoder mở (BGE-Reranker, MiniLM), API managed (Cohere Rerank).",
            "Với tiếng Việt: dùng BGE-Reranker-v2-m3 hoặc Cohere Rerank — tránh các model tiếng Anh thuần.",
            "Luôn batch các cặp (q, d) trên GPU — đây là đòn bẩy đơn giản nhất để giảm latency 5–10 lần.",
          ]}
        />
      </LessonSection>

      {/* ================================================================
           BƯỚC 8 — QUIZ (8 câu)
           ================================================================ */}
      <QuizSection questions={quiz} />
    </>
  );
}
