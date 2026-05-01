"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rag-evaluation",
  title: "RAG Evaluation",
  titleVi: "Đánh giá RAG — Bộ ba Faithfulness, Answer & Context Relevance",
  description:
    "Đo lường hệ thống RAG theo ba trụ cột: độ trung thành với nguồn (faithfulness), độ liên quan câu trả lời (answer relevance), độ liên quan ngữ cảnh truy xuất (context relevance) — và cách chúng sụp đổ khác nhau khi retrieval, prompting, hoặc generation bị lỗi.",
  category: "ai-safety",
  tags: ["rag", "evaluation", "faithfulness", "retrieval"],
  difficulty: "advanced",
  relatedSlugs: ["rag", "agentic-rag", "hallucination", "llm-evaluation", "re-ranking"],
  vizType: "interactive",
};

// Dữ liệu: 5 truy vấn × 4 kịch bản (no fault + 3 fault injection).
type FaultMode = "none" | "bad-retrieval" | "ignore-context" | "off-topic";

type QueryId =
  | "shopee-refund"
  | "vat-2026"
  | "python-mac"
  | "samsung-warranty"
  | "uit-math";

interface DocSnippet {
  source: string;
  title: string;
  content: string;
  /** true nếu snippet thực sự liên quan tới câu hỏi */
  relevant: boolean;
}

interface ScenarioResult {
  answer: string;
  faithfulness: number;
  answerRelevance: number;
  contextRelevance: number;
  diagnosis: string;
}

interface QueryCase {
  id: QueryId;
  label: string;
  question: string;
  /** Docs khi retrieval đúng (dùng cho none / ignore-context / off-topic) */
  goodDocs: DocSnippet[];
  /** Docs khi retrieval hỏng — chỉ dùng cho bad-retrieval */
  badDocs: DocSnippet[];
  results: Record<FaultMode, ScenarioResult>;
}

