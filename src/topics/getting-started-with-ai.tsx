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

// ═══════════════════════════════════════════════════════════════════════════
// METADATA — giữ nguyên để hệ thống điều hướng nhận diện chủ đề
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: TopicMeta = {
  slug: "getting-started-with-ai",
  title: "Getting Started with AI",
  titleVi: "Bắt đầu sử dụng AI",
  description:
    "Hướng dẫn tạo tài khoản, cuộc hội thoại đầu tiên, và mẹo nhận kết quả tốt trong 5 phút.",
  category: "applied-ai",
  tags: ["beginner", "practical", "office", "getting-started"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "prompt-engineering", "ai-tool-evaluation"],
  vizType: "interactive",
};

// ═══════════════════════════════════════════════════════════════════════════
// DỮ LIỆU LỘ TRÌNH HỌC AI — 6 NODE
// ═══════════════════════════════════════════════════════════════════════════
//
// Mỗi node đại diện một cột mốc kiến thức trên đường đi từ người mới
// đến kỹ sư AI ứng dụng. Click vào node để xem chi tiết về thời lượng,
// điều kiện tiên quyết, tài nguyên học, và điều mà bạn có thể làm sau
// khi thành thạo nó.

type RoadmapNode = {
  id: string;
  label: string;
  short: string;
  timeHours: string;
  prerequisites: string[];
  resources: { label: string; kind: "book" | "course" | "video" | "doc" }[];
  afterThis: string;
  color: string;
  // Toạ độ trên SVG viewBox 800x360
  x: number;
  y: number;
};

const NODES: RoadmapNode[] = [
  {
    id: "python",
    label: "Python căn bản",
    short: "Biến, hàm, list, dict, file I/O",
    timeHours: "30 – 60 giờ",
    prerequisites: ["Không có — đây là điểm xuất phát cho đa số người học AI"],
    resources: [
      { label: "Python for Everybody (Coursera, miễn phí audit)", kind: "course" },
      { label: "Automate the Boring Stuff with Python", kind: "book" },
      { label: "python.org — Hướng dẫn chính thức", kind: "doc" },
    ],
    afterThis:
      "Bạn có thể đọc script Python, viết hàm đơn giản, xử lý file CSV — đủ để bắt đầu làm việc với dữ liệu.",
    color: "#3b82f6",
    x: 90,
    y: 180,
  },
  {
    id: "numpy",
    label: "NumPy & Pandas",
    short: "Mảng số, phép toán vector, DataFrame",
    timeHours: "20 – 40 giờ",
    prerequisites: ["Python căn bản", "Toán cấp 3 (đại số tuyến tính sơ cấp)"],
    resources: [
      { label: "NumPy: the absolute basics (numpy.org)", kind: "doc" },
      { label: "10 minutes to pandas (pandas.pydata.org)", kind: "doc" },
      { label: "Python Data Science Handbook — Jake VanderPlas", kind: "book" },
    ],
    afterThis:
      "Bạn xử lý được các bộ dữ liệu bảng, làm sạch dữ liệu, và hiểu tại sao vectorisation nhanh hơn vòng lặp Python thuần.",
    color: "#22c55e",
    x: 230,
    y: 180,
  },
  {
    id: "ml",
    label: "Nền tảng ML",
    short: "Regression, classification, train/test, overfit",
    timeHours: "80 – 120 giờ",
    prerequisites: [
      "NumPy & Pandas",
      "Xác suất & thống kê cơ bản",
      "Gradient descent (hiểu ở mức trực quan)",
    ],
    resources: [
      { label: "Machine Learning — Andrew Ng (Coursera)", kind: "course" },
      { label: "Hands-On ML — Aurélien Géron (O'Reilly)", kind: "book" },
      { label: "scikit-learn user guide", kind: "doc" },
      { label: "StatQuest (Josh Starmer) — YouTube", kind: "video" },
    ],
    afterThis:
      "Bạn huấn luyện được mô hình dự đoán đơn giản, chọn metric phù hợp (accuracy, F1, AUC), và nhận ra khi nào mô hình đang overfit.",
    color: "#f59e0b",
    x: 380,
    y: 100,
  },
  {
    id: "dl",
    label: "Deep Learning",
    short: "Neural net, backprop, CNN, Transformer",
    timeHours: "120 – 200 giờ",
    prerequisites: [
      "Nền tảng ML",
      "Đại số tuyến tính vững (ma trận, vector)",
      "Giải tích đa biến sơ cấp",
    ],
    resources: [
      { label: "Deep Learning Specialization — Andrew Ng", kind: "course" },
      { label: "Dive into Deep Learning (d2l.ai)", kind: "book" },
      { label: "Neural Networks: Zero to Hero — Karpathy", kind: "video" },
      { label: "PyTorch tutorials", kind: "doc" },
    ],
    afterThis:
      "Bạn tự huấn luyện được mạng neuron cho bài toán ảnh hoặc văn bản, đọc hiểu paper ở mức kiến trúc, và biết khi nào dùng CNN vs. Transformer.",
    color: "#a855f7",
    x: 540,
    y: 100,
  },
  {
    id: "nlp",
    label: "NLP & LLM",
    short: "Token, embedding, attention, prompt engineering",
    timeHours: "60 – 100 giờ",
    prerequisites: ["Deep Learning", "Hiểu mô hình Transformer"],
    resources: [
      { label: "Hugging Face NLP Course (miễn phí)", kind: "course" },
      { label: "Speech & Language Processing — Jurafsky & Martin", kind: "book" },
      { label: "Illustrated Transformer — Jay Alammar", kind: "doc" },
      { label: "Let's build GPT — Karpathy", kind: "video" },
    ],
    afterThis:
      "Bạn fine-tune được mô hình LLM nhỏ, hiểu cơ chế attention, và xây được chatbot đơn giản bằng API.",
    color: "#ec4899",
    x: 680,
    y: 180,
  },
  {
    id: "apps",
    label: "Ứng dụng AI",
    short: "RAG, agent, tool use, triển khai production",
    timeHours: "60 – 120 giờ",
    prerequisites: ["NLP & LLM", "Kinh nghiệm backend web / API"],
    resources: [
      { label: "LangChain / LlamaIndex — tài liệu chính thức", kind: "doc" },
      { label: "Building LLM-Powered Applications — Valentina Alto", kind: "book" },
      { label: "Prompt Engineering Guide (promptingguide.ai)", kind: "doc" },
      { label: "Full Stack Deep Learning", kind: "course" },
    ],
    afterThis:
      "Bạn tự xây được chatbot RAG truy vấn tài liệu công ty, agent thực thi tool, và triển khai lên cloud với observability đầy đủ.",
    color: "#ef4444",
    x: 540,
    y: 280,
  },
];

