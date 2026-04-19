"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  AudioLines,
  Brain,
  MessageSquare,
  CheckCircle2,
  Volume2,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  StepReveal,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "neural-network-overview-in-voice-assistants",
  title: "Neural Networks in Voice Assistants",
  titleVi: "Mạng nơ-ron trong trợ lý giọng nói",
  description:
    'Khi bạn nói "Hey Siri, đặt hẹn giờ 10 phút" — giọng của bạn đi qua mạng nơ-ron sâu nhiều lần để biến thành hành động. Xem từng chặng của hành trình đó.',
  category: "neural-fundamentals",
  tags: ["neural-network", "speech-recognition", "application"],
  difficulty: "beginner",
  relatedSlugs: ["neural-network-overview"],
  vizType: "interactive",
  applicationOf: "neural-network-overview",
  featuredApp: {
    name: "Google Assistant",
    productFeature: "Nhận dạng giọng nói",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Hey Siri: An On-device DNN-powered Voice Trigger",
      publisher: "Apple Machine Learning Research",
      url: "https://machinelearning.apple.com/research/hey-siri",
      date: "2017-10",
      kind: "engineering-blog",
    },
    {
      title: "Deep Learning for Siri's Voice: On-device Deep Mixture Density Networks",
      publisher: "Apple Machine Learning Research",
      url: "https://machinelearning.apple.com/research/siri-voices",
      date: "2017-08",
      kind: "engineering-blog",
    },
    {
      title: "The Neural Networks Behind Google Voice Transcription",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/the-neural-networks-behind-google-voice-transcription/",
      date: "2015-09",
      kind: "engineering-blog",
    },
    {
      title: "Improving End-to-End Models for Speech Recognition",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/improving-end-to-end-models-for-speech-recognition/",
      date: "2019-01",
      kind: "engineering-blog",
    },
    {
      title: "Google's Speech Recognition Technology Now Has a 4.9% Word Error Rate",
      publisher: "VentureBeat",
      url: "https://venturebeat.com/business/googles-speech-recognition-technology-now-has-a-4-9-word-error-rate",
      date: "2017-05",
      kind: "news",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   HINH MINH HOẠ — Sóng âm → Spectrogram → Đặc trưng → Phân loại
   ═══════════════════════════════════════════════════════════════════ */

type PipelineStage =
  | "waveform"
  | "spectrogram"
  | "features"
  | "phoneme"
  | "word"
  | "action";

interface StageConfig {
  key: PipelineStage;
  label: string;
  icon: typeof Mic;
  color: string;
  bgTint: string;
  summary: string;
  detail: string;
}

const STAGES: StageConfig[] = [
  {
    key: "waveform",
    label: "Sóng âm",
    icon: Mic,
    color: "#3b82f6",
    bgTint: "bg-blue-50 dark:bg-blue-900/20",
    summary: "Micro thu sóng áp suất, lấy mẫu 16.000 lần/giây.",
    detail:
      "Giọng nói là các dao động không khí. Micro chuyển chúng thành một dãy số — mỗi số đo áp suất tại một khoảnh khắc. Trong một giây có 16.000 số.",
  },
  {
    key: "spectrogram",
    label: "Phổ tần số",
    icon: AudioLines,
    color: "#8b5cf6",
    bgTint: "bg-violet-50 dark:bg-violet-900/20",
    summary: "Chia thành khung 10 mili-giây, tính phổ tần số mỗi khung.",
    detail:
      "Máy tách sóng thành từng miếng 10 mili-giây, rồi hỏi mỗi miếng: âm trầm nhiều không? âm cao nhiều không? Mỗi miếng ra một ảnh nhỏ như một lát cắt nhiệt.",
  },
  {
    key: "features",
    label: "Đặc trưng",
    icon: Volume2,
    color: "#f59e0b",
    bgTint: "bg-amber-50 dark:bg-amber-900/20",
    summary: "Rút gọn ảnh nhiệt thành vài chục con số mô tả tiếng.",
    detail:
      "Ảnh nhiệt vẫn quá chi tiết. Thuật toán chọn 40–80 con số quan trọng nhất — đủ để phân biệt âm /a/, /b/, /ngh/ mà không cần hình ảnh đầy đủ.",
  },
  {
    key: "phoneme",
    label: "Mạng nơ-ron",
    icon: Brain,
    color: "#10b981",
    bgTint: "bg-emerald-50 dark:bg-emerald-900/20",
    summary: "Mạng nhiều lớp đoán xem mỗi khung là âm vị nào.",
    detail:
      "Đây là trái tim của hệ thống. Mạng nơ-ron sâu nhận các con số đặc trưng, lan truyền qua hàng chục lớp, và ra xác suất cho từng âm vị: /h/, /e/, /y/... Mỗi lớp học một cấp độ trừu tượng hơn.",
  },
  {
    key: "word",
    label: "Ghép từ",
    icon: MessageSquare,
    color: "#06b6d4",
    bgTint: "bg-cyan-50 dark:bg-cyan-900/20",
    summary: "Một mạng khác ghép các âm vị thành từ tiếng Việt.",
    detail:
      "Mô hình ngôn ngữ biết &ldquo;h + ê-i&rdquo; có thể là &ldquo;Hey&rdquo;, &ldquo;s + i + ri&rdquo; có thể là &ldquo;Siri&rdquo;. Nó chọn chuỗi từ hợp lý nhất, cả về mặt ngữ nghĩa lẫn phát âm.",
  },
  {
    key: "action",
    label: "Hành động",
    icon: CheckCircle2,
    color: "#ef4444",
    bgTint: "bg-rose-50 dark:bg-rose-900/20",
    summary: "Mạng thứ ba phân loại ý định và kích hoạt API phù hợp.",
    detail:
      "Khi đã có văn bản, mạng NLU (hiểu ngôn ngữ) tìm ra &ldquo;ý định&rdquo; — ví dụ đặt_hẹn_giờ — và các &ldquo;tham số&rdquo; — 10 phút. Rồi nó gọi API bình thường trên điện thoại.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   DEMO: Pipeline "Hey Siri, đặt hẹn giờ 10 phút"
   Người học click từng chặng để xem chi tiết
   ═══════════════════════════════════════════════════════════════════ */

function PipelineExplorer() {
  const [active, setActive] = useState<PipelineStage>("waveform");

  const activeStage = useMemo(
    () => STAGES.find((s) => s.key === active) ?? STAGES[0],
    [active],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Bạn nói <strong>&ldquo;Hey Siri, đặt hẹn giờ 10 phút&rdquo;</strong> —
        giọng của bạn đi qua sáu chặng. Bấm từng chặng để xem nó làm gì.
      </p>

      {/* Thanh pipeline horizontal */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex items-stretch gap-0 min-w-full">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = stage.key === active;
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-[110px]">
                <button
                  type="button"
                  onClick={() => setActive(stage.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? "shadow-md scale-105"
                      : "border-border bg-card hover:border-accent/40 opacity-75"
                  }`}
                  style={{
                    borderColor: isActive ? stage.color : undefined,
                    backgroundColor: isActive ? stage.color + "15" : undefined,
                  }}
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: stage.color + "20" }}
                  >
                    <Icon size={17} style={{ color: stage.color }} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight"
                    style={{ color: isActive ? stage.color : "var(--text-muted)" }}
                  >
                    Chặng {i + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold text-center ${
                      isActive ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {stage.label}
                  </span>
                </button>
                {i < STAGES.length - 1 && (
                  <ChevronRight
                    size={14}
                    className="shrink-0 mx-0.5 text-muted"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chi tiết chặng được chọn */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className={`rounded-xl border-2 p-5 ${activeStage.bgTint}`}
          style={{ borderColor: activeStage.color + "80" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <activeStage.icon size={18} style={{ color: activeStage.color }} />
            <h4
              className="text-base font-semibold"
              style={{ color: activeStage.color }}
            >
              {activeStage.label}
            </h4>
          </div>
          <p className="text-sm font-medium text-foreground mb-2">
            {activeStage.summary}
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {activeStage.detail}
          </p>

          <div className="mt-4">
            <StageVisual stage={active} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Mỗi chặng có một hình minh hoạ SVG ngắn
   ═══════════════════════════════════════════════════════════════════ */

function StageVisual({ stage }: { stage: PipelineStage }) {
  if (stage === "waveform") return <WaveformVisual />;
  if (stage === "spectrogram") return <SpectrogramVisual />;
  if (stage === "features") return <FeaturesVisual />;
  if (stage === "phoneme") return <PhonemeVisual />;
  if (stage === "word") return <WordVisual />;
  return <ActionVisual />;
}

function WaveformVisual() {
  // Vẽ sóng âm giả lập
  const points: string[] = [];
  for (let x = 0; x <= 320; x += 2) {
    const y =
      60 +
      18 * Math.sin(x / 10) +
      10 * Math.sin(x / 3 + 2) +
      5 * Math.sin(x / 1.5);
    points.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-2">
        Một giây giọng nói — 16.000 con số đo áp suất không khí
      </p>
      <svg viewBox="0 0 320 120" className="w-full">
        <line x1={0} y1={60} x2={320} y2={60} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="2 3" />
        <polyline points={points.join(" ")} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
        <text x={4} y={115} fontSize={9} fill="#94a3b8">0 giây</text>
        <text x={300} y={115} fontSize={9} fill="#94a3b8" textAnchor="end">1 giây</text>
      </svg>
    </div>
  );
}

function SpectrogramVisual() {
  // Lưới các ô nhỏ, tô màu ngẫu nhiên mô phỏng spectrogram
  const cols = 40;
  const rows = 16;
  const cells: { x: number; y: number; v: number }[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // Mô phỏng hai "đốm" sáng ở các tần số thấp và một dải giọng
      const base = Math.exp(-((j - (i < 20 ? 5 : 9)) ** 2) / 6);
      const variation = 0.3 + 0.7 * Math.sin(i * 0.7 + j * 0.5);
      const v = Math.max(0, Math.min(1, base * variation));
      cells.push({ x: i, y: j, v });
    }
  }
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold mb-2">
        Phổ tần số — chia thành khung 10ms, mỗi khung một cột màu
      </p>
      <svg viewBox="0 0 320 130" className="w-full">
        {cells.map((c, idx) => (
          <rect
            key={idx}
            x={c.x * 7.5 + 10}
            y={115 - (c.y + 1) * 6.5}
            width={7}
            height={6}
            fill="#8b5cf6"
            opacity={c.v}
          />
        ))}
        <text x={4} y={125} fontSize={9} fill="#94a3b8">Thấp</text>
        <text x={312} y={8} fontSize={9} fill="#94a3b8" textAnchor="end">Cao</text>
      </svg>
    </div>
  );
}

function FeaturesVisual() {
  // Hiển thị một vector feature ~40 số
  const values = Array.from({ length: 40 }, (_, i) =>
    0.5 + 0.5 * Math.sin(i * 0.4) * Math.cos(i * 0.23),
  );
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-2">
        Vector đặc trưng — 40 con số mô tả &ldquo;hình dạng&rdquo; âm thanh
      </p>
      <div className="flex items-end gap-[2px] h-24">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-amber-500"
            style={{ height: `${Math.abs(v) * 90}%`, opacity: 0.6 + v * 0.4 }}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted mt-1 italic">
        Mỗi cột = một đặc trưng. Hai khung âm thanh cùng phát âm &ldquo;a&rdquo;
        thì hai vector này sẽ na ná nhau.
      </p>
    </div>
  );
}

function PhonemeVisual() {
  // Mạng nơ-ron đơn giản: 3 → 4 → 4 → 3 nơ-ron
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-2">
        Mạng nơ-ron sâu — nhiều lớp chồng nhau đoán âm vị
      </p>
      <svg viewBox="0 0 340 160" className="w-full">
        {/* 4 lớp: 3-4-4-3 */}
        {[
          { x: 40, size: 3, color: "#f59e0b", label: "Vector đặc trưng" },
          { x: 130, size: 4, color: "#10b981", label: "Lớp ẩn 1" },
          { x: 220, size: 4, color: "#10b981", label: "Lớp ẩn 2" },
          { x: 310, size: 3, color: "#8b5cf6", label: "Âm vị" },
        ].map((layer, layerIdx, layers) => {
          const nodes: { x: number; y: number }[] = [];
          const spacing = 30;
          const startY = 80 - ((layer.size - 1) * spacing) / 2;
          for (let i = 0; i < layer.size; i++) {
            nodes.push({ x: layer.x, y: startY + i * spacing });
          }
          const nextLayer = layers[layerIdx + 1];
          return (
            <g key={`L-${layerIdx}`}>
              {/* Dây sang lớp kế */}
              {nextLayer &&
                nodes.map((n, ni) => {
                  const nextSpacing = 30;
                  const nextStart = 80 - ((nextLayer.size - 1) * nextSpacing) / 2;
                  return Array.from({ length: nextLayer.size }, (_, nj) => (
                    <line
                      key={`w-${layerIdx}-${ni}-${nj}`}
                      x1={n.x}
                      y1={n.y}
                      x2={nextLayer.x}
                      y2={nextStart + nj * nextSpacing}
                      stroke="#94a3b8"
                      strokeWidth={0.6}
                      opacity={0.45}
                    />
                  ));
                })}
              {/* Nơ-ron */}
              {nodes.map((n, ni) => (
                <circle
                  key={`n-${layerIdx}-${ni}`}
                  cx={n.x}
                  cy={n.y}
                  r={9}
                  fill={layer.color}
                  opacity={0.85}
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
              <text
                x={layer.x}
                y={155}
                textAnchor="middle"
                fontSize={9}
                fill="#64748b"
              >
                {layer.label}
              </text>
            </g>
          );
        })}
        {/* Nhãn âm vị đầu ra */}
        <text x={330} y={52} fontSize={10} fill="#8b5cf6" fontWeight="bold">/h/</text>
        <text x={330} y={82} fontSize={10} fill="#8b5cf6" fontWeight="bold">/eɪ/</text>
        <text x={330} y={112} fontSize={10} fill="#8b5cf6" fontWeight="bold">/s/</text>
      </svg>
    </div>
  );
}

function WordVisual() {
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-cyan-700 dark:text-cyan-300 font-semibold mb-2">
        Từ âm vị thành từ — mô hình ngôn ngữ chọn chuỗi hợp lý
      </p>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="rounded-md bg-violet-500/15 px-2 py-1 font-mono text-violet-700 dark:text-violet-300">
          /h/ /eɪ/ /s/ /i/ /r/ /i/
        </span>
        <ChevronRight size={14} className="text-muted" />
        <span className="rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-cyan-700 dark:text-cyan-300">
          &ldquo;Hey Siri&rdquo;
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="rounded-md bg-violet-500/15 px-2 py-1 font-mono text-violet-700 dark:text-violet-300">
          /d/ /a/ /t/ /h/ /e/ /n/ /j/ /o/
        </span>
        <ChevronRight size={14} className="text-muted" />
        <span className="rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-cyan-700 dark:text-cyan-300">
          &ldquo;đặt hẹn giờ&rdquo;
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="rounded-md bg-violet-500/15 px-2 py-1 font-mono text-violet-700 dark:text-violet-300">
          /m/ /ɨ/ /ɨ/ /i/ /p/ /h/ /u/ /t/
        </span>
        <ChevronRight size={14} className="text-muted" />
        <span className="rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-cyan-700 dark:text-cyan-300">
          &ldquo;mười phút&rdquo;
        </span>
      </div>
      <p className="text-[10px] text-muted mt-1 italic">
        Mô hình ngôn ngữ biết &ldquo;mười phút&rdquo; hợp lý hơn &ldquo;mười
        phúc&rdquo; vì nó đã đọc hàng tỷ câu tiếng Việt.
      </p>
    </div>
  );
}

function ActionVisual() {
  return (
    <div className="rounded-lg bg-white/40 dark:bg-black/20 border border-border p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-rose-700 dark:text-rose-300 font-semibold mb-2">
        Văn bản → ý định → API
      </p>
      <div className="flex flex-col gap-2 text-xs">
        <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-2">
          <span className="font-semibold text-cyan-800 dark:text-cyan-200">Văn bản:</span>{" "}
          <span className="text-foreground">&ldquo;đặt hẹn giờ 10 phút&rdquo;</span>
        </div>
        <ChevronRight size={14} className="mx-auto text-muted rotate-90" />
        <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2 space-y-1">
          <div>
            <span className="font-semibold text-purple-800 dark:text-purple-200">Ý định:</span>{" "}
            <code className="bg-purple-200 dark:bg-purple-800/50 px-1 rounded">
              đặt_hẹn_giờ
            </code>
          </div>
          <div>
            <span className="font-semibold text-purple-800 dark:text-purple-200">Tham số:</span>{" "}
            <code className="bg-purple-200 dark:bg-purple-800/50 px-1 rounded">
              thời_lượng = 10 phút
            </code>
          </div>
        </div>
        <ChevronRight size={14} className="mx-auto text-muted rotate-90" />
        <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
          <span className="font-semibold text-emerald-800 dark:text-emerald-200">Hành động:</span>{" "}
          <code className="bg-emerald-200 dark:bg-emerald-800/50 px-1 rounded">
            hẹn_giờ.tạo(thời_lượng=600s)
          </code>
        </div>
        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2 text-center">
          <Clock size={12} className="inline mr-1 text-amber-700 dark:text-amber-300" />
          <span className="text-amber-800 dark:text-amber-200 font-semibold">
            Siri: &ldquo;Đã đặt hẹn giờ 10 phút.&rdquo;
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEEPEN — StepReveal: theo một câu thật đi qua các lớp
   ═══════════════════════════════════════════════════════════════════ */

function QueryJourney() {
  return (
    <StepReveal
      labels={[
        "Bước 1: Thu âm",
        "Bước 2: Phổ tần",
        "Bước 3: Âm vị",
        "Bước 4: Từ",
        "Bước 5: Ý định",
        "Bước 6: Phản hồi",
      ]}
    >
      {[
        <div key="j1" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Bạn nói, micro ghi
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn nói &ldquo;<strong>Đặt hẹn giờ 10 phút</strong>&rdquo;. Micro
            trên điện thoại thu dao động không khí, chuyển thành{" "}
            <strong>32.000 con số</strong> (khoảng 2 giây × 16.000 mẫu/giây).
            Mỗi con số là áp suất không khí tại một khoảnh khắc.
          </p>
          <div className="rounded-lg bg-card border border-border p-2 text-xs font-mono text-muted">
            <span className="text-blue-600 dark:text-blue-400">[</span>
            0.003, -0.017, 0.042, -0.081, 0.156, 0.124, ...(31.994 số){" "}
            <span className="text-blue-600 dark:text-blue-400">]</span>
          </div>
        </div>,
        <div key="j2" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white text-xs font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Chuyển sang &ldquo;ảnh nhiệt&rdquo; phổ tần
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            32.000 con số quá nhiều và quá thô. Máy chia chúng thành{" "}
            <strong>200 khung</strong> (mỗi khung 10 mili-giây), rồi tính phổ
            tần số cho mỗi khung. Kết quả: <strong>200 cột màu</strong> — mỗi
            cột cho biết ở khoảnh khắc đó có âm trầm nhiều hay âm cao nhiều.
          </p>
          <div className="flex items-end gap-0.5 h-12">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-violet-500"
                style={{
                  height: `${20 + 70 * Math.abs(Math.sin(i * 0.8))}%`,
                  opacity: 0.4 + 0.6 * Math.abs(Math.cos(i * 0.3)),
                }}
              />
            ))}
          </div>
        </div>,
        <div key="j3" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Mạng nơ-ron sâu nhận dạng âm vị
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đây là trái tim. Mạng nơ-ron <strong>hàng chục lớp</strong> nhận 200
            cột phổ, lan truyền qua các lớp ẩn, và ra xác suất cho từng âm vị
            (khoảng 40 âm vị tiếng Việt). Mỗi lớp học một cấp độ trừu tượng
            khác nhau.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded bg-emerald-500/15 border border-emerald-400/40 p-2 text-center">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                /đ/
              </div>
              <div className="text-[10px] text-muted">97%</div>
            </div>
            <div className="rounded bg-emerald-500/15 border border-emerald-400/40 p-2 text-center">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                /a/
              </div>
              <div className="text-[10px] text-muted">94%</div>
            </div>
            <div className="rounded bg-emerald-500/15 border border-emerald-400/40 p-2 text-center">
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                /t/
              </div>
              <div className="text-[10px] text-muted">91%</div>
            </div>
            <div className="rounded bg-card border border-border p-2 text-center">
              <div className="font-mono text-muted">... (tiếp)</div>
              <div className="text-[10px] text-muted">200 khung</div>
            </div>
          </div>
        </div>,
        <div key="j4" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Ghép âm vị thành từ
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Chuỗi âm vị vẫn khó đọc. Một mạng khác (mô hình ngôn ngữ) đã đọc
            hàng tỷ câu tiếng Việt, biết cách ghép âm vị thành từ có nghĩa.
            Nó loại &ldquo;đạt hẹn giò&rdquo; (vô nghĩa) và chọn{" "}
            <strong>&ldquo;đặt hẹn giờ 10 phút&rdquo;</strong>.
          </p>
          <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-3 text-sm">
            <span className="font-semibold text-cyan-800 dark:text-cyan-200">
              Văn bản:
            </span>{" "}
            <span className="text-foreground font-medium">
              &ldquo;đặt hẹn giờ 10 phút&rdquo;
            </span>
          </div>
        </div>,
        <div key="j5" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">
              5
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Mạng NLU hiểu ý định
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Một mạng thứ ba — mạng hiểu ngôn ngữ (NLU) — đọc văn bản và trả
            lời hai câu hỏi: <em>Người dùng muốn làm gì?</em> (ý định) và{" "}
            <em>Cần tham số gì?</em>. Kết quả là một cấu trúc dữ liệu mà phần
            mềm truyền thống đọc được.
          </p>
          <div className="rounded-lg bg-card border border-border p-3 text-xs font-mono">
            <div>
              <span className="text-purple-700 dark:text-purple-300">ý_định:</span>{" "}
              <span className="text-foreground">đặt_hẹn_giờ</span>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">thời_lượng:</span>{" "}
              <span className="text-foreground">600 giây</span>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">độ_tin_cậy:</span>{" "}
              <span className="text-foreground">0.98</span>
            </div>
          </div>
        </div>,
        <div key="j6" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
              6
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Thực thi và trả lời
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Phần mềm thường (không phải mạng nơ-ron) nhận cấu trúc trên, gọi
            API hẹn giờ với thời lượng 600 giây, rồi sinh câu trả lời. Cuối
            cùng, <strong>một mạng nơ-ron nữa</strong> (TTS — văn bản thành
            giọng nói) biến câu trả lời thành âm thanh tự nhiên phát ra loa.
          </p>
          <div className="rounded-lg bg-rose-100 dark:bg-rose-900/30 p-3 text-sm flex items-center gap-2">
            <Volume2 size={14} className="text-rose-700 dark:text-rose-300" />
            <span className="text-rose-800 dark:text-rose-200 font-medium">
              &ldquo;Đã đặt hẹn giờ 10 phút.&rdquo;
            </span>
          </div>
          <p className="text-[11px] text-muted italic">
            Toàn bộ sáu chặng — thường xong trong dưới 500 mili-giây. Bạn
            thường không nhận ra.
          </p>
        </div>,
      ]}
    </StepReveal>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QUIZ — 4 câu MCQ
   ═══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Khi bạn nói &ldquo;Hey Siri, đặt hẹn giờ 10 phút&rdquo;, điện thoại dùng mấy mạng nơ-ron để hoàn thành yêu cầu?",
    options: [
      "Chỉ một mạng duy nhất làm hết",
      "Ít nhất ba mạng khác nhau: một mạng nhận dạng âm thanh, một mạng hiểu ý định, một mạng tạo giọng trả lời",
      "Không cần mạng nơ-ron nào — chỉ cần khớp mẫu đơn giản",
      "Mạng nơ-ron chỉ làm phần phát lại giọng",
    ],
    correct: 1,
    explanation:
      "Một trợ lý giọng nói hoàn chỉnh cần nhiều mạng: (1) mạng biến âm thanh thành văn bản, (2) mạng hiểu ý định và tham số từ văn bản, (3) mạng biến câu trả lời thành giọng nói. Mỗi mạng chuyên một việc, nối tiếp nhau trong vài trăm mili-giây.",
  },
  {
    question:
      "Tại sao không đưa thẳng sóng âm 16.000 số/giây vào mạng nơ-ron mà phải biến thành phổ tần số trước?",
    options: [
      "Vì mạng nơ-ron không biết xử lý số thập phân",
      "Vì con số sóng thô quá nhiều và thiếu cấu trúc dễ nhận biết. Phổ tần số nén lại thành các 'ảnh' mà mạng dễ học hơn",
      "Vì quy định pháp luật yêu cầu",
      "Không có lý do, đây là lựa chọn tùy ý",
    ],
    correct: 1,
    explanation:
      "Phổ tần số giữ lại thông tin quan trọng (âm trầm, âm cao, biên độ) và loại bỏ phần thừa. Điều này giúp mạng nơ-ron học nhanh hơn với ít dữ liệu hơn. Gần đây có mô hình end-to-end đọc trực tiếp sóng âm, nhưng chúng cần nhiều dữ liệu và tính toán hơn rất nhiều.",
  },
  {
    question:
      "Trước 2012, tỉ lệ lỗi từ của hệ thống nhận dạng giọng nói là trên 23%. Sau khi Google chuyển sang mạng nơ-ron sâu, con số này là bao nhiêu?",
    options: [
      "Vẫn khoảng 23%, không thay đổi đáng kể",
      "Giảm xuống dưới 5%, gần ngang với khả năng nghe của con người",
      "Tăng lên hơn 30%",
      "Không đo được",
    ],
    correct: 1,
    explanation:
      "Google công bố năm 2017: tỉ lệ lỗi từ (word error rate) giảm từ 23% (2013) xuống 4,9% (2017). Đây là lý do trợ lý giọng nói đột ngột trở nên &ldquo;dùng được&rdquo; và xuất hiện khắp nơi: iPhone, loa thông minh, xe hơi.",
  },
  {
    question:
      "Apple cho mạng nhận dạng &ldquo;Hey Siri&rdquo; chạy trực tiếp trên chip điện thoại (Neural Engine), không gửi lên máy chủ. Vì sao?",
    options: [
      "Để tiết kiệm điện cho máy chủ",
      "Để mạng ngừng hoạt động khi mất mạng",
      "Để giảm độ trễ (dưới 200ms) và giữ giọng người dùng ở trên máy — không cần gửi âm thanh lên mạng",
      "Vì mạng nơ-ron không chạy được trên máy chủ",
    ],
    correct: 2,
    explanation:
      "Chạy trên thiết bị có hai lợi ích: (1) độ trễ thấp — Siri phản hồi tức thì khi nghe &ldquo;Hey Siri&rdquo;, (2) riêng tư — âm thanh không rời khỏi điện thoại cho đến khi xác nhận đúng lệnh gọi. Đây là lý do các trợ lý thế hệ mới đầu tư vào chip chuyên biệt cho mạng nơ-ron.",
  },
  {
    question:
      "Nếu không có mạng nơ-ron sâu, trợ lý giọng nói dùng mô hình thống kê truyền thống. Điểm yếu lớn nhất của mô hình đó là gì?",
    options: [
      "Chạy quá nhanh, khó debug",
      "Mỗi khung âm thanh được xử lý gần như độc lập, không nắm được ngữ cảnh dài — dẫn đến tỉ lệ lỗi cao",
      "Không thể chạy trên máy tính",
      "Chỉ hoạt động với tiếng Anh",
    ],
    correct: 1,
    explanation:
      "HMM/GMM truyền thống xử lý từng khung 10ms tương đối độc lập. Nhưng giọng nói phụ thuộc mạnh vào ngữ cảnh — âm /t/ phát sau /s/ khác /t/ phát sau /a/. Mạng nơ-ron sâu, đặc biệt là LSTM và Transformer, giữ được ngữ cảnh dài nên đoán chính xác hơn nhiều.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ═══════════════════════════════════════════════════════════════════ */

export default function NeuralNetworkOverviewInVoiceAssistants() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Mạng nơ-ron"
    >
      {/* ─── HERO ─── */}
      <ApplicationHero
        parentTitleVi="Mạng nơ-ron"
        topicSlug={metadata.slug}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Mic size={22} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  &ldquo;Hey Siri&rdquo; — &ldquo;OK Google&rdquo;
                </p>
                <p className="text-xs text-muted">
                  Giọng của bạn → văn bản → hành động. Mạng nơ-ron ở mọi chặng.
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Bạn nói vài từ — chỉ trong vài trăm mili-giây, điện thoại đã hiểu
              và phản hồi. Đằng sau sự nhanh nhạy đó là hàng loạt{" "}
              <strong>mạng nơ-ron sâu</strong> nối tiếp nhau, mỗi mạng làm một
              việc: nghe âm, hiểu nghĩa, tạo giọng trả lời.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border-l-4 border-l-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-bold mb-1">
                Trước 2012
              </p>
              <p className="text-xs text-foreground/85 leading-snug">
                Tỉ lệ lỗi từ trên 23% — cứ bốn từ sai một. Dùng mô hình thống
                kê HMM/GMM.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-bold mb-1">
                Sau 2015
              </p>
              <p className="text-xs text-foreground/85 leading-snug">
                Chuyển sang mạng nơ-ron sâu: tỉ lệ lỗi giảm xuống 4,9% — gần
                ngang khả năng của con người.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-bold mb-1">
                Hôm nay
              </p>
              <p className="text-xs text-foreground/85 leading-snug">
                Hơn 4,2 tỷ thiết bị có trợ lý giọng nói. Đã trở thành công
                cụ hàng ngày.
              </p>
            </div>
          </div>
        </div>
      </ApplicationHero>

      {/* ─── PROBLEM ─── */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <div className="space-y-3">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Biến giọng nói của một người bất kỳ thành văn bản chính xác{" "}
            <strong>trong thời gian thực</strong> là một bài toán cực khó:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Giọng không ai giống ai
              </p>
              <p className="text-xs text-muted leading-snug">
                Bắc, Trung, Nam, nam, nữ, già, trẻ — cùng một từ có thể phát
                âm theo hàng chục cách.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Tiếng ồn ở khắp nơi
              </p>
              <p className="text-xs text-muted leading-snug">
                Xe máy, TV, tiếng trẻ con — hệ thống phải &ldquo;gạn đục&rdquo;
                lấy đúng giọng nói.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Tốc độ khác nhau
              </p>
              <p className="text-xs text-muted leading-snug">
                Có người nói chậm, có người nói rất nhanh. Hệ thống phải theo
                kịp mọi nhịp.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Độ trễ dưới 1 giây
              </p>
              <p className="text-xs text-muted leading-snug">
                Quá chậm là người dùng bỏ cuộc. Cần cân giữa chính xác và tốc độ.
              </p>
            </div>
          </div>

          <Callout variant="warning" title="Vì sao mô hình cổ điển thất bại">
            Trước 2012 người ta dùng HMM (mô hình Markov ẩn) kết hợp GMM (mô
            hình hỗn hợp Gauss). Vấn đề: cả hai xử lý mỗi khung âm thanh gần
            như độc lập, không giữ được ngữ cảnh dài. Kết quả: tỉ lệ lỗi hơn
            23% — mức khó dùng hàng ngày.
          </Callout>
        </div>
      </ApplicationProblem>

      {/* ─── MECHANISM ─── */}
      <ApplicationMechanism
        parentTitleVi="Mạng nơ-ron"
        topicSlug={metadata.slug}
      >
        <Beat step={1}>
          <div className="space-y-2">
            <p>
              <strong>Thu âm và chuyển thành phổ tần số.</strong>
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Micro lấy mẫu 16.000 lần/giây. Thuật toán chia thành khung 10ms,
              tính phổ tần số — ra một &ldquo;ảnh nhiệt&rdquo; nhỏ cho mỗi
              khung.
            </p>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                Kết quả:
              </span>{" "}
              một ma trận phổ — đầu vào cho mạng nơ-ron.
            </div>
          </div>
        </Beat>

        <Beat step={2}>
          <div className="space-y-2">
            <p>
              <strong>Mạng nơ-ron sâu phân loại âm vị.</strong>
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Ma trận phổ đi qua một mạng nhiều lớp. Google dùng LSTM (bộ nhớ
              dài-ngắn hạn) để giữ ngữ cảnh. Apple dùng DNN tối ưu cho chip
              Neural Engine trên iPhone. Đầu ra: xác suất cho từng{" "}
              <em>âm vị</em> (đơn vị âm nhỏ nhất).
            </p>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                Trái tim:
              </span>{" "}
              đây là nơi mạng nơ-ron đóng vai trò quan trọng nhất. Trước khi có
              nó, tỉ lệ lỗi cao. Có nó, tỉ lệ lỗi giảm mạnh.
            </div>
          </div>
        </Beat>

        <Beat step={3}>
          <div className="space-y-2">
            <p>
              <strong>Giải mã chuỗi âm vị thành chuỗi từ.</strong>
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Mạng ra xác suất cho từng âm vị, nhưng âm vị chưa phải từ. Bộ
              giải mã dùng thuật toán <em>beam search</em> — giữ nhiều giả
              thuyết tốt nhất — kết hợp mô hình ngôn ngữ (cũng là một mạng
              nơ-ron) để chọn chuỗi từ hợp lý nhất.
            </p>
            <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 p-2 text-xs">
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                Ví dụ:
              </span>{" "}
              &ldquo;đặt hẹn giờ&rdquo; thắng &ldquo;đạt hẹn giò&rdquo; vì mô
              hình ngôn ngữ đã đọc hàng tỷ câu tiếng Việt.
            </div>
          </div>
        </Beat>

        <Beat step={4}>
          <div className="space-y-2">
            <p>
              <strong>Hiểu ý định và thực thi.</strong>
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Văn bản đi qua một mạng NLU (hiểu ngôn ngữ tự nhiên) để tìm{" "}
              <em>ý định</em> (&ldquo;đặt_hẹn_giờ&rdquo;) và các <em>tham số</em>{" "}
              (&ldquo;10 phút&rdquo;). Phần mềm thường nhận cấu trúc đó, gọi
              API, rồi trả lời bằng giọng — tất cả trong dưới nửa giây.
            </p>
          </div>
        </Beat>
      </ApplicationMechanism>

      {/* ─── TRY IT ─── */}
      <ApplicationTryIt topicSlug={metadata.slug}>
        <div className="space-y-5">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Bấm qua từng chặng để thấy giọng của bạn biến đổi thế nào trước khi
            trở thành hành động.
          </p>
          <PipelineExplorer />

          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Theo một câu thật đi qua hệ thống
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Giả lập toàn bộ hành trình của câu{" "}
              <strong>&ldquo;Đặt hẹn giờ 10 phút&rdquo;</strong> — bấm{" "}
              <em>Tiếp tục</em> để mở từng bước và xem từng lớp của pipeline
              biến đổi dữ liệu như thế nào.
            </p>
            <QueryJourney />
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Thử thách kiểm tra hiểu biết
            </h3>
            <InlineChallenge
              question="Siri nhận ra từ 'Hey Siri' ngay cả khi điện thoại nằm xa, tiếng ồn xung quanh nhiều. Điều gì quan trọng nhất giúp làm được chuyện đó?"
              options={[
                "Micro đặc biệt to hơn điện thoại thường",
                "Mạng nơ-ron chạy trực tiếp trên chip Neural Engine, luôn nghe và học trước cả triệu mẫu giọng nói trong nhiều hoàn cảnh",
                "Siri gọi về máy chủ Apple cho mỗi âm thanh nghe được",
                "Siri chỉ hoạt động khi bạn bấm nút",
              ]}
              correct={1}
              explanation="Mạng nhỏ chuyên biệt chạy trên chip điện thoại liên tục nghe nền. Nó được huấn luyện với hàng triệu mẫu 'Hey Siri' ở nhiều giọng, nhiều mức ồn khác nhau. Chạy trực tiếp trên chip giúp độ trễ dưới 200ms và không cần gửi âm thanh liên tục lên máy chủ."
            />

            <div className="mt-4">
              <InlineChallenge
                question="Vì sao hệ thống hiện đại dùng NHIỀU mạng nơ-ron chuyên biệt thay vì một mạng duy nhất?"
                options={[
                  "Vì Apple/Google muốn làm cho phức tạp",
                  "Mỗi nhiệm vụ có đặc thù riêng: nhận âm vị cần nghe tốt, hiểu ý định cần đọc tốt, tạo giọng cần nói tốt. Tách ra → mỗi mạng tối ưu một việc",
                  "Vì mạng to quá không chạy được",
                  "Vì pháp luật quy định",
                ]}
                correct={1}
                explanation="Mỗi mạng chuyên sâu một khía cạnh dễ huấn luyện hơn, nhẹ hơn khi chạy, dễ cải tiến từng phần mà không ảnh hưởng phần khác. Gần đây có cả mô hình 'end-to-end' kết hợp nhiều bước, nhưng trong sản phẩm thương mại, các mạng chuyên biệt vẫn phổ biến vì dễ triển khai và gỡ lỗi."
              />
            </div>
          </div>
        </div>
      </ApplicationTryIt>

      {/* ─── METRICS ─── */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="Tỉ lệ lỗi từ của Google giảm từ 23% (2013) xuống 4,9% (2017) nhờ chuyển sang mạng nơ-ron sâu — gần ngang khả năng nghe của con người"
          sourceRef={5}
        />
        <Metric
          value="Mô hình end-to-end mới của Google đạt 5,6% WER trên giọng điện thoại, cải thiện 16% so với hệ thống truyền thống"
          sourceRef={4}
        />
        <Metric
          value="Siri dùng mạng nơ-ron sâu chạy trực tiếp trên chip Neural Engine, phát hiện 'Hey Siri' với độ trễ dưới 200 mili-giây"
          sourceRef={1}
        />
        <Metric
          value="Google Voice Transcription chuyển sang LSTM-RNN giảm đáng kể lỗi nhận dạng trên cuộc gọi điện thoại"
          sourceRef={3}
        />
        <Metric
          value="Giọng trả lời của Siri từ 2017 dùng mô hình Deep Mixture Density — sinh giọng mượt tự nhiên như người thật"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* ─── COUNTERFACTUAL ─── */}
      <ApplicationCounterfactual
        parentTitleVi="Mạng nơ-ron"
        topicSlug={metadata.slug}
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Nếu không có mạng nơ-ron sâu, trợ lý giọng nói sẽ vẫn dùng mô hình
            thống kê cũ với tỉ lệ lỗi hơn 20% — <strong>cứ 5 từ lại sai 1
            từ</strong>. Trải nghiệm đó quá tệ để dùng hàng ngày.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 dark:bg-rose-900/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-rose-700 dark:text-rose-300 font-bold mb-2">
                Thế giới không có mạng nơ-ron
              </p>
              <ul className="text-xs text-foreground/85 space-y-1 list-disc list-inside">
                <li>Siri, Google Assistant gần như không tồn tại</li>
                <li>Gõ vẫn nhanh hơn nói</li>
                <li>Loa thông minh trở thành đồ chơi bất tiện</li>
                <li>Người khiếm thị khó dùng điện thoại hơn nhiều</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-bold mb-2">
                Thế giới có mạng nơ-ron (bây giờ)
              </p>
              <ul className="text-xs text-foreground/85 space-y-1 list-disc list-inside">
                <li>Hơn 4,2 tỷ thiết bị có trợ lý giọng nói</li>
                <li>Nói tự nhiên, máy hiểu ngay</li>
                <li>Xe hơi tự lái hiểu lệnh bằng giọng</li>
                <li>Hỗ trợ người khiếm thị, người khuyết tật vận động</li>
              </ul>
            </div>
          </div>

          <Callout variant="insight" title="Ý tưởng lớn">
            Mạng nơ-ron sâu đã học trực tiếp từ hàng triệu giờ giọng nói. Nó
            nắm được ngữ cảnh dài — thứ mô hình thống kê không thể. Nhờ đó,
            trợ lý giọng nói bỗng dưng &ldquo;dùng được&rdquo; trong cuộc sống
            hàng ngày — và thay đổi cách con người giao tiếp với máy.
          </Callout>
        </div>

        <div className="mt-6">
          <MiniSummary
            title="3 điều cần nhớ"
            points={[
              "Trợ lý giọng nói không phải một mạng lớn — mà là nhiều mạng nối tiếp: nhận âm vị, ghép từ, hiểu ý định, tạo giọng trả lời.",
              "Chuyển từ mô hình thống kê (HMM/GMM) sang mạng nơ-ron sâu đã giảm tỉ lệ lỗi từ trên 23% xuống dưới 5%.",
              "Chạy mạng nơ-ron trực tiếp trên chip điện thoại (Neural Engine của Apple) giữ độ trễ thấp và bảo vệ riêng tư — âm thanh không cần rời máy.",
            ]}
          />
        </div>

        <div className="mt-5">
          <Callout variant="tip" title="Đọc lại nền tảng">
            Nếu bạn muốn hiểu kỹ hơn vì sao mạng có nhiều lớp lại mạnh đến thế,
            quay lại bài lý thuyết:{" "}
            <TopicLink slug="neural-network-overview">
              Mạng nơ-ron là gì
            </TopicLink>{" "}
            — nơi bạn có thể kéo slider, bấm vào từng nơ-ron và xem tín hiệu
            lan truyền.
          </Callout>
        </div>

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
