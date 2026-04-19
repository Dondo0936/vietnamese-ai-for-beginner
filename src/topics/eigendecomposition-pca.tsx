"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Compass,
  Eye,
  Users,
  Sparkles,
  RotateCw,
  Shuffle,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  LessonSection,
  StepReveal,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "eigendecomposition-pca",
  title: "Eigendecomposition & PCA",
  titleVi: "Phân tích thành phần chính (PCA) — tìm trục chính của dữ liệu",
  description:
    "Nếu phải mô tả một đám đông bằng một câu, bạn nói gì? PCA tìm 'trục chính' — hướng mà dữ liệu trải ra nhiều nhất.",
  category: "math-foundations",
  tags: ["pca", "eigenvalues", "dimensionality-reduction"],
  difficulty: "beginner",
  relatedSlugs: ["vectors-and-matrices", "word-embeddings"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   HẰNG SỐ SVG
   ──────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 8;

/* Bảng scatter chính */
const SW = 420;
const SH = 380;
const S_CX = SW / 2;
const S_CY = 180;
const S_SCALE = 60;

/* Khu vực biểu đồ 1D dưới scatter */
const HIST_Y = 290;
const HIST_H = 50;
const HIST_W = SW - 40;

/* ────────────────────────────────────────────────────────────
   SINH DỮ LIỆU: 50 điểm theo phân phối elliptic
   ──────────────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NUM_POINTS = 50;
const TRUE_ANGLE = 0.5236; // ~30 độ — hướng "trục chính" thật
const SIGMA1 = 1.6; // độ trải dọc PC1
const SIGMA2 = 0.4; // độ trải dọc PC2

function generatePoints(seed: number, angle: number, s1: number, s2: number): [number, number][] {
  const rng = mulberry32(seed);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const points: [number, number][] = [];

  for (let i = 0; i < NUM_POINTS; i++) {
    const u1 = rng();
    const u2 = rng();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const pc1 = z0 * s1;
    const pc2 = z1 * s2;
    points.push([cosA * pc1 - sinA * pc2, sinA * pc1 + cosA * pc2]);
  }
  return points;
}

const DATA_POINTS = generatePoints(42, TRUE_ANGLE, SIGMA1, SIGMA2);

const CENTROID: [number, number] = [
  DATA_POINTS.reduce((s, p) => s + p[0], 0) / NUM_POINTS,
  DATA_POINTS.reduce((s, p) => s + p[1], 0) / NUM_POINTS,
];

const TOTAL_VARIANCE =
  DATA_POINTS.reduce((s, p) => {
    const dx = p[0] - CENTROID[0];
    const dy = p[1] - CENTROID[1];
    return s + dx * dx + dy * dy;
  }, 0) / NUM_POINTS;

/* ────────────────────────────────────────────────────────────
   TIỆN ÍCH
   ──────────────────────────────────────────────────────────── */

function projectOntoAxis(
  point: [number, number],
  center: [number, number],
  angle: number,
): number {
  const dx = point[0] - center[0];
  const dy = point[1] - center[1];
  return dx * Math.cos(angle) + dy * Math.sin(angle);
}

function varianceAlongAxis(points: [number, number][], center: [number, number], angle: number): number {
  const projs = points.map((p) => projectOntoAxis(p, center, angle));
  const mean = projs.reduce((s, v) => s + v, 0) / projs.length;
  return projs.reduce((s, v) => s + (v - mean) ** 2, 0) / projs.length;
}

const SNAP_THRESHOLD = 0.06;

/* ────────────────────────────────────────────────────────────
   BỐN BỘ DỮ LIỆU CHO CHALLENGE CUỐI: "Đâu là PC1?"
   ──────────────────────────────────────────────────────────── */

interface ScatterChallenge {
  label: string;
  hint: string;
  points: [number, number][];
  answer: "horizontal" | "vertical" | "diagonal-up" | "diagonal-down";
}

const CHALLENGE_SCATTERS: ScatterChallenge[] = [
  {
    label: "Bộ 1",
    hint: "Dữ liệu kéo dài theo đường chéo đi lên",
    points: generatePoints(7, Math.PI / 4, 1.5, 0.35),
    answer: "diagonal-up",
  },
  {
    label: "Bộ 2",
    hint: "Dữ liệu nằm ngang, gần như bẹp theo trục x",
    points: generatePoints(13, 0, 1.7, 0.3),
    answer: "horizontal",
  },
  {
    label: "Bộ 3",
    hint: "Dữ liệu đứng dọc theo trục y",
    points: generatePoints(21, Math.PI / 2, 1.7, 0.3),
    answer: "vertical",
  },
  {
    label: "Bộ 4",
    hint: "Dữ liệu trải theo đường chéo đi xuống",
    points: generatePoints(33, -Math.PI / 4, 1.5, 0.35),
    answer: "diagonal-down",
  },
];

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "PCA cố gắng tìm điều gì khi đưa dữ liệu từ nhiều chiều xuống ít chiều?",
    options: [
      "Hướng ngẫu nhiên bất kỳ",
      "Hướng mà dữ liệu trải ra nhiều nhất — giữ được nhiều sự khác biệt nhất",
      "Hướng có nhiều điểm giống nhau nhất",
      "Hướng song song với trục x của hệ toạ độ gốc",
    ],
    correct: 1,
    explanation:
      "PCA tìm hướng mà các điểm dữ liệu 'trải ra' nhiều nhất (phương sai lớn nhất). Đó là hướng giữ được nhiều thông tin nhất — những chiều ít phương sai chỉ thêm rác.",
  },
  {
    question:
      "Tại sao trước khi làm PCA, ta phải 'trung tâm hoá' dữ liệu (trừ đi trung bình)?",
    options: [
      "Để dữ liệu chạy nhanh hơn",
      "Để trục tìm được đi qua trọng tâm của đám mây điểm, không bị lệch",
      "Không bắt buộc, chỉ để trang trí",
      "Để thêm nhiễu vào dữ liệu",
    ],
    correct: 1,
    explanation:
      "Nếu không trung tâm hoá, trục 'quan trọng nhất' sẽ bị kéo về phía trung bình thay vì theo hướng dữ liệu trải ra. Trung tâm hoá là bước 1 của mọi thuật toán PCA.",
  },
  {
    question:
      "Nếu PC1 giải thích 85% phương sai và PC2 giải thích 10%, thì cả hai thành phần giữ được bao nhiêu phần trăm thông tin?",
    options: ["85%", "90%", "95%", "100%"],
    correct: 2,
    explanation:
      "Tỷ lệ phương sai cộng dồn: 85% + 10% = 95%. Chỉ cần giữ hai trục này là giữ được gần hết câu chuyện của dữ liệu — 5% còn lại thường là nhiễu.",
  },
  {
    type: "fill-blank",
    question:
      "PC1 = Principal Component 1 = trục mà dữ liệu có {blank} lớn nhất khi chiếu lên.",
    blanks: [
      {
        answer: "phương sai",
        accept: ["phương sai", "variance", "độ trải", "trải"],
      },
    ],
    explanation:
      "PC1 là trục đầu tiên theo thứ tự phương sai giảm dần. Phương sai càng lớn, càng nhiều sự đa dạng được giữ lại sau khi chiếu.",
  },
  {
    question:
      "Bạn có 100 đặc trưng mô tả một khách hàng (tuổi, thu nhập, giờ dùng app...). Chạy PCA và thấy 5 thành phần đầu giải thích 92% phương sai. Điều này có nghĩa là gì?",
    options: [
      "Dữ liệu hoàn toàn ngẫu nhiên, không có cấu trúc",
      "Từ 100 con số, 5 'trục tổng hợp' đã nắm được gần như toàn bộ câu chuyện — cực kỳ hữu ích để nén và vẽ biểu đồ",
      "Phải dùng đúng 100 chiều, không được giảm",
      "PCA thất bại với dữ liệu này",
    ],
    correct: 1,
    explanation:
      "Đây là kết quả trong mơ của một nhà phân tích: dữ liệu thực tế có rất nhiều đặc trưng 'nói cùng một chuyện'. PCA phát hiện ra điều đó và gói gọn 100 con số thành 5 trục mới — chạy mô hình nhanh hơn, vẽ biểu đồ được, giảm tốn bộ nhớ.",
  },
  {
    question:
      "Vector riêng (eigenvector) của một ma trận là gì, hiểu theo cách đơn giản nhất?",
    options: [
      "Một vector bất kỳ trong không gian",
      "Một hướng đặc biệt mà khi ma trận 'tác động' vào, vector chỉ bị kéo giãn hoặc rút ngắn, không bị xoay",
      "Vector có độ dài đúng bằng 1",
      "Dòng đầu tiên của ma trận",
    ],
    correct: 1,
    explanation:
      "Eigenvector là 'hướng bất biến' — sau khi ma trận tác động, nó vẫn chỉ cùng hướng cũ, chỉ có độ dài thay đổi. Hệ số thay đổi độ dài chính là eigenvalue (trị riêng). Trong PCA, eigenvector của ma trận hiệp phương sai chính là các trục PC.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function EigendecompositionPcaTopic() {
  /* ── Sân chơi 1: xoay trục, tìm PC1 ── */
  const [userAngle, setUserAngle] = useState(0);
  const [phase, setPhase] = useState<"pc1" | "pc2" | "done">("pc1");
  const [foundPC1, setFoundPC1] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  /* ── Thử thách: đoán PC1 của 4 bộ scatter khác nhau ── */
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [challengeAnswer, setChallengeAnswer] =
    useState<ScatterChallenge["answer"] | null>(null);

  const variancePC1 = useMemo(
    () => varianceAlongAxis(DATA_POINTS, CENTROID, userAngle),
    [userAngle],
  );
  const varianceRatio = useMemo(
    () => Math.min(variancePC1 / TOTAL_VARIANCE, 1),
    [variancePC1],
  );

  const foundPC1Var = useMemo(
    () => (foundPC1 !== null ? varianceAlongAxis(DATA_POINTS, CENTROID, foundPC1) : 0),
    [foundPC1],
  );
  const foundPC2Var = useMemo(
    () =>
      foundPC1 !== null
        ? varianceAlongAxis(DATA_POINTS, CENTROID, foundPC1 + Math.PI / 2)
        : 0,
    [foundPC1],
  );
  const totalFound = foundPC1Var + foundPC2Var;

  const projections = useMemo(
    () => DATA_POINTS.map((p) => projectOntoAxis(p, CENTROID, userAngle)),
    [userAngle],
  );
  const projMin = useMemo(() => Math.min(...projections), [projections]);
  const projMax = useMemo(() => Math.max(...projections), [projections]);

  const isNearPC1 = useMemo(() => {
    const diff1 = Math.abs(
      ((userAngle - TRUE_ANGLE + Math.PI) % (2 * Math.PI)) - Math.PI,
    );
    const diff2 = Math.abs(
      ((userAngle - TRUE_ANGLE - Math.PI + Math.PI) % (2 * Math.PI)) - Math.PI,
    );
    return Math.min(diff1, diff2) < SNAP_THRESHOLD;
  }, [userAngle]);

  const toSvgX = useCallback((x: number) => S_CX + x * S_SCALE, []);
  const toSvgY = useCallback((y: number) => S_CY - y * S_SCALE, []);

  /* ── Xử lý kéo trục ── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (phase === "done") return;
      isDragging.current = true;
      (e.target as SVGSVGElement).setPointerCapture?.(e.pointerId);
    },
    [phase],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging.current || phase === "done") return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SW / rect.width;
      const scaleY = SH / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      const mx = (svgX - toSvgX(CENTROID[0])) / S_SCALE;
      const my = -(svgY - toSvgY(CENTROID[1])) / S_SCALE;
      if (phase === "pc1") setUserAngle(Math.atan2(my, mx));
    },
    [phase, toSvgX, toSvgY],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleLockPC1 = useCallback(() => {
    setFoundPC1(userAngle);
    setPhase("pc2");
  }, [userAngle]);
  const handleFinish = useCallback(() => setPhase("done"), []);
  const handleReset = useCallback(() => {
    setUserAngle(0);
    setPhase("pc1");
    setFoundPC1(null);
  }, []);

  const displayAngle = phase === "pc1" ? userAngle : (foundPC1 ?? userAngle);
  const displayPC2 = displayAngle + Math.PI / 2;

  const axisLength = 3;

  /* Thông báo thân thiện cho người học */
  const phaseHint =
    phase === "pc1"
      ? varianceRatio > 0.9
        ? "Rất gần rồi — bấm khoá PC1!"
        : varianceRatio > 0.7
          ? "Ấm dần… xoay thêm chút"
          : varianceRatio > 0.5
            ? "Còn hơi lạnh"
            : "Lạnh — thử xoay hướng khác"
      : phase === "pc2"
        ? "PC1 đã khoá. PC2 tự động vuông góc — bấm Hoàn thành"
        : "Xong! Xem kết quả phân tích bên dưới";

  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn phải mô tả cả một đám đông bằng MỘT câu duy nhất. Cách nào giữ được nhiều thông tin nhất?"
          options={[
            "Mô tả chiều cao của người đầu tiên trong hàng",
            "Lấy điểm trung bình của cả đám (nhưng bỏ thông tin về khác biệt)",
            "Tìm 'đặc điểm' mà đám đông khác biệt nhau nhiều nhất và mô tả theo đặc điểm đó",
            "Đếm số người rồi báo con số",
          ]}
          correct={2}
          explanation="Câu C chính là ý tưởng của PCA. Nếu bạn phải tóm tắt một nhóm sinh viên, câu 'điểm trung bình học lực' giữ được nhiều thông tin hơn 'chiều cao trung bình' — vì học lực là chiều mà các sinh viên khác biệt nhau nhiều nhất. PCA tìm đúng cái 'đặc điểm phân biệt nhất' đó, nhưng làm tự động, ở hàng trăm chiều cùng lúc."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Bài này bạn sẽ chơi với một đám mây điểm 2D. Nhiệm vụ: xoay
            một thanh thẳng sao cho các điểm khi chiếu xuống nó{" "}
            <strong>trải ra nhiều nhất</strong>. Đó chính là PC1 — trục
            chính thứ nhất. PCA mở rộng trò chơi này lên 100 hay 10.000
            chiều và làm tự động trong mili-giây.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — HIỂU BẰNG HÌNH ẢNH ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Compass size={20} className="text-accent" /> PCA = tìm
            &ldquo;góc chụp ảnh&rdquo; đẹp nhất của dữ liệu
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng bạn có một tác phẩm điêu khắc 3D và chỉ được
            chụp <em>một</em> bức ảnh 2D. Bạn chọn góc nào? Chắc chắn
            không phải góc trực diện (chi tiết chồng lên nhau), mà là góc
            bạn <strong>thấy được nhiều chiều sâu nhất</strong>. PCA làm
            chính xác vậy — nhưng cho dữ liệu hàng trăm chiều.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {[
              {
                icon: Users,
                title: "Dữ liệu",
                desc: "Một đám mây điểm. Mỗi điểm là một bạn sinh viên với hàng chục con số (điểm môn, giờ học, chiều cao…).",
                color: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300",
              },
              {
                icon: Target,
                title: "Mục tiêu",
                desc: "Tìm một, hai, ba 'trục' mới sao cho khi chiếu điểm xuống đó, các bạn vẫn khác biệt rõ nhất.",
                color: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
              },
              {
                icon: Eye,
                title: "Kết quả",
                desc: "Vẽ được biểu đồ 2D của dữ liệu 100 chiều. Nhóm nào rõ, nhóm nào trộn, ta nhìn thấy ngay.",
                color: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-xl border p-4 space-y-1 ${card.color}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <span className="text-sm font-semibold">{card.title}</span>
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — KHÁM PHÁ ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Sân chơi: Xoay trục, tìm PC1
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Kéo chấm xanh để xoay đường thẳng qua tâm đám mây. Khi
                đường thẳng đi đúng hướng mà dữ liệu trải ra nhiều nhất,
                thanh &ldquo;phương sai&rdquo; sẽ gần đầy — đó là PC1.
              </p>

              {/* Thanh phương sai */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Phương sai chiếu lên trục:
                  </span>
                  <span className="font-mono font-bold text-accent text-lg">
                    {(varianceRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-5 rounded-full bg-surface-hover overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-150 ease-out"
                    style={{
                      width: `${varianceRatio * 100}%`,
                      background:
                        varianceRatio > 0.9
                          ? "#10b981"
                          : varianceRatio > 0.6
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  />
                </div>
                <div className="text-xs text-muted text-center italic">
                  {phaseHint}
                </div>
              </div>

              {/* SVG chính */}
              <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${SW} ${SH}`}
                  className="w-full max-w-[420px] cursor-crosshair select-none touch-none"
                  aria-label="Kéo trục để tìm PC1"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <line
                    x1={20}
                    y1={toSvgY(CENTROID[1])}
                    x2={SW - 20}
                    y2={toSvgY(CENTROID[1])}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={toSvgX(CENTROID[0])}
                    y1={20}
                    x2={toSvgX(CENTROID[0])}
                    y2={260}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="0.5"
                  />

                  {/* Điểm dữ liệu */}
                  {DATA_POINTS.map((p, i) => (
                    <circle
                      key={`pt-${i}`}
                      cx={toSvgX(p[0])}
                      cy={toSvgY(p[1])}
                      r="3.5"
                      fill="currentColor"
                      className="text-accent/60"
                    />
                  ))}

                  {/* Trọng tâm */}
                  <circle
                    cx={toSvgX(CENTROID[0])}
                    cy={toSvgY(CENTROID[1])}
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={toSvgX(CENTROID[0])}
                    cy={toSvgY(CENTROID[1])}
                    r="2"
                    fill="currentColor"
                    className="text-foreground"
                  />

                  {/* Đường chiếu từ điểm xuống trục */}
                  {DATA_POINTS.map((p, i) => {
                    const proj = projections[i];
                    const px =
                      CENTROID[0] + proj * Math.cos(displayAngle);
                    const py =
                      CENTROID[1] + proj * Math.sin(displayAngle);
                    return (
                      <line
                        key={`proj-${i}`}
                        x1={toSvgX(p[0])}
                        y1={toSvgY(p[1])}
                        x2={toSvgX(px)}
                        y2={toSvgY(py)}
                        stroke="currentColor"
                        className="text-accent/15"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* PC1 */}
                  <line
                    x1={toSvgX(CENTROID[0] - axisLength * Math.cos(displayAngle))}
                    y1={toSvgY(CENTROID[1] - axisLength * Math.sin(displayAngle))}
                    x2={toSvgX(CENTROID[0] + axisLength * Math.cos(displayAngle))}
                    y2={toSvgY(CENTROID[1] + axisLength * Math.sin(displayAngle))}
                    stroke="#3b82f6"
                    strokeWidth={phase === "pc1" ? 2.5 : 2}
                    strokeLinecap="round"
                  />
                  {phase === "pc1" && (
                    <circle
                      cx={toSvgX(CENTROID[0] + axisLength * Math.cos(displayAngle))}
                      cy={toSvgY(CENTROID[1] + axisLength * Math.sin(displayAngle))}
                      r="9"
                      fill="#3b82f6"
                      fillOpacity="0.3"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="cursor-grab active:cursor-grabbing"
                    />
                  )}
                  <text
                    x={toSvgX(CENTROID[0] + (axisLength + 0.3) * Math.cos(displayAngle))}
                    y={toSvgY(CENTROID[1] + (axisLength + 0.3) * Math.sin(displayAngle))}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#3b82f6"
                  >
                    PC1
                  </text>

                  {/* PC2 hiện khi đã khoá PC1 */}
                  {(phase === "pc2" || phase === "done") && (
                    <>
                      <line
                        x1={toSvgX(CENTROID[0] - axisLength * 0.7 * Math.cos(displayPC2))}
                        y1={toSvgY(CENTROID[1] - axisLength * 0.7 * Math.sin(displayPC2))}
                        x2={toSvgX(CENTROID[0] + axisLength * 0.7 * Math.cos(displayPC2))}
                        y2={toSvgY(CENTROID[1] + axisLength * 0.7 * Math.sin(displayPC2))}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="6,3"
                        strokeLinecap="round"
                      />
                      <text
                        x={toSvgX(CENTROID[0] + (axisLength * 0.7 + 0.3) * Math.cos(displayPC2))}
                        y={toSvgY(CENTROID[1] + (axisLength * 0.7 + 0.3) * Math.sin(displayPC2))}
                        fontSize="12"
                        fontWeight="bold"
                        fill="#ef4444"
                      >
                        PC2
                      </text>
                    </>
                  )}

                  {/* Biểu đồ 1D: phân bố sau khi chiếu */}
                  <line
                    x1={20}
                    y1={HIST_Y - 5}
                    x2={SW - 20}
                    y2={HIST_Y - 5}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="0.5"
                  />
                  <text x={20} y={HIST_Y - 10} fontSize="10" fill="currentColor" className="text-muted">
                    Phân bố sau khi chiếu xuống PC1 (từ đám mây 2D → đường thẳng 1D)
                  </text>
                  {projections.map((proj, i) => {
                    const range = projMax - projMin || 1;
                    const nx = 20 + ((proj - projMin) / range) * HIST_W;
                    return (
                      <circle
                        key={`hist-${i}`}
                        cx={nx}
                        cy={HIST_Y + HIST_H / 2}
                        r="3"
                        fill="currentColor"
                        className="text-accent/50"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Nút hành động */}
              <div className="flex gap-3 justify-center flex-wrap">
                {phase === "pc1" && (
                  <button
                    onClick={handleLockPC1}
                    disabled={!isNearPC1}
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isNearPC1
                      ? "Khoá PC1 — tuyệt vời!"
                      : "Chưa đủ gần PC1 — tiếp tục xoay"}
                  </button>
                )}
                {phase === "pc2" && (
                  <button
                    onClick={handleFinish}
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors"
                  >
                    Hoàn thành — xem kết quả
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors inline-flex items-center gap-2"
                >
                  <RotateCw size={14} />
                  Làm lại
                </button>
              </div>

              {/* Kết quả */}
              <AnimatePresence>
                {phase === "done" && foundPC1 !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg border border-accent/30 bg-accent-light/30 p-4 space-y-3"
                  >
                    <p className="font-semibold text-accent-dark text-sm">
                      Kết quả phân tích PCA
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border border-border bg-surface p-3 text-center">
                        <div className="text-xs text-muted mb-1">PC1</div>
                        <div className="font-mono font-bold text-blue-500 text-lg">
                          {totalFound > 0
                            ? ((foundPC1Var / totalFound) * 100).toFixed(1)
                            : "—"}
                          %
                        </div>
                        <div className="text-xs text-muted">phương sai</div>
                      </div>
                      <div className="rounded-lg border border-border bg-surface p-3 text-center">
                        <div className="text-xs text-muted mb-1">PC2</div>
                        <div className="font-mono font-bold text-red-500 text-lg">
                          {totalFound > 0
                            ? ((foundPC2Var / totalFound) * 100).toFixed(1)
                            : "—"}
                          %
                        </div>
                        <div className="text-xs text-muted">phương sai</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Ở 2D, hai trục PC giữ 100% thông tin. Nhưng với dữ
                      liệu 100 chiều, thường chỉ 5-10 trục PC đầu tiên đã
                      giữ được 95% thông tin — phần còn lại là nhiễu.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — ĐI SÂU (STEP REVEAL): 3 bước PCA ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Thuật toán PCA thực tế chạy 3 bước. Bấm &ldquo;Tiếp tục&rdquo;
          để mở từng bước:
        </p>

        <StepReveal
          labels={[
            "Bước 1: Trung tâm hoá dữ liệu",
            "Bước 2: Tìm hướng phương sai lớn nhất (eigenvector)",
            "Bước 3: Chiếu xuống trục mới",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Trung tâm hoá = đưa trọng tâm đám mây về gốc toạ độ.</strong>{" "}
                Tính điểm trung bình (x̄, ȳ), rồi trừ nó ra khỏi mỗi điểm.
                Sau bước này, đám mây vẫn có đúng hình dáng cũ, chỉ là
                &ldquo;dọn về giữa&rdquo; để các trục sau đi qua tâm.
              </p>
              <MiniCenteringDiagram />
              <p className="text-xs text-muted italic">
                Giống việc đặt cân nặng của bức tượng ngay tâm bàn trước
                khi đo các góc nghiêng của nó.
              </p>
            </div>,

            <div
              key="s2"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>
                  Tìm hướng mà đám mây &ldquo;trải ra&rdquo; nhiều nhất.
                </strong>{" "}
                Máy tính không thử từng góc như bạn vừa làm ở sân chơi.
                Nó giải một phương trình toán — eigenvector của ma trận
                hiệp phương sai — để tìm ra hướng đó ngay lập tức.
              </p>
              <MiniEigenDiagram />
              <p className="text-xs text-muted italic">
                Eigenvector = &ldquo;hướng mà ma trận tác động chỉ kéo
                giãn, không xoay&rdquo;. Với ma trận hiệp phương sai, nó
                chính là hướng dữ liệu trải ra nhiều nhất.
              </p>
            </div>,

            <div
              key="s3"
              className="rounded-lg bg-surface/60 border border-border p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Chiếu dữ liệu xuống các trục PC.</strong> Mỗi
                điểm 2D được thay bằng toạ độ trên PC1 (và PC2 nếu muốn
                giữ 2 chiều). Số chiều giảm, nhưng cấu trúc quan trọng
                vẫn còn.
              </p>
              <MiniProjectionDiagram />
              <p className="text-xs text-muted italic">
                Đây là lý do vẽ được biểu đồ 2D cho dữ liệu 100 chiều: ta
                chiếu xuống 2 trục PC quan trọng nhất.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — THỬ THÁCH + AHA ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-5">
          <p className="text-sm text-muted leading-relaxed">
            Nhìn 4 bộ dữ liệu khác nhau dưới đây. Với mỗi bộ, PC1 đi theo
            hướng nào? Bấm vào hướng bạn nghĩ, xem có đúng không.
          </p>

          <ChallengeScatterCard
            challenge={CHALLENGE_SCATTERS[challengeIdx]}
            selected={challengeAnswer}
            onSelect={setChallengeAnswer}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {CHALLENGE_SCATTERS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setChallengeIdx(i);
                    setChallengeAnswer(null);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === challengeIdx
                      ? "w-8 bg-accent"
                      : "w-4 bg-surface hover:bg-surface-hover"
                  }`}
                  aria-label={`Bộ ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setChallengeIdx(
                  (challengeIdx + 1) % CHALLENGE_SCATTERS.length,
                );
                setChallengeAnswer(null);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"
            >
              <Shuffle size={12} />
              Bộ khác
            </button>
          </div>

          <InlineChallenge
            question="Dữ liệu 10 chiều có eigenvalues lần lượt: [5, 3, 1, 0.5, 0.2, ...]. PC1 giải thích khoảng bao nhiêu phần trăm phương sai?"
            options={["30%", "50%", "80%", "100%"]}
            correct={1}
            explanation="Tổng eigenvalues ≈ 10. PC1 có λ₁ = 5. Tỷ lệ = 5 / 10 = 50%. Riêng PC1 đã giữ một nửa thông tin của toàn bộ 10 chiều."
          />
        </div>

        <div className="mt-6">
          <AhaMoment>
            Máy tính không phải đứng đó &ldquo;thử xoay từng góc&rdquo;
            như bạn vừa làm. Nó giải một phương trình đại số — tìm{" "}
            <strong>eigenvector</strong> của ma trận hiệp phương sai — và{" "}
            <em>ra ngay kết quả</em>. Cả một bài toán &ldquo;tìm trục
            quan trọng nhất&rdquo; được thu gọn thành một phép tính ma
            trận. Đó là sức mạnh của đại số tuyến tính.
          </AhaMoment>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã thấy PCA hoạt động. Giờ hãy nhìn hai công thức đứng
            đằng sau — và hiểu chúng bằng tiếng Việt trước khi nhìn
            tiếng toán.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Công thức 1: Ma trận hiệp phương sai
          </h4>
          <LaTeX block>
            {String.raw`C = \frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})(x_i - \bar{x})^T`}
          </LaTeX>
          <p className="text-sm leading-relaxed">
            <strong>Đọc bằng tiếng Việt:</strong> &ldquo;Lấy mỗi điểm trừ
            đi trung bình (trung tâm hoá), rồi gom tất cả lại thành một
            bảng số vuông cho biết{" "}
            <em>mỗi cặp đặc trưng thay đổi cùng nhau đến đâu</em>&rdquo;.
            Nếu C<sub>ij</sub> dương, đặc trưng i và j tăng cùng nhau.
            Bằng 0: chúng không liên quan. Âm: khi i tăng thì j giảm.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            {[
              {
                title: "C > 0",
                example: "Chiều cao và cân nặng",
                desc: "Cao thường nặng hơn — chúng tăng cùng nhau.",
                color: "#10b981",
              },
              {
                title: "C ≈ 0",
                example: "Số giày và điểm văn",
                desc: "Không ảnh hưởng lẫn nhau — thay đổi độc lập.",
                color: "#6b7280",
              },
              {
                title: "C < 0",
                example: "Giờ ngủ và giờ chơi game",
                desc: "Ngủ nhiều → chơi ít. Một tăng thì một giảm.",
                color: "#ef4444",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-xl border bg-card p-3 space-y-1"
                style={{ borderLeft: `4px solid ${c.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {c.title}
                  </span>
                </div>
                <p className="text-xs text-foreground/85 italic">
                  {c.example}
                </p>
                <p className="text-xs text-muted leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Công thức 2: Phương trình vector riêng (eigenvalue)
          </h4>
          <LaTeX block>{String.raw`C \vec{v} = \lambda \vec{v}`}</LaTeX>
          <p className="text-sm leading-relaxed">
            <strong>Đọc bằng tiếng Việt:</strong> &ldquo;Có những hướng{" "}
            <em>đặc biệt</em> mà ma trận C tác động vào chỉ{" "}
            <strong>kéo giãn</strong>, không xoay. Chúng gọi là{" "}
            <em>vector riêng</em> (eigenvector). Hệ số kéo giãn gọi là{" "}
            <em>trị riêng</em> (eigenvalue)&rdquo;. Trong PCA:
          </p>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              Eigenvector của C = các <strong>trục PC</strong>.
            </li>
            <li>
              Eigenvalue λ = <strong>lượng phương sai</strong> trục đó
              giữ được.
            </li>
            <li>
              Sắp λ từ lớn đến nhỏ → chọn vài λ đầu là đã giữ gần hết
              thông tin.
            </li>
          </ul>

          <Callout variant="insight" title="Phép ẩn dụ: cánh cửa bản lề">
            Tưởng tượng bạn đẩy một cánh cửa. Bản lề là eigenvector —
            cửa chỉ xoay quanh bản lề, không đi đâu khác. Eigenvalue cho
            biết cánh cửa mở rộng bao nhiêu lần. Với ma trận hiệp phương
            sai: bản lề = hướng dữ liệu trải ra, độ mở = độ trải ra đó
            có lớn cỡ nào.
          </Callout>

          <Callout variant="tip" title="Tại sao chỉ cần 2 công thức này?">
            Phần lớn sách giáo khoa PCA trình bày hàng trang công thức —
            SVD, whitening, kernel trick, probabilistic PCA. Nhưng cốt
            lõi chỉ có 2 thứ này: <em>đo sự thay đổi cùng nhau</em> (ma
            trận hiệp phương sai) và <em>tìm hướng bất biến</em>{" "}
            (eigenvector). Nắm 2 ý này, các biến thể sau sẽ dễ hiểu
            hơn.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Khi nào dùng PCA, khi nào không?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Nên dùng PCA</span>
              </div>
              <ul className="text-xs text-foreground/85 space-y-1 list-disc list-inside">
                <li>Muốn vẽ dữ liệu đa chiều xuống biểu đồ 2D/3D</li>
                <li>Các đặc trưng tương quan mạnh với nhau</li>
                <li>Cần nén embedding (từ 300 xuống 50 chiều)</li>
                <li>Loại bỏ nhiễu (trục PC cuối thường là nhiễu)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <Compass size={16} />
                <span className="text-sm font-semibold">Tránh PCA</span>
              </div>
              <ul className="text-xs text-foreground/85 space-y-1 list-disc list-inside">
                <li>Dữ liệu nằm trên đường cong (vòng tròn, xoắn ốc)</li>
                <li>Đặc trưng có đơn vị khác nhau và chưa chuẩn hoá</li>
                <li>Cần diễn giải rõ trục mới thành gì</li>
                <li>Chỉ có vài chục điểm ít chiều</li>
              </ul>
            </div>
          </div>

          <CollapsibleDetail title="Tại sao phải sắp xếp eigenvalue từ lớn đến nhỏ?">
            <p className="text-sm leading-relaxed">
              Vì eigenvalue chính là &ldquo;lượng phương sai&rdquo; mỗi
              trục giữ được. Trục có eigenvalue lớn giữ nhiều thông tin
              hơn. Khi giảm chiều từ d xuống k, ta chọn k trục ứng với k
              eigenvalue lớn nhất — vứt bỏ những trục ít thông tin.
              Giống khi bạn tóm tắt một cuốn sách: giữ chương quan trọng,
              bỏ chương phụ.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Một ứng dụng thú vị: PageRank">
            <p className="text-sm leading-relaxed">
              Google xếp hạng các trang web bằng cách tìm{" "}
              <em>eigenvector</em> của ma trận link giữa các trang. Trang
              nào có &ldquo;giá trị&rdquo; cao trong eigenvector ấy là
              trang quan trọng nhất. Ý tưởng y hệt PCA, chỉ khác dữ liệu
              là web thay vì đám điểm. Đại số tuyến tính lặng lẽ làm
              nhiều việc hơn bạn nghĩ.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Năm điều cần nhớ về PCA"
          points={[
            "PCA trả lời câu hỏi: 'Nếu phải mô tả dữ liệu bằng ít chiều hơn, nên chọn trục nào?'",
            "Trục PC1 là hướng dữ liệu trải ra nhiều nhất. PC2 vuông góc với PC1, trải nhiều nhất trong phần còn lại. Cứ thế tiếp.",
            "Bước 1: trung tâm hoá (đưa trọng tâm về gốc). Bước 2: tìm eigenvector của ma trận hiệp phương sai. Bước 3: chiếu dữ liệu xuống các trục PC.",
            "Eigenvalue = lượng phương sai mỗi trục giữ. Tổng λ đầu / tổng tất cả λ = phần trăm thông tin giữ lại.",
            "Dùng được cho: vẽ biểu đồ dữ liệu đa chiều, nén embedding, loại nhiễu. Tránh khi dữ liệu cong (vòng tròn, xoắn ốc).",
          ]}
        />

        <Callout variant="tip" title="Học tiếp">
          PCA là nền tảng cho nhiều kỹ thuật hiện đại.{" "}
          <TopicLink slug="word-embeddings">Word embeddings</TopicLink>{" "}
          300 chiều của GPT có thể giảm xuống 50 chiều bằng PCA. Nếu bạn
          cần ôn lại cơ bản, quay về{" "}
          <TopicLink slug="vectors-and-matrices">Vector và ma trận</TopicLink>
          .
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT PHỤ: mini diagrams cho StepReveal
   ════════════════════════════════════════════════════════════ */

function MiniCenteringDiagram() {
  return (
    <svg viewBox="0 0 360 140" className="w-full max-w-[360px] mx-auto">
      {/* Panel trái: dữ liệu gốc */}
      <g>
        <rect
          x={10}
          y={10}
          width={160}
          height={120}
          rx={6}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />
        <text x={90} y={25} fontSize="10" textAnchor="middle" fill="currentColor" className="text-muted">
          Trước (tâm lệch)
        </text>
        {[
          [120, 50],
          [130, 60],
          [140, 70],
          [115, 75],
          [135, 55],
          [125, 85],
          [110, 65],
          [145, 75],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
        ))}
        {/* Gốc */}
        <line x1={10} y1={100} x2={170} y2={100} stroke="currentColor" className="text-foreground/50" strokeWidth="0.5" />
        <line x1={90} y1={30} x2={90} y2={130} stroke="currentColor" className="text-foreground/50" strokeWidth="0.5" />
      </g>

      {/* Mũi tên */}
      <text x={180} y={75} fontSize="20" fill="currentColor" className="text-accent">
        →
      </text>

      {/* Panel phải: sau khi trung tâm hoá */}
      <g>
        <rect
          x={200}
          y={10}
          width={150}
          height={120}
          rx={6}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />
        <text x={275} y={25} fontSize="10" textAnchor="middle" fill="currentColor" className="text-muted">
          Sau (tâm ở gốc)
        </text>
        {[
          [270, 60],
          [280, 70],
          [290, 80],
          [265, 85],
          [285, 65],
          [275, 95],
          [260, 75],
          [295, 85],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
        ))}
        <line x1={200} y1={75} x2={350} y2={75} stroke="currentColor" className="text-foreground/50" strokeWidth="0.5" />
        <line x1={275} y1={20} x2={275} y2={130} stroke="currentColor" className="text-foreground/50" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

function MiniEigenDiagram() {
  return (
    <svg viewBox="0 0 360 140" className="w-full max-w-[360px] mx-auto">
      {/* Đám mây elliptic kéo nghiêng */}
      {[
        [100, 80],
        [110, 75],
        [115, 70],
        [95, 85],
        [120, 68],
        [130, 62],
        [90, 88],
        [140, 58],
        [105, 78],
        [125, 65],
        [135, 60],
        [85, 90],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" opacity="0.6" />
      ))}

      {/* Trục PC1 đi qua đám mây */}
      <line
        x1={70}
        y1={95}
        x2={155}
        y2={50}
        stroke="#10b981"
        strokeWidth="2.5"
      />
      <text x={160} y={50} fontSize="11" fill="#10b981" fontWeight="bold">
        PC1 (eigenvector)
      </text>

      {/* PC2 vuông góc */}
      <line
        x1={100}
        y1={60}
        x2={125}
        y2={85}
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeDasharray="4,3"
      />
      <text x={130} y={88} fontSize="10" fill="#ef4444">
        PC2
      </text>

      <text x={180} y={75} fontSize="10" fill="currentColor" className="text-muted">
        PC1 = hướng đám mây
      </text>
      <text x={180} y={90} fontSize="10" fill="currentColor" className="text-muted">
        trải ra nhiều nhất.
      </text>
      <text x={180} y={105} fontSize="10" fill="currentColor" className="text-muted">
        PC2 vuông góc.
      </text>
    </svg>
  );
}

function MiniProjectionDiagram() {
  return (
    <svg viewBox="0 0 360 140" className="w-full max-w-[360px] mx-auto">
      {/* Đám mây 2D */}
      <g>
        {[
          [60, 80],
          [70, 75],
          [75, 70],
          [55, 85],
          [80, 68],
          [90, 62],
          [50, 88],
          [100, 58],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" opacity="0.6" />
        ))}
        {/* Trục PC1 */}
        <line x1={40} y1={95} x2={115} y2={50} stroke="#10b981" strokeWidth="2" />
        {/* Đường chiếu */}
        {[
          [60, 80, 55, 78],
          [70, 75, 68, 72],
          [75, 70, 78, 65],
          [55, 85, 50, 83],
          [80, 68, 83, 63],
          [90, 62, 92, 58],
          [50, 88, 45, 90],
          [100, 58, 100, 52],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            className="text-accent/40"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        <text x={75} y={115} fontSize="9" fill="currentColor" className="text-muted" textAnchor="middle">
          2D (trước)
        </text>
      </g>

      {/* Mũi tên */}
      <text x={150} y={75} fontSize="20" fill="currentColor" className="text-accent">
        →
      </text>

      {/* Đường thẳng 1D: điểm chiếu xuống */}
      <g>
        <line x1={190} y1={75} x2={340} y2={75} stroke="currentColor" className="text-foreground" strokeWidth="1.5" />
        {[200, 215, 230, 250, 265, 285, 305, 325].map((x, i) => (
          <circle key={i} cx={x} cy={75} r="3.5" fill="#10b981" />
        ))}
        <text x={265} y={105} fontSize="9" fill="currentColor" className="text-muted" textAnchor="middle">
          1D (sau khi chiếu)
        </text>
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT PHỤ: Challenge "Đâu là PC1?"
   ════════════════════════════════════════════════════════════ */

interface ChallengeScatterProps {
  challenge: ScatterChallenge;
  selected: ScatterChallenge["answer"] | null;
  onSelect: (answer: ScatterChallenge["answer"]) => void;
}

function ChallengeScatterCard({
  challenge,
  selected,
  onSelect,
}: ChallengeScatterProps) {
  const W = 280;
  const H = 220;
  const cx = W / 2;
  const cy = H / 2;
  const scale = 50;

  const options: {
    key: ScatterChallenge["answer"];
    label: string;
    angle: number;
  }[] = [
    { key: "horizontal", label: "Ngang (trục x)", angle: 0 },
    { key: "vertical", label: "Dọc (trục y)", angle: Math.PI / 2 },
    { key: "diagonal-up", label: "Chéo đi lên ↗", angle: Math.PI / 4 },
    { key: "diagonal-down", label: "Chéo đi xuống ↘", angle: -Math.PI / 4 },
  ];

  const isRevealed = selected !== null;
  const isCorrect = selected === challenge.answer;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {challenge.label}: PC1 đi theo hướng nào?
        </span>
        {isRevealed && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isCorrect
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            }`}
          >
            {isCorrect ? "Đúng!" : "Chưa đúng"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-2 flex items-center justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px]">
            {/* Trục nền */}
            <line
              x1={10}
              y1={cy}
              x2={W - 10}
              y2={cy}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
            />
            <line
              x1={cx}
              y1={10}
              x2={cx}
              y2={H - 10}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
            />

            {/* Điểm dữ liệu */}
            {challenge.points.map((p, i) => (
              <circle
                key={i}
                cx={cx + p[0] * scale}
                cy={cy - p[1] * scale}
                r="3"
                fill="#3b82f6"
                opacity="0.6"
              />
            ))}

            {/* Nếu đã đoán: vẽ trục theo hướng người dùng chọn */}
            {isRevealed && (
              <>
                <line
                  x1={cx - 3 * scale * Math.cos(
                    options.find((o) => o.key === selected)?.angle ?? 0,
                  )}
                  y1={cy + 3 * scale * Math.sin(
                    options.find((o) => o.key === selected)?.angle ?? 0,
                  )}
                  x2={cx + 3 * scale * Math.cos(
                    options.find((o) => o.key === selected)?.angle ?? 0,
                  )}
                  y2={cy - 3 * scale * Math.sin(
                    options.find((o) => o.key === selected)?.angle ?? 0,
                  )}
                  stroke={isCorrect ? "#10b981" : "#ef4444"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {!isCorrect && (
                  <line
                    x1={cx - 3 * scale * Math.cos(
                      options.find((o) => o.key === challenge.answer)?.angle ?? 0,
                    )}
                    y1={cy + 3 * scale * Math.sin(
                      options.find((o) => o.key === challenge.answer)?.angle ?? 0,
                    )}
                    x2={cx + 3 * scale * Math.cos(
                      options.find((o) => o.key === challenge.answer)?.angle ?? 0,
                    )}
                    y2={cy - 3 * scale * Math.sin(
                      options.find((o) => o.key === challenge.answer)?.angle ?? 0,
                    )}
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="5,3"
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted italic mb-1">
            Gợi ý: {challenge.hint}
          </p>
          {options.map((o) => {
            const isUserChoice = selected === o.key;
            const isAnswer = challenge.answer === o.key;
            let cls =
              "w-full text-left rounded-lg border px-3 py-2 text-xs font-medium transition-colors";
            if (!isRevealed) {
              cls +=
                " border-border bg-card text-foreground hover:border-accent/50 hover:bg-surface";
            } else if (isAnswer) {
              cls +=
                " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
            } else if (isUserChoice) {
              cls +=
                " border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
            } else {
              cls += " border-border bg-card text-muted opacity-60";
            }
            return (
              <button
                key={o.key}
                type="button"
                disabled={isRevealed}
                onClick={() => onSelect(o.key)}
                className={cls}
              >
                {o.label}
              </button>
            );
          })}

          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg bg-surface/60 border border-border p-3 text-xs text-muted leading-relaxed"
            >
              {isCorrect
                ? "PC1 luôn đi theo hướng dữ liệu trải ra nhiều nhất. Đám mây này rõ ràng kéo theo hướng đó."
                : "Nhìn lại: PC1 là hướng dữ liệu trải ra xa nhất, chứ không phải theo trục nền x hoặc y. Đường màu xanh lá nét đứt là đáp án đúng."}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