// Các cạnh (phụ thuộc) giữa các node. Format: [from_id, to_id]
const EDGES: [string, string][] = [
  ["python", "numpy"],
  ["numpy", "ml"],
  ["ml", "dl"],
  ["dl", "nlp"],
  ["nlp", "apps"],
];

// ═══════════════════════════════════════════════════════════════════════════
// CÁC LỘ TRÌNH KHÁC NHAU THEO VAI TRÒ
// ═══════════════════════════════════════════════════════════════════════════

type PathVariant = {
  id: "student" | "engineer" | "manager";
  label: string;
  subtitle: string;
  nodes: string[]; // node ids theo thứ tự
  note: string;
};

const PATHS: PathVariant[] = [
  {
    id: "student",
    label: "Sinh viên / Người học bài bản",
    subtitle: "Muốn hiểu sâu, có thời gian, định làm nghiên cứu / kỹ sư AI",
    nodes: ["python", "numpy", "ml", "dl", "nlp", "apps"],
    note:
      "Đi đủ 6 node, dành khoảng 6 – 12 tháng học full-time hoặc 12 – 24 tháng part-time. Ưu tiên bài tập tay, đọc paper, reproduce kết quả.",
  },
  {
    id: "engineer",
    label: "Kỹ sư phần mềm muốn chuyển sang AI ứng dụng",
    subtitle: "Đã biết code, cần nhanh chóng xây sản phẩm tích hợp LLM",
    nodes: ["python", "numpy", "nlp", "apps"],
    note:
      "Bỏ qua phần Deep Learning chi tiết, đi tắt vào LLM & ứng dụng. Khoảng 3 – 6 tháng. Sau này nếu cần custom model mới quay lại học DL.",
  },
  {
    id: "manager",
    label: "Quản lý / Người quyết định công nghệ",
    subtitle: "Cần hiểu khái niệm, đánh giá rủi ro, làm việc với team kỹ thuật",
    nodes: ["python", "ml", "nlp", "apps"],
    note:
      "Tập trung vào tư duy sản phẩm: khi nào dùng AI, chi phí, rủi ro bảo mật, ROI. Không cần code sâu, đọc ở mức khái niệm. Khoảng 4 – 8 tuần.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ — 8 câu
// ═══════════════════════════════════════════════════════════════════════════

const QUIZ: QuizQuestion[] = [
  {
    question: "Khi lần đầu sử dụng AI, bước nào nên làm đầu tiên?",
    options: [
      "Hỏi AI một câu hỏi dài và phức tạp ngay.",
      "Tạo tài khoản trên một công cụ AI phổ biến (ChatGPT, Claude, Gemini) — miễn phí, chỉ cần email.",
      "Mua gói trả phí đắt nhất để có kết quả tốt nhất.",
      "Đọc hết tài liệu kỹ thuật về mô hình ngôn ngữ lớn trước.",
    ],
    correct: 1,
    explanation:
      "Bắt đầu đơn giản: tạo tài khoản miễn phí. Bạn không cần trả phí hay hiểu kỹ thuật — cứ thử trước, tìm hiểu sau. Phần lớn bài học nhập môn AI tốt nhất đến từ việc tương tác thực tế với một công cụ, không phải từ lý thuyết.",
  },
  {
    question:
      "Prompt nào sẽ cho kết quả tốt hơn khi nhờ AI viết email xin phép nghỉ?",
    options: [
      "\"Viết email nghỉ phép\".",
      "\"Viết email xin phép nghỉ 2 ngày, gửi trưởng phòng Nguyễn Văn A, lý do việc gia đình, giọng văn lịch sự và chuyên nghiệp, khoảng 100 từ\".",
      "\"Email nghỉ, ngắn thôi\".",
      "\"Viết cái gì đó cho sếp\".",
    ],
    correct: 1,
    explanation:
      "Prompt cụ thể (số ngày, người nhận, lý do, giọng văn, độ dài) giúp AI hiểu chính xác bạn cần gì. Quy tắc ngắn: càng nhiều ràng buộc rõ ràng trong prompt, output càng sát yêu cầu.",
  },
  {
    type: "fill-blank",
    question:
      "Khi kết quả AI chưa tốt, bạn nên {blank} prompt bằng cách thêm chi tiết, thay vì hỏi lại y nguyên câu cũ.",
    blanks: [
      { answer: "tinh chỉnh", accept: ["chỉnh sửa", "cải thiện", "sửa", "refine"] },
    ],
    explanation:
      "Tinh chỉnh (refine) prompt là kỹ năng quan trọng nhất khi dùng AI. Thêm ngữ cảnh, ví dụ, hoặc ràng buộc cụ thể hơn sẽ cải thiện kết quả đáng kể. Đây là quá trình lặp — ít ai có prompt hoàn hảo ngay lần đầu.",
  },
  {
    question: "AI có thể mắc sai lầm nào sau đây?",
    options: [
      "Trả lời sai nhưng nghe rất tự tin và thuyết phục.",
      "Từ chối trả lời mọi câu hỏi.",
      "Tự động gửi email thay bạn mà không hỏi.",
      "Tự xoá tài khoản của bạn.",
    ],
    correct: 0,
    explanation:
      "Đây gọi là \"ảo giác\" (hallucination) — AI có thể bịa thông tin sai nhưng trình bày rất thuyết phục. Luôn kiểm tra lại các thông tin quan trọng: số liệu, ngày tháng, trích dẫn, tên riêng.",
  },
  {
    question:
      "Một sinh viên muốn học AI bài bản. Thứ tự môn nào hợp lý nhất?",
    options: [
      "Deep Learning → Python → Toán → NLP.",
      "Python → NumPy/Pandas → ML căn bản → Deep Learning → NLP → Ứng dụng.",
      "NLP → Python → ML.",
      "Bắt đầu thẳng với LLM, bỏ qua hết phần cơ bản.",
    ],
    correct: 1,
    explanation:
      "Kiến thức AI xếp chồng: cần Python để code, NumPy/Pandas để xử lý dữ liệu, ML căn bản để hiểu khái niệm train/test, rồi mới lên DL và LLM. Nhảy cóc có thể chạy được demo nhưng không vững khi debug hoặc cải thiện.",
  },
  {
    question:
      "Kỹ sư phần mềm muốn chuyển sang AI ứng dụng (xây chatbot, RAG) nhanh nhất. Lộ trình nào phù hợp?",
    options: [
      "Học đủ 6 tháng toán + 6 tháng DL trước, rồi mới đụng LLM.",
      "Python (đã biết) → đủ NumPy/Pandas → đi tắt vào NLP & ứng dụng LLM → quay lại học DL sâu hơn nếu cần model tuỳ chỉnh.",
      "Chỉ cần đọc vài bài blog rồi xây ngay.",
      "Học thuộc API của một framework duy nhất.",
    ],
    correct: 1,
    explanation:
      "Với kỹ sư đã có nền tảng code, không cần đi qua toàn bộ ML/DL chi tiết để xây app RAG hay chatbot. Đi tắt vào LLM + framework (LangChain, Mastra...) giúp ra sản phẩm trong 3-6 tháng. Khi gặp bài toán cần custom model, mới quay lại học DL.",
  },
  {
    question:
      "Lộ trình cho người quản lý (không code) nên nhấn vào điều gì?",
    options: [
      "Tự viết và train model từ đầu.",
      "Hiểu khái niệm, khả năng và giới hạn của AI, chi phí / rủi ro / ROI để làm việc hiệu quả với team kỹ thuật.",
      "Chỉ cần đọc báo công nghệ là đủ.",
      "Học đầy đủ toán như sinh viên PhD.",
    ],
    correct: 1,
    explanation:
      "Quản lý cần đủ kiến thức để đánh giá đề xuất của team kỹ thuật: task này AI làm được không, chi phí bao nhiêu, rủi ro hallucination / bảo mật / bản quyền dữ liệu. Không cần code sâu, nhưng cần tư duy về sản phẩm và hệ thống.",
  },
  {
    question:
      "Dấu hiệu nào cho thấy bạn nên DỪNG lộ trình hiện tại và học lùi lại?",
    options: [
      "Bạn đang đọc Deep Learning nhưng không hiểu đạo hàm và ma trận là gì.",
      "Bạn đọc một đoạn code Python mà không hiểu nghĩa → nên quay lại củng cố Python cơ bản.",
      "Bạn đang làm model mà không hiểu tại sao dùng loss function này thay loss khác.",
      "Tất cả các dấu hiệu trên.",
    ],
    correct: 3,
    explanation:
      "Kiến thức AI như xây nhà: móng không vững thì lên tầng là sập. Nếu thấy mình đang \"copy code không hiểu\", \"chạy theo tutorial cảm giác hiểu nhưng không giải thích được\" — đó là tín hiệu nên quay về node trước đó và củng cố. Đi chậm mà chắc nhanh hơn đi nhanh rồi phải quay lại từ đầu.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════════════════════════

export default function GettingStartedWithAiTopic() {
  // Node đang được chọn để xem chi tiết
  const [selectedNode, setSelectedNode] = useState<string>("python");
  // Lộ trình vai trò đang xem
  const [path, setPath] = useState<PathVariant["id"]>("student");

  const node = useMemo(
    () => NODES.find((n) => n.id === selectedNode) ?? NODES[0],
    [selectedNode]
  );

  const activePath = useMemo(
    () => PATHS.find((p) => p.id === path) ?? PATHS[0],
    [path]
  );

  // Kiểm tra một node có thuộc lộ trình đang chọn không
  const nodeInPath = useMemo(() => {
    const set = new Set(activePath.nodes);
    return (id: string) => set.has(id);
  }, [activePath]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 1 — PREDICTION GATE                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Theo bạn, để trở thành kỹ sư AI ứng dụng (xây chatbot, RAG, agent) thành thạo, thời gian học trung bình là bao lâu?"
          options={[
            "1 – 2 tuần, chỉ cần xem vài video YouTube.",
            "3 – 12 tháng tuỳ nền tảng ban đầu, với học đều đặn và làm dự án thực tế.",
            "Tối thiểu 5 năm, phải có bằng PhD.",
          ]}
          correct={1}
          explanation="Sự thật nằm giữa. Nếu đã biết lập trình, 3-6 tháng tập trung vào LLM & ứng dụng là đủ để xây sản phẩm đầu tiên. Nếu bắt đầu từ con số 0 (chưa biết Python), cần khoảng 6-12 tháng để học vững. Không cần PhD, nhưng cũng không có đường tắt dưới vài tuần — kỹ năng cần thời gian thực hành."
        >
          <p className="text-base text-foreground/90 leading-relaxed">
            Bài này vẽ ra một <strong>lộ trình học AI trực quan</strong>{" "}
            — 6 cột mốc kiến thức, mỗi cột mốc có thời lượng, điều
            kiện tiên quyết, và tài nguyên học tốt nhất. Bạn cũng sẽ
            thấy <strong>ba biến thể lộ trình</strong>: cho sinh viên
            bài bản, cho kỹ sư đã biết code, và cho người quản lý
            không cần viết code.
          </p>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Hãy đoán trước, rồi khám phá đồ thị bên dưới để tìm lộ
            trình phù hợp với mình.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 2 — ẨN DỤ + VISUALIZATION                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            Ẩn dụ: học AI như leo núi có nhiều tuyến
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Hãy tưởng tượng <strong>kiến thức AI là một ngọn núi</strong>,
            và bạn đang đứng ở chân núi. Có <em>nhiều tuyến đường</em>{" "}
            lên đỉnh:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground/90">
            <li>
              <strong>Tuyến bài bản</strong>: đi lên từng trạm, dừng
              nghỉ ở mỗi cột mốc (Python → NumPy → ML → DL → NLP →
              Ứng dụng). Chậm nhưng vững.
            </li>
            <li>
              <strong>Tuyến tắt cho kỹ sư</strong>: đã có leo núi kinh
              nghiệm (biết code), có thể đi đường tắt qua vài trạm
              và lên nhanh hơn.
            </li>
            <li>
              <strong>Tuyến ngắm cảnh</strong>: bạn là quản lý, không
              cần lên đỉnh — chỉ cần hiểu bản đồ để làm việc với các
              leader đang dẫn nhóm leo.
            </li>
          </ul>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Quan trọng: <strong>không có tuyến nào sai</strong> — chỉ
            có tuyến phù hợp với mục tiêu của bạn. Nhảy cóc có thể
            nhanh lúc đầu, nhưng nếu móng kiến thức yếu, bạn sẽ phải
            quay lại. Đọc tiếp để chọn tuyến.
          </p>
        </div>

        <div className="mt-6">
          <VisualizationSection>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Bản đồ lộ trình học AI — click vào node để xem chi tiết
            </h3>
            <p className="text-sm text-muted mb-4">
              Chọn một vai trò bên dưới để xem lộ trình tương ứng
              (node màu đầy là có trong lộ trình, node mờ là không
              bắt buộc). Click vào node bất kỳ để xem thời lượng,
              điều kiện tiên quyết, và tài nguyên học.
            </p>

            {/* Bộ chọn vai trò */}
            <div className="flex flex-wrap gap-2 mb-5">
              {PATHS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPath(p.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    path === p.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Mô tả lộ trình hiện tại */}
            <div className="rounded-lg border border-border bg-background/40 p-3 mb-5">
              <p className="text-sm font-semibold text-foreground">
                {activePath.label}
              </p>
              <p className="text-xs text-muted mt-1">
                {activePath.subtitle}
              </p>
              <p className="text-sm text-foreground/90 mt-2 leading-relaxed">
                {activePath.note}
              </p>
            </div>

            {/* SVG lộ trình */}
            <svg
              viewBox="0 0 800 360"
              className="w-full max-w-4xl mx-auto mb-4"
              role="img"
              aria-label="Bản đồ lộ trình học AI"
            >
              <defs>
                <marker
                  id="arr-rm"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>

              {/* Cạnh giữa các node */}
              {EDGES.map(([from, to]) => {
                const a = NODES.find((n) => n.id === from)!;
                const b = NODES.find((n) => n.id === to)!;
                const inPath = nodeInPath(from) && nodeInPath(to);
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={inPath ? "#60a5fa" : "#cbd5e1"}
                    strokeWidth={inPath ? 2.5 : 1}
                    strokeDasharray={inPath ? "0" : "4 4"}
                    markerEnd="url(#arr-rm)"
                  />
                );
              })}

              {/* Node */}
              {NODES.map((n) => {
                const active = selectedNode === n.id;
                const inPath = nodeInPath(n.id);
                const opacity = inPath ? 1 : 0.35;
                return (
                  <g
                    key={n.id}
                    style={{ cursor: "pointer", opacity }}
                    onClick={() => setSelectedNode(n.id)}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={active ? 36 : 30}
                      fill={n.color}
                      stroke={active ? "#fbbf24" : "white"}
                      strokeWidth={active ? 4 : 2}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      {n.label.split(" ")[0]}
                    </text>
                    <text
                      x={n.x}
                      y={n.y + 55}
                      textAnchor="middle"
                      fill="var(--text-tertiary)"
                      fontSize={10}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Chi tiết node đang chọn */}
            <div className="rounded-lg border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: node.color }}
                />
                <h4 className="text-sm font-semibold text-foreground">
                  {node.label}
                </h4>
                <span className="text-xs text-muted ml-auto">
                  Thời lượng: {node.timeHours}
                </span>
              </div>
              <p className="text-sm text-foreground/90">{node.short}</p>

              <div>
                <p className="text-xs font-semibold text-muted mb-1">
                  Điều kiện tiên quyết:
                </p>
                <ul className="list-disc list-inside pl-2 text-sm text-foreground/90 space-y-0.5">
                  {node.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted mb-1">
                  Tài nguyên đề xuất:
                </p>
                <ul className="list-disc list-inside pl-2 text-sm text-foreground/90 space-y-0.5">
                  {node.resources.map((r, i) => (
                    <li key={i}>
                      <span className="text-xs uppercase text-accent mr-1">
                        [{r.kind}]
                      </span>
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted mb-1">
                  Sau khi hoàn thành:
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {node.afterThis}
                </p>
              </div>
            </div>
          </VisualizationSection>
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — AHA MOMENT                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc aha">
        <AhaMoment>
          Lộ trình học AI <strong>không phải một đường thẳng duy nhất</strong>.
          Một sinh viên năm nhất và một kỹ sư full-stack 5 năm kinh
          nghiệm không nên đi cùng một tuyến. Điều quan trọng là{" "}
          <strong>khớp mục tiêu với tuyến</strong>: nếu bạn muốn xây
          sản phẩm LLM trong 6 tháng, đừng mất 12 tháng đọc
          backpropagation chi tiết. Nhưng nếu muốn đi xa (nghiên cứu,
          custom model), không có cách nào né được phần toán và DL.
          Chọn đúng tuyến giúp bạn tiết kiệm hàng trăm giờ.
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 4 — INLINE CHALLENGE #1                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="Bạn là kỹ sư backend 3 năm kinh nghiệm, đã biết Python tốt. Mục tiêu: xây một chatbot RAG truy vấn tài liệu nội bộ công ty trong 3 tháng. Lộ trình nào phù hợp nhất?"
          options={[
            "Học đầy đủ: Python → NumPy → ML → DL → NLP → Ứng dụng (6-12 tháng).",
            "Nhảy thẳng vào framework LLM, sao chép code mẫu, không cần hiểu gì.",
            "Ôn NumPy/Pandas nhanh → học NLP & LLM ở mức khái niệm → tập trung vào framework RAG và ứng dụng → quay lại DL sau nếu cần.",
            "Bỏ nghề, đi học PhD trước.",
          ]}
          correct={2}
          explanation="Với người đã vững code, đi tắt qua phần DL chi tiết để tập trung vào LLM & ứng dụng là hợp lý. Bạn vẫn cần hiểu khái niệm (token, embedding, attention ở mức trực quan), nhưng không cần tự viết transformer từ đầu. Khi nào cần fine-tune model riêng, hãy quay lại học DL sâu hơn."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 5 — INLINE CHALLENGE #2                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách 2">
        <InlineChallenge
          question="Bạn đang đọc một tutorial Deep Learning, nhưng gặp thuật ngữ 'gradient descent' và không biết đạo hàm là gì. Nên làm gì?"
          options={[
            "Bỏ qua, cứ copy code cho chạy được là xong.",
            "Dừng lại, quay về học đạo hàm sơ cấp (chỉ cần mức hiểu trực quan, không cần giải tích cao cấp) rồi mới tiếp tục.",
            "Chuyển sang AI khác dễ hơn.",
            "Đi học PhD toán 4 năm rồi quay lại.",
          ]}
          correct={1}
          explanation="Đây chính là tín hiệu nên học lùi một node. Gradient descent cần hiểu ý nghĩa đạo hàm (tốc độ thay đổi). Không cần giải tích cao cấp — Khan Academy hoặc 3Blue1Brown có thể giải thích trong 1 giờ. Bỏ qua sẽ khiến mọi khái niệm sau đó (backprop, optimizer, lr schedule) trở nên mơ hồ. Chọn 'PhD 4 năm' là over-kill; chọn 'bỏ qua' là nợ kiến thức."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 6 — EXPLANATION SECTION                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Lý thuyết sâu">
        <ExplanationSection>
          {/* ──────────────────────────────────────────────────────── */}
          {/* ĐỊNH NGHĨA                                              */}
          {/* ──────────────────────────────────────────────────────── */}
          <p>
            <strong>Lộ trình học AI</strong> là một chuỗi các cột mốc
            kiến thức được sắp xếp theo thứ tự phụ thuộc, giúp người
            học đi từ điểm xuất phát (thường là Python cơ bản) đến
            mục tiêu cụ thể (kỹ sư AI ứng dụng, nhà nghiên cứu, hay
            quản lý sản phẩm AI). Mỗi cột mốc bao gồm:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Nội dung cốt lõi</strong> — khái niệm cần hiểu.
            </li>
            <li>
              <strong>Kỹ năng đầu ra</strong> — sau khi thạo, bạn
              làm được gì?
            </li>
            <li>
              <strong>Thời lượng ước tính</strong> — giờ học cần đầu
              tư để đạt mức cơ bản.
            </li>
            <li>
              <strong>Tài nguyên tốt nhất</strong> — khoá học, sách,
              video được cộng đồng công nhận.
            </li>
            <li>
              <strong>Phụ thuộc</strong> — các cột mốc nào cần có
              trước khi vào được cột mốc này.
            </li>
          </ul>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CÔNG THỨC ƯỚC LƯỢNG THỜI GIAN                           */}
          {/* ──────────────────────────────────────────────────────── */}
          <p>
            Hình thức, ta có thể ước lượng tổng thời gian của một
            lộ trình bằng công thức đơn giản. Gọi{" "}
            <LaTeX>{`t_i`}</LaTeX> là thời lượng (giờ) của cột mốc
            thứ <LaTeX>{`i`}</LaTeX>, và{" "}
            <LaTeX>{`\\alpha_i \\in [0.5, 1.5]`}</LaTeX> là hệ số
            hiệu chỉnh theo nền tảng ban đầu của bạn (thấp nếu đã
            có nền, cao nếu chưa có). Tổng thời gian ước tính:
          </p>
          <LaTeX block>
            {`T_{\\text{total}} = \\sum_{i \\in \\text{path}} \\alpha_i \\cdot t_i`}
          </LaTeX>
          <p>
            Với lộ trình sinh viên đầy đủ (370 – 640 giờ) và{" "}
            <LaTeX>{`\\alpha = 1.0`}</LaTeX>, học part-time 10
            giờ/tuần tương ứng{" "}
            <LaTeX>{`37 - 64`}</LaTeX> tuần — khoảng{" "}
            <strong>9 – 15 tháng</strong>. Với kỹ sư đã biết code
            và đi lộ trình tắt (170 – 320 giờ, {" "}
            <LaTeX>{`\\alpha = 0.7`}</LaTeX>): còn{" "}
            <LaTeX>{`120 - 224`}</LaTeX> giờ,
            tương ứng <strong>3 – 5 tháng</strong> part-time.
          </p>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CODE BLOCK 1 — OpenAI tools / gọi API lần đầu            */}
          {/* ──────────────────────────────────────────────────────── */}
          <p>
            Dù lộ trình học thế nào, sớm muộn bạn sẽ cần viết đoạn
            code đầu tiên gọi API LLM. Đây là &quot;Hello World&quot;
            của AI ứng dụng — chỉ cần vài dòng để nói chuyện với mô
            hình:
          </p>

          <CodeBlock language="python" title="hello_ai.py">{`# Bước 1: cài SDK
# pip install openai python-dotenv

# Bước 2: tạo file .env ở cùng thư mục với nội dung
#   OPENAI_API_KEY=sk-...
# Nhớ thêm .env vào .gitignore để tránh lộ key.

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()  # đọc biến môi trường từ .env
client = OpenAI()  # SDK tự đọc OPENAI_API_KEY

# Bước 3: cuộc hội thoại đầu tiên
response = client.chat.completions.create(
    model="gpt-4o-mini",  # mô hình nhỏ, rẻ, đủ dùng cho luyện tập
    messages=[
        {"role": "system",
         "content": "Bạn là gia sư tiếng Việt, trả lời ngắn gọn."},
        {"role": "user",
         "content": "Giải thích AI là gì cho người mới, dưới 3 câu."},
    ],
)

# Bước 4: in kết quả
print(response.choices[0].message.content)
# Ví dụ output: "AI (Trí tuệ nhân tạo) là công nghệ máy tính..."
`}</CodeBlock>

          <Callout variant="insight" title="Quy tắc ngón tay cái về model">
            Khi bắt đầu, dùng <strong>model nhỏ &amp; rẻ</strong>{" "}
            (gpt-4o-mini, claude-3-haiku, gemini-flash) để luyện
            tập. Mỗi request tốn vài xu — bạn có thể thử hàng trăm
            lần mà không tốn nhiều. Chỉ nâng lên model lớn khi
            thấy rõ mô hình nhỏ không đủ chất lượng cho nhiệm vụ
            cụ thể.
          </Callout>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CODE BLOCK 2 — Jupyter setup                            */}
          {/* ──────────────────────────────────────────────────────── */}
          <p>
            Đa số bài học AI dùng Jupyter Notebook. Dưới đây là
            cách setup một môi trường Jupyter sạch với uv (trình
            quản lý môi trường Python nhanh và hiện đại):
          </p>

          <CodeBlock language="bash" title="jupyter_setup.sh">{`# ── 1. Cài uv (nếu chưa có) ──────────────────────────────────────
# macOS / Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows PowerShell:
#   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# ── 2. Tạo dự án & môi trường ảo ────────────────────────────────
mkdir my-ai-lab && cd my-ai-lab
uv init --python 3.11
uv venv                  # tạo .venv
source .venv/bin/activate # (Windows: .venv\\Scripts\\activate)

# ── 3. Cài gói cơ bản cho AI learning ──────────────────────────
uv pip install \\
  jupyter \\
  numpy pandas matplotlib \\
  scikit-learn \\
  openai anthropic \\
  python-dotenv

# ── 4. Tạo file .env (điền key thật) ───────────────────────────
cat > .env <<'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
EOF
echo ".env" >> .gitignore   # bảo vệ key

# ── 5. Khởi động Jupyter ───────────────────────────────────────
jupyter notebook
# Trình duyệt sẽ mở http://localhost:8888/tree

# ── 6. Trong cell đầu tiên của notebook, kiểm tra ──────────────
# !python -c "import numpy, pandas, sklearn, openai; print('OK')"
`}</CodeBlock>

          <Callout variant="tip" title="Vì sao dùng Jupyter?">
            Jupyter cho phép bạn chạy từng cell, xem kết quả ngay,
            trộn code với Markdown giải thích. Đây là môi trường lý
            tưởng để học vì bạn có thể thí nghiệm nhanh. Trong
            production, code sẽ được chuyển sang file .py, nhưng giai
            đoạn học và R&amp;D thì Jupyter là vô địch.
          </Callout>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CALLOUT 2                                               */}
          {/* ──────────────────────────────────────────────────────── */}
          <Callout variant="warning" title="Bẫy &quot;tutorial hell&quot;">
            Nhiều người mới rơi vào vòng lặp: xem tutorial → copy
            code chạy được → có cảm giác hiểu → xem tutorial tiếp
            → quên sạch cái trước. Cách thoát:{" "}
            <strong>làm mini-project của chính mình</strong>. Mỗi
            node trên lộ trình, hãy hoàn thành ít nhất 1 dự án mà
            không có template sẵn. Khó hơn xem video, nhưng đó mới
            là lúc kiến thức bám vào đầu.
          </Callout>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CALLOUT 3                                               */}
          {/* ──────────────────────────────────────────────────────── */}
          <Callout variant="info" title="Học lý thuyết &amp; thực hành song song">
            Đừng để lý thuyết quá xa thực hành. Quy tắc 50/50: mỗi
            giờ đọc/xem, dành một giờ code. Đọc về regression → tự
            viết linear regression từ đầu bằng NumPy. Đọc về
            transformer → build một attention head mini. Kiến thức
            chỉ trở thành kỹ năng khi tay đã gõ ra nó.
          </Callout>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CALLOUT 4                                               */}
          {/* ──────────────────────────────────────────────────────── */}
          <Callout variant="insight" title="Cộng đồng là gia tốc lớn nhất">
            Học một mình rất chậm. Tham gia một cộng đồng: Discord,
            Slack local AI, group Facebook VN về ML/LLM, hoặc tham
            gia một study group. Bạn sẽ gặp những người cùng trình
            độ để trao đổi, và những người đi trước sẵn sàng chỉ
            chỗ sai nhanh hơn Google nhiều lần.
          </Callout>

          {/* ──────────────────────────────────────────────────────── */}
          {/* COLLAPSIBLE DETAIL 1                                    */}
          {/* ──────────────────────────────────────────────────────── */}
          <CollapsibleDetail title="Chi tiết: Bạn cần bao nhiêu toán?">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Lời đồn &quot;học AI phải giỏi toán như tiến sĩ&quot;
              không đúng với đa số kỹ sư AI ứng dụng. Mức toán tối
              thiểu theo mục tiêu:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground/90 mt-2">
              <li>
                <strong>Xây ứng dụng LLM (chatbot, RAG, agent):</strong>{" "}
                cần hiểu vector, similarity (cosine), và xác suất
                căn bản. Không cần giải tích cao cấp.
              </li>
              <li>
                <strong>Huấn luyện mô hình ML / DL:</strong> cần
                đại số tuyến tính (ma trận, phép nhân ma trận),
                đạo hàm (để hiểu gradient descent), xác suất &amp;
                thống kê (likelihood, phân phối).
              </li>
              <li>
                <strong>Nghiên cứu / viết paper:</strong> cần giải
                tích nhiều biến, thống kê nâng cao, có khi cả lý
                thuyết tối ưu lồi và lý thuyết thông tin.
              </li>
            </ul>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Nếu quên toán cấp 3, không sao — 3Blue1Brown (YouTube,
              series &quot;Essence of Linear Algebra&quot; và{" "}
              &quot;Essence of Calculus&quot;) giúp bạn ôn lại ở mức
              trực quan trong khoảng 10 giờ.
            </p>
          </CollapsibleDetail>

          {/* ──────────────────────────────────────────────────────── */}
          {/* COLLAPSIBLE DETAIL 2                                    */}
          {/* ──────────────────────────────────────────────────────── */}
          <CollapsibleDetail title="Chi tiết: Cách đo tiến độ học của bạn">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Tiến độ học không đo bằng &quot;đã học bao nhiêu
              giờ&quot; — mà đo bằng &quot;bạn làm được gì mà trước
              đó không làm được&quot;. Gợi ý bộ checkpoint:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-sm text-foreground/90 mt-2">
              <li>
                <strong>Python</strong>: viết được script tự động
                đổi tên 100 file ảnh theo pattern.
              </li>
              <li>
                <strong>NumPy/Pandas</strong>: load một CSV 100k
                dòng, làm sạch, group-by, vẽ biểu đồ.
              </li>
              <li>
                <strong>ML căn bản</strong>: huấn luyện một
                classifier dự đoán hoa Iris, đạt accuracy &gt; 90%
                trên test set.
              </li>
              <li>
                <strong>Deep Learning</strong>: train một CNN
                nhận dạng chữ số MNIST đạt &gt; 98% accuracy.
              </li>
              <li>
                <strong>NLP &amp; LLM</strong>: fine-tune một mô
                hình BERT nhỏ cho bài phân loại cảm xúc tiếng
                Việt; hoặc xây một chatbot RAG cho 100 tài liệu
                PDF.
              </li>
              <li>
                <strong>Ứng dụng</strong>: triển khai ứng dụng lên
                cloud (Vercel, Fly, Railway), có monitoring, có
                cost tracking.
              </li>
            </ol>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Mỗi checkpoint đạt được là một bằng chứng hữu hình
              — tốt hơn hàng giờ &quot;cảm giác hiểu&quot;.
            </p>
          </CollapsibleDetail>

          {/* ──────────────────────────────────────────────────────── */}
          {/* ỨNG DỤNG                                                */}
          {/* ──────────────────────────────────────────────────────── */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Ứng dụng thực tế của kiến thức AI
          </h4>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Nhân viên văn phòng:</strong> dùng AI viết
              email, tóm tắt tài liệu, dịch thuật, phân tích
              spreadsheet nhanh hơn 2-3 lần.
            </li>
            <li>
              <strong>Lập trình viên:</strong> dùng GitHub Copilot,
              Cursor, Claude Code để code nhanh hơn; tự xây agent
              cho workflow riêng.
            </li>
            <li>
              <strong>Marketing:</strong> tự động hoá viết
              content, A/B test prompt, cá nhân hoá email theo
              segment.
            </li>
            <li>
              <strong>Customer support:</strong> xây chatbot RAG
              từ kho FAQ + lịch sử ticket, giảm 40-60% khối
              lượng tier 1.
            </li>
            <li>
              <strong>Phân tích dữ liệu:</strong> dùng LLM để sinh
              SQL từ câu hỏi tự nhiên, giúp nghiệp vụ tự truy vấn
              database mà không cần đội data.
            </li>
            <li>
              <strong>Sáng tạo nội dung:</strong> nhà văn,
              podcaster, YouTuber dùng AI brainstorm ý tưởng,
              viết outline, tạo transcript.
            </li>
          </ul>

          {/* ──────────────────────────────────────────────────────── */}
          {/* BẪY PHỔ BIẾN                                            */}
          {/* ──────────────────────────────────────────────────────── */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Bẫy phổ biến của người mới học AI
          </h4>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Nhảy cóc kiến thức:</strong> đọc về
              transformer khi chưa biết matrix multiplication là
              gì. Mọi thứ sẽ trở nên mơ hồ và bạn sẽ cảm thấy AI
              là &quot;phép màu&quot; thay vì toán học. Khắc phục:
              quay lại node trước ngay khi thấy mình không giải
              thích được khái niệm.
            </li>
            <li>
              <strong>Tutorial hell:</strong> xem 100 video, làm
              theo từng bước, có cảm giác hiểu, nhưng không tự
              code được gì. Khắc phục: giới hạn 1 tutorial mỗi
              chủ đề, rồi tự làm mini-project không template.
            </li>
            <li>
              <strong>Framework worship:</strong> nghĩ rằng phải
              thạo LangChain / LlamaIndex / AutoGen. Thực tế:
              framework thay đổi mỗi 6 tháng; hãy hiểu nguyên lý
              trước (prompt, embedding, vector store, tool use),
              framework nào cũng học nhanh sau đó.
            </li>
            <li>
              <strong>So sánh với người khác:</strong> thấy người
              khác xây được app ấn tượng sau 2 tháng, tự nhủ
              mình dở. Không biết rằng họ có nền tảng 5 năm
              backend. So sánh với chính bạn tháng trước, không
              so với bản năm 5 của người khác.
            </li>
            <li>
              <strong>Không theo dõi chi phí:</strong> bật nhiều
              agent lặp, gọi GPT-4 đầy đủ, một đêm ngủ dậy bill
              vài triệu đồng. Luôn đặt budget limit trên
              dashboard của nhà cung cấp, và monitoring token.
            </li>
            <li>
              <strong>Bỏ qua an toàn và đạo đức:</strong> xây
              chatbot mà không nghĩ đến prompt injection, data
              leak, bias. Càng vào production sâu, càng phải
              nghĩ về security và fairness ngay từ đầu.
            </li>
            <li>
              <strong>Học một mình quá lâu:</strong> không tham
              gia cộng đồng, không đi meetup, không code cùng ai.
              Kiến thức AI tiến nhanh; cộng đồng là cách update
              hiệu quả nhất.
            </li>
            <li>
              <strong>Tin vào con số &quot;thay thế việc&quot;:</strong>{" "}
              &quot;AI sẽ thay thế 50% việc trong 2 năm&quot; —
              phần lớn dự báo quá cường điệu. AI thay thế{" "}
              <em>task</em> chứ ít khi thay thế toàn bộ{" "}
              <em>công việc</em>. Hãy dùng AI để mạnh hơn, thay
              vì sợ hãi nó.
            </li>
          </ul>

          {/* ──────────────────────────────────────────────────────── */}
          {/* MẸO TIẾT KIỆM THỜI GIAN                                 */}
          {/* ──────────────────────────────────────────────────────── */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Bảy mẹo tiết kiệm hàng trăm giờ khi học AI
          </h4>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Bắt đầu với task thật:</strong> thay vì học
              khô, chọn một vấn đề thật bạn muốn giải (tự động
              tóm tắt mail, phân loại ticket). Học có mục đích
              nhanh gấp 3 lần.
            </li>
            <li>
              <strong>Giới hạn phạm vi:</strong> mỗi tuần chọn{" "}
              <em>một</em> chủ đề. Khép kín rồi mới sang chủ đề
              mới. Tránh &quot;đa nhiệm học&quot;.
            </li>
            <li>
              <strong>Ghi lại notes riêng của bạn:</strong> dùng
              Notion/Obsidian viết lại khái niệm bằng lời của
              chính bạn. Hành động tái diễn đạt giúp kiến thức
              ngấm gấp đôi.
            </li>
            <li>
              <strong>Dùng AI để học AI:</strong> hỏi ChatGPT/Claude
              giải thích bất cứ khái niệm nào bạn mắc. Đặt câu
              hỏi cụ thể: &quot;Giải thích attention cho người
              đã biết dot product nhưng chưa biết softmax&quot;.
            </li>
            <li>
              <strong>Đọc source code:</strong> khi dùng thư
              viện, dành 15 phút đọc source chỗ hàm bạn dùng. Học
              kỹ thuật viết code hay + hiểu sâu cách library
              hoạt động.
            </li>
            <li>
              <strong>Viết blog hoặc chia sẻ:</strong> dạy lại là
              cách học tốt nhất. Một bài blog ngắn mỗi tuần về
              thứ bạn vừa học ép bạn phải hiểu thật.
            </li>
            <li>
              <strong>Đừng sợ xoá project cũ:</strong> project
              tuần 1 của bạn sẽ xấu. Đó là bình thường. Quan
              trọng là project tuần 20 tốt hơn tuần 1.
            </li>
          </ol>

          {/* ──────────────────────────────────────────────────────── */}
          {/* LỊCH HỌC MẪU MỖI TUẦN                                   */}
          {/* ──────────────────────────────────────────────────────── */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Lịch học mẫu 10 giờ/tuần cho người đi làm
          </h4>
          <p>
            Một lịch học thực tế giúp bạn duy trì đều đặn mà không
            burnout. Lịch dưới đây thiết kế cho kỹ sư đi làm 40
            giờ/tuần, dành 10 giờ/tuần cho AI:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Thứ Hai — Thứ Sáu (5 × 1 giờ):</strong> đọc
              tài liệu chính, xem video ngắn (30 phút), ghi notes
              (15 phút), làm bài tập nhỏ (15 phút). Ưu tiên buổi
              sáng sớm hoặc sau ăn tối — lúc trí lực còn tươi.
            </li>
            <li>
              <strong>Thứ Bảy (3 giờ):</strong> block thời gian để
              code dự án. Mỗi tuần hoàn thành một chức năng nhỏ.
              Không học lý thuyết trong block này — chỉ code.
            </li>
            <li>
              <strong>Chủ Nhật (2 giờ):</strong> review tuần qua —
              đọc lại notes, viết bản tóm tắt ngắn (500 từ) bằng
              lời của bạn, chia sẻ trên blog / Notion công khai
              nếu có thể.
            </li>
          </ul>
          <p>
            Làm đều 10 giờ/tuần trong 6 tháng = 260 giờ. Đủ để đi
            hết lộ trình kỹ sư AI ứng dụng nếu bạn đã biết code.
            Quan trọng: <strong>đều đặn quan trọng hơn cường độ</strong>.
            Học 10 giờ/tuần trong 6 tháng hiệu quả hơn 40 giờ/tuần
            trong 6 tuần rồi bỏ cuộc.
          </p>

          {/* ──────────────────────────────────────────────────────── */}
          {/* DẤU HIỆU TIẾN BỘ                                        */}
          {/* ──────────────────────────────────────────────────────── */}
          <h4 className="text-base font-semibold text-foreground mt-6">
            Dấu hiệu bạn đang tiến bộ
          </h4>
          <p>
            Học AI đôi khi khiến bạn cảm thấy đi lùi — khái niệm
            mới làm rõ những gì bạn tưởng đã hiểu. Đây là{" "}
            <em>dấu hiệu tốt</em>, không phải xấu. Một vài cột mốc
            tâm lý cho thấy bạn đang tiến:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Bạn bắt đầu <strong>đọc code library</strong> và hiểu
              một phần — trước đây chỉ thấy &quot;bí ẩn&quot;.
            </li>
            <li>
              Bạn <strong>tranh luận được</strong> về lựa chọn kỹ
              thuật — vì sao RAG thay vì fine-tune, khi nào dùng
              agent.
            </li>
            <li>
              Bạn dạy lại được cho người khác — nếu giải thích
              cho bạn bè mà họ hiểu, bạn thật sự hiểu.
            </li>
            <li>
              Bạn đọc paper và không bỏ cuộc ở dòng công thức đầu
              tiên — có thể không hiểu hết, nhưng nắm được ý chính.
            </li>
          </ul>

          {/* ──────────────────────────────────────────────────────── */}
          {/* LỜI KẾT NỐI                                             */}
          {/* ──────────────────────────────────────────────────────── */}
          <p>
            Nếu bạn muốn bắt đầu <em>ngay hôm nay</em>, đây là 3
            bước nhỏ nhất:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>
              Tạo tài khoản miễn phí trên một công cụ (ChatGPT,
              Claude, hoặc Gemini).
            </li>
            <li>
              Thử 10 prompt thật cho công việc của bạn (viết
              email, dịch, tóm tắt).
            </li>
            <li>
              Nếu thấy hữu ích, cài Python và chạy script{" "}
              <code>hello_ai.py</code> ở trên. Chúc mừng, bạn
              đã qua node đầu tiên của lộ trình!
            </li>
          </ol>

          <p>
            Bài tiếp theo bạn có thể học:{" "}
            <TopicLink slug="llm-overview">Tổng quan về LLM</TopicLink>,{" "}
            <TopicLink slug="prompt-engineering">Kỹ thuật viết prompt</TopicLink>,
            hoặc{" "}
            <TopicLink slug="ai-tool-evaluation">
              Cách đánh giá công cụ AI
            </TopicLink>
            .
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 7 — MINI SUMMARY (6 điểm)                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Sáu điểm cần nhớ về lộ trình học AI"
          points={[
            "Không có một lộ trình đúng duy nhất. Có ít nhất 3 tuyến chính: sinh viên bài bản (6-12 tháng), kỹ sư đi tắt (3-6 tháng), quản lý định hướng (4-8 tuần).",
            "Sáu cột mốc kiến thức chung: Python → NumPy/Pandas → ML căn bản → Deep Learning → NLP & LLM → Ứng dụng. Mỗi cột phụ thuộc cột trước.",
            "Tổng thời gian ~ Σ(αᵢ × tᵢ) — hệ số α phụ thuộc nền tảng của bạn. Học part-time 10 giờ/tuần là khả thi cho đa số người đi làm.",
            "Toán cần vừa đủ theo mục tiêu: ứng dụng LLM cần ít toán; huấn luyện DL cần đại số tuyến tính + đạo hàm; nghiên cứu cần nhiều hơn.",
            "Học bằng cách làm dự án thật. Tránh tutorial hell bằng cách giới hạn tutorial và bắt tay vào mini-project không template cho mỗi node.",
            "Cộng đồng và chia sẻ là gia tốc lớn nhất. Viết note, blog lại, tham gia group, mentoring — mỗi hình thức đều giúp kiến thức ngấm sâu hơn.",
          ]}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 8 — QUIZ (8 câu)                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
