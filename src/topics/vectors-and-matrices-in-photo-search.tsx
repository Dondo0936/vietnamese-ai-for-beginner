"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Search,
  Sun,
  Palette,
  Layers,
  ImageIcon,
  Sparkles,
  X,
  Check,
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
import {
  InlineChallenge,
  SliderGroup,
  Callout,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "vectors-and-matrices-in-photo-search",
  title: "Vectors & Matrices in Photo Search",
  titleVi: "Vector trong tìm kiếm ảnh",
  description:
    "Bạn gõ 'hoàng hôn bãi biển' và Google Photos tìm ra đúng ảnh. Mỗi ảnh trở thành một vector. So sánh hai ảnh = so sánh hai vector.",
  category: "math-foundations",
  tags: ["vectors", "embeddings", "photo-search", "application"],
  difficulty: "beginner",
  relatedSlugs: ["vectors-and-matrices"],
  vizType: "interactive",
  applicationOf: "vectors-and-matrices",
  featuredApp: {
    name: "Google Photos",
    productFeature: "Tìm kiếm bằng từ khoá và khuôn mặt",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "FaceNet: A Unified Embedding for Face Recognition and Clustering",
      publisher:
        "Florian Schroff, Dmitry Kalenichenko, James Philbin — CVPR 2015",
      url: "https://arxiv.org/abs/1503.03832",
      date: "2015-06",
      kind: "paper",
    },
    {
      title: "Search your photos by people, places & things",
      publisher: "Google Support",
      url: "https://support.google.com/photos/answer/6128838",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title:
        "Google Photos Now Stores Over 9 Trillion Photos — And the Number Is Growing Fast",
      publisher: "PetaPixel",
      url: "https://petapixel.com/2025/02/18/google-photos-now-stores-over-9-trillion-photos/",
      date: "2025-02",
      kind: "news",
    },
    {
      title:
        "Automatic large-scale clustering of faces in images and videos (US8977061B2)",
      publisher: "Google Patent",
      url: "https://patents.google.com/patent/US8977061B2",
      date: "2015-03",
      kind: "patent",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Vấn đề thật" },
    { id: "problem", labelVi: "Tại sao khó" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: 6 ảnh mẫu, mỗi ảnh có 3 tín hiệu (mô phỏng embedding)
   ──────────────────────────────────────────────────────────── */

interface PhotoSample {
  id: string;
  label: string;
  emoji: string;
  scene: string;
  // Vector 3 chiều: [màu ấm, độ mở, độ chi tiết]
  // Trong thực tế Google dùng 128-2048 chiều
  warmth: number; // 0-1: lạnh (xanh) -> ấm (đỏ/vàng)
  openness: number; // 0-1: đóng (nội thất) -> mở (ngoài trời rộng)
  detail: number; // 0-1: tối giản -> nhiều chi tiết
}

const PHOTO_BANK: PhotoSample[] = [
  {
    id: "sunset",
    label: "Hoàng hôn biển",
    emoji: "🌅",
    scene: "Biển lúc mặt trời lặn, trời cam đỏ",
    warmth: 0.92,
    openness: 0.95,
    detail: 0.3,
  },
  {
    id: "beach",
    label: "Bãi biển trưa",
    emoji: "🏖️",
    scene: "Bãi cát và sóng xanh giữa ban ngày",
    warmth: 0.65,
    openness: 0.9,
    detail: 0.45,
  },
  {
    id: "kitchen",
    label: "Bữa tối trong bếp",
    emoji: "🍲",
    scene: "Bàn ăn trong bếp, đèn vàng ấm",
    warmth: 0.78,
    openness: 0.15,
    detail: 0.8,
  },
  {
    id: "city",
    label: "Đường phố đêm",
    emoji: "🌃",
    scene: "Đèn đường, toà nhà cao, không gian dọc",
    warmth: 0.5,
    openness: 0.35,
    detail: 0.9,
  },
  {
    id: "mountain",
    label: "Núi sương mù",
    emoji: "🏔️",
    scene: "Đỉnh núi và sương, trời xanh nhạt",
    warmth: 0.2,
    openness: 0.95,
    detail: 0.25,
  },
  {
    id: "cafe",
    label: "Góc quán cà phê",
    emoji: "☕",
    scene: "Ly cà phê và bàn gỗ, ánh sáng ấm",
    warmth: 0.82,
    openness: 0.2,
    detail: 0.65,
  },
];

/* ────────────────────────────────────────────────────────────
   TIỆN ÍCH
   ──────────────────────────────────────────────────────────── */

function cosineSim3D(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const la = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2);
  const lb = Math.sqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2);
  if (la < 0.001 || lb < 0.001) return 0;
  return dot / (la * lb);
}

function photoVec(p: PhotoSample): [number, number, number] {
  return [p.warmth, p.openness, p.detail];
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ: ảnh minh hoạ + 3 thanh tín hiệu
   ──────────────────────────────────────────────────────────── */

interface PhotoCardProps {
  photo: PhotoSample;
  similarity?: number;
  highlight?: boolean;
}

function PhotoCard({ photo, similarity, highlight }: PhotoCardProps) {
  const simColor =
    similarity === undefined
      ? "#6b7280"
      : similarity > 0.9
        ? "#10b981"
        : similarity > 0.75
          ? "#22c55e"
          : similarity > 0.55
            ? "#f59e0b"
            : "#ef4444";

  return (
    <motion.div
      animate={{
        borderColor: highlight ? simColor : "var(--border)",
        boxShadow: highlight ? `0 0 0 2px ${simColor}55` : "none",
      }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border-2 bg-card p-3 space-y-2"
    >
      {/* Ảnh giả lập: emoji + nền gradient theo ấm/lạnh */}
      <div
        className="relative aspect-video rounded-lg flex items-center justify-center text-4xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${
            photo.warmth > 0.6
              ? "#fbbf24"
              : photo.warmth > 0.4
                ? "#94a3b8"
                : "#60a5fa"
          } 0%, ${
            photo.warmth > 0.6
              ? "#f97316"
              : photo.warmth > 0.4
                ? "#64748b"
                : "#3b82f6"
          } 100%)`,
        }}
      >
        <span className="drop-shadow">{photo.emoji}</span>
        {similarity !== undefined && (
          <span
            className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${simColor}dd`,
              color: "white",
            }}
          >
            {(similarity * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-foreground">
          {photo.label}
        </div>

        {/* 3 thanh tín hiệu — "embedding mini" */}
        <div className="space-y-1">
          <BarRow
            icon={Sun}
            label="Ấm/lạnh"
            value={photo.warmth}
            color="#f59e0b"
          />
          <BarRow
            icon={Layers}
            label="Mở/đóng"
            value={photo.openness}
            color="#3b82f6"
          />
          <BarRow
            icon={Palette}
            label="Chi tiết"
            value={photo.detail}
            color="#8b5cf6"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface BarRowProps {
  icon: typeof Sun;
  label: string;
  value: number;
  color: string;
}

function BarRow({ icon: Icon, label, value, color }: BarRowProps) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <Icon size={10} style={{ color }} className="shrink-0" />
      <span className="text-muted w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="font-mono text-tertiary w-8 text-right">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIZ — kiểm tra hiểu biết sau khi xem ứng dụng
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Google Photos biến mỗi khuôn mặt thành một vector 128 chiều. Vector 128 chiều là gì?",
    options: [
      "Một ảnh có 128 pixel",
      "Một danh sách 128 con số, mỗi số mô tả một đặc điểm nhỏ của khuôn mặt",
      "Một ma trận 128 × 128",
      "Một câu chú thích dài 128 từ",
    ],
    correct: 1,
    explanation:
      "Vector 128 chiều đơn giản là một dãy 128 con số. Mỗi con số đại diện cho một 'đặc điểm' được mô hình FaceNet học ra — chúng thay thế hàng triệu pixel bằng 128 con số giữ lại ý nghĩa.",
  },
  {
    question:
      "Tại sao cosine similarity phù hợp hơn phép so sánh pixel-từng-pixel khi tìm ảnh giống nhau?",
    options: [
      "Vì cosine nhanh hơn một chút",
      "Vì cosine chỉ quan tâm đến 'hướng' của vector, không bị ảnh hưởng bởi độ sáng tổng thể hay kích thước ảnh",
      "Vì so sánh pixel đã bị cấm bản quyền",
      "Vì cosine luôn cho kết quả cao hơn",
    ],
    correct: 1,
    explanation:
      "Hai ảnh của cùng một bà ngoại chụp trong ngày nắng và trong nhà có pixel rất khác. Nhưng vector embedding của chúng vẫn chỉ cùng một hướng. Cosine đo hướng, không đo độ dài — đó là lý do nó bền vững trước thay đổi ánh sáng.",
  },
  {
    question:
      "Nếu Google tìm ảnh bằng cách so sánh vector truy vấn với 9 nghìn tỷ vector khác, chuyện gì sẽ xảy ra?",
    options: [
      "Kết quả trả về trong 1 mili-giây",
      "Sẽ tốn hàng giờ đến hàng ngày cho mỗi truy vấn — không khả thi",
      "Máy chủ Google sẽ tự tắt",
      "Ảnh sẽ tự xoá",
    ],
    correct: 1,
    explanation:
      "Đây là lý do Google dùng thuật toán Approximate Nearest Neighbor (ANN). Thay vì so từng vector, ANN xây dựng cấu trúc chỉ mục để loại bỏ 99% vector rõ ràng xa và chỉ kiểm tra vài chục vector gần. Đánh đổi chút chính xác lấy tốc độ nhanh hàng nghìn lần.",
  },
  {
    question:
      "Bạn có hai vector 128 chiều từ hai ảnh. Cosine của chúng là 0,97. Điều này có nghĩa là gì?",
    options: [
      "Hai ảnh hoàn toàn khác nhau",
      "Hai ảnh có khả năng rất cao là cùng một người hoặc cùng cảnh",
      "Ảnh bị lỗi",
      "Phải dùng thêm một thuật toán khác để quyết định",
    ],
    correct: 1,
    explanation:
      "Cosine 0,97 rất gần mức tối đa (1,0) — hai vector chỉ gần như cùng một hướng. Trong thực tế, Google đặt ngưỡng quyết định (ví dụ 0,9) để tự động gom hai ảnh vào cùng một album khuôn mặt.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function VectorsAndMatricesInPhotoSearch() {
  // State cho mini-demo 1: chọn 2 ảnh, xem cosine
  const [leftId, setLeftId] = useState<string>("sunset");
  const [rightId, setRightId] = useState<string>("beach");

  // State cho mini-demo 3: chọn 1 ảnh "câu truy vấn", sau khi gate
  const [showQueryDemo, setShowQueryDemo] = useState(false);

  const leftPhoto = useMemo(
    () => PHOTO_BANK.find((p) => p.id === leftId) ?? PHOTO_BANK[0],
    [leftId],
  );
  const rightPhoto = useMemo(
    () => PHOTO_BANK.find((p) => p.id === rightId) ?? PHOTO_BANK[1],
    [rightId],
  );
  const pairCosine = useMemo(
    () => cosineSim3D(photoVec(leftPhoto), photoVec(rightPhoto)),
    [leftPhoto, rightPhoto],
  );

  const pairLabel =
    pairCosine > 0.95
      ? "Hai ảnh gần như giống hệt theo cả ba tín hiệu"
      : pairCosine > 0.85
        ? "Rất giống nhau — cùng một 'họ' ảnh"
        : pairCosine > 0.65
          ? "Hơi giống — có điểm chung nhưng khác nhiều"
          : pairCosine > 0.4
            ? "Khác nhiều — chỉ có chút điểm chung"
            : "Hầu như khác hẳn";

  const pairColor =
    pairCosine > 0.85
      ? "#10b981"
      : pairCosine > 0.65
        ? "#22c55e"
        : pairCosine > 0.4
          ? "#f59e0b"
          : "#ef4444";

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Vector và ma trận">
      {/* ═══════════════════════════════════════════════════════════
          HERO — Vì sao Google Photos nhận ra ảnh giống nhau
          ═══════════════════════════════════════════════════════════ */}
      <ApplicationHero
        parentTitleVi="Vector và ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <p>
          Bạn mở Google Photos, gõ &ldquo;hoàng hôn bãi biển&rdquo; —
          hàng trăm tấm ảnh của bạn suốt 5 năm qua hiện ra trong một
          giây. Không phải bạn đã dán nhãn cho từng tấm. Máy tự nhận ra.
          Làm sao?
        </p>
        <p>
          Câu trả lời ngắn: <strong>mỗi ảnh được biến thành một mũi tên</strong>{" "}
          (vector) trong không gian nhiều chiều. Hai ảnh giống nhau →
          hai mũi tên chỉ cùng hướng. Việc &ldquo;so sánh hai bức ảnh&rdquo;
          phức tạp được thu gọn thành: so sánh hai mũi tên có cùng hướng
          không. Mà cái đó thì bạn đã biết làm — nó chính là{" "}
          <TopicLink slug="vectors-and-matrices">
            tích vô hướng và cosine similarity
          </TopicLink>{" "}
          bạn vừa học ở bài trước.
        </p>

        {/* Mini demo 1: ảnh thật trở thành 3 thanh số */}
        <div className="not-prose mt-5 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Thử ngay: chọn hai ảnh và xem chúng &ldquo;giống nhau bao
              nhiêu&rdquo;
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Mỗi thẻ ảnh dưới đây có 3 thanh màu. Mỗi thanh là một con số
            giữa 0 và 1, mô tả một đặc điểm của ảnh: ấm/lạnh, rộng/hẹp,
            nhiều chi tiết/ít chi tiết. Trong thực tế, Google dùng{" "}
            <strong>128 đến 2048 con số</strong> cho mỗi ảnh — nhưng
            nguyên tắc giống hệt.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PHOTO_BANK.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (leftId === p.id) return;
                  if (rightId === p.id) setRightId(leftId);
                  setLeftId(p.id);
                }}
                className={`text-left rounded-lg border transition-colors ${
                  leftId === p.id
                    ? "border-blue-500"
                    : rightId === p.id
                      ? "border-red-500"
                      : "border-border hover:border-accent/50"
                }`}
              >
                <PhotoCard photo={p} />
                <div className="px-2 py-1 text-[10px] text-center border-t border-border bg-surface/60 rounded-b-lg">
                  {leftId === p.id
                    ? "Ảnh A"
                    : rightId === p.id
                      ? "Ảnh B"
                      : "Bấm để chọn"}
                </div>
              </button>
            ))}
          </div>

          {/* Kết quả so sánh */}
          <div className="rounded-lg bg-surface/60 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-500 font-semibold">
                  A: {leftPhoto.label}
                </span>
                <span className="text-muted">vs</span>
                <span className="text-red-500 font-semibold">
                  B: {rightPhoto.label}
                </span>
              </div>
              <span
                className="font-mono text-sm font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${pairColor}22`,
                  color: pairColor,
                }}
              >
                cosine = {pairCosine.toFixed(2)}
              </span>
            </div>
            <p className="text-xs italic" style={{ color: pairColor }}>
              {pairLabel}
            </p>
            <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{
                  width: `${((pairCosine + 1) / 2) * 100}%`,
                  backgroundColor: pairColor,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <p className="text-[11px] text-tertiary italic">
            Quan sát: hai ảnh ngoài trời (hoàng hôn và bãi biển) có
            cosine cao. Ảnh bếp và ảnh núi thì cosine thấp. Cả một bài
            toán &ldquo;hai ảnh có giống nhau không?&rdquo; thu gọn
            thành <em>một con số duy nhất</em>.
          </p>
        </div>
      </ApplicationHero>

      {/* ═══════════════════════════════════════════════════════════
          PROBLEM — Tại sao bài toán khó
          ═══════════════════════════════════════════════════════════ */}
      <ApplicationProblem topicSlug="vectors-and-matrices-in-photo-search">
        <p>
          Google Photos lưu trữ hơn <strong>9 nghìn tỷ</strong> tấm ảnh,
          phục vụ <strong>1,5 tỷ</strong> người dùng mỗi tháng, với{" "}
          <strong>28 tỷ ảnh mới</strong> được tải lên mỗi tuần. Bạn có
          thể có 20.000 tấm trong thư viện cá nhân — chụp từ nhiều năm,
          nhiều góc, nhiều đèn, nhiều mùa.
        </p>
        <p>
          Bài toán cốt lõi: khi bạn gõ từ khoá hoặc bấm vào khuôn mặt bà
          ngoại, máy phải trả về đúng những ảnh liên quan, trong{" "}
          <strong>mili-giây</strong>, và phải đúng dù bà đang đội nón
          lá, đeo kính, hay cười to. Không có thời gian cho máy &ldquo;xem
          từng tấm và nghĩ&rdquo;.
        </p>

        {/* Minh hoạ: đống ảnh và một phép đọc số */}
        <div className="not-prose mt-5 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Vì sao không thể so sánh pixel-từng-pixel?
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-3 space-y-2">
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <X size={12} aria-hidden="true" />
                Cách ngây thơ: so sánh từng pixel
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Mỗi ảnh 1 triệu pixel. So sánh 2 ảnh = 1 triệu phép trừ.
                Hai ảnh cùng chủ thể chụp khác góc → pixel khác hoàn toàn
                → sai. Hai ảnh khác nhau mà cùng màu → pixel giống → sai.
                <strong> Vô dụng.</strong>
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 space-y-2">
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Check size={12} aria-hidden="true" />
                Cách của Google: biến ảnh thành vector ý nghĩa
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Mỗi ảnh → một mũi tên 128 chiều (vector nhúng). Hai ảnh
                cùng chủ thể → mũi tên chỉ cùng hướng, bất kể góc chụp
                hay ánh sáng. So sánh = tính cosine. Mili-giây trên hàng
                tỷ ảnh. <strong>Hoạt động.</strong>
              </p>
            </div>
          </div>

          <InlineChallenge
            question="Bạn có 20.000 ảnh trong thư viện. Nếu so sánh pixel-từng-pixel cho mỗi truy vấn, việc tìm kiếm sẽ tốn bao lâu trên điện thoại?"
            options={[
              "Gần như ngay lập tức — điện thoại rất nhanh",
              "Vài giây là xong",
              "Hàng phút — không đủ nhanh cho trải nghiệm người dùng",
              "Không so sánh được, thuật toán báo lỗi",
            ]}
            correct={2}
            explanation="So sánh pixel cần khối lượng tính toán khổng lồ: 20.000 ảnh × 1 triệu pixel × so sánh từng màu = không kịp. Đó là lý do Google biến mỗi ảnh thành một vector nhỏ 128 chiều — so sánh 128 con số nhanh hơn 1 triệu pixel hàng triệu lần."
          />
        </div>
      </ApplicationProblem>

      {/* ═══════════════════════════════════════════════════════════
          MECHANISM — 4 bước giải quyết
          ═══════════════════════════════════════════════════════════ */}
      <ApplicationMechanism
        parentTitleVi="Vector và ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <Beat step={1}>
          <p>
            <strong>Phát hiện đối tượng trong ảnh</strong> (face detection,
            object detection). Một mô hình nhỏ quét qua ảnh, khoanh hình
            chữ nhật quanh khuôn mặt, xe, cây, món ăn. Mục tiêu chỉ là:
            tách phần đáng quan tâm khỏi nền.
          </p>
          <div className="not-prose mt-3 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Camera size={12} />
              Mỗi khuôn mặt được đóng khung riêng trước khi đi tiếp.
            </div>
          </div>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Biến ảnh thành vector (embedding)</strong>. Mạng
            FaceNet của Google nhận vùng ảnh khuôn mặt và nhả ra một
            vector 128 chiều. Được huấn luyện trên 100-200 triệu ảnh,
            mạng học được quy tắc: cùng người → hai vector gần nhau,
            khác người → hai vector xa nhau, bất kể ánh sáng hay góc
            chụp.
          </p>

          {/* Minh hoạ: 3 ảnh và embedding của chúng */}
          <div className="not-prose mt-3 space-y-2">
            <p className="text-xs text-muted">
              Minh hoạ (bản rút gọn 3 chiều thay vì 128):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[PHOTO_BANK[0], PHOTO_BANK[1], PHOTO_BANK[4]].map((p) => (
                <PhotoCard key={p.id} photo={p} />
              ))}
            </div>
            <p className="text-xs text-muted italic">
              Hai ảnh đầu (hoàng hôn và bãi biển) có ba thanh gần giống
              nhau → vector gần nhau. Ảnh núi có thanh &ldquo;ấm&rdquo;
              rất thấp → vector xa.
            </p>
          </div>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Đo khoảng cách giữa các vector</strong>. Với hai
            vector đã tính, Google dùng cosine similarity hoặc khoảng
            cách Euclid. Cosine gần 1 → cùng người / cùng cảnh. Gần 0 →
            hai bức ảnh không liên quan.
          </p>

          {/* Mini demo 3: query vector bằng SliderGroup */}
          {!showQueryDemo ? (
            <div className="not-prose mt-4">
              <button
                type="button"
                onClick={() => setShowQueryDemo(true)}
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-accent-dark transition-colors"
              >
                <Search size={14} />
                Thử mô phỏng câu truy vấn của bạn
              </button>
            </div>
          ) : (
            <div className="not-prose mt-4">
              <SliderGroup
                title="Giả lập 'câu truy vấn' và xem ảnh nào phản hồi"
                sliders={[
                  {
                    key: "warmth",
                    label: "Tôi muốn ảnh ấm / vàng",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.85,
                  },
                  {
                    key: "openness",
                    label: "Tôi muốn không gian rộng / ngoài trời",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.8,
                  },
                  {
                    key: "detail",
                    label: "Tôi muốn nhiều chi tiết",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.3,
                  },
                ]}
                visualization={(values) => (
                  <QueryResult values={values} />
                )}
              />
            </div>
          )}
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Gom các ảnh gần nhau thành cụm</strong> (clustering).
            Tất cả ảnh của cùng một người được xếp chung nhóm → album
            &ldquo;Bà Ngoại&rdquo;. Với hàng tỷ ảnh, Google dùng kỹ thuật
            tìm láng giềng gần đúng (ANN) để trả kết quả trong mili-giây
            thay vì so sánh hết 20.000 vector cá nhân của bạn.
          </p>

          {/* Minh hoạ clustering: các ảnh gom nhóm */}
          <div className="not-prose mt-3 rounded-lg border border-border bg-card p-3 space-y-3">
            <p className="text-xs text-muted">
              Minh hoạ: ở đây 6 ảnh được tự gom thành 3 cụm theo độ
              tương đồng (mỗi cụm có 2 ảnh gần nhau nhất theo cosine).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  name: "Cụm 'ngoài trời ấm'",
                  color: "#f59e0b",
                  photos: [PHOTO_BANK[0], PHOTO_BANK[1]],
                },
                {
                  name: "Cụm 'trong nhà ấm'",
                  color: "#ef4444",
                  photos: [PHOTO_BANK[2], PHOTO_BANK[5]],
                },
                {
                  name: "Cụm 'ngoài trời mát'",
                  color: "#3b82f6",
                  photos: [PHOTO_BANK[3], PHOTO_BANK[4]],
                },
              ].map((cluster) => (
                <div
                  key={cluster.name}
                  className="rounded-lg border p-2 space-y-1"
                  style={{ borderColor: cluster.color + "55" }}
                >
                  <div
                    className="text-[10px] font-semibold"
                    style={{ color: cluster.color }}
                  >
                    {cluster.name}
                  </div>
                  <div className="flex gap-2">
                    {cluster.photos.map((p) => (
                      <div
                        key={p.id}
                        className="flex-1 aspect-square rounded flex items-center justify-center text-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${
                            p.warmth > 0.6
                              ? "#fbbf24"
                              : p.warmth > 0.4
                                ? "#94a3b8"
                                : "#60a5fa"
                          }, ${
                            p.warmth > 0.6
                              ? "#f97316"
                              : p.warmth > 0.4
                                ? "#64748b"
                                : "#3b82f6"
                          })`,
                        }}
                      >
                        {p.emoji}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <InlineChallenge
            question="Bạn đang có 20.000 ảnh trong thư viện. Google cần tìm tất cả ảnh của bà ngoại. Thuật toán nào giúp việc này chạy trong mili-giây?"
            options={[
              "So sánh vector bà với toàn bộ 20.000 vector khác, chờ vài giây",
              "Dùng tìm láng giềng gần đúng (ANN) — bỏ qua hầu hết vector rõ ràng khác, chỉ kiểm tra những vector có khả năng gần",
              "Tạo một ảnh mẫu bà rồi đếm pixel",
              "Hỏi người dùng dán nhãn thủ công",
            ]}
            correct={1}
            explanation="ANN (Approximate Nearest Neighbor) là chìa khoá. Thay vì so từng vector một, ANN xây dựng trước một cấu trúc chỉ mục sao cho khi có câu truy vấn, hệ thống loại bỏ 99% vector rõ ràng xa và chỉ kiểm tra vài chục vector có khả năng gần. Đổi lại chút sai số nhỏ, tốc độ nhanh hàng nghìn lần."
          />
        </Beat>

        <Callout variant="insight" title="Đại số tuyến tính cứu cuộc sống">
          Mỗi lần bạn tìm &ldquo;chó&rdquo;, &ldquo;bánh sinh nhật&rdquo;, hay bấm
          vào khuôn mặt em trai, cả hệ thống đang: (1) chuyển ảnh thành
          vector, (2) tính cosine với một vector truy vấn, (3) sắp xếp
          theo cosine giảm dần, (4) trả về top 50. Toán của bài trước —
          cộng vector, nhân vô hướng, tích vô hướng — đã làm được điều
          kỳ diệu đó.
        </Callout>
      </ApplicationMechanism>

      {/* ═══════════════════════════════════════════════════════════
          METRICS
          ═══════════════════════════════════════════════════════════ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <Metric
          value="Độ chính xác 99,63% trên bộ chuẩn LFW (nhận diện khuôn mặt) — vượt mức 97,53% của con người"
          sourceRef={1}
        />
        <Metric
          value="Mỗi khuôn mặt được biểu diễn bằng vector 128 chiều — thay vì so sánh hàng triệu pixel"
          sourceRef={1}
        />
        <Metric
          value="Lưu trữ hơn 9 nghìn tỷ tấm ảnh, phục vụ 1,5 tỷ người dùng mỗi tháng"
          sourceRef={3}
        />
        <Metric
          value="Tìm kiếm trả kết quả trên hàng tỷ vector chỉ trong mili-giây nhờ thuật toán láng giềng gần đúng (ANN)"
          sourceRef={4}
        />
      </ApplicationMetrics>

      {/* ═══════════════════════════════════════════════════════════
          COUNTERFACTUAL
          ═══════════════════════════════════════════════════════════ */}
      <ApplicationCounterfactual
        parentTitleVi="Vector và ma trận"
        topicSlug="vectors-and-matrices-in-photo-search"
      >
        <p>
          Không có vector embedding, Google Photos sẽ phải so sánh
          trực tiếp từng điểm ảnh của mỗi khuôn mặt với hàng tỷ khuôn
          mặt khác. Chỉ cần bạn đội mũ, đeo kính, hoặc chụp ở ánh sáng
          khác — kết quả sai hoàn toàn.
        </p>
        <p>
          Biến mỗi khuôn mặt thành vector 128 chiều, Google chuyển một
          bài toán nhận diện ảnh siêu phức tạp thành phép đo khoảng
          cách đơn giản giữa hai mảng số. Đây là bí mật giúp mọi tính
          năng tìm kiếm thông minh của Photos hoạt động — và cũng là
          cốt lõi của Spotify gợi ý nhạc, TikTok gợi ý video, và hầu
          hết AI hiện đại.
        </p>

        <div className="not-prose mt-5">
          <MiniSummary
            title="Ba điều cần nhớ từ ứng dụng này"
            points={[
              "Mỗi ảnh được biến thành một vector 128 chiều — hai ảnh giống nhau có vector gần nhau.",
              "So sánh hai ảnh = so sánh hai vector = tính cosine similarity. Bài toán phức tạp thu gọn về một con số.",
              "Hàng tỷ ảnh × hàng tỷ người dùng hoạt động được trong mili-giây nhờ thuật toán tìm láng giềng gần đúng.",
            ]}
          />
        </div>

        <div className="not-prose mt-5">
          <Callout variant="tip" title="Ôn lại nền tảng">
            Muốn hiểu sâu hơn cosine similarity, tích vô hướng, hay lý
            do vector trả lời được cho bài toán so sánh ảnh? Quay về
            bài{" "}
            <TopicLink slug="vectors-and-matrices">
              Vector và ma trận
            </TopicLink>{" "}
            — ba sân chơi tương tác ở đó chính là nền cho toàn bộ hệ
            thống này.
          </Callout>
        </div>

        <div className="not-prose mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT PHỤ: QueryResult — hiển thị top 3 ảnh khớp với query
   ════════════════════════════════════════════════════════════ */

interface QueryResultProps {
  values: Record<string, number>;
}

function QueryResult({ values }: QueryResultProps) {
  const queryVec: [number, number, number] = [
    values.warmth ?? 0.5,
    values.openness ?? 0.5,
    values.detail ?? 0.5,
  ];

  const scored = PHOTO_BANK.map((p) => ({
    photo: p,
    sim: cosineSim3D(photoVec(p), queryVec),
  })).sort((a, b) => b.sim - a.sim);

  const top3 = scored.slice(0, 3);
  const rest = scored.slice(3);

  return (
    <div className="w-full space-y-4">
      {/* Query vector hiển thị */}
      <div className="rounded-lg bg-card border border-border p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Search size={12} className="text-accent" />
          Vector câu truy vấn của bạn
        </div>
        <div className="space-y-1.5">
          <BarRow
            icon={Sun}
            label="Ấm/lạnh"
            value={queryVec[0]}
            color="#f59e0b"
          />
          <BarRow
            icon={Layers}
            label="Mở/đóng"
            value={queryVec[1]}
            color="#3b82f6"
          />
          <BarRow
            icon={Palette}
            label="Chi tiết"
            value={queryVec[2]}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Top 3 ảnh khớp nhất */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
          <Sparkles size={12} className="text-accent" />
          Top 3 ảnh khớp nhất (cosine cao nhất)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <AnimatePresence mode="popLayout">
            {top3.map((item) => (
              <motion.div
                key={item.photo.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <PhotoCard
                  photo={item.photo}
                  similarity={item.sim}
                  highlight
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Phần còn lại: hiện mờ đi */}
      <div>
        <div className="text-[11px] text-tertiary mb-2">
          Các ảnh còn lại (điểm thấp hơn, bị hệ thống xếp xuống dưới):
        </div>
        <div className="flex gap-2 flex-wrap opacity-60">
          {rest.map((item) => (
            <div
              key={item.photo.id}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[10px]"
            >
              <span>{item.photo.emoji}</span>
              <span className="text-muted">{item.photo.label}</span>
              <span className="font-mono text-tertiary">
                {(item.sim * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-tertiary italic text-center">
        Kéo thanh → vector truy vấn đổi → Top 3 cũng thay đổi. Google
        làm y hệt, nhưng trên 20.000 ảnh riêng của bạn và 128 chiều
        thay vì 3.
      </p>
    </div>
  );
}
