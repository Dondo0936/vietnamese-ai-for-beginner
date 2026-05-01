"use client";

import type { JSX } from "react";
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
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ────────────────────────────────────────────────────────────────
   METADATA -- preserved from previous revision
   ─────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "data-augmentation",
  title: "Data Augmentation",
  titleVi: "Tăng cường dữ liệu",
  description:
    "Kỹ thuật mở rộng tập dữ liệu huấn luyện bằng cách tạo biến thể mới từ dữ liệu gốc, giảm overfitting.",
  category: "computer-vision",
  tags: ["computer-vision", "training", "regularization"],
  difficulty: "beginner",
  relatedSlugs: ["overfitting-underfitting", "image-classification", "regularization"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
   ─────────────────────────────────────────────────────────────── */
type AugKey =
  | "rotation"
  | "flip"
  | "colorJitter"
  | "cutout"
  | "mixup"
  | "noise";

interface AugControls {
  rotation: number;   // -45 .. 45 độ
  flip: boolean;      // lật ngang
  colorJitter: number;// 0 .. 1 cường độ color jitter
  cutout: number;     // 0 .. 1 tỉ lệ vùng bị che
  mixup: number;      // 0 .. 1 alpha trộn với ảnh thứ hai
  noise: number;      // 0 .. 1 cường độ nhiễu Gaussian
}

const DEFAULT_CONTROLS: AugControls = {
  rotation: 0,
  flip: false,
  colorJitter: 0,
  cutout: 0,
  mixup: 0,
  noise: 0,
};

const TOTAL_STEPS = 10;

/* ────────────────────────────────────────────────────────────────
   Sample 28x28 digit "7" -- encoded as a 28x28 intensity grid
   Each value 0..1 represents pixel darkness. Used both for main
   playground and for the 1 -> 8 variant gallery.
   ─────────────────────────────────────────────────────────────── */
const DIGIT_SEVEN: number[][] = (() => {
  const g: number[][] = Array.from({ length: 28 }, () =>
    Array.from({ length: 28 }, () => 0)
  );
  // Nét ngang trên cùng của số 7
  for (let x = 6; x <= 22; x++) {
    g[6][x] = 1;
    g[7][x] = 0.85;
  }
  // Nét chéo xuống dưới bên trái
  for (let i = 0; i < 16; i++) {
    const x = 22 - Math.floor(i * 0.9);
    const y = 8 + i;
    if (x >= 0 && x < 28 && y >= 0 && y < 28) {
      g[y][x] = 1;
      if (x - 1 >= 0) g[y][x - 1] = 0.6;
    }
  }
  // Gạch ngang nhỏ giữa -- đặc trưng của số 7 "kiểu châu Âu"
  for (let x = 11; x <= 16; x++) {
    g[16][x] = 0.7;
  }
  return g;
})();

/* Ảnh phụ để minh hoạ MixUp (số 3) */
const DIGIT_THREE: number[][] = (() => {
  const g: number[][] = Array.from({ length: 28 }, () =>
    Array.from({ length: 28 }, () => 0)
  );
  // Hai nửa cung tròn
  for (let t = 0; t < 30; t++) {
    const ang = (t / 30) * Math.PI;
    const x = Math.round(14 + 7 * Math.sin(ang));
    const y1 = Math.round(9 - 5 * Math.cos(ang));
    const y2 = Math.round(19 - 5 * Math.cos(ang));
    if (x >= 0 && x < 28 && y1 >= 0 && y1 < 28) g[y1][x] = 1;
    if (x >= 0 && x < 28 && y2 >= 0 && y2 < 28) g[y2][x] = 1;
  }
  return g;
})();

/* ────────────────────────────────────────────────────────────────
   Helpers -- biến đổi ma trận pixel theo controls
   Tất cả đều thuần hàm để dễ test & memo hoá.
   ─────────────────────────────────────────────────────────────── */
function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  deg: number
): [number, number] {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}

function applyAugmentation(
  base: number[][],
  mix: number[][],
  ctrl: AugControls,
  seed = 1
): { grid: number[][]; rgb: [number, number, number] } {
  const H = base.length;
  const W = base[0].length;
  const out: number[][] = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => 0)
  );

  // Deterministic PRNG cho reproducibility trong playground
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 1. Xoay + lật -- tái lấy mẫu ngược
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sx = x;
      const sy = y;
      if (ctrl.flip) sx = W - 1 - sx;
      const [rx, ry] = rotatePoint(sx, sy, W / 2, H / 2, -ctrl.rotation);
      const ix = Math.round(rx);
      const iy = Math.round(ry);
      if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
        out[y][x] = base[iy][ix];
      }
    }
  }

  // 2. MixUp với ảnh số 3
  if (ctrl.mixup > 0) {
    const a = ctrl.mixup;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        out[y][x] = (1 - a) * out[y][x] + a * mix[y][x];
      }
    }
  }

  // 3. Cutout -- một vùng vuông bị che
  if (ctrl.cutout > 0) {
    const size = Math.round(ctrl.cutout * 14);
    const cx = Math.round(6 + rand() * (W - 12));
    const cy = Math.round(6 + rand() * (H - 12));
    for (let y = cy - size; y <= cy + size; y++) {
      for (let x = cx - size; x <= cx + size; x++) {
        if (x >= 0 && x < W && y >= 0 && y < H) out[y][x] = 0;
      }
    }
  }

  // 4. Noise Gaussian xấp xỉ
  if (ctrl.noise > 0) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = (rand() + rand() + rand() - 1.5) * ctrl.noise;
        out[y][x] = Math.min(1, Math.max(0, out[y][x] + n));
      }
    }
  }

  // 5. Color jitter -- lệch tông màu RGB của foreground
  const base255: [number, number, number] = [30, 41, 59]; // slate-800
  const jitter = ctrl.colorJitter;
  const rgb: [number, number, number] = [
    Math.min(255, Math.max(0, base255[0] + jitter * 180)),
    Math.min(255, Math.max(0, base255[1] + jitter * 30)),
    Math.min(255, Math.max(0, base255[2] - jitter * 120)),
  ];

  return { grid: out, rgb };
}