const QUERIES: QueryCase[] = [
  {
    id: "shopee-refund",
    label: "Chính sách hoàn tiền Shopee",
    question:
      "Nếu hàng Shopee bị lỗi, tôi có bao nhiêu ngày để yêu cầu hoàn tiền?",
    goodDocs: [
      {
        source: "shopee-vn/policy/return.md",
        title: "Quy định Trả hàng & Hoàn tiền Shopee (2026)",
        content:
          "Người mua có 15 ngày kể từ ngày nhận hàng để gửi yêu cầu Trả hàng / Hoàn tiền với lý do hàng lỗi hoặc không đúng mô tả.",
        relevant: true,
      },
      {
        source: "shopee-vn/help/return-methods",
        title: "Các hình thức hoàn tiền",
        content:
          "Hoàn tiền qua ShopeePay trong vòng 24 giờ sau khi bên bán xác nhận. Hoàn về ngân hàng 3–7 ngày làm việc.",
        relevant: true,
      },
    ],
    badDocs: [
      {
        source: "shopee-vn/seller/fee.md",
        title: "Phí thanh toán cho Người bán",
        content:
          "Phí thanh toán 2.5% áp dụng cho mỗi đơn hàng thành công, thu khi đối soát tuần.",
        relevant: false,
      },
      {
        source: "shopee-vn/ads/flash-sale.md",
        title: "Cách đăng ký Flash Sale",
        content:
          "Người bán cần đăng ký trước 48 giờ, sản phẩm phải có đánh giá ≥ 4 sao.",
        relevant: false,
      },
    ],
    results: {
      none: {
        answer:
          "Theo quy định hiện hành của Shopee VN, bạn có 15 ngày kể từ ngày nhận hàng để yêu cầu hoàn tiền khi hàng lỗi hoặc không đúng mô tả. Tiền sẽ về ShopeePay trong 24 giờ hoặc ngân hàng trong 3–7 ngày làm việc.",
        faithfulness: 96,
        answerRelevance: 94,
        contextRelevance: 92,
        diagnosis:
          "Baseline tốt: context liên quan, câu trả lời bám sát nguồn, đúng trọng tâm.",
      },
      "bad-retrieval": {
        answer:
          "Dựa trên tài liệu, tôi thấy thông tin về phí thanh toán 2.5% và Flash Sale, nhưng không có quy định về thời hạn hoàn tiền. Bạn có thể liên hệ CSKH.",
        faithfulness: 85,
        answerRelevance: 32,
        contextRelevance: 18,
        diagnosis:
          "Retrieval lạc đề: trả về doc seller-side thay vì buyer-return. Context Relevance sụp — LLM vẫn trung thành với (sai) context nên Faithfulness cao.",
      },
      "ignore-context": {
        answer:
          "Shopee thường cho 7 ngày để khiếu nại hàng lỗi, sau đó khoá đơn. Tiền hoàn về thẻ tín dụng mất 14 ngày.",
        faithfulness: 24,
        answerRelevance: 86,
        contextRelevance: 92,
        diagnosis:
          "LLM bịa từ trí nhớ (7 ngày / 14 ngày) thay vì dùng context (15 ngày). Faithfulness sụp — answer nghe hợp lý nhưng sai nguồn.",
      },
      "off-topic": {
        answer:
          "Shopee là một sàn thương mại điện tử phổ biến ở Đông Nam Á, có nhiều khuyến mãi, miễn phí vận chuyển và nhiều phương thức thanh toán. Người bán có thể tham gia Shopee Mall để tăng uy tín.",
        faithfulness: 72,
        answerRelevance: 22,
        contextRelevance: 92,
        diagnosis:
          "LLM lan man quảng bá thay vì trả lời số ngày. Answer Relevance sụp — context đúng nhưng output không chạm câu hỏi.",
      },
    },
  },

  {
    id: "vat-2026",
    label: "Cấu trúc thuế VAT 2026 tại VN",
    question:
      "Thuế VAT phổ thông tại Việt Nam năm 2026 là bao nhiêu % và mặt hàng nào chịu mức thấp hơn?",
    goodDocs: [
      {
        source: "chinhphu.vn/nq-174-2025",
        title: "Nghị quyết 174/2025 — giảm thuế VAT",
        content:
          "Từ 01/01/2026, thuế VAT phổ thông giữ ở mức 8% (giảm 2% từ mức 10%) cho phần lớn hàng hoá, không áp dụng cho viễn thông, ngân hàng, bất động sản.",
        relevant: true,
      },
      {
        source: "gdt.gov.vn/thuesuat-2026",
        title: "Danh mục thuế suất VAT 2026",
        content:
          "Hàng hoá thiết yếu (nước sạch, thuốc, sách giáo khoa) áp thuế 5%. Một số mặt hàng xuất khẩu áp thuế 0%.",
        relevant: true,
      },
    ],
    badDocs: [
      {
        source: "gdt.gov.vn/tncn",
        title: "Thuế thu nhập cá nhân 2026",
        content:
          "Mức 5% cho thu nhập ≤ 5 triệu/tháng, luỹ tiến 7 bậc đến 35%.",
        relevant: false,
      },
      {
        source: "gdt.gov.vn/tndn",
        title: "Thuế thu nhập doanh nghiệp",
        content: "Mức phổ thông 20%, ưu đãi 10–17% cho một số khu vực.",
        relevant: false,
      },
    ],
    results: {
      none: {
        answer:
          "Năm 2026, VAT phổ thông là 8% (theo Nghị quyết 174/2025, giảm từ 10%), ngoại trừ viễn thông, ngân hàng, bất động sản vẫn giữ 10%. Mặt hàng thiết yếu như nước sạch, thuốc, sách giáo khoa chịu 5%; xuất khẩu áp 0%.",
        faithfulness: 95,
        answerRelevance: 96,
        contextRelevance: 94,
        diagnosis:
          "Trọn vẹn ba đỉnh — có trích nghị quyết, liệt kê mức, phân loại đúng.",
      },
      "bad-retrieval": {
        answer:
          "Tôi có dữ liệu về thuế TNCN (5–35%) và TNDN (20%), nhưng không tìm thấy VAT cụ thể. Vui lòng tham chiếu Tổng cục Thuế.",
        faithfulness: 88,
        answerRelevance: 28,
        contextRelevance: 12,
        diagnosis:
          "Retrieval kéo nhầm sang TNCN/TNDN — Context Relevance chạm đáy. Agent trung thực nói không biết nên Faithfulness vẫn giữ.",
      },
      "ignore-context": {
        answer:
          "Thuế VAT Việt Nam năm 2026 là 10% cho hầu hết hàng hoá, với ngoại lệ 5% cho dịch vụ y tế và 20% cho hàng xa xỉ như rượu ngoại.",
        faithfulness: 18,
        answerRelevance: 84,
        contextRelevance: 94,
        diagnosis:
          "LLM dùng trí nhớ cũ (10%, 20% xa xỉ) — Faithfulness sụp. Context đã có 8%/5%/0% nhưng model lờ đi.",
      },
      "off-topic": {
        answer:
          "Thuế là công cụ quan trọng để nhà nước điều tiết kinh tế. Tại Việt Nam có nhiều loại thuế như TNCN, TNDN, VAT. Hãy tuân thủ nghĩa vụ thuế.",
        faithfulness: 68,
        answerRelevance: 18,
        contextRelevance: 94,
        diagnosis:
          "Lan man bài-văn-mẫu. Không đưa con số 8%/5%/0%. Answer Relevance sụp.",
      },
    },
  },

  {
    id: "python-mac",
    label: "Cách cài Python trên Mac (2026)",
    question:
      "Cách cài Python 3.13 trên Mac M-series theo khuyến nghị chính thức?",
    goodDocs: [
      {
        source: "python.org/downloads/mac",
        title: "Cài Python trên macOS (Apple Silicon)",
        content:
          "Tải installer universal từ python.org (Python 3.13.x), chạy .pkg, installer tự chọn đúng kiến trúc arm64 cho M-series.",
        relevant: true,
      },
      {
        source: "brew.sh/python",
        title: "Homebrew formula python@3.13",
        content:
          "`brew install python@3.13`. Homebrew tự liên kết /opt/homebrew/bin/python3 cho Apple Silicon.",
        relevant: true,
      },
    ],
    badDocs: [
      {
        source: "python.org/docs/asyncio",
        title: "asyncio — Concurrent I/O",
        content:
          "asyncio cung cấp event loop cho lập trình bất đồng bộ. Dùng với async/await.",
        relevant: false,
      },
      {
        source: "apple.com/macos-release",
        title: "macOS Sequoia 15 changelog",
        content:
          "Ra mắt Sequoia 15 với Apple Intelligence và cải tiến Metal.",
        relevant: false,
      },
    ],
    results: {
      none: {
        answer:
          "Hai cách chính thức: (1) Tải installer universal từ python.org, chạy .pkg — tự chọn arm64 cho M-series. (2) Homebrew: `brew install python@3.13`, binary ở /opt/homebrew/bin/python3.",
        faithfulness: 97,
        answerRelevance: 95,
        contextRelevance: 93,
        diagnosis:
          "Hoàn hảo: hai con đường đúng, mỗi cái kèm chi tiết quan trọng cho M-series.",
      },
      "bad-retrieval": {
        answer:
          "Tài liệu hiện có nói về asyncio và changelog macOS, nhưng chưa có hướng dẫn cài Python. Hãy kiểm tra python.org.",
        faithfulness: 86,
        answerRelevance: 30,
        contextRelevance: 14,
        diagnosis:
          "Retrieval trả về docs cùng hệ sinh thái nhưng lạc đề. Context Relevance đáy.",
      },
      "ignore-context": {
        answer:
          "Trên Mac, chạy `sudo apt-get install python3` hoặc tải từ Microsoft Store. Nếu không được, dùng port MacPorts cho kiến trúc PowerPC.",
        faithfulness: 10,
        answerRelevance: 78,
        contextRelevance: 92,
        diagnosis:
          "apt-get, Microsoft Store, PowerPC — model bịa lẫn nền tảng. Faithfulness gần 0.",
      },
      "off-topic": {
        answer:
          "Python là ngôn ngữ do Guido van Rossum thiết kế năm 1991, rất phổ biến trong khoa học dữ liệu và web. Học Python sẽ mở ra nhiều cơ hội nghề nghiệp.",
        faithfulness: 70,
        answerRelevance: 16,
        contextRelevance: 92,
        diagnosis:
          "Trôi sang kể lịch sử thay vì đưa lệnh cài. Answer Relevance đáy.",
      },
    },
  },

  {
    id: "samsung-warranty",
    label: "Bảo hành Samsung Galaxy",
    question:
      "Điện thoại Galaxy S25 mua tại Việt Nam được bảo hành bao lâu và có áp dụng cho pin không?",
    goodDocs: [
      {
        source: "samsung.com/vn/warranty",
        title: "Điều khoản bảo hành Samsung Galaxy tại VN",
        content:
          "Bảo hành chính hãng 12 tháng cho máy; pin và phụ kiện bảo hành 6 tháng. Yêu cầu hoá đơn hợp lệ.",
        relevant: true,
      },
      {
        source: "samsung.com/vn/care-plus",
        title: "Samsung Care+",
        content:
          "Gói Care+ mở rộng bảo hành thêm 12 tháng và thay thế pin sau 24 tháng với phí 790k.",
        relevant: true,
      },
    ],
    badDocs: [
      {
        source: "samsung.com/vn/release-s25",
        title: "Thông số Galaxy S25 Ultra",
        content:
          "Màn hình 6.8 inch, Snapdragon 8 Gen 4, camera 200MP, pin 5000mAh.",
        relevant: false,
      },
      {
        source: "samsung.com/vn/promo",
        title: "Khuyến mãi đặt trước S25",
        content: "Tặng Buds Pro, giảm 3 triệu khi thu cũ máy cũ.",
        relevant: false,
      },
    ],
    results: {
      none: {
        answer:
          "Galaxy S25 mua tại VN: bảo hành chính hãng 12 tháng cho máy, 6 tháng cho pin và phụ kiện (cần hoá đơn). Samsung Care+ mở rộng thêm 12 tháng và hỗ trợ thay pin sau 24 tháng với phí 790k.",
        faithfulness: 96,
        answerRelevance: 93,
        contextRelevance: 94,
        diagnosis:
          "Ba đỉnh đều khoẻ — trả lời đúng, phân biệt máy/pin, có Care+.",
      },
      "bad-retrieval": {
        answer:
          "Tôi có thông tin thông số kỹ thuật và khuyến mãi S25, nhưng chưa có chi tiết về bảo hành. Hãy liên hệ CSKH Samsung.",
        faithfulness: 88,
        answerRelevance: 34,
        contextRelevance: 16,
        diagnosis:
          "Retrieval trả về doc marketing thay vì doc warranty. Context Relevance đáy.",
      },
      "ignore-context": {
        answer:
          "Samsung Galaxy thường bảo hành 24 tháng trên toàn cầu, bao gồm cả pin. Ở Việt Nam thì cũng vậy, pin được bảo hành đầy đủ.",
        faithfulness: 16,
        answerRelevance: 82,
        contextRelevance: 94,
        diagnosis:
          "Model nói 24 tháng + pin đủ — sai cả hai so với 12/6 trong context. Faithfulness sụp.",
      },
      "off-topic": {
        answer:
          "Samsung là thương hiệu điện tử hàng đầu Hàn Quốc, nổi tiếng với dòng Galaxy, có mặt tại Việt Nam từ lâu với nhiều trung tâm bảo hành uỷ quyền.",
        faithfulness: 72,
        answerRelevance: 20,
        contextRelevance: 94,
        diagnosis: "Bài PR thay vì con số. Answer Relevance đáy.",
      },
    },
  },

  {
    id: "uit-math",
    label: "Học lại Toán đại cương UIT",
    question:
      "Sinh viên UIT muốn học lại môn MA004 (Toán đại cương) thì đăng ký vào lúc nào và điều kiện gì?",
    goodDocs: [
      {
        source: "uit.edu.vn/hoc-vu/quy-che-hoc-lai",
        title: "Quy chế đăng ký học lại UIT",
        content:
          "Sinh viên có điểm D+ trở xuống được phép đăng ký học lại. Đăng ký mở vào tuần 12 của mỗi học kỳ, đóng sau 7 ngày.",
        relevant: true,
      },
      {
        source: "uit.edu.vn/schedule/ma004-hk2-2026",
        title: "Lịch mở MA004 học kỳ 2/2025–2026",
        content:
          "MA004 mở 4 lớp học lại vào HK2, tuần bắt đầu 03/03/2026. Học phí 720k/tín chỉ × 3TC = 2.160k.",
        relevant: true,
      },
    ],
    badDocs: [
      {
        source: "uit.edu.vn/tuyen-sinh-2026",
        title: "Tuyển sinh UIT 2026",
        content:
          "Chỉ tiêu 2500, 7 ngành. Điểm chuẩn 2025 từ 24.5 đến 28.0.",
        relevant: false,
      },
      {
        source: "uit.edu.vn/hoi-sv",
        title: "Lịch hoạt động Hội Sinh viên",
        content:
          "Cuộc thi Programming Contest vào tháng 4, tháng 11 có Job Fair.",
        relevant: false,
      },
    ],
    results: {
      none: {
        answer:
          "Sinh viên UIT có điểm D+ trở xuống ở MA004 được đăng ký học lại. Đăng ký mở tuần 12 của học kỳ, đóng sau 7 ngày. HK2/2025–2026 mở 4 lớp, bắt đầu 03/03/2026. Học phí 720k/TC × 3TC = 2.160k.",
        faithfulness: 97,
        answerRelevance: 95,
        contextRelevance: 93,
        diagnosis:
          "Đầy đủ điều kiện + lịch + học phí — ba đỉnh đều cao.",
      },
      "bad-retrieval": {
        answer:
          "Hiện có thông tin tuyển sinh và hoạt động Hội SV nhưng không có quy chế học lại. Vui lòng hỏi phòng đào tạo.",
        faithfulness: 87,
        answerRelevance: 30,
        contextRelevance: 14,
        diagnosis:
          "Retrieval trả về tin tuyển sinh/đoàn hội. Context Relevance đáy.",
      },
      "ignore-context": {
        answer:
          "Ở UIT, chỉ khi điểm F mới được học lại. Đăng ký ở tuần 1 mỗi học kỳ. Học phí tầm 500k/tín chỉ, học vào mùa hè.",
        faithfulness: 14,
        answerRelevance: 80,
        contextRelevance: 92,
        diagnosis:
          "Model bịa: F (không phải D+), tuần 1 (không phải 12), 500k (không phải 720k), mùa hè (không phải HK2). Faithfulness sụp thẳng.",
      },
      "off-topic": {
        answer:
          "UIT là trường Đại học Công nghệ Thông tin uy tín tại TP.HCM. Môn Toán đại cương là nền tảng quan trọng cho CS. Hãy chăm chỉ học và đừng để bị nợ môn.",
        faithfulness: 68,
        answerRelevance: 18,
        contextRelevance: 92,
        diagnosis:
          "Lời khuyên chung chung thay vì tuần 12 / 03/03/2026. Answer Relevance đáy.",
      },
    },
  },
];

