"use client";

import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bm25",
  title: "BM25",
  titleVi: "BM25 - Xếp hạng từ khoá kinh điển",
  description:
    "Thuật toán xếp hạng văn bản dựa trên tần suất từ khóa, là nền tảng của các công cụ tìm kiếm truyền thống.",
  category: "search-retrieval",
  tags: ["bm25", "ranking", "information-retrieval", "tf-idf"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "re-ranking"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "BM25 cải tiến gì so với TF-IDF?",
    options: [
      "BM25 dùng deep learning thay vì đếm từ",
      "BM25 có bão hoà tần suất (từ lặp 10 lần không gấp đôi 5 lần) + chuẩn hoá theo độ dài",
      "BM25 hiểu ngữ nghĩa câu hỏi",
      "BM25 nhanh hơn TF-IDF 100 lần",
    ],
    correct: 1,
    explanation: "TF tuyến tính: từ lặp 10 lần = 2x điểm so với 5 lần. BM25 bão hoà: 10 lần chỉ hơn 5 lần một chút. Thêm chuẩn hoá theo độ dài tài liệu để công bằng.",
  },
  {
    question: "Parameter b = 0.75 trong BM25 kiểm soát gì?",
    options: [
      "Tốc độ tìm kiếm",
      "Mức phạt theo độ dài tài liệu: b=1 phạt nặng tài liệu dài, b=0 bỏ qua",
      "Số kết quả trả về",
      "Ngưỡng confidence",
    ],
    correct: 1,
    explanation: "b kiểm soát length normalization. b=1: tài liệu dài gấp đôi trung bình bị phạt nặng (vì nhiều từ hơn tự nhiên chứa query terms). b=0: bỏ qua độ dài. Mặc định b=0.75 là cân bằng tốt.",
  },
  {
    question: "Tại sao BM25 vẫn quan trọng dù đã có semantic search?",
    options: [
      "BM25 miễn phí còn semantic search tốn tiền",
      "BM25 giỏi khớp chính xác tên riêng, mã sản phẩm, thuật ngữ -- nơi semantic search yếu",
      "BM25 luôn chính xác hơn",
      "BM25 không cần GPU",
    ],
    correct: 1,
    explanation: "Tìm 'iPhone 16 Pro Max': BM25 khớp chính xác từng từ. Semantic search có thể trả về 'Samsung Galaxy' vì 'điện thoại cao cấp' gần nhau về nghĩa. BM25 + Semantic = Hybrid Search!",
  },
  {
    type: "fill-blank",
    question: "BM25 kết hợp 2 thành phần chính: {blank} đo tần suất từ trong tài liệu, còn {blank} đo độ hiếm của từ trên toàn bộ corpus.",
    blanks: [
      { answer: "TF", accept: ["term frequency", "tần suất từ"] },
      { answer: "IDF", accept: ["inverse document frequency", "độ hiếm"] },
    ],
    explanation: "TF (Term Frequency) đếm tần suất từ trong một tài liệu — nhưng bão hoà để tránh thiên vị. IDF (Inverse Document Frequency) nâng điểm cho từ hiếm, hạ điểm cho từ phổ biến như 'và', 'là'. BM25 = TF x IDF + chuẩn hoá độ dài.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function BM25Topic() {
  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn tìm 'luật lao động 2025' trên VnExpress. Bài nào nên xếp trên? Bài A nhắc 'luật lao động' 5 lần (200 từ) hay bài B nhắc 3 lần (5000 từ)?"
          options={[
            "Bài B vì dài hơn, chắc chi tiết hơn",
            "Bài A vì mật độ từ khoá cao hơn (5 lần trong 200 từ vs 3 lần trong 5000 từ)",
            "Cả hai ngang nhau",
          ]}
          correct={1}
          explanation="BM25 xét 3 yếu tố: tần suất từ (TF), độ hiếm của từ (IDF), và chuẩn hoá theo độ dài. Bài A có mật độ cao hơn (2.5% vs 0.06%) nên xếp trên!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <svg viewBox="0 0 700 280" className="w-full max-w-3xl mx-auto">
              <text x="350" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="bold">
                3 thành phần của BM25
              </text>

              {/* IDF */}
              <rect x="40" y="55" width="200" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="140" y="80" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">IDF - Độ hiếm của từ</text>
              <text x="140" y="100" textAnchor="middle" fill="#94a3b8" fontSize="9">Từ xuất hiện ở ít tài liệu</text>
              <text x="140" y="115" textAnchor="middle" fill="#94a3b8" fontSize="9">= giá trị phân biệt cao</text>
              <text x="140" y="135" textAnchor="middle" fill="#64748b" fontSize="8">VD: 'blockchain' hiếm hơn 'và'</text>

              {/* TF */}
              <rect x="260" y="55" width="200" height="90" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="360" y="80" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">TF - Tần suất từ</text>
              <text x="360" y="100" textAnchor="middle" fill="#94a3b8" fontSize="9">Từ xuất hiện nhiều lần</text>
              <text x="360" y="115" textAnchor="middle" fill="#94a3b8" fontSize="9">= liên quan hơn (nhưng bão hoà)</text>
              <text x="360" y="135" textAnchor="middle" fill="#64748b" fontSize="8">10 lần chỉ hơn 5 lần một chút</text>

              {/* Length norm */}
              <rect x="480" y="55" width="200" height="90" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
              <text x="580" y="80" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">Chuẩn hoá độ dài</text>
              <text x="580" y="100" textAnchor="middle" fill="#94a3b8" fontSize="9">Tài liệu dài tự nhiên</text>
              <text x="580" y="115" textAnchor="middle" fill="#94a3b8" fontSize="9">chứa nhiều từ hơn</text>
              <text x="580" y="135" textAnchor="middle" fill="#64748b" fontSize="8">Phạt điểm để công bằng</text>

              {/* Example */}
              <rect x="80" y="165" width="540" height="95" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="350" y="188" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                VD: Tìm 'luật lao động' trên VnExpress
              </text>
              <text x="350" y="210" textAnchor="middle" fill="#22c55e" fontSize="10">
                Bài A: 'luật lao động' x5, 200 từ → BM25 = 3.8 (mật độ cao)
              </text>
              <text x="350" y="230" textAnchor="middle" fill="#94a3b8" fontSize="10">
                Bài B: 'luật lao động' x3, 5000 từ → BM25 = 1.2 (mật độ thấp)
              </text>
              <text x="350" y="250" textAnchor="middle" fill="#64748b" fontSize="10">
                Bài C: 'luật giao thông' x8, 300 từ → BM25 = 0.0 (không có 'lao động')
              </text>
            </svg>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-background/50 border border-border p-3">
                <p className="text-sm font-semibold text-blue-400">k1 = 1.2 (mặc định)</p>
                <p className="text-xs text-muted">Kiểm soát bão hoà tần suất. k1 cao = từ lặp nhiều vẫn được cộng điểm.</p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-3">
                <p className="text-sm font-semibold text-green-400">b = 0.75 (mặc định)</p>
                <p className="text-xs text-muted">Kiểm soát phạt theo độ dài. b=1 phạt nặng, b=0 bỏ qua.</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            BM25 giống <strong>chấm bài thi tự luận</strong>: đếm số lần nhắc đến chủ đề (TF), coi trọng
            thuật ngữ chuyên ngành hơn từ phổ biến (IDF), và không thiên vị bài dài (length norm).
            Là hậu duệ trực tiếp của <TopicLink slug="tf-idf">TF-IDF</TopicLink>, BM25 vẫn là{" "}
            <strong>baseline cực mạnh</strong>{" "}mà nhiều hệ thống{" "}
            <TopicLink slug="semantic-search">semantic search</TopicLink>{" "}hiện đại cũng khó thắng ở bài toán khớp chính xác, nên cả hai thường được kết hợp trong{" "}
            <TopicLink slug="hybrid-search">hybrid search</TopicLink>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Người dùng tìm 'thú cưng đáng yêu' nhưng tài liệu viết 'chó mèo dễ thương'. BM25 tìm được không?"
          options={[
            "Được, BM25 hiểu đồng nghĩa",
            "KHÔNG, BM25 chỉ khớp chính xác từ -- 'thú cưng' != 'chó mèo', 'đáng yêu' != 'dễ thương'",
            "Được nếu tăng k1 lên cao",
          ]}
          correct={1}
          explanation="BM25 là lexical search -- chỉ khớp chính xác chuỗi ký tự. Không hiểu đồng nghĩa, viết tắt, hay ngữ cảnh. Đây là lý do cần Semantic Search bổ sung, tạo thành Hybrid Search!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>BM25</strong>{" "}(Best Matching 25) là thuật toán xếp hạng kinh điển trong Information Retrieval,
            nền tảng của Elasticsearch, Solr, và Lucene.
          </p>

          <p><strong>Công thức BM25:</strong></p>
          <LaTeX block>{"\\text{score}(D, Q) = \\sum_{i=1}^{n} \\text{IDF}(q_i) \\cdot \\frac{f(q_i, D) \\cdot (k_1 + 1)}{f(q_i, D) + k_1 \\cdot \\left(1 - b + b \\cdot \\frac{|D|}{\\text{avgdl}}\\right)}"}</LaTeX>

          <p><strong>Các thành phần:</strong></p>
          <LaTeX block>{"\\text{IDF}(q_i) = \\ln\\left(\\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1\\right)"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"f(q_i, D)"}</LaTeX> = tần suất từ <LaTeX>{"q_i"}</LaTeX> trong tài liệu D.{" "}
            <LaTeX>{"n(q_i)"}</LaTeX> = số tài liệu chứa từ <LaTeX>{"q_i"}</LaTeX>.{" "}
            <LaTeX>{"|D|"}</LaTeX> = độ dài tài liệu, <LaTeX>{"\\text{avgdl}"}</LaTeX> = độ dài trung bình.
          </p>

          <Callout variant="insight" title="BM25 vs TF-IDF">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>TF-IDF:</strong>{" "}TF tuyến tính (10 lần = 2x 5 lần). Không chuẩn hoá độ dài.</li>
              <li><strong>BM25:</strong>{" "}TF bão hoà (10 lần chỉ hơn 5 lần chút). Chuẩn hoá theo |D|/avgdl. Parameter k1, b tuning được.</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="BM25 với rank-bm25 (Python)">
{`from rank_bm25 import BM25Okapi

# Tài liệu (đã tách từ)
corpus = [
    "luật lao động việt nam quy định quyền người lao động".split(),
    "bộ luật hình sự năm 2015 sửa đổi bổ sung".split(),
    "luật lao động bảo vệ quyền lợi người lao động".split(),
    "luật giao thông đường bộ quy định tốc độ".split(),
    "quyền và nghĩa vụ người lao động theo luật".split(),
]

# Tạo BM25 index
bm25 = BM25Okapi(corpus)  # k1=1.5, b=0.75 mặc định

# Tìm kiếm
query = "quyền người lao động".split()
scores = bm25.get_scores(query)
# scores = [2.8, 0.3, 3.5, 0.0, 2.1]

# Top-3 kết quả
top3 = sorted(
    enumerate(scores), key=lambda x: -x[1]
)[:3]
for idx, score in top3:
    print(f"Score {score:.2f}: {' '.join(corpus[idx])}")

# Elasticsearch cũng dùng BM25 làm default scoring
# GET /vnexpress/_search
# { "query": { "match": { "content": "luật lao động" } } }`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "BM25 = TF (tần suất, bão hoà) x IDF (độ hiếm) x Length Normalization (chuẩn hoá độ dài)",
          "Parameter k1 (bão hoà TF), b (phạt độ dài). Mặc định k1=1.2, b=0.75 hoạt động tốt",
          "Giỏi khớp chính xác: tên riêng, mã sản phẩm, thuật ngữ. Yếu: đồng nghĩa, ngữ cảnh",
          "Vẫn là baseline mạnh, kết hợp semantic search trong Hybrid Search là chuẩn hiện đại",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