/* Render 28x28 grid sang SVG <rect> array */
function renderGrid(
  grid: number[][],
  rgb: [number, number, number],
  cell = 6
): JSX.Element[] {
  const out: JSX.Element[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const v = grid[y][x];
      if (v < 0.02) continue;
      out.push(
        <rect
          key={`${x}-${y}`}
          x={x * cell}
          y={y * cell}
          width={cell}
          height={cell}
          fill={`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}
          opacity={Math.min(1, v)}
        />
      );
    }
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────
   8 biến thể cố định cho gallery "1 ảnh -> 8 phiên bản"
   Các preset được chọn để phủ tất cả nhóm biến đổi.
   ─────────────────────────────────────────────────────────────── */
const GALLERY_PRESETS: { label: string; ctrl: AugControls; seed: number }[] = [
  {
    label: "Gốc",
    ctrl: { ...DEFAULT_CONTROLS },
    seed: 11,
  },
  {
    label: "Xoay +15°",
    ctrl: { ...DEFAULT_CONTROLS, rotation: 15 },
    seed: 12,
  },
  {
    label: "Xoay -20°",
    ctrl: { ...DEFAULT_CONTROLS, rotation: -20 },
    seed: 13,
  },
  {
    label: "Lật ngang",
    ctrl: { ...DEFAULT_CONTROLS, flip: true },
    seed: 14,
  },
  {
    label: "Color jitter",
    ctrl: { ...DEFAULT_CONTROLS, colorJitter: 0.7 },
    seed: 15,
  },
  {
    label: "Cutout",
    ctrl: { ...DEFAULT_CONTROLS, cutout: 0.55 },
    seed: 16,
  },
  {
    label: "Noise",
    ctrl: { ...DEFAULT_CONTROLS, noise: 0.45 },
    seed: 17,
  },
  {
    label: "MixUp 0.4",
    ctrl: { ...DEFAULT_CONTROLS, mixup: 0.4 },
    seed: 18,
  },
];

/* ────────────────────────────────────────────────────────────────
   Biểu đồ validation accuracy theo epoch -- with vs without aug
   Dữ liệu mô phỏng có xu hướng thực tế: không aug bị overfit sớm,
   có aug hội tụ cao hơn và ổn định hơn.
   ─────────────────────────────────────────────────────────────── */
const ACC_EPOCHS = 30;
const ACC_NO_AUG: number[] = [
  42, 55, 63, 69, 73, 76, 78, 79, 80, 80.5, 80.7, 80.5, 80.2, 79.9, 79.5,
  79.1, 78.8, 78.5, 78.2, 77.9, 77.6, 77.3, 77.1, 76.8, 76.5, 76.3, 76.0,
  75.8, 75.5, 75.3,
];
const ACC_WITH_AUG: number[] = [
  38, 52, 61, 68, 73, 77, 80, 82, 83.5, 85, 86, 87, 87.8, 88.4, 88.9,
  89.3, 89.6, 89.9, 90.1, 90.3, 90.5, 90.7, 90.8, 90.9, 91.0, 91.1, 91.15,
  91.2, 91.22, 91.25,
];

/* ────────────────────────────────────────────────────────────────
   QUIZ -- 8 câu hỏi (MCQ + fill-blank)
   ─────────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Data Augmentation giúp giảm overfitting?",
    options: [
      "Vì nó giảm số parameter của mô hình",
      "Vì mô hình thấy nhiều biến thể hơn, học được tính bất biến thay vì nhớ tập train",
      "Vì ảnh augmented dễ phân loại hơn ảnh gốc",
      "Vì augmentation thay đổi nhãn của dữ liệu",
    ],
    correct: 1,
    explanation:
      "Augmentation tạo nhiều biến thể (xoay, lật, đổi sáng) giúp mô hình học được tính invariance -- nhận ra xe máy dù chụp từ góc nào, ánh sáng nào. Số tham số không đổi; điều thay đổi là phân phối của dữ liệu train mà mô hình 'thấy'.",
  },
  {
    question: "Phép augmentation nào KHÔNG nên dùng cho bài toán nhận dạng chữ số viết tay?",
    options: [
      "Thay đổi độ sáng",
      "Lật ngang (horizontal flip)",
      "Xoay nhẹ (5-10 độ)",
      "Thêm nhiễu Gaussian",
    ],
    correct: 1,
    explanation:
      "Lật ngang số '6' thành '6' ngược (giống số '9') -- sai nhãn! Augmentation phải BẢO TOÀN NHÃN. Cần chọn phép biến đổi phù hợp từng bài toán.",
  },
  {
    question: "MixUp tạo dữ liệu mới bằng cách nào?",
    options: [
      "Cắt và dán vùng từ ảnh này sang ảnh khác",
      "Trộn 2 ảnh với trọng số ngẫu nhiên, nhãn cũng trộn tương ứng",
      "Thêm nhiễu ngẫu nhiên vào ảnh",
      "Xoay ảnh 180 độ",
    ],
    correct: 1,
    explanation:
      "MixUp: ảnh mới = lambda * ảnh_A + (1-lambda) * ảnh_B, nhãn mới = lambda * nhãn_A + (1-lambda) * nhãn_B. Giúp mô hình học quyết định mềm (soft decisions) và tránh overconfidence.",
  },
  {
    question:
      "Sự khác biệt cốt lõi giữa Cutout và CutMix nằm ở đâu?",
    options: [
      "Cutout che vùng bằng màu đen / zero, CutMix dán vùng từ ảnh khác vào chỗ đó",
      "Cutout áp dụng trên GPU, CutMix chỉ chạy trên CPU",
      "Cutout thay đổi nhãn, CutMix giữ nguyên nhãn",
      "Cutout chỉ dùng cho ảnh xám, CutMix cho ảnh màu",
    ],
    correct: 0,
    explanation:
      "Cutout xoá một vùng (thành 0) -- pixel bị lãng phí. CutMix thay vùng đó bằng patch của ảnh khác, đồng thời trộn nhãn theo tỉ lệ diện tích. Nhờ vậy, mô hình luôn có tín hiệu học ở mọi pixel.",
  },
  {
    question:
      "Test-Time Augmentation (TTA) cải thiện độ chính xác bằng cách nào?",
    options: [
      "Thêm dữ liệu vào tập train tại thời điểm inference",
      "Predict nhiều biến thể của cùng 1 ảnh ở inference rồi trung bình các kết quả",
      "Cho phép model tiếp tục train trên tập test",
      "Giảm kích thước ảnh test để chạy nhanh hơn",
    ],
    correct: 1,
    explanation:
      "TTA: ở inference, tạo ra ví dụ: 8 biến thể (lật, crop 4 góc, v.v.) của ảnh test, predict từng cái, rồi trung bình xác suất. Giống ensemble 'rẻ' -- không thay đổi weights, nhưng giảm phương sai dự đoán.",
  },
  {
    question:
      "Khi nào KHÔNG nên dùng RandAugment / AutoAugment trên một dataset mới?",
    options: [
      "Khi dataset nhỏ hơn 100 ảnh -- policy tìm được dễ overfit tập validation tìm kiếm",
      "Khi GPU chỉ có 24GB bộ nhớ",
      "Khi dùng Adam thay vì SGD",
      "Khi mô hình là CNN thay vì Vision Transformer",
    ],
    correct: 0,
    explanation:
      "AutoAugment tìm policy bằng cách đánh giá trên validation set. Dataset quá nhỏ làm cho policy overfit vào val đó. Với data nhỏ, nên dùng policy chuẩn đã công bố (ImageNet, CIFAR) hoặc heuristic đơn giản.",
  },
  {
    question:
      "Trong bài toán segmentation y tế, khi áp dụng augmentation hình học (xoay, lật, crop), bắt buộc phải làm gì?",
    options: [
      "Áp dụng cùng một phép biến đổi cho cả ảnh và mask nhãn pixel-level",
      "Chỉ áp dụng cho ảnh, giữ nguyên mask",
      "Đảo ngược biến đổi trên mask để bù trừ",
      "Không được phép augmentation hình học trong y tế",
    ],
    correct: 0,
    explanation:
      "Mask segmentation là 'nhãn pixel-level'. Nếu xoay ảnh nhưng không xoay mask, nhãn sẽ lệch khỏi đối tượng. Thư viện như Albumentations có API `additional_targets` để áp cùng transform cho nhiều tensor.",
  },
  {
    type: "fill-blank",
    question:
      "Phương pháp trộn 2 ảnh cùng nhãn theo trọng số ngẫu nhiên được gọi là {blank}. Phương pháp cắt một mảng vuông và dán từ ảnh khác vào, kèm trộn nhãn theo tỉ lệ diện tích, gọi là {blank}.",
    blanks: [
      { answer: "mixup", accept: ["MixUp", "mix-up", "mix up"] },
      { answer: "cutmix", accept: ["CutMix", "cut-mix", "cut mix"] },
    ],
    explanation:
      "MixUp pha trộn pixel-wise cả ảnh; CutMix chỉ dán patch + trộn nhãn. Cả hai đều regularization mạnh, thường cải thiện thêm 1-2% accuracy trên ImageNet.",
  },
];

/* ────────────────────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────────────────── */
export default function DataAugmentationTopic() {
  const [controls, setControls] = useState<AugControls>(DEFAULT_CONTROLS);
  const [seed, setSeed] = useState(42);

  const augmented = useMemo(
    () => applyAugmentation(DIGIT_SEVEN, DIGIT_THREE, controls, seed),
    [controls, seed]
  );

  const original = useMemo(
    () => applyAugmentation(DIGIT_SEVEN, DIGIT_THREE, DEFAULT_CONTROLS, 0),
    []
  );

  const updateCtrl = useCallback(
    <K extends keyof AugControls>(key: K, value: AugControls[K]) => {
      setControls((c) => ({ ...c, [key]: value }));
    },
    []
  );

  const resetCtrl = useCallback(() => {
    setControls(DEFAULT_CONTROLS);
    setSeed(42);
  }, []);

  const randomize = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
    setControls({
      rotation: Math.round((Math.random() - 0.5) * 60),
      flip: Math.random() > 0.5,
      colorJitter: Math.random() * 0.8,
      cutout: Math.random() * 0.6,
      mixup: Math.random() * 0.5,
      noise: Math.random() * 0.4,
    });
  }, []);

  /* Biểu đồ accuracy */
  const chartWidth = 520;
  const chartHeight = 180;
  const yMin = 30;
  const yMax = 95;
  const toX = (i: number) => 40 + (i / (ACC_EPOCHS - 1)) * (chartWidth - 60);
  const toY = (v: number) =>
    chartHeight - 20 - ((v - yMin) / (yMax - yMin)) * (chartHeight - 40);
  const pathNoAug = ACC_NO_AUG.map(
    (v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`
  ).join(" ");
  const pathWithAug = ACC_WITH_AUG.map(
    (v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`
  ).join(" ");

  return (
    <>
      {/* ─────────── STEP 0: PROGRESS ─────────── */}
      <ProgressSteps
        current={1}
        total={TOTAL_STEPS}
        labels={[
          "Dự đoán",
          "Khám phá",
          "Gallery",
          "Biểu đồ",
          "Aha",
          "Thử thách",
          "Chi tiết",
          "Lý thuyết",
          "Tóm tắt",
          "Quiz",
        ]}
      />

      {/* ─────────── STEP 1: PREDICTION ─────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn chỉ có 100 ảnh xe máy để huấn luyện mô hình phân loại. Mô hình bị overfitting nặng. Cách nào tốt nhất để cải thiện mà KHÔNG cần thu thập thêm ảnh?"
          options={[
            "Tăng số epoch huấn luyện",
            "Tạo biến thể mới từ 100 ảnh gốc (lật, xoay, đổi sáng...)",
            "Giảm learning rate xuống rất nhỏ",
          ]}
          correct={1}
          explanation="Data Augmentation tạo hàng nghìn biến thể từ dữ liệu có sẵn. 100 ảnh gốc x 10 phép biến đổi = 1000 ảnh huấn luyện! Mô hình học được tính bất biến thay vì nhớ tập train."
        >
          {/* ─────────── STEP 2: PLAYGROUND ─────────── */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Playground augmentation">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Kéo thả các thanh bên dưới và xem ngay hiệu ứng trên ảnh số <strong>7</strong>{" "}
              kích thước 28×28 pixel -- giống định dạng MNIST. Bên trái là ảnh gốc, bên phải là ảnh
              sau khi augment theo cấu hình hiện tại.
            </p>

            <VisualizationSection>
              <div className="space-y-6">
                {/* Hàng: ảnh gốc + ảnh augment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <svg
                        viewBox="0 0 168 168"
                        width={168}
                        height={168}
                        role="img"
                        aria-label="Ảnh gốc số 7"
                      >
                        <rect
                          x={0}
                          y={0}
                          width={168}
                          height={168}
                          fill="#0f172a"
                          rx={8}
                        />
                        {renderGrid(original.grid, original.rgb, 6)}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      Gốc (label = &quot;7&quot;)
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      key={`${controls.rotation}-${controls.flip}-${controls.colorJitter}-${controls.cutout}-${controls.mixup}-${controls.noise}-${seed}`}
                      initial={{ opacity: 0.4, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border-2 border-accent/70 bg-background/60 p-3"
                    >
                      <svg
                        viewBox="0 0 168 168"
                        width={168}
                        height={168}
                        role="img"
                        aria-label="Ảnh sau augmentation"
                      >
                        <rect
                          x={0}
                          y={0}
                          width={168}
                          height={168}
                          fill="#0f172a"
                          rx={8}
                        />
                        {renderGrid(augmented.grid, augmented.rgb, 6)}
                      </svg>
                    </motion.div>
                    <span className="text-xs font-semibold text-accent">
                      Sau augment (label VẪN = &quot;7&quot;)
                    </span>
                  </div>
                </div>

                {/* Sliders + toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ControlSlider
                    label="Góc xoay"
                    value={controls.rotation}
                    min={-45}
                    max={45}
                    step={1}
                    suffix="°"
                    onChange={(v) => updateCtrl("rotation", v)}
                  />
                  <ControlToggle
                    label="Lật ngang (flip)"
                    value={controls.flip}
                    onChange={(v) => updateCtrl("flip", v)}
                  />
                  <ControlSlider
                    label="Color jitter"
                    value={controls.colorJitter}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateCtrl("colorJitter", v)}
                  />
                  <ControlSlider
                    label="Cutout"
                    value={controls.cutout}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateCtrl("cutout", v)}
                  />
                  <ControlSlider
                    label="MixUp α"
                    value={controls.mixup}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateCtrl("mixup", v)}
                  />
                  <ControlSlider
                    label="Gaussian noise"
                    value={controls.noise}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateCtrl("noise", v)}
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={randomize}
                    className="rounded-lg bg-accent/90 hover:bg-accent text-white px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Ngẫu nhiên (🎲)
                  </button>
                  <button
                    type="button"
                    onClick={resetCtrl}
                    className="rounded-lg border border-border bg-card hover:bg-surface text-foreground px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeed((s) => s + 1)}
                    className="rounded-lg border border-border bg-card hover:bg-surface text-foreground px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Seed khác ({seed})
                  </button>
                </div>

                <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                  <p className="text-sm text-muted">
                    Nhãn vẫn là <strong className="text-foreground">&quot;7&quot;</strong>{" "}
                    dù hình ảnh thay đổi rất nhiều.  Đó chính là bất biến (invariance)
                    mà chúng ta muốn mô hình học: <em>hình dạng cấu trúc</em>{" "}mới quyết định nhãn,
                    không phải vị trí hay màu sắc cụ thể.
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── STEP 3: GALLERY 1 -> 8 ─────────── */}
          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="1 ảnh → 8 biến thể">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Trong một epoch thực tế, mỗi ảnh gốc sinh ra <strong>nhiều</strong>{" "}biến thể
              khác nhau. Dưới đây là 8 biến thể đại diện của cùng một ảnh số 7 -- đều là nhãn
              &quot;7&quot;, nhưng pixel hoàn toàn khác biệt.
            </p>

            <VisualizationSection>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
                {GALLERY_PRESETS.map((preset, i) => {
                  const result = applyAugmentation(
                    DIGIT_SEVEN,
                    DIGIT_THREE,
                    preset.ctrl,
                    preset.seed
                  );
                  return (
                    <motion.div
                      key={preset.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`rounded-xl p-2 bg-background/60 ${
                          i === 0
                            ? "border-2 border-blue-400/70"
                            : "border border-border"
                        }`}
                      >
                        <svg viewBox="0 0 112 112" width={112} height={112}>
                          <rect
                            x={0}
                            y={0}
                            width={112}
                            height={112}
                            fill="#0f172a"
                            rx={6}
                          />
                          {renderGrid(result.grid, result.rgb, 4)}
                        </svg>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          i === 0 ? "text-blue-400" : "text-accent"
                        }`}
                      >
                        {preset.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted mt-4">
                8 biến thể • cùng 1 nhãn • cùng 1 ảnh gốc. Với 100 ảnh gốc × 8 biến thể
                mỗi epoch × 50 epoch = <strong>40.000 ví dụ</strong>{" "}mà mô hình đã thấy.
              </p>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── STEP 4: CHART ACC ─────────── */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Biểu đồ validation accuracy">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              So sánh hai lần huấn luyện cùng kiến trúc, cùng dataset, cùng optimizer --
              chỉ khác ở việc có hay không có augmentation. Chú ý: đường{" "}
              <span className="text-rose-700 dark:text-rose-400 font-semibold">không aug</span>{" "}chạm đỉnh
              rồi <em>đi xuống</em>{" "}(overfit), còn đường{" "}
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">có aug</span>{" "}tiếp tục
              tăng và cao hơn ~15%.
            </p>

            <VisualizationSection>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full max-w-2xl mx-auto"
                role="img"
                aria-label="Biểu đồ val accuracy có và không có augmentation"
              >
                {/* grid */}
                {[40, 50, 60, 70, 80, 90].map((v) => (
                  <g key={v}>
                    <line
                      x1={40}
                      y1={toY(v)}
                      x2={chartWidth - 20}
                      y2={toY(v)}
                      stroke="#1e293b"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={34}
                      y={toY(v) + 3}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize={11}
                    >
                      {v}%
                    </text>
                  </g>
                ))}
                {/* axes */}
                <line
                  x1={40}
                  y1={chartHeight - 20}
                  x2={chartWidth - 20}
                  y2={chartHeight - 20}
                  stroke="#475569"
                />
                <line
                  x1={40}
                  y1={20}
                  x2={40}
                  y2={chartHeight - 20}
                  stroke="#475569"
                />
                {/* epoch ticks */}
                {[0, 10, 20, 29].map((e) => (
                  <g key={e}>
                    <line
                      x1={toX(e)}
                      y1={chartHeight - 20}
                      x2={toX(e)}
                      y2={chartHeight - 16}
                      stroke="#475569"
                    />
                    <text
                      x={toX(e)}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize={11}
                    >
                      {e + 1}
                    </text>
                  </g>
                ))}
                {/* lines */}
                <path
                  d={pathNoAug}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth={2}
                />
                <path
                  d={pathWithAug}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2}
                />

                {/* annotations */}
                <text x={toX(12)} y={toY(81)} fill="#f43f5e" fontSize={11}>
                  Peak 80.7% → rơi xuống 75.3%
                </text>
                <text x={toX(20)} y={toY(92)} fill="#10b981" fontSize={11}>
                  Aug: 91.25% ổn định
                </text>

                {/* legend */}
                <rect
                  x={chartWidth - 150}
                  y={24}
                  width={140}
                  height={36}
                  fill="#0f172a"
                  stroke="#1e293b"
                  rx={4}
                />
                <line
                  x1={chartWidth - 140}
                  y1={34}
                  x2={chartWidth - 120}
                  y2={34}
                  stroke="#f43f5e"
                  strokeWidth={2}
                />
                <text
                  x={chartWidth - 116}
                  y={37}
                  fill="#f43f5e"
                  fontSize={11}
                >
                  Không augmentation
                </text>
                <line
                  x1={chartWidth - 140}
                  y1={50}
                  x2={chartWidth - 120}
                  y2={50}
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <text
                  x={chartWidth - 116}
                  y={53}
                  fill="#10b981"
                  fontSize={11}
                >
                  Có augmentation
                </text>
              </svg>

              <div className="mt-4 grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold">
                    Không augmentation
                  </p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                    75.3%
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    sau 30 epoch (overfit)
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                    Có augmentation
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    91.25%
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    sau 30 epoch (ổn định)
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── STEP 5: AHA ─────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Data Augmentation dạy mô hình tính <strong>bất biến</strong>{" "}
                (invariance): mèo lật ngược vẫn là mèo, xe máy xoay nghiêng
                vẫn là xe máy. Giống cách trẻ em Việt Nam nhận ra{" "}
                <strong>phở</strong>{" "}dù bát to, bát nhỏ, góc chụp khác nhau
                -- vì đã thấy <strong>nhiều biến thể</strong>! Mô hình không
                được giàu &quot;kinh nghiệm&quot; kiểu đó nếu chỉ nhìn 100 ảnh cố định.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ─────────── STEP 6: CHALLENGES ─────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Bạn augment ảnh chữ số viết tay bằng cách lật ngang (horizontal flip). Chữ số '6' bị lật thành hình giống '6' ngược. Vấn đề gì xảy ra?"
                options={[
                  "Không vấn đề gì vì ảnh vẫn rõ nét",
                  "Nhãn bị sai vì '6' ngược trông giống '9'",
                  "Mô hình sẽ chạy chậm hơn",
                ]}
                correct={1}
                explanation="Augmentation phải BẢO TOÀN NHÃN! Lật '6' thành '9' là gán nhãn sai. Cần chọn phép biến đổi phù hợp từng bài toán -- không phải augmentation nào cũng đúng!"
              />

              <InlineChallenge
                question="Bạn train mô hình X-quang phổi (ảnh y tế) và bật augmentation: xoay ±30°, lật ngang, color jitter mạnh. Model đạt 95% val nhưng 68% trên test thực tế từ bệnh viện. Nguyên nhân có khả năng nhất?"
                options={[
                  "Lật ngang phá vỡ thông tin giải phẫu (tim bên trái, gan bên phải) -- augmentation không hợp lệ cho domain này",
                  "Color jitter quá yếu, cần mạnh hơn",
                  "Val set quá lớn so với test set",
                ]}
                correct={0}
                explanation="Trong X-quang phổi, trái-phải giải phẫu rất quan trọng (dextrocardia vs bình thường). Lật ngang tạo ra ảnh không tồn tại trong thực tế -- mô hình học phân phối sai. Quy tắc: augmentation phải bảo toàn semantics của domain, không chỉ nhãn class."
              />
            </div>
          </LessonSection>

          {/* ─────────── STEP 7: COLLAPSIBLES ─────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Chi tiết bổ sung">
            <div className="space-y-4">
              <CollapsibleDetail title="Khi nào augmentation KHÔNG giúp? (và dấu hiệu nhận biết)">
                <div className="space-y-3 text-sm">
                  <p>
                    Augmentation không phải thuốc tiên. Có những trường hợp nó{" "}
                    <strong>không cải thiện</strong>{" "}thậm chí{" "}
                    <strong>gây hại</strong>.  Vài pattern cần chú ý:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Dataset đã rất lớn và đa dạng:</strong>{" "}
                      ImageNet-22k hay JFT-300M có sẵn sự đa dạng tự nhiên,
                      augmentation nhẹ là đủ; policy nặng không giúp thêm.
                    </li>
                    <li>
                      <strong>Aug phá vỡ bất biến của domain:</strong>{" "}
                      lật ngang ảnh chụp đường (lane detection) -- mất thông
                      tin bên trái / bên phải đường.
                    </li>
                    <li>
                      <strong>Aug quá nặng tạo ảnh out-of-distribution:</strong>{" "}
                      rotate 180° ảnh selfie sinh ra ảnh &quot;ngược đầu&quot; không
                      bao giờ xuất hiện ở inference.
                    </li>
                    <li>
                      <strong>Label noise tăng:</strong>{" "}mixup với α quá lớn
                      làm nhãn mờ nhạt, loss khó hội tụ.
                    </li>
                  </ul>
                  <p>
                    Dấu hiệu: val accuracy <em>giảm</em>{" "}khi bật aug mạnh hơn,
                    hoặc train loss không giảm được.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Augmentation cho modality ngoài ảnh: text, audio, tabular">
                <div className="space-y-3 text-sm">
                  <p>
                    Ý tưởng augmentation áp dụng được cho mọi loại dữ liệu, chỉ
                    khác ở phép biến đổi cụ thể:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Text:</strong>{" "}back-translation (EN→FR→EN),
                      synonym replacement, random deletion/swap (EDA), và{" "}
                      <code>SpecAugment</code>{" "}trên embeddings.
                    </li>
                    <li>
                      <strong>Audio:</strong>{" "}time stretch, pitch shift,
                      add noise, SpecAugment (masking trên spectrogram).
                    </li>
                    <li>
                      <strong>Tabular:</strong>{" "}SMOTE để oversample minority,
                      Gaussian noise lên numeric, swap-noise để phá tương
                      quan giả (pseudo-correlation).
                    </li>
                    <li>
                      <strong>Time series:</strong>{" "}window warping, magnitude
                      warping, jittering -- cẩn trọng với tính nhân quả (không
                      nhìn được tương lai).
                    </li>
                  </ul>
                  <p>
                    Nguyên tắc giống nhau: <em>tạo biến thể không đổi nhãn</em>,{" "}
                    mô phỏng phân phối dữ liệu test thực tế.
                  </p>
                </div>
              </CollapsibleDetail>
            </div>
          </LessonSection>

          {/* ─────────── STEP 8: EXPLANATION ─────────── */}
          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Giải thích sâu">
            <ExplanationSection>
              <p>
                <strong>Data Augmentation</strong>{" "}tạo thêm dữ liệu huấn luyện
                bằng cách áp dụng các phép biến đổi lên dữ liệu gốc. Đây là phương
                pháp regularization hiệu quả, giảm overfitting đáng kể.  Khi kết hợp
                với <TopicLink slug="regularization">regularization</TopicLink>{" "}
                chuẩn (weight decay, dropout), augmentation thường mang lại mức
                tăng accuracy lớn nhất trong các kỹ thuật &quot;không đổi kiến trúc&quot;.
              </p>

              <Callout variant="insight" title="Ba nhóm phép biến đổi">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1. Hình học:</strong>{" "}Lật (flip), xoay (rotate),
                    cắt (crop), co giãn (scale), dịch chuyển (translate), biến dạng
                    affine / elastic.
                  </p>
                  <p>
                    <strong>2. Quang học:</strong>{" "}Đổi độ sáng, contrast,
                    bão hoà màu, thêm nhiễu, làm mờ, blur, JPEG compression,
                    posterize, solarize.
                  </p>
                  <p>
                    <strong>3. Nâng cao:</strong>{" "}MixUp, CutMix, AutoAugment,
                    RandAugment, TrivialAugment, AugMax.
                  </p>
                </div>
              </Callout>

              <p>
                <strong>MixUp</strong>{" "}-- trộn 2 ảnh cùng batch:
              </p>
              <LaTeX block>
                {"\\tilde{x} = \\lambda x_i + (1-\\lambda) x_j, \\quad \\tilde{y} = \\lambda y_i + (1-\\lambda) y_j"}
              </LaTeX>
              <p className="text-sm text-muted">
                Với <LaTeX>{"\\lambda \\sim \\text{Beta}(\\alpha, \\alpha)"}</LaTeX>,
                α thường 0.2-0.4 cho ImageNet, 1.0 cho CIFAR. Giúp mô hình học
                quyết định mềm, giảm overconfidence và cải thiện calibration.
              </p>

              <p>
                <strong>CutMix</strong>{" "}-- cắt dán vùng:
              </p>
              <LaTeX block>
                {"\\tilde{x} = M \\odot x_i + (1-M) \\odot x_j"}
              </LaTeX>
              <p className="text-sm text-muted">
                M là mask nhị phân hình chữ nhật. Nhãn tỷ lệ theo diện tích vùng.
                Hiệu quả hơn CutOut vì không lãng phí pixel. Trên ResNet-50 /
                ImageNet, CutMix cộng thêm ~1.5% top-1 so với baseline.
              </p>

              <p>
                <strong>RandAugment</strong>{" "}đơn giản hoá AutoAugment: chỉ 2 siêu
                tham số <LaTeX>{"N, M"}</LaTeX>{" "}-- số biến đổi áp đồng thời và độ mạnh.
                Hiệu quả ngang AutoAugment nhưng không cần search policy.
              </p>

              <Callout variant="warning" title="Nguyên tắc quan trọng">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Bảo toàn nhãn:</strong>{" "}Biến đổi không được thay đổi
                    ý nghĩa nhãn. Lật &quot;6&quot; thành &quot;9&quot; là sai.
                  </li>
                  <li>
                    <strong>Domain-specific:</strong>{" "}Ảnh y tế không nên đổi màu
                    quá mạnh; ảnh vệ tinh cần augmentation khác ảnh selfie; OCR
                    không lật ngang.
                  </li>
                  <li>
                    <strong>AutoAugment / RandAugment:</strong>{" "}Dùng policy tự
                    động tìm cho dataset cụ thể, tiết kiệm công thủ công.
                  </li>
                  <li>
                    <strong>Đồng bộ nhãn pixel-level:</strong>{" "}Segmentation &
                    detection cần áp cùng transform cho ảnh và mask / bbox.
                  </li>
                </ul>
              </Callout>

              <Callout variant="tip" title="Augmentation tại Việt Nam">
                VinAI sử dụng augmentation mạnh (RandAugment + CutMix) cho xe tự
                lái VinFast để mô hình ổn định trong điều kiện mưa, sương mù, và
                ánh sáng đường Việt Nam.  Bkav AI Camera dùng color jitter + cutout
                để làm mô hình nhận dạng khuôn mặt bền vững với khẩu trang và
                ánh sáng ngược chiều.
              </Callout>

              <Callout variant="info" title="So sánh hiệu quả trên CIFAR-10 (ResNet-56)">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Baseline (không aug): <strong>92.5%</strong>
                  </li>
                  <li>
                    + Random crop + flip: <strong>94.3%</strong>
                  </li>
                  <li>
                    + Cutout: <strong>94.8%</strong>
                  </li>
                  <li>
                    + AutoAugment: <strong>95.4%</strong>
                  </li>
                  <li>
                    + CutMix + RandAugment: <strong>96.0%</strong>
                  </li>
                </ul>
              </Callout>

              <CodeBlock
                language="python"
                title="Data Augmentation với Albumentations (production-ready)"
              >{`import albumentations as A
from albumentations.pytorch import ToTensorV2
import cv2

# Pipeline augmentation cho ảnh giao thông Việt Nam
# -- có thể áp cùng lúc cho image + mask (segmentation)
# -- hoặc image + bboxes (detection)

train_transform = A.Compose(
    [
        # --- Hình học ---
        A.HorizontalFlip(p=0.5),                # Lật ngang
        A.RandomRotate90(p=0.2),                # Xoay 90 độ (ảnh vệ tinh)
        A.ShiftScaleRotate(                     # Dịch + zoom + xoay
            shift_limit=0.1,
            scale_limit=0.2,
            rotate_limit=15,
            border_mode=cv2.BORDER_REFLECT_101,
            p=0.5,
        ),
        A.RandomResizedCrop(
            height=224, width=224,
            scale=(0.7, 1.0),
            ratio=(0.85, 1.15),
            p=0.5,
        ),

        # --- Quang học: chọn 1 trong 3 ---
        A.OneOf(
            [
                A.RandomBrightnessContrast(
                    brightness_limit=0.2,
                    contrast_limit=0.2,
                    p=1,
                ),
                A.HueSaturationValue(
                    hue_shift_limit=10,
                    sat_shift_limit=20,
                    val_shift_limit=15,
                    p=1,
                ),
                A.CLAHE(clip_limit=2.0, p=1),
            ],
            p=0.5,
        ),

        # --- Nhiễu / làm mờ ---
        A.OneOf(
            [
                A.GaussNoise(var_limit=(10, 50), p=1),
                A.GaussianBlur(blur_limit=(3, 5), p=1),
                A.MotionBlur(blur_limit=5, p=1),
            ],
            p=0.3,
        ),

        # --- Cutout / CoarseDropout ---
        A.CoarseDropout(
            max_holes=8, max_height=32,
            max_width=32,
            min_holes=1, min_height=8, min_width=8,
            fill_value=0,
            p=0.3,
        ),

        # --- Chuẩn hoá + tensor ---
        A.Normalize(
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        ),
        ToTensorV2(),
    ],
    # Đồng bộ transform cho mask / bbox
    additional_targets={"mask": "mask"},
)

# Validation: KHÔNG augmentation, chỉ resize + normalize
val_transform = A.Compose(
    [
        A.Resize(224, 224),
        A.Normalize(
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        ),
        ToTensorV2(),
    ]
)

# --- Sử dụng ---
class TrafficDataset(torch.utils.data.Dataset):
    def __init__(self, files, masks, transform):
        self.files = files
        self.masks = masks
        self.transform = transform

    def __getitem__(self, idx):
        img = cv2.imread(self.files[idx])
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mask = cv2.imread(self.masks[idx], cv2.IMREAD_GRAYSCALE)

        out = self.transform(image=img, mask=mask)
        return out["image"], out["mask"]

    def __len__(self):
        return len(self.files)

train_ds = TrafficDataset(train_files, train_masks, train_transform)
val_ds   = TrafficDataset(val_files, val_masks, val_transform)

# 1 ảnh gốc -> nhiều biến thể mỗi epoch
# Với batch_size=32 và 50 epoch, mỗi ảnh gốc "được thấy" ~50 lần
# nhưng mỗi lần là một biến thể khác -- chính là sức mạnh của aug.`}</CodeBlock>

              <CodeBlock
                language="python"
                title="MixUp & CutMix dưới dạng hook trong training loop"
              >{`import torch
import numpy as np


def mixup_batch(x, y, alpha=0.2, num_classes=10):
    """Trộn 2 ảnh trong cùng batch theo công thức MixUp."""
    if alpha <= 0:
        return x, torch.nn.functional.one_hot(y, num_classes).float()

    lam = np.random.beta(alpha, alpha)
    idx = torch.randperm(x.size(0), device=x.device)
    x_mixed = lam * x + (1 - lam) * x[idx]

    y_onehot = torch.nn.functional.one_hot(y, num_classes).float()
    y_mixed = lam * y_onehot + (1 - lam) * y_onehot[idx]
    return x_mixed, y_mixed


def cutmix_batch(x, y, alpha=1.0, num_classes=10):
    """Cắt một vùng từ ảnh khác rồi dán vào. Nhãn trộn theo diện tích."""
    lam = np.random.beta(alpha, alpha)
    idx = torch.randperm(x.size(0), device=x.device)

    B, C, H, W = x.shape
    cut_rat = np.sqrt(1.0 - lam)
    cw = int(W * cut_rat)
    ch = int(H * cut_rat)
    cx = np.random.randint(W)
    cy = np.random.randint(H)

    bbx1 = np.clip(cx - cw // 2, 0, W)
    bby1 = np.clip(cy - ch // 2, 0, H)
    bbx2 = np.clip(cx + cw // 2, 0, W)
    bby2 = np.clip(cy + ch // 2, 0, H)

    x_mixed = x.clone()
    x_mixed[:, :, bby1:bby2, bbx1:bbx2] = x[idx, :, bby1:bby2, bbx1:bbx2]

    # Tỉ lệ diện tích thực tế (sau khi clip)
    lam_adj = 1 - ((bbx2 - bbx1) * (bby2 - bby1) / (W * H))

    y_onehot = torch.nn.functional.one_hot(y, num_classes).float()
    y_mixed = lam_adj * y_onehot + (1 - lam_adj) * y_onehot[idx]
    return x_mixed, y_mixed


# --- Training loop ---
for x, y in train_loader:
    x, y = x.to(device), y.to(device)

    # 50% batch dùng MixUp, 25% CutMix, 25% baseline
    r = np.random.rand()
    if r < 0.5:
        x, y_soft = mixup_batch(x, y, alpha=0.2)
    elif r < 0.75:
        x, y_soft = cutmix_batch(x, y, alpha=1.0)
    else:
        y_soft = torch.nn.functional.one_hot(y, 10).float()

    logits = model(x)
    # Soft cross-entropy tương thích với nhãn mềm
    loss = -(y_soft * torch.log_softmax(logits, dim=-1)).sum(-1).mean()
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()`}</CodeBlock>
            </ExplanationSection>
          </LessonSection>

          {/* ─────────── STEP 9: SUMMARY ─────────── */}
          <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Data Augmentation tạo biến thể mới từ dữ liệu gốc, giúp mô hình học tính bất biến (invariance) thay vì nhớ tập train.",
                "3 nhóm phép biến đổi: hình học (flip, rotate, crop), quang học (brightness, color, noise), và nâng cao (MixUp, CutMix, AutoAugment).",
                "Nguyên tắc vàng: phép biến đổi phải BẢO TOÀN NHÃN và phù hợp DOMAIN -- lật '6' thành '9' hay lật X-quang phổi đều sai.",
                "MixUp trộn toàn ảnh + nhãn theo λ ~ Beta(α, α); CutMix cắt-dán patch + nhãn theo tỉ lệ diện tích; cả hai giảm overconfidence.",
                "Test-Time Augmentation (TTA) là ensemble miễn phí ở inference: predict nhiều biến thể rồi trung bình; ~0.5-1% top-1 trên ImageNet.",
                "Trong production Việt Nam: Albumentations là thư viện chuẩn, hỗ trợ đồng bộ image + mask + bbox cho detection & segmentation.",
              ]}
            />
          </LessonSection>

          {/* ─────────── STEP 10: QUIZ ─────────── */}
          <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   Small control primitives used only in the playground
   ─────────────────────────────────────────────────────────────── */
interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: ControlSliderProps) {
  const display =
    step >= 1 ? value.toFixed(0) : value.toFixed(2);
  return (
    <label className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs font-mono text-accent">
          {display}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

interface ControlToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ControlToggle({ label, value, onChange }: ControlToggleProps) {
  return (
    <label className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
          value ? "bg-accent" : "bg-muted/30"
        }`}
        aria-pressed={value}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
