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
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ============================================================================
// METADATA — giữ nguyên theo yêu cầu
// ============================================================================

export const metadata: TopicMeta = {
  slug: "ai-for-data-analysis",
  title: "AI for Data Analysis",
  titleVi: "AI phân tích dữ liệu",
  description:
    "Dùng AI để phân tích bảng tính, tạo biểu đồ, viết SQL, và tìm insight từ dữ liệu.",
  category: "applied-ai",
  tags: ["data-analysis", "spreadsheet", "sql", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "ai-for-writing", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ============================================================================
// DỮ LIỆU MOCK — bảng CSV giả lập 5 dòng × 4 cột
//
// Bộ dữ liệu này mô phỏng một file export từ hệ thống POS của cửa hàng điện
// tử. Trong thực tế bảng này có thể dài hàng chục nghìn dòng, nhưng để tương
// tác trên UI chúng ta chỉ hiển thị 5 dòng đại diện. Mỗi dòng tương ứng với
// tổng doanh thu của một sản phẩm trong một khu vực — đã tổng hợp sẵn để
// dễ minh hoạ phép GROUP BY.
//
// Các cột được chọn để đủ đa dạng:
//   - product  : chuỗi (categorical, nhiều giá trị)
//   - region   : chuỗi có tập giá trị hữu hạn (Bắc/Trung/Nam) — lý tưởng cho GROUP BY
//   - quantity : số nguyên — demo SUM/AVG/COUNT
//   - revenue  : số lớn, đơn vị VND — demo format tiền và so sánh bar chart
// ============================================================================

interface SalesRow {
  product: string;
  region: string;
  quantity: number;
  revenue: number;
}

const MOCK_TABLE: SalesRow[] = [
  {
    product: "Bàn phím cơ K3",
    region: "Bắc",
    quantity: 142,
    revenue: 170_400_000,
  },
  {
    product: "Tai nghe BT X5",
    region: "Nam",
    quantity: 210,
    revenue: 186_900_000,
  },
  {
    product: "Chuột không dây M2",
    region: "Trung",
    quantity: 95,
    revenue: 42_750_000,
  },
  {
    product: "Màn hình 27 inch",
    region: "Nam",
    quantity: 38,
    revenue: 212_800_000,
  },
  {
    product: "Loa bluetooth S1",
    region: "Bắc",
    quantity: 176,
    revenue: 88_000_000,
  },
];

// ============================================================================
// KỊCH BẢN TRUY VẤN — mỗi kịch bản gồm SQL, pandas, dữ liệu biểu đồ
//
// Mỗi kịch bản đại diện cho một "intent" phổ biến khi người không chuyên hỏi
// AI về dữ liệu. Thay vì tự suy luận bằng LLM (sẽ không deterministic), ta
// khớp từ khóa trong câu hỏi với 1 trong 4 kịch bản đã được dựng sẵn. Cách
// làm này:
//
//   1. Deterministic — cùng input cho cùng output, dễ kiểm thử.
//   2. Không gọi API — tương tác mượt ngay trên máy người dùng.
//   3. Vẫn truyền tải được trải nghiệm "hỏi dữ liệu bằng tiếng người".
//
// Trong production, chỗ này sẽ là một cuộc gọi đến mô hình text-to-SQL
// (ví dụ Vanna, DataHerald, hoặc gpt-4 kèm schema). Logic matcher bên dưới
// chỉ đóng vai trò demo.
// ============================================================================

interface BarDatum {
  label: string;
  value: number;
  unit: string;
}

interface QueryScenario {
  key: string;
  nl: string;
  sql: string;
  pandas: string;
  explanation: string;
  bars: BarDatum[];
  caption: string;
}

const SCENARIOS: QueryScenario[] = [
  {
    key: "top_revenue",
    nl: "Show top products by revenue",
    sql: `SELECT product, SUM(revenue) AS total_revenue
FROM sales
GROUP BY product
ORDER BY total_revenue DESC
LIMIT 5;`,
    pandas: `(df.groupby("product")["revenue"]
   .sum()
   .sort_values(ascending=False)
   .head(5))`,
    explanation:
      "AI hiểu 'top' = sắp xếp giảm dần, 'by revenue' = theo cột revenue, 'products' = nhóm theo product. Kết quả trả về 5 dòng hàng đầu kèm tổng doanh thu.",
    bars: [
      { label: "Màn hình 27″", value: 212_800_000, unit: "₫" },
      { label: "Tai nghe BT X5", value: 186_900_000, unit: "₫" },
      { label: "Bàn phím K3", value: 170_400_000, unit: "₫" },
      { label: "Loa BT S1", value: 88_000_000, unit: "₫" },
      { label: "Chuột M2", value: 42_750_000, unit: "₫" },
    ],
    caption: "Top sản phẩm theo doanh thu (₫)",
  },
  {
    key: "avg_by_region",
    nl: "Average revenue per region",
    sql: `SELECT region, AVG(revenue) AS avg_revenue
FROM sales
GROUP BY region
ORDER BY avg_revenue DESC;`,
    pandas: `df.groupby("region")["revenue"].mean().sort_values(ascending=False)`,
    explanation:
      "'Average' = AVG trong SQL, mean() trong pandas. 'Per region' = GROUP BY region. AI tự động chọn hàm tổng hợp phù hợp với từ khóa.",
    bars: [
      { label: "Nam", value: 199_850_000, unit: "₫" },
      { label: "Bắc", value: 129_200_000, unit: "₫" },
      { label: "Trung", value: 42_750_000, unit: "₫" },
    ],
    caption: "Doanh thu trung bình theo khu vực (₫)",
  },
  {
    key: "group_by_region",
    nl: "Group quantity by region",
    sql: `SELECT region, SUM(quantity) AS total_qty
FROM sales
GROUP BY region
ORDER BY total_qty DESC;`,
    pandas: `df.groupby("region")["quantity"].sum().sort_values(ascending=False)`,
    explanation:
      "GROUP BY gom các dòng có cùng giá trị region vào một nhóm, rồi SUM cộng số lượng trong từng nhóm. Đây là thao tác cốt lõi của phân tích tổng hợp.",
    bars: [
      { label: "Bắc", value: 318, unit: "đơn vị" },
      { label: "Nam", value: 248, unit: "đơn vị" },
      { label: "Trung", value: 95, unit: "đơn vị" },
    ],
    caption: "Tổng số lượng bán ra theo khu vực",
  },
  {
    key: "filter_high_qty",
    nl: "Filter products with quantity > 100",
    sql: `SELECT product, region, quantity
FROM sales
WHERE quantity > 100
ORDER BY quantity DESC;`,
    pandas: `df[df["quantity"] > 100].sort_values("quantity", ascending=False)`,
    explanation:
      "WHERE lọc dòng theo điều kiện trước khi tổng hợp. Trong pandas, boolean indexing (df[...]) làm điều tương tự. Luôn lọc trước, tổng hợp sau để tăng tốc query.",
    bars: [
      { label: "Tai nghe BT X5", value: 210, unit: "đơn vị" },
      { label: "Loa BT S1", value: 176, unit: "đơn vị" },
      { label: "Bàn phím K3", value: 142, unit: "đơn vị" },
    ],
    caption: "Sản phẩm có số lượng > 100 (đã lọc)",
  },
];

// ============================================================================
// SIMULATOR — "Ask data a question"
// ============================================================================

function AskDataSimulator() {
  const [query, setQuery] = useState<string>("Show top products by revenue");
  const [activeKey, setActiveKey] = useState<string>("top_revenue");
  const [view, setView] = useState<"sql" | "pandas">("sql");

  const scenario = useMemo<QueryScenario>(() => {
    return SCENARIOS.find((s) => s.key === activeKey) ?? SCENARIOS[0];
  }, [activeKey]);

  const runQuery = useCallback(() => {
    const q = query.toLowerCase();
    if (q.includes("filter") || q.includes("lọc") || q.includes(">")) {
      setActiveKey("filter_high_qty");
    } else if (q.includes("avg") || q.includes("average") || q.includes("trung bình")) {
      setActiveKey("avg_by_region");
    } else if (
      q.includes("group") ||
      q.includes("khu vực") ||
      q.includes("region")
    ) {
      setActiveKey("group_by_region");
    } else {
      setActiveKey("top_revenue");
    }
  }, [query]);

  const fillExample = useCallback((example: string, key: string) => {
    setQuery(example);
    setActiveKey(key);
  }, []);

  const maxBar = useMemo(() => {
    return Math.max(...scenario.bars.map((b) => b.value));
  }, [scenario]);

  const formatNumber = (n: number, unit: string) => {
    if (unit === "₫") {
      return `${(n / 1_000_000).toFixed(1)}M ₫`;
    }
    return `${n.toLocaleString("vi-VN")} ${unit}`;
  };

  return (
    <div className="space-y-5">
      {/* Bảng CSV mẫu */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Dữ liệu mẫu — sales.csv (5 dòng × 4 cột)
        </p>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-muted/10 text-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">product</th>
                <th className="px-3 py-2 text-left font-semibold">region</th>
                <th className="px-3 py-2 text-right font-semibold">quantity</th>
                <th className="px-3 py-2 text-right font-semibold">revenue (₫)</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TABLE.map((row, i) => (
                <tr
                  key={row.product}
                  className={i % 2 === 0 ? "bg-card" : "bg-surface"}
                >
                  <td className="px-3 py-2 text-foreground">{row.product}</td>
                  <td className="px-3 py-2 text-muted">{row.region}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {row.quantity}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {row.revenue.toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Natural language input */}
      <div>
        <label
          htmlFor="nl-query"
          className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2"
        >
          Hỏi bằng ngôn ngữ tự nhiên
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="nl-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ví dụ: Show top products by revenue"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={runQuery}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Hỏi AI
          </button>
        </div>

        {/* Pre-filled examples */}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              fillExample("Average revenue per region", "avg_by_region")
            }
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-muted/10 transition-colors"
          >
            avg
          </button>
          <button
            type="button"
            onClick={() =>
              fillExample("Group quantity by region", "group_by_region")
            }
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-muted/10 transition-colors"
          >
            group_by
          </button>
          <button
            type="button"
            onClick={() =>
              fillExample("Filter products with quantity > 100", "filter_high_qty")
            }
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-muted/10 transition-colors"
          >
            filter
          </button>
          <button
            type="button"
            onClick={() =>
              fillExample("Show top products by revenue", "top_revenue")
            }
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-muted/10 transition-colors"
          >
            top
          </button>
        </div>
      </div>

      {/* Dịch sang SQL / pandas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            AI dịch sang code
          </p>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("sql")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                view === "sql"
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              SQL
            </button>
            <button
              type="button"
              onClick={() => setView("pandas")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                view === "pandas"
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              pandas
            </button>
          </div>
        </div>
        <motion.div
          key={`${scenario.key}-${view}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg bg-[#0d1117] p-4 font-mono text-xs text-[#e6edf3] overflow-x-auto"
        >
          <pre className="whitespace-pre">
            {view === "sql" ? scenario.sql : scenario.pandas}
          </pre>
        </motion.div>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          {scenario.explanation}
        </p>
      </div>

      {/* Kết quả dạng bar chart */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Kết quả — {scenario.caption}
        </p>
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          {scenario.bars.map((bar, idx) => {
            const pct = maxBar > 0 ? (bar.value / maxBar) * 100 : 0;
            return (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs text-foreground">
                  {bar.label}
                </span>
                <div className="flex-1 h-5 rounded-md bg-surface overflow-hidden relative">
                  <motion.div
                    key={`${scenario.key}-${bar.label}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                      delay: idx * 0.05,
                    }}
                    className="h-full bg-gradient-to-r from-accent to-accent/70"
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted">
                  {formatNumber(bar.value, bar.unit)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Biểu đồ cột thanh ngang — phù hợp khi nhãn dài hoặc có từ 3-10 mục
          cần so sánh. Độ dài thanh được chuẩn hoá theo giá trị lớn nhất
          trong tập kết quả.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT CHÍNH
// ============================================================================

export default function AiForDataAnalysisTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Khi muốn AI phân tích dữ liệu bán hàng, bước đầu tiên bạn nên làm là gì?",
        options: [
          "Yêu cầu AI tự truy cập file Excel của bạn",
          "Copy-paste dữ liệu vào prompt kèm mô tả cột và câu hỏi cụ thể",
          "Gửi link Google Sheets cho AI",
          "Chỉ cần gõ 'phân tích dữ liệu' là đủ",
        ],
        correct: 1,
        explanation:
          "AI không thể tự truy cập file trên máy bạn. Bạn cần copy dữ liệu vào prompt, mô tả rõ từng cột nghĩa là gì, và đặt câu hỏi cụ thể để AI hiểu bạn muốn phân tích điều gì.",
      },
      {
        question:
          "AI trả lời: 'Doanh thu trung bình tháng 3 là 523 triệu đồng.' Bạn nên làm gì tiếp theo?",
        options: [
          "Tin ngay vì AI rất chính xác với số liệu",
          "Kiểm tra lại bằng cách tính trung bình thủ công hoặc dùng công thức Excel",
          "Bỏ qua vì con số nghe hợp lý",
          "Yêu cầu AI tính lại 5 lần rồi lấy trung bình",
        ],
        correct: 1,
        explanation:
          "AI có thể 'bịa' số liệu (hallucination). Luôn kiểm tra lại các con số quan trọng bằng công thức Excel hoặc tính thủ công. AI giỏi nhất ở việc gợi ý cách phân tích, không phải thay thế bạn kiểm tra.",
      },
      {
        question:
          "Trong SQL, câu lệnh nào dùng để gom nhóm các dòng có cùng giá trị trước khi tổng hợp?",
        options: [
          "ORDER BY — sắp xếp theo cột",
          "WHERE — lọc dòng theo điều kiện",
          "GROUP BY — gom nhóm trước khi áp dụng SUM/AVG/COUNT",
          "LIMIT — giới hạn số dòng trả về",
        ],
        correct: 2,
        explanation:
          "GROUP BY gom tất cả dòng có cùng giá trị ở một cột (ví dụ cùng region) vào một nhóm, rồi các hàm tổng hợp như SUM, AVG, COUNT sẽ tính trên từng nhóm đó. Đây là nền tảng của pivot table.",
      },
      {
        question:
          "Bạn có bảng dữ liệu 500 dòng với các cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Prompt nào giúp AI phân tích hiệu quả nhất?",
        options: [
          "'Phân tích dữ liệu giúp tôi'",
          "'Tôi có dữ liệu bán hàng 6 tháng gần nhất với các cột: Ngày, Sản phẩm, Số lượng, Đơn giá, Khu vực. Hãy: 1) Tìm sản phẩm bán chạy nhất theo khu vực, 2) Xu hướng doanh thu theo tháng, 3) Gợi ý biểu đồ phù hợp'",
          "'Cho tôi biểu đồ đẹp'",
          "'Sản phẩm nào tốt nhất?'",
        ],
        correct: 1,
        explanation:
          "Prompt tốt cần có: mô tả dữ liệu (các cột gì), bối cảnh (6 tháng bán hàng), và yêu cầu cụ thể (3 câu hỏi phân tích rõ ràng). Càng cụ thể, AI càng cho kết quả hữu ích.",
      },
      {
        question:
          "Khi AI gợi ý công thức Excel =SUMIFS(D2:D100, C2:C100, \"Bắc\"), bạn nên làm gì?",
        options: [
          "Dán vào Excel và tin tưởng 100% kết quả",
          "Kiểm tra bằng cách lọc thủ công một vài dòng để đối chiếu tổng",
          "Yêu cầu AI viết lại bằng VLOOKUP",
          "Bỏ qua, tự viết công thức mới an toàn hơn",
        ],
        correct: 1,
        explanation:
          "AI thường viết đúng cú pháp, nhưng có thể chọn sai phạm vi cột hoặc điều kiện. Luôn test công thức với một nhóm nhỏ (5-10 dòng) để đối chiếu trước khi áp dụng cho toàn bộ dữ liệu.",
      },
      {
        question:
          "Biểu đồ nào phù hợp nhất để so sánh tổng doanh thu giữa các khu vực (Bắc/Trung/Nam)?",
        options: [
          "Biểu đồ đường (line chart)",
          "Biểu đồ cột (bar chart)",
          "Biểu đồ tròn nhiều lớp (multi-pie)",
          "Biểu đồ tán xạ (scatter plot)",
        ],
        correct: 1,
        explanation:
          "Bar chart là lựa chọn tiêu chuẩn khi so sánh một đại lượng (doanh thu) giữa các danh mục rời rạc (khu vực). Line chart dành cho xu hướng theo thời gian, scatter plot dành cho mối quan hệ hai biến liên tục.",
      },
      {
        question:
          "Prompt nào giúp AI tạo truy vấn SQL chính xác hơn?",
        options: [
          "'Viết SQL cho tôi'",
          "'Lấy data từ database'",
          "'Bảng orders có cột order_id, customer_id, order_date, amount. Viết SQL lấy top 10 khách hàng chi nhiều nhất trong Q1 2025'",
          "'Query đi'",
        ],
        correct: 2,
        explanation:
          "Prompt C cung cấp đủ ba yếu tố AI cần: tên bảng (orders), cấu trúc cột, và yêu cầu cụ thể (top 10, Q1 2025). Thiếu cấu trúc bảng, AI sẽ đoán tên cột và thường đoán sai.",
      },
      {
        question:
          "Bạn muốn tính 'tỷ lệ hoàn thành KPI' = Doanh thu thực tế / Mục tiêu. Cách dùng AI an toàn nhất là gì?",
        options: [
          "Dán toàn bộ file Excel cho AI và hỏi 'phân tích KPI'",
          "Mô tả công thức, để AI viết công thức Excel tương ứng, rồi kiểm tra trên 2-3 dòng",
          "Yêu cầu AI tự nghĩ ra công thức",
          "Bỏ qua AI, tự tính tay toàn bộ",
        ],
        correct: 1,
        explanation:
          "Cách làm chuẩn: bạn định nghĩa công thức nghiệp vụ (bạn là người hiểu business logic), AI chỉ dịch sang cú pháp Excel/SQL. Luôn test lại trên vài dòng để chắc chắn trước khi áp dụng toàn bộ.",
      },
    ],
    []
  );

  return (
    <>
      {/* ========================================================= */}
      {/* BƯỚC 1 — HOOK: Dự đoán                                    */}
      {/* ========================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn có file Excel 10.000 dòng dữ liệu bán hàng. Mất bao lâu để tìm ra xu hướng doanh thu và sản phẩm bán chạy nhất?"
          options={[
            "Vài giờ — lọc, tạo pivot table, vẽ biểu đồ thủ công",
            "Vài phút — nhờ AI phân tích và gợi ý insight",
            "Không thể — cần phải biết lập trình Python",
          ]}
          correct={1}
          explanation="Với AI, bạn chỉ cần mô tả dữ liệu và đặt câu hỏi — AI sẽ gợi ý cách phân tích, viết công thức Excel, thậm chí viết SQL cho bạn. Không cần biết lập trình!"
        >
          <p className="text-sm text-muted mt-4">
            Hãy cùng khám phá cách dùng AI để biến dữ liệu thô thành{" "}
            <strong className="text-foreground">insight hữu ích</strong>{" "}
            chỉ trong vài phút.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 2 — DISCOVER: Simulator "Ask data a question"       */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Hỏi dữ liệu bằng ngôn ngữ tự nhiên
          </h3>
          <p className="text-sm text-muted mb-4">
            Gõ câu hỏi tiếng Anh hoặc tiếng Việt. AI sẽ dịch thành SQL/pandas và
            vẽ biểu đồ kết quả. Thử các ví dụ{" "}
            <strong className="text-foreground">avg</strong>,{" "}
            <strong className="text-foreground">group_by</strong>,{" "}
            <strong className="text-foreground">filter</strong>,{" "}
            <strong className="text-foreground">top</strong> bên dưới.
          </p>

          <AskDataSimulator />

          <Callout variant="tip" title="Mẹo đọc query">
            Luôn đọc hiểu câu SQL/pandas AI sinh ra trước khi tin kết quả. Nếu
            chưa quen cú pháp, nhờ AI giải thích từng dòng một — AI là giáo
            viên lập trình rất kiên nhẫn.
          </Callout>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Quan sát 3 điều khi chơi với simulator
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90">
              <li>
                Từ khóa tiếng Anh (<em>avg, group, filter, top</em>) kích
                hoạt các kịch bản khác nhau — AI thật cũng dựa vào từ khóa
                tương tự.
              </li>
              <li>
                SQL và pandas cho cùng kết quả, chỉ khác cú pháp. Chọn cái
                nào tùy công cụ sẵn có.
              </li>
              <li>
                Bar chart sắp xếp giảm dần theo mặc định — mắt người đọc từ
                trên xuống, nên giá trị lớn nhất nằm trên cùng.
              </li>
            </ol>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 3 — REVEAL: 3 cấp độ AI hỗ trợ phân tích            */}
      {/* ========================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            AI hỗ trợ phân tích dữ liệu theo <strong>3 cấp độ</strong> từ đơn
            giản đến nâng cao. Bạn không cần biết lập trình để dùng cả 3 cấp
            này.
          </p>

          <TabView
            tabs={[
              {
                label: "Cấp 1 — Mô tả",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      AI đọc hiểu cấu trúc bảng, giải thích ý nghĩa các cột,
                      phát hiện dữ liệu thiếu hoặc bất thường.
                    </p>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Ví dụ prompt:
                      </p>
                      <p className="text-muted italic">
                        &quot;Tôi có bảng CSV 12 cột. Hãy đọc 5 dòng đầu, đoán
                        kiểu dữ liệu mỗi cột, và chỉ ra cột nào có thể có giá
                        trị null.&quot;
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      AI sẽ trả lời: &quot;Cột <code>order_date</code> kiểu
                      datetime, cột <code>discount</code> có 3/5 dòng null — có
                      thể nghĩa là &apos;không giảm giá&apos;.&quot;
                    </p>
                  </div>
                ),
              },
              {
                label: "Cấp 2 — Tính toán",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      AI gợi ý công thức Excel, viết truy vấn SQL, tính trung
                      bình, tìm giá trị lớn nhất, so sánh các nhóm.
                    </p>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Ví dụ prompt:
                      </p>
                      <p className="text-muted italic">
                        &quot;Viết công thức Excel tính tỷ lệ hoàn thành KPI =
                        doanh thu (cột D) / mục tiêu (cột E), làm tròn 2 chữ
                        số.&quot;
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      AI trả: <code>=ROUND(D2/E2, 2)</code>. Có thể đòi hỏi bổ
                      sung IFERROR để xử lý chia cho 0.
                    </p>
                  </div>
                ),
              },
              {
                label: "Cấp 3 — Trực quan hoá",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      AI đề xuất loại biểu đồ phù hợp, giải thích cách tạo trong
                      Excel hoặc Google Sheets, thậm chí viết code Python nếu
                      bạn cần.
                    </p>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Ví dụ prompt:
                      </p>
                      <p className="text-muted italic">
                        &quot;Tôi có doanh thu 12 tháng. Loại biểu đồ nào phù
                        hợp để trình bày cho sếp? Viết code Python để vẽ.&quot;
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      AI đề xuất line chart (xu hướng theo thời gian) và viết
                      code matplotlib/seaborn sẵn sàng chạy.
                    </p>
                  </div>
                ),
              },
            ]}
          />

          <AhaMoment>
            AI không thay thế bạn phân tích dữ liệu — AI là{" "}
            <strong>trợ lý thông minh</strong> giúp bạn đặt đúng câu hỏi, chọn
            đúng công thức, và nhìn ra pattern mà mắt thường dễ bỏ lỡ trong
            hàng nghìn dòng dữ liệu.
          </AhaMoment>

          <p className="mt-4">
            Về mặt toán học, rất nhiều phép thống kê chỉ là các công thức đơn
            giản. Ví dụ trung bình cộng:
          </p>
          <LaTeX block>
            {`\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i`}
          </LaTeX>
          <p className="text-sm text-muted">
            Nhưng khi dữ liệu có 10.000 dòng và cần nhóm theo 5 khu vực × 12
            tháng, bạn cần máy tính — và AI giúp bạn viết ra lệnh máy tính đó
            bằng ngôn ngữ tự nhiên.
          </p>

          <p className="mt-4 text-sm text-foreground leading-relaxed">
            Một công thức nữa thường thấy trong báo cáo kinh doanh là tỷ lệ
            tăng trưởng giữa hai kỳ:
          </p>
          <LaTeX block>
            {`g = \\frac{V_{current} - V_{previous}}{V_{previous}} \\times 100\\%`}
          </LaTeX>
          <p className="text-sm text-muted">
            Khi hỏi AI &quot;tính tăng trưởng doanh thu tháng 3 so với tháng
            2&quot;, thực chất bạn đang yêu cầu AI áp dụng đúng công thức
            này lên cột dữ liệu của bạn — không có gì huyền bí.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 4 — DEEPEN: Prompt thực chiến + CodeBlock            */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <p>
          Dưới đây là prompt thực chiến mà dân văn phòng hay dùng. Hãy áp dụng
          kỹ thuật <TopicLink slug="prompt-engineering">viết prompt</TopicLink>{" "}
          để có kết quả tốt nhất.
        </p>

        <p className="text-sm text-muted leading-relaxed mt-3">
          Lưu ý: mỗi prompt dưới đây tuân theo cấu trúc 3 lớp —{" "}
          <strong className="text-foreground">bối cảnh dữ liệu</strong> (bảng
          gì, bao nhiêu dòng, cột nào), <strong className="text-foreground">
          câu hỏi phân tích</strong> (đánh số rõ ràng), và{" "}
          <strong className="text-foreground">định dạng output mong
          muốn</strong> (công thức Excel, SQL, bullet points, bảng…). Đây là
          công thức vàng giúp AI trả lời chính xác từ lần đầu, tránh phải
          hỏi đi hỏi lại.
        </p>

        <CodeBlock language="text" title="Prompt 1 — Phân tích doanh thu 4 quý">
          {`Tôi có dữ liệu doanh thu cửa hàng điện tử 4 quý (Q1-Q4 2025).
Các cột: Tháng, Doanh thu (triệu VNĐ), Chi phí, Lợi nhuận, Khu vực.

Hãy:
1. So sánh lợi nhuận giữa 4 quý
2. Khu vực nào có biên lợi nhuận cao nhất?
3. Tháng nào doanh thu đột biến? Có thể do nguyên nhân gì?
4. Viết công thức Excel tính biên lợi nhuận (%) cho từng dòng
5. Gợi ý 3 loại biểu đồ để trình bày với ban giám đốc`}
        </CodeBlock>

        <CodeBlock language="sql" title="Prompt 2 — SQL top khách hàng">
          {`-- Prompt gửi AI:
-- Database có bảng orders(order_id, customer_id, order_date, amount)
-- và bảng customers(customer_id, name, region).
-- Viết SQL lấy top 10 khách hàng chi nhiều nhất trong Q1 2025,
-- kèm khu vực và tổng giá trị đơn hàng.

SELECT
  c.name,
  c.region,
  SUM(o.amount) AS total_spent,
  COUNT(o.order_id) AS num_orders
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date BETWEEN '2025-01-01' AND '2025-03-31'
GROUP BY c.customer_id, c.name, c.region
ORDER BY total_spent DESC
LIMIT 10;`}
        </CodeBlock>

        <Callout variant="insight" title="AI viết SQL rất giỏi nếu bạn mô tả schema">
          Nếu dữ liệu nằm trong database, hãy dán mô tả bảng và cột cho AI
          trước. Ví dụ: <code>&quot;Bảng sales có các cột id, date, product,
          qty, price.&quot;</code> Sau đó mới hỏi. AI sẽ trả về SQL chính xác
          tên cột.
        </Callout>

        <CollapsibleDetail title="Bảng cheat-sheet SQL cho người mới">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">SELECT … FROM …</p>
              <p className="text-muted">
                Chọn cột nào, từ bảng nào. <code>SELECT *</code> lấy hết cột,
                nhưng trong thực tế nên liệt kê tên cột cụ thể để query chạy
                nhanh và code dễ đọc hơn.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">WHERE điều_kiện</p>
              <p className="text-muted">
                Lọc dòng trước khi tổng hợp. Ví dụ{" "}
                <code>WHERE amount &gt; 1000000</code>. Có thể kết hợp nhiều
                điều kiện bằng <code>AND</code>, <code>OR</code>,{" "}
                <code>NOT</code>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">GROUP BY cột</p>
              <p className="text-muted">
                Gom nhóm theo giá trị cột, thường đi kèm SUM/AVG/COUNT. Mọi
                cột trong SELECT không phải là hàm tổng hợp đều phải có mặt
                trong GROUP BY — nếu không sẽ lỗi cú pháp.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">HAVING điều_kiện</p>
              <p className="text-muted">
                Như WHERE nhưng áp dụng <em>sau</em> GROUP BY — tức lọc các
                nhóm đã tổng hợp. Ví dụ{" "}
                <code>HAVING SUM(amount) &gt; 10000000</code>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                ORDER BY cột [DESC]
              </p>
              <p className="text-muted">
                Sắp xếp kết quả. DESC = giảm dần, mặc định là tăng dần. Có thể
                sắp theo nhiều cột: <code>ORDER BY region, revenue DESC</code>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">LIMIT n</p>
              <p className="text-muted">
                Chỉ lấy n dòng đầu — thường dùng sau ORDER BY để lấy top N.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">JOIN … ON …</p>
              <p className="text-muted">
                Ghép 2 bảng qua cột chung, ví dụ customer_id. Các loại JOIN
                phổ biến: <code>INNER JOIN</code> (chỉ giữ dòng có ở cả hai
                bảng), <code>LEFT JOIN</code> (giữ hết dòng bảng trái).
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Hàm tổng hợp phổ biến
              </p>
              <ul className="list-disc list-inside text-muted ml-2 space-y-1">
                <li>
                  <code>SUM(col)</code> — cộng tổng giá trị cột.
                </li>
                <li>
                  <code>AVG(col)</code> — trung bình cộng.
                </li>
                <li>
                  <code>COUNT(*)</code> — đếm số dòng.
                </li>
                <li>
                  <code>COUNT(DISTINCT col)</code> — đếm giá trị khác nhau.
                </li>
                <li>
                  <code>MAX(col)</code>, <code>MIN(col)</code> — giá trị
                  lớn/nhỏ nhất.
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleDetail>

        <p className="text-sm text-muted leading-relaxed mt-4">
          Ngoài SQL, bạn có thể yêu cầu AI viết code Python (pandas) để xử lý
          dữ liệu trong các file CSV/Excel lớn. Pandas có cú pháp khác nhưng
          tư duy tương tự SQL: filter ~ <code>df[df[col] &gt; x]</code>,
          group_by ~ <code>df.groupby(col)</code>, aggregate ~{" "}
          <code>.sum() / .mean() / .count()</code>. AI sẽ tự chuyển đổi giữa
          hai cú pháp nếu bạn nói rõ &quot;viết bằng pandas&quot; hay
          &quot;viết SQL&quot;.
        </p>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 5 — CHALLENGE                                         */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn có bảng KPI 50 nhân viên (Tên, Phòng ban, Doanh số, Chỉ tiêu, Tỷ lệ hoàn thành). Prompt nào giúp AI phân tích hiệu quả nhất?"
          options={[
            "Phân tích KPI giúp tôi",
            "Cho tôi biểu đồ KPI",
            "Tôi có bảng KPI 50 nhân viên (5 cột: Tên, Phòng ban, Doanh số, Chỉ tiêu, Tỷ lệ hoàn thành). Hãy: 1) Phòng ban nào đạt KPI cao nhất, 2) Top 3 nhân viên xuất sắc, 3) Công thức Excel tính tỷ lệ tự động",
            "Ai làm việc kém nhất công ty?",
          ]}
          correct={2}
          explanation="Prompt C cụ thể nhất: mô tả rõ dữ liệu (50 nhân viên, 5 cột), 3 câu hỏi phân tích rõ ràng, yêu cầu output thực tế (công thức Excel). Các prompt còn lại quá mơ hồ hoặc thiếu bối cảnh."
        />

        <InlineChallenge
          question={"AI trả về SQL có dòng `WHERE region = \"Bac\"` nhưng dữ liệu thật lưu là \"Bắc\" (có dấu). Bạn nên làm gì?"}
          options={[
            "Chạy luôn, SQL không phân biệt dấu",
            "Sửa điều kiện thành `WHERE region = \"Bắc\"` — AI không biết dữ liệu của bạn có dấu tiếng Việt",
            "Yêu cầu AI tự tìm và sửa lỗi",
            "Bỏ dấu toàn bộ cột region trong database",
          ]}
          correct={1}
          explanation="SQL phân biệt giá trị chuỗi chính xác từng ký tự, kể cả dấu tiếng Việt. AI không biết dữ liệu thực tế — bạn phải đối chiếu. Đây là lỗi phổ biến khi làm việc với dữ liệu tiếng Việt."
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 6 — EXPLAIN: Pitfalls + Callouts                     */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lưu ý quan trọng">
        <p>
          AI rất hữu ích cho phân tích dữ liệu, nhưng có{" "}
          <strong>những điểm yếu nghiêm trọng</strong> bạn cần biết để tránh
          sai lầm.
        </p>

        <Callout variant="warning" title="AI không truy cập được file của bạn">
          AI chatbot (ChatGPT, Claude, Gemini) không thể mở file Excel trên máy
          tính của bạn. Bạn phải copy-paste dữ liệu vào khung chat. Nếu file
          quá lớn, hãy copy phần đại diện hoặc dùng tính năng upload file nếu
          công cụ hỗ trợ.
        </Callout>

        <Callout variant="warning" title="AI có thể bịa số liệu">
          Đây là hiện tượng{" "}
          <TopicLink slug="hallucination">hallucination</TopicLink>. AI có thể
          tự &quot;sáng tác&quot; ra con số nghe hợp lý nhưng hoàn toàn sai.
          Ví dụ: bạn hỏi trung bình doanh thu, AI trả lời một con số
          &quot;đẹp&quot; nhưng không khớp dữ liệu thật. Luôn kiểm tra lại
          bằng Excel.
        </Callout>

        <Callout
          variant="warning"
          title="Dữ liệu nhạy cảm — cẩn thận bảo mật"
        >
          Không nên dán dữ liệu chứa thông tin cá nhân (CMND, số tài khoản,
          lương cụ thể từng người) vào AI công cộng. Hãy ẩn danh hoặc thay tên
          trước khi paste. Nếu công ty có chính sách bảo mật, hãy tuân thủ.
        </Callout>

        <Callout variant="tip" title="Quy tắc vàng 3 bước">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Dùng AI để <strong>gợi ý cách phân tích</strong> và viết công thức.</li>
            <li>Chạy công thức trên <strong>mẫu nhỏ 5-10 dòng</strong> để đối chiếu.</li>
            <li>Áp dụng toàn bộ dữ liệu khi đã xác nhận đúng.</li>
          </ol>
        </Callout>

        <CollapsibleDetail title="Danh sách kiểm tra trước khi trust AI output">
          <ul className="list-disc list-inside space-y-2 text-sm text-foreground/90">
            <li>
              <strong>Số liệu</strong> — đối chiếu ít nhất 2-3 giá trị với
              nguồn gốc.
            </li>
            <li>
              <strong>Phạm vi cột</strong> — kiểm tra công thức có đúng A2:A100
              hay bị lệch thành A1:A99.
            </li>
            <li>
              <strong>Kiểu dữ liệu</strong> — ngày có đúng format dd/mm/yyyy
              hay bị hiểu nhầm mm/dd/yyyy.
            </li>
            <li>
              <strong>Giá trị null</strong> — AI đôi khi bỏ qua, đôi khi tính
              null = 0.
            </li>
            <li>
              <strong>Dấu tiếng Việt</strong> — &quot;Bắc&quot; ≠ &quot;Bac&quot; trong điều kiện WHERE.
            </li>
            <li>
              <strong>Đơn vị</strong> — triệu VNĐ ≠ VNĐ, tuần ≠ ngày, % ≠ tỷ
              lệ thập phân.
            </li>
          </ul>
        </CollapsibleDetail>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 6B — Ví dụ tình huống thực tế mở rộng                */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ví dụ thực tế">
        <p>
          Để thấy rõ cách quy trình áp dụng trong công việc hàng ngày, ta xem
          ba tình huống phổ biến của dân văn phòng khi cần &quot;hỏi dữ
          liệu&quot; nhanh mà không muốn mở Excel.
        </p>

        <TabView
          tabs={[
            {
              label: "Kế toán",
              content: (
                <div className="space-y-3 text-sm">
                  <p className="text-foreground leading-relaxed">
                    <strong>Tình huống:</strong> Bạn có file công nợ khách
                    hàng 800 dòng. Sếp hỏi &quot;Top 10 khách nợ lâu nhất và
                    tổng công nợ từng người bao nhiêu?&quot;
                  </p>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-semibold text-foreground mb-1">
                      Prompt:
                    </p>
                    <p className="text-muted italic">
                      &quot;Tôi có bảng công nợ 800 dòng với cột: khách_hàng,
                      số_hoá_đơn, ngày_xuất, số_tiền, số_ngày_quá_hạn. Viết
                      công thức Excel hoặc SQL lấy top 10 khách hàng theo
                      tổng số_ngày_quá_hạn lớn nhất, kèm tổng_công_nợ của
                      họ.&quot;
                    </p>
                  </div>
                  <p className="text-muted">
                    AI trả về cả SQL và công thức Excel SUMIFS — bạn chọn
                    cái phù hợp công cụ đang dùng.
                  </p>
                </div>
              ),
            },
            {
              label: "Marketing",
              content: (
                <div className="space-y-3 text-sm">
                  <p className="text-foreground leading-relaxed">
                    <strong>Tình huống:</strong> Có file tracking chiến dịch
                    quảng cáo 30 ngày, cần so sánh hiệu quả các kênh (Google,
                    Facebook, TikTok).
                  </p>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-semibold text-foreground mb-1">
                      Prompt:
                    </p>
                    <p className="text-muted italic">
                      &quot;Bảng có các cột: ngày, kênh, chi_phí,
                      lượt_hiển_thị, lượt_click, đơn_hàng. Viết truy vấn:
                      CTR (click/impression), CPC (cost/click), CVR
                      (order/click) theo từng kênh, sắp xếp theo CVR giảm
                      dần. Kèm ghi chú kênh nào tối ưu hóa chi phí
                      nhất.&quot;
                    </p>
                  </div>
                  <p className="text-muted">
                    Mẹo: yêu cầu AI viết thêm phần diễn giải bằng tiếng Việt
                    để dán vào slide thuyết trình cho sếp.
                  </p>
                </div>
              ),
            },
            {
              label: "Vận hành",
              content: (
                <div className="space-y-3 text-sm">
                  <p className="text-foreground leading-relaxed">
                    <strong>Tình huống:</strong> File log hệ thống 5.000 dòng,
                    cần tìm các lỗi xuất hiện nhiều nhất và giờ cao điểm xảy
                    ra sự cố.
                  </p>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-semibold text-foreground mb-1">
                      Prompt:
                    </p>
                    <p className="text-muted italic">
                      &quot;Log có cột timestamp, level (INFO/WARN/ERROR),
                      message. Đếm số lần xuất hiện mỗi message level=ERROR,
                      top 10. Sau đó thống kê số lỗi theo từng giờ trong ngày
                      để tìm giờ peak. Viết bằng pandas.&quot;
                    </p>
                  </div>
                  <p className="text-muted">
                    AI sẽ dùng <code>groupby()</code> kết hợp{" "}
                    <code>dt.hour</code> để rút giờ từ timestamp — một
                    pattern rất phổ biến khi xử lý time-series.
                  </p>
                </div>
              ),
            },
          ]}
        />

        <Callout variant="info" title="Mẹo ghi nhớ 4 bước">
          Mỗi lần nhờ AI phân tích, hãy tự nhắc 4 chữ cái viết tắt{" "}
          <strong>D-A-T-A</strong>: <strong>D</strong>escribe (mô tả dữ liệu),{" "}
          <strong>A</strong>sk (đặt câu hỏi cụ thể), <strong>T</strong>est
          (thử trên mẫu nhỏ), <strong>A</strong>pply (áp dụng toàn bộ). Bỏ
          một bước là dễ ra số sai.
        </Callout>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 7 — CONNECT: MiniSummary + liên kết                  */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
        <MiniSummary
          title="Những điều cần nhớ về AI phân tích dữ liệu"
          points={[
            "Mô tả dữ liệu cho AI theo 3 bước: cấu trúc cột → dữ liệu mẫu → câu hỏi cụ thể.",
            "AI hỗ trợ 3 cấp: mô tả dữ liệu, phân tích/viết công thức, và gợi ý trực quan hoá.",
            "AI dịch ngôn ngữ tự nhiên sang SQL/pandas — bạn vẫn phải đọc hiểu code trước khi tin.",
            "Luôn kiểm tra lại số liệu AI đưa ra — AI có thể hallucinate con số.",
            "Không dán dữ liệu nhạy cảm (lương, CMND, tài khoản) vào AI công cộng.",
            "Kết hợp kỹ thuật viết prompt tốt để có kết quả phân tích chính xác hơn.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">Khám phá thêm:</p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm text-foreground/90">
            <li>
              <TopicLink slug="prompt-engineering">
                Kỹ thuật viết prompt
              </TopicLink>{" "}
              — viết prompt tốt hơn để AI hiểu chính xác yêu cầu phân tích
              của bạn.
            </li>
            <li>
              <TopicLink slug="hallucination">Hallucination</TopicLink> —
              hiểu vì sao AI đôi khi bịa số liệu và cách phòng tránh.
            </li>
            <li>
              <TopicLink slug="ai-for-writing">AI hỗ trợ viết lách</TopicLink>{" "}
              — dùng AI để viết báo cáo từ kết quả phân tích.
            </li>
            <li>
              <TopicLink slug="getting-started-with-ai">
                Bắt đầu với AI
              </TopicLink>{" "}
              — nếu bạn hoàn toàn mới với chatbot AI và cần nền tảng.
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-5">
          <p className="text-sm font-semibold text-foreground mb-2">
            Bài tập về nhà (tuỳ chọn)
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Mở một file Excel thật bạn đang làm việc (có thể ẩn danh cột tên
            nếu cần). Viết ba câu hỏi phân tích bằng tiếng Việt theo công
            thức D-A-T-A, gửi cho AI và đối chiếu kết quả. Ghi lại ba điểm
            AI làm đúng và một điểm AI làm sai — đây là cách tốt nhất để xây
            dựng &quot;giác quan nghi ngờ&quot; cần thiết khi làm việc với
            dữ liệu.
          </p>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 8 — QUIZ                                              */}
      {/*                                                            */}
      {/* 8 câu hỏi phủ đủ 4 nhóm năng lực:                          */}
      {/*   - Nhận thức: AI không tự đọc file, có thể hallucinate.   */}
      {/*   - Kỹ thuật: GROUP BY, biểu đồ phù hợp, cú pháp.          */}
      {/*   - Quy trình: prompt tốt, test trước khi apply.           */}
      {/*   - An toàn: xử lý dữ liệu nhạy cảm, dấu tiếng Việt.       */}
      {/* ========================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
