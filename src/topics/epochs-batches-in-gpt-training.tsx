"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Database,
  Flame,
  Gauge,
  Layers,
  Rocket,
  Server,
  TrendingDown,
  Zap,
  CircleDot,
  BookOpen,
  HardDrive,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import {
  SliderGroup,
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "epochs-batches-in-gpt-training",
  title: "Epochs & Batches in GPT Training",
  titleVi: "Epoch và batch khi huấn luyện GPT",
  description:
    "GPT-4 đọc khoảng 13 nghìn tỉ token — một lượt duy nhất, chia thành hàng triệu batch. Xem cách các lab AI vặn batch size, lên lịch epoch và tránh hết RAM GPU.",
  category: "neural-fundamentals",
  tags: ["epochs-batches", "training", "gpt", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["epochs-batches"],
  vizType: "interactive",
  applicationOf: "epochs-batches",
  featuredApp: {
    name: "GPT-4 / LLaMA",
    productFeature: "Large-Scale Pretraining",
    company: "OpenAI / Meta AI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Training Compute-Optimal Large Language Models (Chinchilla)",
      publisher: "Hoffmann et al., arXiv (DeepMind)",
      url: "https://arxiv.org/pdf/2203.15556",
      date: "2022-03",
      kind: "paper",
    },
    {
      title: "Scaling Data-Constrained Language Models",
      publisher: "Muennighoff et al., arXiv",
      url: "https://arxiv.org/pdf/2305.16264",
      date: "2023-05",
      kind: "paper",
    },
    {
      title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
      publisher: "Meta AI (Touvron et al.)",
      url: "https://huggingface.co/meta-llama/Llama-2-7b",
      date: "2023-07",
      kind: "documentation",
    },
    {
      title: "Chinchilla Scaling Laws: Compute-Optimal LLM Training",
      publisher: "Michael Brenndoerfer",
      url: "https://mbrenndoerfer.com/writing/chinchilla-scaling-laws-compute-optimal-llm-training",
      date: "2024-01",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Câu chuyện" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — ba mô hình ngôn ngữ lớn với ngân sách dữ liệu rất
   khác nhau. Dùng để so sánh số token, số batch, số iteration.
   Nguồn: Chinchilla (2022), LLaMA 2 (2023), GPT-3 (2020).
   ──────────────────────────────────────────────────────────── */

type ModelId = "gpt3" | "chinchilla" | "llama2" | "gpt4";

interface ModelProfile {
  id: ModelId;
  name: string;
  shortVi: string;
  icon: typeof Cpu;
  color: string;
  params: string;
  paramsNum: number;
  tokens: string;
  tokensNum: number;
  ratio: string;
  epochs: string;
  status: "under" | "balanced" | "over";
  verdictVi: string;
}

const MODELS: ModelProfile[] = [
  {
    id: "gpt3",
    name: "GPT-3 (2020)",
    shortVi: "GPT-3",
    icon: BookOpen,
    color: "#f97316",
    params: "175 tỉ",
    paramsNum: 175e9,
    tokens: "300 tỉ",
    tokensNum: 3e11,
    ratio: "~1,7",
    epochs: "~1 epoch",
    status: "under",
    verdictVi:
      "Quá thiếu dữ liệu. Mô hình to nhưng chưa được 'đọc' đủ sách — học vẹt nhiều hơn là hiểu.",
  },
  {
    id: "chinchilla",
    name: "Chinchilla (2022)",
    shortVi: "Chinchilla",
    icon: Gauge,
    color: "#10b981",
    params: "70 tỉ",
    paramsNum: 7e10,
    tokens: "1,4 nghìn tỉ",
    tokensNum: 1.4e12,
    ratio: "~20",
    epochs: "~1 epoch",
    status: "balanced",
    verdictVi:
      "Đúng tỉ lệ vàng: 20 token cho mỗi tham số. Nhỏ hơn GPT-3 gấp 2,5 lần nhưng làm tốt hơn trên hầu hết bài kiểm tra.",
  },
  {
    id: "llama2",
    name: "LLaMA 2 (2023)",
    shortVi: "LLaMA 2",
    icon: Layers,
    color: "#3b82f6",
    params: "70 tỉ",
    paramsNum: 7e10,
    tokens: "2 nghìn tỉ",
    tokensNum: 2e12,
    ratio: "~28,6",
    epochs: "~1 epoch",
    status: "balanced",
    verdictVi:
      "Vượt mốc Chinchilla một chút — đầu tư dữ liệu cao hơn để đổi lấy khả năng nói tiếng nhiều vùng hơn.",
  },
  {
    id: "gpt4",
    name: "GPT-4 (2023)",
    shortVi: "GPT-4",
    icon: Rocket,
    color: "#a855f7",
    params: "~1,8 nghìn tỉ (ước tính)",
    paramsNum: 1.8e12,
    tokens: "~13 nghìn tỉ",
    tokensNum: 1.3e13,
    ratio: "~7",
    epochs: "~2 epoch",
    status: "over",
    verdictVi:
      "Mô hình khổng lồ, dữ liệu đã gần hết. Bắt đầu cần lặp lại — nhưng lặp quá nhiều thì mô hình học thuộc lòng.",
  },
];

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — bốn cặp batch size + learning rate để xem khi cạn
   RAM GPU thì mô hình gãy thế nào. Hình dung: mỗi batch = "bàn
   ăn", model = "đầu bếp", RAM GPU = "độ rộng bếp".
   ──────────────────────────────────────────────────────────── */

interface BatchScenario {
  bsTokens: number;
  ramGB: number;
  ramFree: number;
  oom: boolean;
  label: string;
  noteVi: string;
}

function computeScenario(bsTokens: number, gpuRamGB: number): BatchScenario {
  const bytesPerToken = 24;
  const ramNeeded = (bsTokens * bytesPerToken) / 1e9;
  const ramFree = gpuRamGB - ramNeeded;
  const oom = ramFree < 0;
  let label: string;
  let noteVi: string;
  if (oom) {
    label = "Hết RAM (OOM)";
    noteVi =
      "GPU hết bộ nhớ — quá trình huấn luyện dừng hẳn. Cần batch nhỏ hơn hoặc dùng gradient accumulation (gom từng batch nhỏ rồi mới cập nhật).";
  } else if (ramFree < 2) {
    label = "Ngay ngưỡng nguy hiểm";
    noteVi =
      "Đủ chạy nhưng nguy cơ OOM khi độ dài chuỗi thay đổi. Thường các đội lùi về batch an toàn hơn.";
  } else if (bsTokens < 4096) {
    label = "Batch quá nhỏ";
    noteVi =
      "Gradient nhiễu, tổng thời gian huấn luyện dài hơn vì mỗi bước chỉ 'học' từ rất ít dữ liệu.";
  } else {
    label = "Vùng hoạt động tốt";
    noteVi =
      "Gradient mượt, tận dụng tốt GPU song song, learning rate có thể nâng lên tương ứng với căn bậc hai của batch.";
  }
  return { bsTokens, ramGB: ramNeeded, ramFree: Math.max(ramFree, 0), oom, label, noteVi };
}

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — scaling laws giả lập: loss giảm theo compute (log).
   Dùng cho biểu đồ "đường cong thu nhỏ dần" trong Mechanism.
   ──────────────────────────────────────────────────────────── */

interface ScalingPoint {
  compute: number;
  loss: number;
  label: string;
  color: string;
}

const SCALING_CURVE: ScalingPoint[] = [
  { compute: 1e19, loss: 3.8, label: "GPT-2", color: "#6b7280" },
  { compute: 3.14e23, loss: 2.4, label: "GPT-3", color: "#f97316" },
  { compute: 5.76e23, loss: 2.1, label: "Chinchilla", color: "#10b981" },
  { compute: 6e24, loss: 1.8, label: "LLaMA 2", color: "#3b82f6" },
  { compute: 2e25, loss: 1.6, label: "GPT-4", color: "#a855f7" },
];

/* ────────────────────────────────────────────────────────────
   HELPER — định dạng token/tham số thành "nghìn tỉ / tỉ / triệu".
   ──────────────────────────────────────────────────────────── */

function fmtBig(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} nghìn tỉ`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỉ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} triệu`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} nghìn`;
  return n.toFixed(0);
}

function fmtIterations(tokens: number, batchTokens: number): string {
  const iters = tokens / batchTokens;
  if (iters >= 1e6) return `${(iters / 1e6).toFixed(2)} triệu`;
  if (iters >= 1e3) return `${(iters / 1e3).toFixed(0)} nghìn`;
  return iters.toFixed(0);
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CON — Biểu đồ "một dải token dài đứt quãng thành
   các batch". Vẽ SVG tĩnh, đổi theo tổng token và batch size.
   ──────────────────────────────────────────────────────────── */

interface StripChartProps {
  totalTokens: number;
  batchTokens: number;
  color: string;
}

function BatchStripChart({ totalTokens, batchTokens, color }: StripChartProps) {
  const visualBatches = Math.min(40, Math.max(5, Math.round(totalTokens / batchTokens)));
  return (
    <svg viewBox="0 0 400 70" className="w-full max-w-md mx-auto">
      <rect x={4} y={22} width={392} height={30} rx={4} fill="var(--bg-surface)" />
      {Array.from({ length: visualBatches }).map((_, i) => {
        const w = 392 / visualBatches;
        return (
          <rect
            key={i}
            x={4 + i * w}
            y={22}
            width={w - 1.5}
            height={30}
            rx={2}
            fill={color}
            opacity={0.85 - (i % 3) * 0.15}
          />
        );
      })}
      <text x={200} y={16} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
        {fmtBig(totalTokens)} token chia thành {fmtIterations(totalTokens, batchTokens)} batch
      </text>
      <text x={200} y={66} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">
        Mỗi ô = một batch = một bước cập nhật trọng số
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CON — Đường cong scaling laws (loss giảm theo compute)
   ──────────────────────────────────────────────────────────── */

function ScalingCurveSvg() {
  const W = 520;
  const H = 240;
  const padding = 40;
  const logMin = 19;
  const logMax = 25.5;
  const lossMin = 1.4;
  const lossMax = 4.0;
  function x(compute: number) {
    const l = Math.log10(compute);
    return padding + ((l - logMin) / (logMax - logMin)) * (W - padding * 2);
  }
  function y(loss: number) {
    return H - padding - ((loss - lossMin) / (lossMax - lossMin)) * (H - padding * 2);
  }
  const pathPoints: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const lg = logMin + ((logMax - logMin) * i) / 60;
    const compute = Math.pow(10, lg);
    const loss = 1.5 + 2.2 * Math.pow(compute / 1e19, -0.07);
    pathPoints.push(`${i === 0 ? "M" : "L"} ${x(compute).toFixed(1)} ${y(loss).toFixed(1)}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg mx-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padding}
          x2={W - padding}
          y1={padding + f * (H - padding * 2)}
          y2={padding + f * (H - padding * 2)}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.4}
        />
      ))}
      <line
        x1={padding}
        y1={H - padding}
        x2={W - padding}
        y2={H - padding}
        stroke="var(--border)"
        strokeWidth={1}
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={H - padding}
        stroke="var(--border)"
        strokeWidth={1}
      />
      <path
        d={pathPoints.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {SCALING_CURVE.map((p) => (
        <g key={p.label}>
          <circle cx={x(p.compute)} cy={y(p.loss)} r={5.5} fill={p.color} stroke="white" strokeWidth={1.5} />
          <text x={x(p.compute)} y={y(p.loss) - 10} textAnchor="middle" fontSize={10} fill={p.color} fontWeight={600}>
            {p.label}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">
        Compute (phép tính, thang log) →
      </text>
      <text
        x={12}
        y={H / 2}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-tertiary)"
        transform={`rotate(-90, 12, ${H / 2})`}
      >
        Loss (sai số, càng thấp càng tốt)
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function EpochsBatchesInGptTraining() {
  const [activeModel, setActiveModel] = useState<ModelId>("llama2");
  const activeModelProfile =
    useMemo(() => MODELS.find((m) => m.id === activeModel) ?? MODELS[0], [activeModel]);

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Epoch, batch và iteration">
      {/* ━━━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationHero
        parentTitleVi="Epoch, batch và iteration"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <p>
          Khi bạn chat với GPT-4, bạn đang nói chuyện với một mô hình đã &ldquo;đọc&rdquo;
          khoảng <strong>13 nghìn tỉ token</strong> văn bản trên internet &mdash; tương đương
          khoảng 50 triệu cuốn sách, gấp hàng nghìn lần số chữ một người có thể đọc trong cả
          đời. Câu hỏi tự nhiên: làm thế nào để nhét ngần ấy dữ liệu vào một mô hình trong
          vài tháng huấn luyện?
        </p>
        <p>
          Câu trả lời gọi là <strong>epoch</strong> (lượt duyệt qua toàn bộ dữ liệu) và{" "}
          <strong>batch</strong> (lô &mdash; nhóm mẫu xử lý cùng lúc). GPT-4 thường chỉ chạy
          một hoặc hai epoch &mdash; vì một lượt đã đủ nhiều. Nhưng mỗi lượt đó được chặt
          thành <strong>hàng triệu batch</strong>, mỗi batch là một bước cập nhật trọng số
          trên hàng ngàn GPU chạy song song. Bài này sẽ cho bạn thấy cách các lab AI thực sự
          vặn những con số đó, và vì sao một sai lầm nhỏ trong batch size có thể đốt hàng
          chục triệu đô-la vô ích.
        </p>
      </ApplicationHero>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ PROBLEM ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationProblem topicSlug="epochs-batches-in-gpt-training">
        <p>
          Hãy hình dung bạn có <strong>13 nghìn tỉ token</strong> văn bản. Không GPU nào trên
          trái đất có đủ RAM để ôm toàn bộ dữ liệu cùng lúc. Ngay cả một chiếc H100
          (card đồ hoạ chuyên dụng cho AI, RAM 80 GB) cũng chỉ chứa nổi vài triệu token.
          Vậy mô hình &ldquo;đọc&rdquo; kiểu gì?
        </p>
        <p>
          Và đây mới là câu hỏi đắt giá: nên <em>lặp lại dữ liệu nhiều lần</em> (nhiều
          epoch, dữ liệu ít) hay <em>đọc một lượt thật kỹ</em> (một epoch, dữ liệu khổng
          lồ)? Batch nên to bao nhiêu để không hết RAM nhưng vẫn đủ ổn định? Mỗi quyết
          định ảnh hưởng trực tiếp tới <strong>chi phí hàng chục đến hàng trăm triệu đô-la</strong>
          {" "}cho một đợt huấn luyện &mdash; và quyết định chất lượng mô hình cuối.
        </p>

        <div className="not-prose mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Database size={16} className="text-accent" /> Khối dữ liệu khổng lồ
            </div>
            <p className="text-xs text-muted leading-relaxed">
              13 nghìn tỉ token &asymp; 50 triệu cuốn sách. Không một GPU nào chứa hết cùng lúc.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Server size={16} className="text-accent" /> Hạn chế RAM GPU
            </div>
            <p className="text-xs text-muted leading-relaxed">
              H100 có 80 GB. Một batch 4 triệu token đã chiếm ~100 GB &rarr; phải chia tiếp.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Flame size={16} className="text-accent" /> Chi phí đốt triệu đô
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Mỗi ngày GPU-cluster &asymp; hàng trăm nghìn đô. Chọn sai batch = cháy tiền.
            </p>
          </div>
        </div>
      </ApplicationProblem>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ MECHANISM ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationMechanism
        parentTitleVi="Epoch, batch và iteration"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <Beat step={1}>
          <p>
            <strong>Chia dữ liệu thành batch, mỗi batch là một bước cập nhật.</strong>{" "}
            Thay vì nạp cả 13 nghìn tỉ token cùng lúc, lab AI chia dữ liệu thành những khối
            nhỏ gọi là <em>batch</em>. Với LLaMA 2, mỗi batch chứa khoảng <strong>4 triệu
            token</strong> &mdash; tương đương 1.000 chuỗi, mỗi chuỗi 4.096 token. Sau khi
            xem xong một batch, mô hình cập nhật trọng số một lần, rồi đọc batch kế tiếp.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Quy luật Chinchilla: khoảng 20 token cho mỗi tham số.</strong> Năm 2022
            DeepMind công bố kết quả chấn động: GPT-3 (175 tỉ tham số) dùng chỉ 300 tỉ token
            &mdash; tức 1,7 token/tham số &mdash; &ldquo;đói&rdquo; dữ liệu trầm trọng.
            Chinchilla 70 tỉ tham số được huấn luyện đúng tỉ lệ <em>20 token cho mỗi tham số</em>
            {" "}và đánh bại GPT-3 trên gần hết bài kiểm tra. Bài học: tăng dữ liệu đúng tỉ lệ
            thường đáng giá hơn tăng kích thước mô hình.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Hàng trăm nghìn đến vài triệu iteration trong một epoch.</strong> Lấy 2
            nghìn tỉ token của LLaMA 2 chia cho batch 4 triệu token &rarr; khoảng{" "}
            <em>500.000 iteration</em> (lần lặp &mdash; mỗi lần là một forward + backward +
            cập nhật). Toàn bộ 500.000 bước này gộp thành <em>một epoch</em>. Một đợt huấn
            luyện thường chạy trong 2 đến 4 tháng trên cluster hàng nghìn GPU.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Gradient accumulation: nhiều batch nhỏ đóng vai một batch lớn.</strong>{" "}
            Nếu một GPU chỉ chứa nổi 500 nghìn token, nhưng bạn muốn batch hiệu dụng 4 triệu
            token, bạn gom gradient của 8 mini-batch rồi mới cập nhật một lần. Đây là mẹo
            vàng giúp các đội nhỏ huấn luyện được mô hình to &mdash; họ &ldquo;mô phỏng&rdquo;
            batch lớn bằng cách lặp lại batch nhỏ trước khi cập nhật.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Lặp dữ liệu quá 4 epoch bắt đầu gây hại.</strong> Muennighoff và cộng sự
            (2023) chỉ ra: lặp dữ liệu 1&ndash;2 lần gần như miễn phí, 3&ndash;4 lần có ích
            giảm dần, sau 4 lần thì giá trị biên gần như bằng 0. Lý do: mô hình bắt đầu{" "}
            <em>thuộc lòng</em> thay vì học mẫu tổng quát. Vì vậy các lab lớn đầu tư mạnh
            vào <em>thu thập dữ liệu mới</em> thay vì chạy nhiều epoch trên bộ dữ liệu cũ.
          </p>
        </Beat>

        {/* Scaling curve visual */}
        <div className="not-prose mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingDown size={16} className="text-accent" /> Scaling laws: loss giảm dần
            theo compute
          </h3>
          <p className="text-xs text-muted leading-relaxed mb-3">
            Trục hoành là tổng phép tính (compute, thang log). Trục tung là loss (sai số).
            Mỗi chấm là một mô hình thật đã được công bố. Đường cong cho thấy quy luật:
            &ldquo;nhân đôi compute &rarr; loss giảm theo một tỉ lệ dự đoán được&rdquo;.
          </p>
          <ScalingCurveSvg />
          <p className="text-xs text-muted leading-relaxed mt-3 italic text-center">
            Mỗi khi tăng gấp 10 lần compute, loss giảm khoảng 15&ndash;20%. Các lab lên kế
            hoạch huấn luyện dựa trên những đường cong như thế này &mdash; trước khi chi
            tiền.
          </p>
        </div>
      </ApplicationMechanism>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ TRY IT ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationTryIt topicSlug="epochs-batches-in-gpt-training">
        {/* ── Phần 1: model picker — cùng bối cảnh, ngân sách khác ── */}
        <h3 className="text-base font-semibold text-foreground mb-2">
          So sánh ngân sách huấn luyện của bốn mô hình thật
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Bấm chọn từng mô hình để xem dữ liệu, tỉ lệ token/tham số, và biểu đồ dải batch
          tương ứng. Bạn sẽ thấy GPT-3 &ldquo;đói&rdquo; dữ liệu rõ rệt so với Chinchilla.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {MODELS.map((m) => {
            const Icon = m.icon;
            const active = m.id === activeModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModel(m.id)}
                className="text-left rounded-xl border-2 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                style={{
                  borderColor: active ? m.color : "var(--border)",
                  backgroundColor: active ? m.color + "15" : "var(--bg-card)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: m.color }} />
                  <span className="text-xs font-bold text-foreground">{m.shortVi}</span>
                </div>
                <div className="text-[10px] text-muted">
                  {m.ratio}{" "}
                  <span className="font-mono" style={{ color: m.color }}>
                    token/tham số
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeModelProfile.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
          >
            <div
              className="rounded-xl border bg-card p-4 space-y-3"
              style={{ borderLeft: `4px solid ${activeModelProfile.color}` }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                  Mô hình
                </div>
                <div className="text-base font-bold mt-0.5" style={{ color: activeModelProfile.color }}>
                  {activeModelProfile.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface/60 border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary mb-0.5">
                    Tham số
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {activeModelProfile.params}
                  </div>
                </div>
                <div className="rounded-lg bg-surface/60 border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary mb-0.5">
                    Tổng token
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {activeModelProfile.tokens}
                  </div>
                </div>
                <div className="rounded-lg bg-surface/60 border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary mb-0.5">
                    Token/tham số
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {activeModelProfile.ratio}
                  </div>
                </div>
                <div className="rounded-lg bg-surface/60 border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary mb-0.5">
                    Epoch
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {activeModelProfile.epochs}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-surface/60 border border-border p-3">
                <p className="text-xs text-foreground/85 leading-relaxed">
                  <strong className="text-foreground">Nhận định: </strong>
                  {activeModelProfile.verdictVi}
                </p>
              </div>
            </div>
            <div
              className="rounded-xl border bg-card p-4 space-y-2"
              style={{ borderLeft: `4px solid ${activeModelProfile.color}` }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                Dải batch của {activeModelProfile.shortVi}
              </div>
              <BatchStripChart
                totalTokens={activeModelProfile.tokensNum}
                batchTokens={4e6}
                color={activeModelProfile.color}
              />
              <p className="text-xs text-muted leading-relaxed text-center">
                Mô phỏng chia {activeModelProfile.tokens} token thành các batch 4 triệu token.
                Trên thực tế, số ô nhiều hơn rất nhiều &mdash; đây chỉ là minh hoạ.
              </p>
              <div className="flex items-center justify-center gap-4 text-[10px] text-muted pt-1">
                <span className="flex items-center gap-1">
                  <CircleDot size={10} style={{ color: activeModelProfile.color }} /> batch =
                  iteration
                </span>
                <span>|</span>
                <span>~{fmtIterations(activeModelProfile.tokensNum, 4e6)} bước cập nhật</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Phần 2: Slider batch size — gradient accumulation sống động ── */}
        <h3 className="text-base font-semibold text-foreground mb-2 mt-8">
          Vặn batch size &mdash; nhìn RAM GPU và nhịp gradient thay đổi
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Bạn đang ngồi trên một GPU H100 (RAM 80 GB). Kéo thanh để đổi batch size (tính
          bằng token). Bạn sẽ thấy: batch quá nhỏ &rarr; gradient nhiễu; vừa phải &rarr; an
          toàn; quá lớn &rarr; GPU hết RAM.
        </p>

        <SliderGroup
          title="Ngân sách bộ nhớ và tốc độ gradient"
          sliders={[
            {
              key: "bsK",
              label: "Batch size (nghìn token, giả lập tiêu thụ 24 byte/token)",
              min: 64,
              max: 5000,
              step: 32,
              defaultValue: 512,
              unit: " K",
            },
            {
              key: "ramGB",
              label: "RAM GPU (GB)",
              min: 16,
              max: 160,
              step: 8,
              defaultValue: 80,
              unit: " GB",
            },
          ]}
          visualization={(values) => {
            const bsTokens = (values.bsK ?? 512) * 1000;
            const ram = values.ramGB ?? 80;
            const scenario = computeScenario(bsTokens, ram);
            const usagePct = Math.min(100, (scenario.ramGB / ram) * 100);
            const barColor = scenario.oom
              ? "#ef4444"
              : usagePct > 85
                ? "#f59e0b"
                : usagePct > 40
                  ? "#10b981"
                  : "#3b82f6";
            return (
              <div className="w-full space-y-3 py-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <HardDrive size={14} className="text-accent" />
                    <span>
                      Cần{" "}
                      <strong className="tabular-nums">
                        {scenario.ramGB.toFixed(1)} GB
                      </strong>{" "}
                      trên {ram} GB
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: barColor + "22", color: barColor }}
                  >
                    {scenario.label}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    animate={{ width: `${usagePct}%` }}
                    transition={{ type: "spring", stiffness: 170, damping: 24 }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-surface/60 border border-border p-2">
                    <div className="text-tertiary uppercase tracking-wide text-[9px]">
                      Số iteration / epoch
                    </div>
                    <div className="font-semibold text-foreground tabular-nums">
                      {fmtIterations(2e12, bsTokens)} lần
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface/60 border border-border p-2">
                    <div className="text-tertiary uppercase tracking-wide text-[9px]">
                      Gradient
                    </div>
                    <div className="font-semibold text-foreground">
                      {bsTokens < 256_000
                        ? "Rất nhiễu"
                        : bsTokens < 1_000_000
                          ? "Nhiễu nhẹ"
                          : bsTokens < 4_000_000
                            ? "Ổn định"
                            : "Rất mượt"}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted italic">
                  {scenario.noteVi}
                </p>
              </div>
            );
          }}
        />

        <Callout variant="insight" title="Mẹo: gradient accumulation cứu GPU nhỏ">
          Nếu GPU bạn quá nhỏ để chạy batch 4 triệu token, đừng giảm batch &mdash; hãy chia
          thành <strong>8 mini-batch 500 nghìn token</strong>, gom gradient lại, rồi mới cập
          nhật. Kết quả toán học tương đương batch 4 triệu &mdash; chỉ chậm hơn, không tệ hơn.
          Đây là cách các đội sinh viên huấn luyện được mô hình tỉ tham số trên cluster khiêm
          tốn.
        </Callout>

        {/* ── Phần 3: StepReveal — lịch huấn luyện cho mô hình 1B tham số ── */}
        <h3 className="text-base font-semibold text-foreground mb-2 mt-10">
          Lên lịch huấn luyện thực tế cho một mô hình 1 tỉ tham số
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Giả sử bạn là một đội startup muốn huấn luyện một mô hình 1 tỉ tham số. Dưới đây là
          từng bước một đội thật sự đi qua &mdash; từ tính ngân sách token đến chạy epoch
          cuối. Bấm &ldquo;Tiếp tục&rdquo; để đi qua từng bước.
        </p>

        <StepReveal
          labels={[
            "Bước 1 — tính ngân sách token",
            "Bước 2 — quyết định batch size",
            "Bước 3 — phân bổ GPU",
            "Bước 4 — lịch epoch và kiểm tra",
            "Bước 5 — kiểm chứng cuối",
          ]}
        >
          {[
            <div key="s1" className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  20 token cho mỗi tham số
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Mô hình 1 tỉ tham số theo tỉ lệ Chinchilla cần <strong>~20 tỉ token</strong>.
                Bạn chuẩn bị dữ liệu: Common Crawl đã lọc + Wikipedia + sách + code &mdash;
                tổng ~25 tỉ token để dư phòng. Đây là bước quan trọng nhất &mdash; thiếu dữ
                liệu thì mô hình dù to cũng chỉ là con vẹt.
              </p>
              <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                <strong>Kiểm tra thực tế: </strong>Chinchilla 70B dùng 1,4 nghìn tỉ token
                (tỉ lệ 20). LLaMA 2 7B dùng 2 nghìn tỉ token (tỉ lệ 286!) vì đa ngôn ngữ đòi
                hỏi thêm dữ liệu.
              </div>
            </div>,
            <div key="s2" className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Global batch size ~2 triệu token
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bạn chọn batch size <strong>2 triệu token</strong> mỗi bước (tương đương ~500
                chuỗi 4.096 token). Vì sao 2 triệu? Nhỏ hơn thì gradient nhiễu, lớn hơn thì
                mỗi bước quá đắt mà lợi ích giảm dần. Quy tắc ngón tay cái của cộng đồng: batch
                hiệu dụng tỉ lệ thuận với kích thước mô hình.
              </p>
              <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                <strong>Phép tính nhanh: </strong>20 tỉ token &divide; 2 triệu token/batch ={" "}
                <strong>10.000 iteration</strong> để chạy xong 1 epoch.
              </div>
            </div>,
            <div key="s3" className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  64 GPU H100 + gradient accumulation
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Mỗi H100 chỉ ôm nổi ~250 nghìn token/bước cho mô hình 1B (kể cả optimizer
                states). Bạn chia batch 2 triệu thành <strong>8 mini-batch 250 nghìn trên 8
                GPU</strong>, chạy song song, rồi lấy trung bình gradient &mdash; đúng một
                batch 2 triệu. Để tăng tốc, bạn dùng <strong>8 node &times; 8 GPU = 64
                GPU</strong>, và mỗi node giữ một bản của mô hình.
              </p>
              <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                <strong>Chi phí ước tính: </strong>64 GPU &times; $2/giờ &times; 24 giờ
                &times; 30 ngày &asymp; <strong>$92.000/tháng</strong>. Thật. Một đợt huấn
                luyện cơ bản thường mất 1&ndash;2 tháng.
              </div>
            </div>,
            <div key="s4" className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Warm-up + decay + checkpoint
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Learning rate không giữ nguyên suốt 10.000 iteration. Bạn <strong>warm-up</strong>{" "}
                trong 2.000 bước đầu (tăng dần từ 0 tới mức đỉnh), rồi <strong>cosine decay</strong>{" "}
                giảm dần về gần 0 ở bước 10.000. Mỗi 500 bước bạn lưu checkpoint &mdash; phòng
                khi cluster sập, còn chỗ để phục hồi.
              </p>
              <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                <strong>Bài học: </strong>nếu chạy 1 epoch, đừng lặp dữ liệu quá 1&ndash;2
                lần. Nghiên cứu 2023 cho thấy lặp quá 4 lần thì mô hình bắt đầu thuộc lòng
                thay vì học.
              </div>
            </div>,
            <div key="s5" className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Kiểm tra loss và đối chiếu scaling laws
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Sau 10.000 iteration (1 epoch), loss cuối rơi vào khoảng <strong>2,0
                &plusmn; 0,1</strong> &mdash; đúng với dự đoán của scaling laws. Nếu loss cao
                hơn dự đoán đáng kể, bạn đã chọn sai hyperparameter; nếu thấp bất thường, kiểm
                tra dữ liệu rò rỉ (data leakage). Đội trưởng đội huấn luyện thường dành cả
                đêm mở dashboard để ngồi nhìn đường cong loss.
              </p>
              <div className="rounded-lg bg-surface/50 border border-border p-3 text-xs text-foreground/85 leading-relaxed">
                <strong>Sau epoch đầu: </strong>đánh giá trên tập validation. Nếu mô hình
                còn tốt &mdash; kết thúc. Nếu muốn nhích thêm, thử thêm 0,3 epoch dữ liệu
                mới &mdash; rẻ và an toàn hơn lặp dữ liệu cũ.
              </div>
            </div>,
          ]}
        </StepReveal>

        {/* ── Phần 4: InlineChallenge — 24GB GPU thiếu 10× RAM ── */}
        <h3 className="text-base font-semibold text-foreground mb-2 mt-10">
          Thử thách: bạn là nhà nghiên cứu với GPU 24 GB
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Một tình huống có thật: bạn muốn huấn luyện mô hình 1 tỉ tham số với{" "}
          <strong>batch size 1 triệu token</strong>, nhưng bạn chỉ có một GPU 24 GB
          &mdash; thiếu <strong>~10 lần RAM</strong> so với nhu cầu (một batch 1 triệu token
          +optimizer states tiêu tốn khoảng 240 GB). Bạn chọn cách nào?
        </p>

        <InlineChallenge
          question="Bạn có GPU 24 GB, muốn batch hiệu dụng 1 triệu token, nhưng thiếu ~10× RAM. Giải pháp nào khả thi và giữ nguyên chất lượng?"
          options={[
            "Giảm batch size xuống 100 nghìn token — chấp nhận gradient nhiễu và chất lượng kém hơn",
            "Dùng gradient accumulation: chia thành 10 mini-batch 100 nghìn, gom gradient 10 bước rồi mới cập nhật — toán học tương đương batch 1 triệu, chỉ chậm hơn 10 lần",
            "Tắt optimizer để bớt RAM — chỉ chạy forward pass, bỏ backward",
            "Đợi GPU mới 240 GB ra mắt",
          ]}
          correct={1}
          explanation="Gradient accumulation là công cụ chuẩn trong hoàn cảnh này. Bạn chia batch mục tiêu thành nhiều mini-batch nhỏ, mỗi mini-batch tính gradient như bình thường nhưng chưa cập nhật trọng số — thay vào đó bạn cộng dồn gradient lại. Sau khi đủ 10 mini-batch, bạn mới chia trung bình và cập nhật một lần. Về mặt toán học, kết quả giống hệt như bạn đã chạy batch 1 triệu token một lần. Cái giá duy nhất là thời gian: bạn chạy chậm hơn 10 lần. Các đội sinh viên dùng kỹ thuật này mỗi ngày để huấn luyện mô hình lớn trên cụm GPU khiêm tốn."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn chạy xong 1 epoch trên 20 tỉ token, loss vẫn cao hơn dự đoán. Chọn chiến thuật tiếp theo có lợi nhất:"
            options={[
              "Chạy tiếp 5 epoch nữa trên cùng dữ liệu cũ",
              "Thu thập thêm 10 tỉ token mới (dữ liệu chưa thấy) và huấn luyện thêm 0,5 epoch",
              "Tăng batch size lên 10 triệu token để mỗi bước mạnh hơn",
              "Giảm learning rate về 0 ngay lập tức",
            ]}
            correct={1}
            explanation="Nghiên cứu 2023 cho thấy: 1 token dữ liệu mới quý hơn nhiều lần 1 token lặp lại. Chạy tiếp trên dữ liệu cũ 5 epoch là bẫy phổ biến — mô hình bắt đầu thuộc lòng thay vì học mẫu tổng quát. Tăng batch size không giải quyết vấn đề nền tảng về dữ liệu. Giảm learning rate về 0 sẽ khiến mô hình ngừng học. Lựa chọn đúng: mở rộng bộ dữ liệu — ngay cả chỉ thêm 10 tỉ token mới cũng đáng giá hơn nhiều chạy đi chạy lại dữ liệu cũ."
          />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Cộng sự đề xuất: 'Thay vì 1 epoch trên 20 tỉ token, hãy chạy 4 epoch trên 5 tỉ token để tiết kiệm chi phí thu thập dữ liệu'. Bạn phản biện thế nào?"
            options={[
              "Đồng ý vì tổng số token 'đi qua' mô hình vẫn là 20 tỉ",
              "Đồng ý vì 4 epoch cho mô hình 'nghĩ kỹ' hơn",
              "Phản đối: 5 tỉ token 4 epoch cho loss tệ hơn đáng kể so với 20 tỉ token 1 epoch — dữ liệu đa dạng mới là chìa khoá",
              "Phản đối vì 4 epoch làm overfit",
            ]}
            correct={2}
            explanation="Đây là bẫy tư duy cổ điển: nhìn 'tổng token đã xử lý' thì có vẻ bằng nhau, nhưng thực tế không phải. Scaling laws cho thấy rất rõ: mô hình học được mẫu tổng quát dựa trên đa dạng dữ liệu, không chỉ số lần nhìn. 5 tỉ token lặp 4 lần cho mô hình học thuộc 5 tỉ token đó, trong khi 20 tỉ token khác nhau cho mô hình học được bức tranh rộng hơn nhiều. Lựa chọn D (overfit) đúng một phần nhưng không phải lý do chính — lý do sâu hơn là đa dạng dữ liệu thiếu."
          />
        </div>

        <Callout variant="warning" title="Bẫy thường gặp: 'cứ lặp thêm sẽ tốt hơn'">
          Với dữ liệu thường (ảnh, âm thanh, bảng), nhiều epoch thực sự giúp mô hình học kỹ.
          Nhưng với <strong>dữ liệu văn bản quy mô internet</strong>, mỗi cuốn sách, mỗi bài
          báo là <em>không thể thay thế</em>. Lặp dữ liệu cũ sau 2&ndash;4 lần không giúp mô
          hình giỏi hơn &mdash; mà bắt đầu biến nó thành một cỗ máy ghi nhớ. Các lab AI hàng
          đầu đầu tư <strong>nhiều tiền vào thu thập và lọc dữ liệu mới</strong> hơn là
          &ldquo;ép&rdquo; mô hình học thêm trên dữ liệu cũ.
        </Callout>
      </ApplicationTryIt>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ METRICS ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="epochs-batches-in-gpt-training"
      >
        <Metric
          value="Chinchilla 70B (1,4 nghìn tỉ token, ~20 token/tham số) vượt Gopher 280B (300 tỉ token, ~1 token/tham số) — dữ liệu quan trọng hơn kích thước mô hình"
          sourceRef={1}
        />
        <Metric
          value="LLaMA 2 huấn luyện trên 2 nghìn tỉ token với global batch size 4 triệu token — khoảng 500.000 iteration trong 1 epoch"
          sourceRef={3}
        />
        <Metric
          value="Tỉ lệ tối ưu Chinchilla: khoảng 20 token dữ liệu cho mỗi tham số mô hình"
          sourceRef={4}
        />
        <Metric
          value="Lặp dữ liệu quá 4 epoch khiến giá trị biên giảm gần bằng 0 — ưu tiên dữ liệu mới hơn lặp dữ liệu cũ"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ COUNTERFACTUAL ━━━━━━━━━━━━━━━━━━━━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Epoch, batch và iteration"
        topicSlug="epochs-batches-in-gpt-training"
      >
        <p>
          Hãy tưởng tượng OpenAI quên quy luật Chinchilla và huấn luyện GPT-4 với tỉ lệ 1,7
          token/tham số như GPT-3. Với 1,8 nghìn tỉ tham số, họ sẽ chỉ dùng ~3 nghìn tỉ
          token &mdash; và kết quả sẽ là một mô hình đói dữ liệu trầm trọng, hiệu năng kém
          hơn nhiều so với phiên bản thực tế dùng 13 nghìn tỉ token. Toàn bộ khoản đầu tư
          hạ tầng có thể biến thành một mô hình tầm trung &mdash; mất hàng trăm triệu đô
          và lợi thế cạnh tranh.
        </p>
        <p>
          Theo chiều ngược lại, nếu không có khái niệm batch và gradient accumulation, các
          đội nhỏ sẽ không bao giờ huấn luyện được mô hình tỉ tham số &mdash; chỉ những
          công ty có cluster GPU khổng lồ mới tham gia cuộc chơi. Đây chính là lý do batch
          và epoch không phải chỉ là chi tiết kỹ thuật: chúng là <em>đòn bẩy dân chủ hoá</em>
          {" "}huấn luyện AI. Hiểu đúng epoch/batch là khác biệt giữa đốt hàng chục triệu
          đô-la và có một mô hình ra hồn.
        </p>
      </ApplicationCounterfactual>

      {/* ━━━━━━━━━━━━━━━━━━━━━━ BOTTOM SUMMARY + REDIRECT ━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-10">
        <MiniSummary
          title="4 điều rút ra từ cách GPT được huấn luyện"
          points={[
            "Epoch = một lượt duyệt toàn bộ dữ liệu. GPT-4 chỉ chạy 1–2 epoch vì 13 nghìn tỉ token đã quá đủ cho một lượt.",
            "Batch = một khối dữ liệu xử lý cùng lúc. LLaMA 2 dùng batch 4 triệu token → ~500 nghìn iteration cho 1 epoch.",
            "Tỉ lệ vàng Chinchilla: ~20 token dữ liệu cho mỗi tham số. Thiếu thì mô hình đói; thừa thì cần lặp và dễ thuộc lòng.",
            "Hết RAM GPU? Dùng gradient accumulation: chia thành mini-batch, gom gradient rồi mới cập nhật. Toán học tương đương, chỉ chậm hơn.",
          ]}
        />
        <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-foreground/85 leading-relaxed">
          <p>
            Muốn hiểu cặn kẽ vì sao một epoch chia thành nhiều batch, và công thức tính số
            iteration chính xác? Xem bài lý thuyết{" "}
            <TopicLink slug="epochs-batches">Epoch, batch và iteration</TopicLink>{" "}
            &mdash; nơi chúng ta mổ xẻ cơ chế từng bước cho một mạng nơ-ron nhỏ, trước khi
            áp dụng cho mô hình khổng lồ như GPT.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center text-xs text-muted gap-2">
          <Cpu size={12} />
          <span>
            GPT-4: 13 nghìn tỉ token, 2 tháng, hàng nghìn GPU &mdash; tất cả được điều khiển
            bởi hai khái niệm đơn giản: epoch và batch.
          </span>
        </div>
      </section>
    </ApplicationLayout>
  );
}