/** Lấy docs đúng theo fault mode: bad-retrieval dùng badDocs, còn lại goodDocs. */
function docsFor(q: QueryCase, mode: FaultMode): DocSnippet[] {
  return mode === "bad-retrieval" ? q.badDocs : q.goodDocs;
}

// 3 chế độ fault injection (mỗi cái phá 1 đỉnh khác nhau).
const FAULT_OPTIONS: {
  value: FaultMode;
  label: string;
  hint: string;
  breaks: "context" | "faithfulness" | "answer" | "none";
}[] = [
  {
    value: "none",
    label: "Không lỗi (baseline)",
    hint: "RAG chạy bình thường — ba đỉnh cùng cao.",
    breaks: "none",
  },
  {
    value: "bad-retrieval",
    label: "Retrieval trả docs không liên quan",
    hint: "Embedding/chunking kém → doc sai lạc đi vào context.",
    breaks: "context",
  },
  {
    value: "ignore-context",
    label: "LLM lờ context, trả từ pretrained memory",
    hint: "Prompt quá mềm hoặc model stubborn → hallucinate.",
    breaks: "faithfulness",
  },
  {
    value: "off-topic",
    label: "LLM lan man, không đúng câu hỏi",
    hint: "Answer quá dài, né câu hỏi, sa vào generalities.",
    breaks: "answer",
  },
];

const TOTAL_STEPS = 9;

// Color helpers
function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 55) return "#eab308";
  return "#ef4444";
}
function scoreTone(score: number): string {
  if (score >= 80) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 55) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export default function RagEvaluationTopic() {
  const [queryId, setQueryId] = useState<QueryId>("shopee-refund");
  const [fault, setFault] = useState<FaultMode>("none");

  const query = useMemo(
    () => QUERIES.find((q) => q.id === queryId)!,
    [queryId],
  );
  const result = useMemo(() => query.results[fault], [query, fault]);
  const retrieved = useMemo(() => docsFor(query, fault), [query, fault]);
  const { faithfulness, answerRelevance, contextRelevance } = result;

  const composite = Math.round(
    (faithfulness + answerRelevance + contextRelevance) / 3,
  );

  const resetFault = useCallback(() => setFault("none"), []);

  // Hình học tam giác — mỗi đỉnh co về tâm khi metric tương ứng thấp.
  const triSize = 320;
  const cx = triSize / 2;
  const cy = triSize / 2 + 14;
  const baseR = 115;

  // Top = Faithfulness · Bottom-left = Answer Rel · Bottom-right = Context Rel
  const angleTop = -Math.PI / 2;
  const angleBL = (Math.PI * 5) / 6; // 150°
  const angleBR = Math.PI / 6; // 30°

  const apex = (angle: number, value: number) => {
    const r = (value / 100) * baseR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };
  const apexFull = (angle: number) => ({
    x: cx + baseR * Math.cos(angle),
    y: cy + baseR * Math.sin(angle),
  });

  const pTop = apex(angleTop, faithfulness);
  const pBL = apex(angleBL, answerRelevance);
  const pBR = apex(angleBR, contextRelevance);
  const fTop = apexFull(angleTop);
  const fBL = apexFull(angleBL);
  const fBR = apexFull(angleBR);

  // Label positions (ngoài rìa)
  const labelR = baseR + 30;
  const lTop = { x: cx + labelR * Math.cos(angleTop), y: cy + labelR * Math.sin(angleTop) };
  const lBL = { x: cx + labelR * Math.cos(angleBL) - 10, y: cy + labelR * Math.sin(angleBL) };
  const lBR = { x: cx + labelR * Math.cos(angleBR) + 10, y: cy + labelR * Math.sin(angleBR) };

  // Quiz: 8 câu, 2 fill-blank.
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Faithfulness trong RAG eval được định nghĩa chính xác nhất là gì?",
        options: [
          "Tỷ lệ câu trả lời giống y như tài liệu (copy-paste)",
          "Tỷ lệ atomic claims trong answer được support bởi retrieved context",
          "Độ dài câu trả lời / độ dài context",
          "Cosine similarity giữa câu hỏi và answer",
        ],
        correct: 1,
        explanation:
          "Faithfulness = # atomic claims được support / # atomic claims tổng. Đo xem LLM có BỊA THÊM ngoài context không. Không phải copy-paste — paraphrase vẫn faithful nếu giữ ý đúng.",
      },
      {
        question:
          "Context Relevance 18%, Faithfulness 88%, Answer Relevance 32%. Đâu là khâu hỏng?",
        options: [
          "Generation — tại vì Answer Relevance thấp",
          "Retrieval — doc lấy về không liên quan, nên LLM dù trung thành với context cũng không trả lời được câu hỏi thật",
          "Prompting — cần thêm few-shot",
          "Không đủ dữ liệu",
        ],
        correct: 1,
        explanation:
          "Context Rel đáy là signature của retrieval hỏng. Faithfulness cao vì LLM vẫn đúng với (sai) context. Answer Relevance thấp vì context không khớp câu hỏi. Chẩn đoán: fix retriever trước, đừng động vào prompt.",
      },
      {
        question:
          "User hỏi tiếng Việt, retriever (embedding multilingual rẻ) trả về docs tiếng Anh, LLM dịch rồi trả lời. Metric nào tụt rõ nhất?",
        options: [
          "Latency",
          "Context Relevance — embedding multilingual yếu khiến doc tiếng Anh bị lấy về dù doc VN tồn tại; và/hoặc Faithfulness do sai lệch qua dịch",
          "Cost",
          "Answer Relevance — luôn luôn",
        ],
        correct: 1,
        explanation:
          "Multilingual embedding đa ngôn ngữ hay kéo nhầm document khác ngôn ngữ ở top-k. Context Relevance tụt. Dịch thêm qua LLM là kênh mới để rò rỉ faithfulness (tam dịch tứ lệch). Fix: dùng embedding chuyên VN hoặc hybrid retrieval với BM25 tiếng Việt.",
      },
      {
        type: "fill-blank",
        question:
          "Công thức Faithfulness: F = (số claim được support) / (tổng số claim). Còn Context Relevance: CR = (số câu trong context liên quan tới {blank}) / (tổng số câu trong context). Và Answer Relevance đo bằng cosine similarity hoặc kỹ thuật {blank} — sinh lại câu hỏi từ answer rồi so với câu hỏi gốc.",
        blanks: [
          {
            answer: "query",
            accept: ["question", "câu hỏi", "truy vấn"],
          },
          {
            answer: "generated questions",
            accept: [
              "generated-questions",
              "sinh câu hỏi",
              "question generation",
              "reverse question",
            ],
          },
        ],
        explanation:
          "Context Relevance đo tín hiệu retrieval so với query. Answer Relevance trong RAGAS thường tính bằng: LLM sinh N câu hỏi từ answer → cosine với câu hỏi gốc → trung bình. Càng gần 1 càng relevant.",
      },
      {
        question:
          "Câu nào về RAGAS / TruLens là ĐÚNG trong 2026?",
        options: [
          "Cả hai chỉ chạy offline và cần ground-truth labels",
          "Cả hai đều cung cấp reference-free metrics dùng LLM-as-judge cho Faithfulness / Answer Relevance / Context Relevance",
          "TruLens không hỗ trợ RAG — chỉ chatbot thuần",
          "RAGAS không dùng LLM-as-judge",
        ],
        correct: 1,
        explanation:
          "Cả hai framework đều chạy reference-free: faithfulness = LLM chia answer thành atomic claims, judge xem claim có được context support không; context relevance = LLM đếm sentence relevant; answer relevance = generated-question cosine. Cho phép eval production không cần gold answer.",
      },
      {
        question:
          "Team bạn bật rerank bằng Cohere Rerank v3 — context relevance tăng từ 0.52 → 0.81. Faithfulness giữ nguyên, Answer Relevance +6 điểm. Đây là dấu hiệu gì?",
        options: [
          "Rerank lãng phí vì không tăng faithfulness",
          "Rerank đang làm đúng việc của nó: lọc context nhiễu → context sạch hơn → LLM dễ trả đúng hơn. Xem re-ranking để hiểu cơ chế",
          "Phải thay model generation",
          "Cần giảm top-k về 1",
        ],
        correct: 1,
        explanation:
          "Rerank là cross-encoder chấm lại top-k, lọc nhiễu. Context Rel tăng mạnh là kỳ vọng chính. Faithfulness giữ vì model generation không đổi. Answer Rel cải thiện nhẹ vì context sạch hơn thì answer bám vào câu hỏi hơn.",
      },
      {
        type: "fill-blank",
        question:
          "Golden retrieval set là tập (query, gold_docs, gold_answer). Nó cho phép eval {blank}-based, tức đối chiếu với kết quả vàng có sẵn, khác với eval {blank}-free như RAGAS mặc định vốn chỉ cần query + context + answer.",
        blanks: [
          {
            answer: "reference",
            accept: ["tham chiếu", "gold", "ground-truth"],
          },
          {
            answer: "reference",
            accept: ["tham chiếu", "gold", "ground-truth"],
          },
        ],
        explanation:
          "Reference-based cần bộ ground-truth (đắt nhưng chính xác); reference-free chỉ cần LLM-as-judge (scale tốt nhưng có bias). Team trưởng thành dùng cả hai: reference-based cho 50-200 gold quan trọng, reference-free cho production monitoring.",
      },
      {
        question:
          "Bạn đổi chunk_size từ 200 → 512 tokens và thêm reranker. Điều gì KHẢ NĂNG CAO xảy ra?",
        options: [
          "Faithfulness tăng vì chunk to hơn",
          "Context relevance tăng (ít nhiễu hơn + reranker lọc), latency tăng nhẹ, cost embedding giảm; faithfulness ít thay đổi trừ khi generation model thay đổi",
          "Context relevance giảm",
          "Không có gì thay đổi",
        ],
        correct: 1,
        explanation:
          "Chunk lớn hơn = ít fragment mất ngữ cảnh → context coherent hơn → context rel tăng. Reranker lọc nhiễu → context rel tăng nữa. Faithfulness là thuộc tính của generation nên gần như không đổi (trừ khi model không chịu tận dụng context dài hơn). Đây là bài học từ case study Topica.",
      },
    ],
    [],
  );

  const renderTriangle = () => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-foreground">
          RAG Triad Triangle — {FAULT_OPTIONS.find((f) => f.value === fault)!.label}
        </p>
        <span
          className="text-[11px] font-mono rounded-md px-2 py-0.5"
          style={{
            background: `${scoreColor(composite)}22`,
            color: scoreColor(composite),
          }}
        >
          composite = {composite}
        </span>
      </div>

      <svg viewBox={`0 0 ${triSize + 60} ${triSize + 40}`} className="w-full max-w-md mx-auto">
        <g transform="translate(30, 10)">
          {/* Khung 100% đường đứt */}
          <polygon points={`${fTop.x},${fTop.y} ${fBL.x},${fBL.y} ${fBR.x},${fBR.y}`} fill="none" stroke="var(--border)" strokeDasharray="3 4" strokeOpacity={0.6} />
          {/* Vòng scale 25/50/75 */}
          {[0.25, 0.5, 0.75].map((k) => (
            <polygon
              key={k}
              points={`${cx + k * (fTop.x - cx)},${cy + k * (fTop.y - cy)} ${cx + k * (fBL.x - cx)},${cy + k * (fBL.y - cy)} ${cx + k * (fBR.x - cx)},${cy + k * (fBR.y - cy)}`}
              fill="none" stroke="var(--border)" strokeDasharray="2 3" strokeOpacity={0.3}
            />
          ))}
          {/* Đường từ tâm → 3 đỉnh */}
          {[fTop, fBL, fBR].map((p, i) => (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeOpacity={0.3} />
          ))}
          {/* Tam giác giá trị — animate */}
          <motion.polygon
            points={`${pTop.x},${pTop.y} ${pBL.x},${pBL.y} ${pBR.x},${pBR.y}`}
            fill="rgba(99, 102, 241, 0.20)" stroke="#6366f1" strokeWidth={2}
            initial={false}
            animate={{ points: `${pTop.x},${pTop.y} ${pBL.x},${pBL.y} ${pBR.x},${pBR.y}` }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          />

          {/* Các đỉnh */}
          {[
            { p: pTop, score: faithfulness, key: "f" },
            { p: pBL, score: answerRelevance, key: "a" },
            { p: pBR, score: contextRelevance, key: "c" },
          ].map((item) => (
            <motion.circle key={item.key} cx={item.p.x} cy={item.p.y} r={6} fill={scoreColor(item.score)} stroke="#0b1021" strokeWidth={1.5} initial={false} animate={{ cx: item.p.x, cy: item.p.y }} transition={{ duration: 0.55, ease: "easeInOut" }} />
          ))}

          {/* Labels ngoài đỉnh */}
          {[
            { pos: lTop, name: "Faithfulness", score: faithfulness, anchor: "middle" as const },
            { pos: lBL, name: "Answer Rel.", score: answerRelevance, anchor: "end" as const },
            { pos: lBR, name: "Context Rel.", score: contextRelevance, anchor: "start" as const },
          ].map((l) => (
            <g key={l.name}>
              <text x={l.pos.x} y={l.pos.y} textAnchor={l.anchor} fontSize={11} fill={scoreColor(l.score)} fontWeight="bold">
                {l.name}
              </text>
              <text x={l.pos.x} y={l.pos.y + 12} textAnchor={l.anchor} fontSize={11} fill="#e2e8f0">
                {l.score}
              </text>
            </g>
          ))}
          {/* Composite ở giữa */}
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fill="#94a3b8">composite</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={18} fontWeight="bold" fill={scoreColor(composite)}>
            {composite}
          </text>
        </g>
      </svg>

      <p className="text-[11px] text-muted mt-1 leading-relaxed">
        <strong className="text-foreground">Chẩn đoán:</strong>{" "}
        {result.diagnosis}
      </p>
    </div>
  );

  const renderDocs = () => (
    <div className="space-y-2">
      {retrieved.map((d, i) => (
        <motion.div
          key={`${queryId}-${fault}-${i}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25 }}
          className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${d.relevant ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
            <code className="font-mono text-[10px] text-muted">{d.source}</code>
            <span className={`text-[9px] font-mono rounded px-1 py-0.5 ${d.relevant ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-500/20 text-red-700 dark:text-red-400"}`}>
              {d.relevant ? "relevant" : "irrelevant"}
            </span>
          </div>
          <p className="font-semibold text-foreground text-[11px]">{d.title}</p>
          <p className="text-muted mt-0.5">{d.content}</p>
        </motion.div>
      ))}
    </div>
  );

  const renderAnswer = () => (
    <motion.div
      key={`${queryId}-${fault}-answer`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-accent/40 bg-accent/5 p-3"
    >
      <p className="text-[10px] font-mono text-muted mb-1">LLM ANSWER</p>
      <p className="text-xs text-foreground leading-relaxed">
        {result.answer}
      </p>
    </motion.div>
  );

  const renderDiagBar = () => {
    const metrics = [
      { label: "Faithfulness", value: faithfulness },
      { label: "Answer Rel.", value: answerRelevance },
      { label: "Context Rel.", value: contextRelevance },
    ];
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <p className="text-[11px] font-bold text-foreground mb-2">Chẩn đoán: đỉnh nào bị kéo xuống?</p>
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted w-24 shrink-0">{m.label}</span>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden border border-border">
                <motion.div className="h-full rounded-full" style={{ background: scoreColor(m.value) }} initial={false} animate={{ width: `${m.value}%` }} transition={{ duration: 0.4 }} />
              </div>
              <span className={`text-[10px] font-mono w-8 text-right ${scoreTone(m.value)}`}>{m.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2 leading-relaxed">
          <em>Quy tắc:</em> Context Rel đỏ → retrieval hỏng. Faithfulness đỏ → generation bịa. Answer Rel đỏ → prompt/lan man.
        </p>
      </div>
    );
  };

  return (
    <>
      {/* ───────────── 1. DỰ ĐOÁN ───────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn build RAG trên Confluence nội bộ. Chatbot trả lời rất mượt, nguồn có đủ. Nhưng người dùng report 'sai'. Lỗi có thể đến từ đâu nhất?"
          options={[
            "Retrieval — doc lấy về không liên quan",
            "Generation — LLM lờ context, trả từ trí nhớ",
            "Prompt — hướng dẫn LLM không buộc trích dẫn chặt",
            "CẢ BA — và bạn cần đo tách riêng mới biết khâu nào hỏng",
          ]}
          correct={3}
          explanation="RAG là 2 hệ thống nối tiếp (retriever + generator) + 1 lớp prompt keo. Mỗi khâu gây ra signature lỗi khác nhau. Nếu chỉ đo 'answer quality' tổng thể, bạn KHÔNG biết phải sửa đâu. Bộ ba metric hôm nay chính là công cụ chẩn đoán."
        >
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Cái nguy hiểm của RAG hỏng là nó{" "}
            <em>nhìn rất giống đang chạy đúng</em> — câu trả lời mượt, có kèm
            nguồn, đúng tông. Chỉ khi tách thành ba đỉnh đo riêng, bạn mới bắt
            được khâu đang âm thầm phản bội.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ───────────── 2. TRỰC QUAN HÓA: TAM GIÁC ───────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Tam giác RAG Triad">
        <p className="mb-3 text-sm text-muted leading-relaxed">
          Chọn một câu truy vấn thực tế, rồi bật từng kiểu lỗi (fault injection)
          và quan sát{" "}
          <strong className="text-foreground">đỉnh nào của tam giác co lại</strong>.
          Đây chính là cách bạn sẽ chẩn đoán RAG production hằng ngày.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Chọn query */}
            <div>
              <p className="text-[11px] font-bold text-muted mb-2">Chọn truy vấn</p>
              <div className="flex flex-wrap gap-2">
                {QUERIES.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => { setQueryId(q.id); setFault("none"); }}
                    className={`text-[11px] rounded-full border px-3 py-1.5 transition-all ${queryId === q.id ? "border-accent bg-accent/10 text-foreground" : "border-border bg-background text-muted hover:border-accent/60"}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fault injection toggles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-muted">Tiêm lỗi (fault injection)</p>
                <button type="button" onClick={resetFault} className="text-[10px] text-muted hover:text-foreground transition">
                  ⟲ reset
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {FAULT_OPTIONS.map((f) => {
                  const active = fault === f.value;
                  const accentColor =
                    f.breaks === "context" ? "#f97316"
                      : f.breaks === "faithfulness" ? "#ef4444"
                        : f.breaks === "answer" ? "#a855f7" : "#22c55e";
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFault(f.value)}
                      className={`text-left rounded-lg border p-2.5 transition-all ${active ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-card hover:border-accent/60"}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accentColor }} />
                        <div>
                          <p className="text-[11px] font-bold text-foreground leading-tight">{f.label}</p>
                          <p className="text-[10px] text-muted mt-0.5 leading-snug">{f.hint}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Câu hỏi đang chạy */}
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-[10px] font-mono text-muted mb-1">QUERY</p>
              <p className="text-xs text-foreground font-medium">
                {query.question}
              </p>
            </div>

            {/* Tam giác + docs/answer song song */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-muted mb-1.5">
                    Retrieved context ({retrieved.length} docs)
                  </p>
                  {renderDocs()}
                </div>
                {renderAnswer()}
              </div>
              <div className="space-y-3">
                {renderTriangle()}
                {renderDiagBar()}
              </div>
            </div>

            <Callout variant="tip" title="Cách đọc">
              Tam giác co méo = RAG đang bệnh ở khâu nào. Baseline thường cân
              ba cạnh. Khi bạn bật lỗi, đỉnh tương ứng &quot;chảy&quot; về phía
              tâm. Thanh chẩn đoán ở dưới cho biết chính xác đỉnh nào đang đỏ.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ───────────── 3. AHA ───────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Từ tam giác vừa chơi, một sự thật lộ ra:{" "}
            <strong>RAG không phải một hệ thống</strong> — nó là{" "}
            <strong>hai hệ thống nối tiếp</strong> (retriever + generator) được
            keo lại bằng prompt. Lỗi ở mỗi khâu làm <em>sụp đổ một đỉnh khác nhau</em>{" "}
            của tam giác:{" "}
            <strong>retrieval hỏng → Context Relevance đỏ</strong>,{" "}
            <strong>generation bịa → Faithfulness đỏ</strong>,{" "}
            <strong>prompt/lan man → Answer Relevance đỏ</strong>. Đo một con
            số tổng (&quot;answer tốt hay không&quot;) sẽ che mất đúng khâu
            cần sửa — đó là lý do triad là công cụ chẩn đoán, không phải công
            cụ chấm điểm.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ───────────── 4. CALLOUTS ───────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Bốn lưu ý quan trọng">
        <div className="space-y-3">
          <Callout variant="tip" title="Framework eval RAG 2026">
            <strong>RAGAS</strong> (reference-free, 3 metric triad cốt lõi),{" "}
            <strong>TruLens</strong> (feedback functions + feedback app),{" "}
            <strong>ARES</strong> (training a classifier judge với synthetic data),{" "}
            <strong>DeepEval</strong> (pytest-style assertions cho LLM). RAGAS
            là lựa chọn mặc định cho đa số team — nó có cả offline batch và
            online streaming, tích hợp LangChain/LlamaIndex sẵn.
          </Callout>

          <Callout variant="warning" title="Bẫy 'chỉ đo answer quality'">
            Rất nhiều team mở đầu bằng một LLM-judge chấm &quot;câu trả lời có
            tốt không&quot; (0-5 sao) rồi deploy. Hậu quả:{" "}
            <strong>không biết khâu nào hỏng</strong>. Hôm nay chatbot tệ —
            tại retriever hay tại model? Không tách ra = không fix được. Bộ
            ba metric bắt buộc tách <em>generation</em> khỏi{" "}
            <em>retrieval</em> thành ba con số riêng biệt.
          </Callout>

          <Callout variant="info" title="LLM-as-judge + reference trace">
            Faithfulness thường đo bằng: judge LLM (thường dùng{" "}
            <em>claim decomposition</em>) chia answer thành từng atomic claim,
            rồi với mỗi claim hỏi &quot;claim này có support bởi context
            không?&quot;. Mỗi claim có thể kèm{" "}
            <strong>reference trace</strong> — chỉ ngược về câu/đoạn nào trong
            context hậu thuẫn nó. Trace này cực giá trị khi debug: ngoài 1
            con số, bạn biết chính xác câu nào trong answer là bịa.
          </Callout>

          <Callout variant="insight" title="Golden retrieval set — tài sản không thể mua">
            Một bộ <code>(query, gold_docs, gold_answer)</code> 50–200 mẫu
            được chọn kỹ, đại diện cho use case quan trọng, là{" "}
            <strong>tài sản vận hành</strong> của team RAG. Nó cho phép đo
            reference-based chính xác và dựng CI gate. Cập nhật golden set
            mỗi 2–4 tuần bằng cách sample từ production log — đừng để nó lỗi
            thời. Xem thêm <TopicLink slug="rag">RAG</TopicLink> và{" "}
            <TopicLink slug="agentic-rag">Agentic RAG</TopicLink> để hiểu kiến
            trúc đang đo.
          </Callout>
        </div>
      </LessonSection>

      {/* ───────────── 5. THÁCH THỨC ───────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách chẩn đoán">
        <div className="space-y-4">
          <InlineChallenge
            question="Bạn chạy eval: Context Relevance = 92%, Faithfulness = 45%, Answer Relevance = 80%. Nguyên nhân gốc có khả năng cao nhất?"
            options={[
              "Retrieval hỏng — cần đổi embedding model",
              "LLM lờ context, trả lời từ pretrained memory — cần siết prompt (buộc 'chỉ dựa vào CONTEXT ở trên') hoặc đổi model chịu bám nguồn hơn",
              "Chunk quá nhỏ — tăng chunk_size",
              "Database index chậm — thêm ANN",
            ]}
            correct={1}
            explanation="Context tốt (92%) → retrieval khỏe. Answer Relevance khá → model hiểu câu hỏi. Nhưng Faithfulness thấp → model có context đúng mà vẫn trả lời từ trí nhớ cũ. Đây là hallucination ở tầng generation. Fix: prompt chặt hơn ('ONLY use CONTEXT'), hoặc đổi model, hoặc thêm cite-check layer. Xem thêm hallucination."
          />

          <InlineChallenge
            question="User hỏi tiếng Việt: 'Học phí UIT ngành Trí tuệ Nhân tạo là bao nhiêu?'. Retriever (multilingual-e5 rẻ) trả về 4 doc tiếng Anh về AI programs ở Stanford. LLM dịch rồi trả lời theo đó. Metric nào tụt rõ nhất?"
            options={[
              "Chỉ Faithfulness — vì dịch thuật",
              "Context Relevance tụt mạnh nhất (docs không liên quan tới UIT/VN); Answer Relevance cũng tụt (trả lời không đúng trường hỏi); Faithfulness có thể cao giả tạo vì model trung thành với context sai",
              "Chỉ Answer Relevance",
              "Không metric nào — vì LLM vẫn tạo được câu trả lời",
            ]}
            correct={1}
            explanation="Đây là multilingual gotcha kinh điển. Embedding đa ngôn ngữ không đủ mạnh để phân biệt 'UIT VN' vs 'Stanford AI program' khi query tiếng Việt còn doc tiếng Anh. Context Rel đáy. Answer Rel tụt theo. Faithfulness cao là ILLUSION (trung thành với sai). Fix: embedding chuyên tiếng Việt (bge-m3, vietnamese-embedding), hybrid với BM25 VN, hoặc query rewrite sang tiếng Anh chủ động."
          />
        </div>
      </LessonSection>

      {/* ───────────── 6. LÝ THUYẾT ───────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            Câu hỏi kế tiếp: đo từng đỉnh như thế nào? Mỗi metric trong bộ ba
            có một cách tính <strong>reference-free</strong> (không cần gold
            answer) và một cách <strong>reference-based</strong> (có gold).
            Công thức gốc xuất phát từ RAGAS và được cả TruLens/DeepEval kế
            thừa.
          </p>

          <h4 className="text-sm font-bold text-foreground mt-4">
            1. Faithfulness — câu trả lời có bám nguồn không?
          </h4>
          <p>
            Chia answer <em>A</em> thành tập atomic claims (những mệnh đề đơn
            nhất có thể kiểm chứng), rồi với mỗi claim, hỏi một judge LLM:{" "}
            <em>claim này có được retrieved context <em>C</em> support không?</em>
          </p>
          <p className="text-center my-2">
            <LaTeX>
              {"F = \\frac{|\\{c : c \\in A,\\; c \\text{ supported by } C\\}|}{|\\{c : c \\in A\\}|}"}
            </LaTeX>
          </p>
          <p className="text-xs text-muted">
            <em>F</em> = 1 nghĩa là mọi mệnh đề trong answer đều có đoạn trong
            context hậu thuẫn. <em>F</em> = 0 là bịa hoàn toàn. Reference trace
            (pointer từ claim → câu nguồn) giúp debug nhanh.
          </p>

          <h4 className="text-sm font-bold text-foreground mt-4">
            2. Context Relevance — doc lấy về có liên quan không?
          </h4>
          <p>
            Với context <em>C</em> (có thể gồm nhiều đoạn/câu <em>s</em>), đếm
            tỷ lệ câu thực sự liên quan tới câu hỏi <em>Q</em>:
          </p>
          <p className="text-center my-2">
            <LaTeX>
              {"CR = \\frac{|\\{s : s \\in C,\\; s \\text{ relevant to } Q\\}|}{|\\{s : s \\in C\\}|}"}
            </LaTeX>
          </p>
          <p className="text-xs text-muted">
            <em>CR</em> thấp là signature của retrieval / chunking / embedding
            kém. Fix bằng: đổi embedding, tăng chunk size, thêm reranker.
            Xem <TopicLink slug="re-ranking">re-ranking</TopicLink> để hiểu
            cơ chế và <TopicLink slug="chunking">chunking</TopicLink> cho
            kích thước tối ưu.
          </p>

          <h4 className="text-sm font-bold text-foreground mt-4">
            3. Answer Relevance — câu trả lời có đúng câu hỏi không?
          </h4>
          <p>
            Có hai kỹ thuật phổ biến:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Embedding cosine</strong>: cosine similarity giữa câu
              hỏi và câu trả lời (đơn giản nhưng hay sai khi answer dài).
            </li>
            <li>
              <strong>Generated-questions</strong>: LLM sinh ra{" "}
              <em>N</em> câu hỏi <em>Q&apos;_i</em> giả định từ answer, rồi
              tính cosine trung bình:
              <p className="text-center my-2">
                <LaTeX>
                  {"AR = \\frac{1}{N} \\sum_{i=1}^{N} \\cos(\\text{embed}(Q),\\; \\text{embed}(Q'_i))"}
                </LaTeX>
              </p>
              Trực giác: nếu answer đúng trọng tâm, thì câu hỏi suy ngược ra
              sẽ giống câu hỏi gốc.
            </li>
          </ul>

          <p className="text-sm mt-4">Bảng chẩn đoán tóm tắt:</p>
          <div className="overflow-x-auto rounded-lg border border-border bg-card my-2">
            <table className="min-w-full text-[11px]">
              <thead className="bg-background/60 text-muted">
                <tr>
                  <th className="text-left px-3 py-2">Đỉnh đỏ</th>
                  <th className="text-left px-3 py-2">Khâu hỏng</th>
                  <th className="text-left px-3 py-2">Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400 font-mono">Context Rel</td>
                  <td className="px-3 py-2">Retrieval / chunking / embedding</td>
                  <td className="px-3 py-2">Reranker, embedding chuyên domain/ngôn ngữ, chunk size, hybrid BM25 + vector</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-red-700 dark:text-red-400 font-mono">Faithfulness</td>
                  <td className="px-3 py-2">Generation bịa (hallucination)</td>
                  <td className="px-3 py-2">Prompt chặt (&quot;only use CONTEXT&quot;), cite-required, đổi model — xem <TopicLink slug="hallucination">hallucination</TopicLink></td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-purple-700 dark:text-purple-400 font-mono">Answer Rel</td>
                  <td className="px-3 py-2">Prompt / intent parsing / model lan man</td>
                  <td className="px-3 py-2">Intent clarification, prompt buộc trả lời trực tiếp, post-filter độ dài</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            language="python"
            title="rag_evaluator.py — triad computation với LLM-as-judge"
          >
            {`from dataclasses import dataclass
from statistics import mean
from typing import List

@dataclass
class RAGSample:
    query: str
    retrieved_context: List[str]    # các đoạn retrieved
    answer: str                      # câu trả lời cuối của LLM

class RAGEvaluator:
    """Bộ ba RAG Triad — reference-free, dùng LLM-as-judge."""

    def __init__(self, judge_llm, embedder, n_generated: int = 3):
        self.judge = judge_llm
        self.embed = embedder
        self.n_generated = n_generated

    # ── 1. FAITHFULNESS ──────────────────────────────────────
    def faithfulness(self, s: RAGSample) -> float:
        claims = self.judge.decompose_to_claims(s.answer)
        if not claims:
            return 1.0  # không khẳng định gì = không bịa
        supported = 0
        for c in claims:
            if self.judge.is_supported(claim=c, context=s.retrieved_context):
                supported += 1
        return supported / len(claims)

    # ── 2. CONTEXT RELEVANCE ─────────────────────────────────
    def context_relevance(self, s: RAGSample) -> float:
        sentences = self.judge.split_into_sentences(s.retrieved_context)
        if not sentences:
            return 0.0
        relevant = sum(
            1 for sent in sentences
            if self.judge.is_relevant(sentence=sent, query=s.query)
        )
        return relevant / len(sentences)

    # ── 3. ANSWER RELEVANCE ──────────────────────────────────
    def answer_relevance(self, s: RAGSample) -> float:
        generated_qs = self.judge.generate_questions(
            answer=s.answer, n=self.n_generated
        )
        q_vec = self.embed(s.query)
        sims = [cosine(q_vec, self.embed(q)) for q in generated_qs]
        return mean(sims) if sims else 0.0

    # ── TRIAD ────────────────────────────────────────────────
    def evaluate(self, samples: List[RAGSample]) -> dict:
        rows = []
        for s in samples:
            rows.append({
                "faithfulness": self.faithfulness(s),
                "context_rel":  self.context_relevance(s),
                "answer_rel":   self.answer_relevance(s),
            })
        agg = {
            "faithfulness": mean(r["faithfulness"] for r in rows),
            "context_rel":  mean(r["context_rel"]  for r in rows),
            "answer_rel":   mean(r["answer_rel"]   for r in rows),
        }
        agg["triad_mean"] = mean(agg.values())
        return agg

def cosine(a, b):
    import numpy as np
    a, b = np.array(a), np.array(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))`}
          </CodeBlock>

          <p className="text-sm">
            Trong CI, team thường pin một file YAML định nghĩa SLO cho từng
            metric để gate deploy. Một ví dụ thực tế:
          </p>

          <CodeBlock language="yaml" title="configs/ragas-eval.yaml">
            {`pipeline:
  dataset: s3://ai-edu/evals/rag-golden-v3.jsonl  # 180 samples
  sample_budget: 180

judge:
  model: anthropic/claude-opus-4.7
  temperature: 0.0

embedder:
  model: bge-m3               # đa ngôn ngữ VN + EN tốt
  dim: 1024

metrics:
  - faithfulness
  - context_relevance
  - answer_relevance

slo:
  faithfulness_min: 0.90
  context_relevance_min: 0.80
  answer_relevance_min: 0.85
  regression_tolerance: 0.02  # sụt > 2% so với baseline = fail

reporting:
  format: json+markdown
  sink: bigquery://ai.evals.rag_runs
  on_regression:
    - slack://#rag-quality
    - create_issue: repo/ragapp`}
          </CodeBlock>

          <CollapsibleDetail title="Retrieval metrics sâu hơn: nDCG, MRR, Recall@k, Hit Rate">
            <p className="text-sm">
              Context Relevance của RAGAS là <em>content-level</em> (câu có
              liên quan không). Còn retrieval có cả <em>ranking-level</em>{" "}
              metrics cổ điển, cần khi bạn có gold docs:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
              <li>
                <strong>Recall@k</strong>: trong top-k retrieved, bao nhiêu %
                gold doc xuất hiện. Quan trọng nhất khi k nhỏ (k=5).
              </li>
              <li>
                <strong>Hit Rate@k</strong>: có ÍT NHẤT 1 gold doc trong top-k
                không (0/1). Quick sanity check.
              </li>
              <li>
                <strong>MRR (Mean Reciprocal Rank)</strong>: 1/rank của gold
                doc đầu tiên, trung bình qua queries. Nhạy với việc gold có
                nằm ở top hay không.
              </li>
              <li>
                <strong>nDCG@k</strong>: discounted gain có chuẩn hóa, tính
                đến cả vị trí và mức độ liên quan nhiều bậc (vd: 3=rất liên
                quan, 1=tạm). Vàng cho reranking eval.
              </li>
            </ul>
            <p className="text-sm mt-3">
              Workflow chuẩn: chạy Recall@k/MRR trên golden set để tune
              retriever; chạy RAGAS triad trên production traffic để monitor
              drift.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Reference-free vs Reference-based — khi nào dùng gì?">
            <p className="text-sm">
              Hai phương pháp bổ trợ nhau, không thay thế:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 pl-2 mt-2">
              <li>
                <strong>Reference-based</strong>: cần tập{" "}
                <code>(query, gold_docs, gold_answer)</code>. Dùng ROUGE/BLEU
                cho answer, Recall@k/MRR cho retrieval. Chính xác nhưng đắt —
                tạo gold tốn 15–30 phút/mẫu × hàng trăm mẫu. Dùng cho:
                benchmark nội bộ, regression gate, so sánh pipeline.
              </li>
              <li>
                <strong>Reference-free</strong> (RAGAS triad): chỉ cần{" "}
                <code>(query, context, answer)</code>. LLM-as-judge chấm trực
                tiếp. Rẻ, scale với production log, nhưng có bias của judge
                model. Dùng cho: online monitoring, A/B test nhanh,
                large-scale sampling.
              </li>
            </ul>
            <p className="text-sm mt-3">
              Team trưởng thành: 50–200 gold reference-based → regression
              gate CI. Full production traffic → reference-free sampling
              (~5%) → dashboard drift. Calibrate judge định kỳ bằng human
              eval 30 mẫu/tuần.
            </p>
          </CollapsibleDetail>

          <p className="text-sm mt-4">
            Cuối cùng, cần nhớ triad chỉ là{" "}
            <strong>công cụ chẩn đoán</strong>, không phải đích đến. Một số
            chiều còn thiếu mà production thật quan tâm:{" "}
            <em>latency p95</em>, <em>$/query</em>, <em>recall coverage</em>{" "}
            (% câu hỏi user mà hệ thống có tài liệu để trả), và{" "}
            <em>harm rate</em> (% câu trả lời gây hại). Triad là xương sống,
            bạn đắp thịt quanh nó theo use case.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ───────────── 7. CASE STUDY ───────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Case study: Topica">
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p>
            <strong className="text-foreground">Bối cảnh.</strong> Topica (edtech VN) build RAG trên giáo trình tiếng Việt. Stack: embedding <code>paraphrase-multilingual-mpnet</code>, chunk 200 tokens, không rerank, generation Claude Haiku.
          </p>
          <p><strong className="text-foreground">Tuần 1 — triad.</strong></p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Faithfulness: <span className="text-emerald-700 dark:text-emerald-400 font-mono">94%</span> — LLM bám context tốt.</li>
            <li>Context Relevance: <span className="text-amber-700 dark:text-amber-400 font-mono">71%</span> — nhiều doc lạ trôi vào top-k.</li>
            <li>Answer Relevance: <span className="text-emerald-700 dark:text-emerald-400 font-mono">88%</span> — đi vào trọng tâm.</li>
          </ul>
          <p>
            <strong className="text-foreground">Chẩn đoán.</strong> Context Rel yếu nhất → khâu retrieval bệnh. Hai giả thuyết: (1) embedding multilingual không đủ mạnh cho tiếng Việt chuyên ngành, (2) chunk 200 tokens cắt vụn ngữ cảnh — câu đầu ở chunk A, câu giải thích ở chunk B, retriever không lấy đủ.
          </p>
          <p><strong className="text-foreground">Thử nghiệm.</strong> 4 variant song song trên golden set 150 câu:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>V1 (baseline): chunk 200, no rerank → CR 71%.</li>
            <li>V2: chunk 512, no rerank → CR 82%.</li>
            <li>V3: chunk 200 + Cohere Rerank v3 → CR 85%.</li>
            <li>V4: <strong>chunk 512 + Cohere Rerank v3</strong> → CR <span className="text-emerald-700 dark:text-emerald-400 font-mono">89%</span>, Faithfulness <span className="text-emerald-700 dark:text-emerald-400 font-mono">96%</span>, Answer Rel <span className="text-emerald-700 dark:text-emerald-400 font-mono">91%</span>.</li>
          </ul>
          <p>
            <strong className="text-foreground">Kết quả.</strong> Triển khai V4. Latency +180ms, $/query +0.0007 (chấp nhận được). CSAT học viên từ 4.1 → 4.6 sau 3 tuần.
          </p>
          <p>
            <strong className="text-foreground">Bài học.</strong> Nếu Topica
            chỉ đo &quot;điểm trả lời tổng thể&quot; kiểu 0-5 sao, họ đã
            không biết retrieval hay generation đang yếu. Bộ ba tách riêng
            giúp họ đi thẳng đến retriever, thử đúng 2 biến số (chunk_size +
            rerank), và fix chỉ trong 1 sprint. <em>Đo tách riêng mới biết
            khâu nào hỏng.</em>
          </p>
        </div>
      </LessonSection>

      {/* ───────────── 8. TÓM TẮT ───────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về RAG Evaluation"
          points={[
            "RAG = 2 hệ nối tiếp (retriever + generator) + prompt. Lỗi ở mỗi khâu làm sụp một đỉnh khác của tam giác.",
            "Bộ ba cốt lõi: Faithfulness (bám nguồn), Context Relevance (doc liên quan), Answer Relevance (đúng câu hỏi). Đo CẢ BA, không gộp.",
            "Chẩn đoán: Context Rel đỏ → fix retrieval (embedding, chunk, rerank). Faithfulness đỏ → fix generation (prompt chặt, đổi model, cite-check). Answer Rel đỏ → fix prompt/intent.",
            "Framework 2026: RAGAS (mặc định), TruLens, ARES, DeepEval. Tất cả hỗ trợ reference-free LLM-as-judge + reference trace để debug.",
            "Golden retrieval set 50–200 mẫu là tài sản vận hành — cập nhật mỗi 2–4 tuần từ production log, dùng làm CI gate.",
            "Multilingual gotcha VN: embedding đa ngôn ngữ yếu hay kéo doc sai ngôn ngữ. Dùng embedding chuyên VN (bge-m3) hoặc hybrid BM25.",
          ]}
        />
      </LessonSection>

      {/* ───────────── 9. QUIZ ───────────── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
