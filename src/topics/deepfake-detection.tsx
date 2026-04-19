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
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "deepfake-detection",
  title: "Deepfake Detection",
  titleVi: "Phát hiện Deepfake",
  description:
    "Các phương pháp phát hiện video và hình ảnh giả mạo được tạo bởi AI",
  category: "ai-safety",
  tags: ["deepfake", "forensics", "detection"],
  difficulty: "advanced",
  relatedSlugs: ["gan", "adversarial-robustness", "ai-watermarking"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ──────────────────────────────────────────────────────────────────────────
// Dữ liệu cho 4 khuôn mặt: 2 thật và 2 giả, mỗi khuôn mặt có hồ sơ pháp y
// ──────────────────────────────────────────────────────────────────────────
type FaceProfile = {
  id: string;
  label: string;
  isFake: boolean;
  // Tín hiệu sinh học (real thường có, fake thường yếu)
  blinkRate: number; // lần / phút (người thật: 12-20)
  pulseBpm: number; // nhịp rPPG đọc từ da (chỉ ảnh thật có)
  eyeReflectionConsistency: number; // 0-1, 1 = hai mắt phản chiếu giống nhau
  // Vân tay GAN/Diffusion
  highFreqEnergy: number; // tỷ lệ năng lượng tần số cao
  symmetryScore: number; // 0-1, fake thường TOO đối xứng
  gazeStability: number; // 0-1, chuyển động mắt tự nhiên
  // Detector output
  detectorProb: number; // 0-1, probability of FAKE
  skinTone: string;
  // Câu chuyện
  story: string;
  artifacts: string[];
};

const FACES: FaceProfile[] = [
  {
    id: "face-1",
    label: "Khuôn mặt A",
    isFake: false,
    blinkRate: 17,
    pulseBpm: 74,
    eyeReflectionConsistency: 0.96,
    highFreqEnergy: 0.12,
    symmetryScore: 0.62,
    gazeStability: 0.88,
    detectorProb: 0.08,
    skinTone: "#f6d9c3",
    story:
      "Ảnh chụp từ camera DSLR, có EXIF gốc. rPPG phát hiện nhịp tim 74 bpm từ thay đổi màu da vùng trán.",
    artifacts: [
      "Có lỗ chân lông tự nhiên, phân bố ngẫu nhiên",
      "Hai mắt phản chiếu CÙNG nguồn sáng (cửa sổ bên trái)",
      "Phổ tần số: dốc 1/f tự nhiên, không có đỉnh lạ",
      "Bóng mũi khớp với hướng ánh sáng từ trên-trái",
    ],
  },
  {
    id: "face-2",
    label: "Khuôn mặt B",
    isFake: true,
    blinkRate: 4,
    pulseBpm: 0,
    eyeReflectionConsistency: 0.42,
    highFreqEnergy: 0.68,
    symmetryScore: 0.95,
    gazeStability: 0.34,
    detectorProb: 0.93,
    skinTone: "#ffe0cc",
    story:
      "StyleGAN3 generated. Nhân vật này KHÔNG tồn tại — dùng trong vụ lừa đảo Zalo tháng 3/2025.",
    artifacts: [
      "Da TRƠN bất thường — không lỗ chân lông, không vết tàn nhang",
      "Mắt trái phản chiếu cửa sổ, mắt phải phản chiếu đèn — hai nguồn sáng!",
      "Phổ Fourier có đỉnh đều đặn ở high-freq — dấu vân tay StyleGAN",
      "Khuôn mặt đối xứng đến 0.95 — người thật ~0.60-0.70",
      "Nháy mắt 4 lần/phút (bình thường 12-20) — yếu điểm GAN cũ",
    ],
  },
  {
    id: "face-3",
    label: "Khuôn mặt C",
    isFake: false,
    blinkRate: 14,
    pulseBpm: 68,
    eyeReflectionConsistency: 0.91,
    highFreqEnergy: 0.15,
    symmetryScore: 0.58,
    gazeStability: 0.82,
    detectorProb: 0.11,
    skinTone: "#e8c5a6",
    story:
      "Video call thật — có nhiễu camera, có jitter khi quay đầu, rPPG 68 bpm ổn định.",
    artifacts: [
      "Nốt ruồi nhỏ trên má trái — chi tiết bất thường, GAN hay xóa",
      "Có rung nhẹ tự nhiên (micro-movements không đều)",
      "Bóng dưới cằm khớp với ánh sáng trần",
      "Răng có rãnh, màu không đều — GAN hay tạo răng trắng quá phẳng",
    ],
  },
  {
    id: "face-4",
    label: "Khuôn mặt D",
    isFake: true,
    blinkRate: 11,
    pulseBpm: 0,
    eyeReflectionConsistency: 0.67,
    highFreqEnergy: 0.54,
    symmetryScore: 0.88,
    gazeStability: 0.48,
    detectorProb: 0.76,
    skinTone: "#f2cfb1",
    story:
      "Diffusion-based face swap (DeepFaceLab + Stable Diffusion refine). Khó phát hiện hơn StyleGAN.",
    artifacts: [
      "Tóc ranh giới NHOÈ nhẹ ở thái dương — khó khăn cho face-swap",
      "Răng: hai răng cửa có cạnh không thẳng hàng khi nói",
      "Lip-sync lệch 120ms với âm thanh — rõ khi phát âm /b/, /p/",
      "Phổ tần số có artifact KHÁC StyleGAN — dấu vân tay Diffusion",
      "Ánh sáng mắt yếu, không rõ phản chiếu",
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Arms race timeline: detector tốt hơn thì generator cũng tiến hóa
// ──────────────────────────────────────────────────────────────────────────
type ArmsRaceEntry = {
  year: number;
  generator: string;
  detectorAccuracy: number; // % trên tập mới
  weakness: string;
  detectorInnovation: string;
};

const ARMS_RACE: ArmsRaceEntry[] = [
  {
    year: 2017,
    generator: "DeepFakes (autoencoder gốc)",
    detectorAccuracy: 99,
    weakness: "Không chớp mắt, boundary mặt nhoè",
    detectorInnovation: "Phát hiện blink rate bất thường",
  },
  {
    year: 2019,
    generator: "FaceSwap + Face2Face",
    detectorAccuracy: 97,
    weakness: "Eye-reflection không khớp, teeth artifact",
    detectorInnovation: "CNN analyze eye region (EyeBlink-net)",
  },
  {
    year: 2020,
    generator: "StyleGAN2",
    detectorAccuracy: 93,
    weakness: "Dấu vân tay tần số cao",
    detectorInnovation: "Frequency-domain detector (FFT + CNN)",
  },
  {
    year: 2022,
    generator: "StyleGAN3 + first-order motion",
    detectorAccuracy: 86,
    weakness: "Chỉ còn yếu ở profile view",
    detectorInnovation: "Multi-view temporal detector",
  },
  {
    year: 2023,
    generator: "Stable Diffusion face-swap",
    detectorAccuracy: 71,
    weakness: "Phổ tần số KHÁC GAN — detector cũ fail",
    detectorInnovation: "Universal forgery detector (train đa kiến trúc)",
  },
  {
    year: 2024,
    generator: "Real-time deepfake (video call)",
    detectorAccuracy: 62,
    weakness: "Temporal consistency yếu trên frames 30fps",
    detectorInnovation: "rPPG pulse detection + active challenge",
  },
  {
    year: 2025,
    generator: "Sora-class + audio-synced",
    detectorAccuracy: 55,
    weakness: "Rất khó phân biệt — cần provenance/watermark",
    detectorInnovation: "C2PA content credentials, cryptographic provenance",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Bạn nhận video call Zalo từ 'bố' xin chuyển 50 triệu gấp. Dấu hiệu nào ĐỂ NGHI là deepfake?",
    options: [
      "Chất lượng video thấp — có thể do mạng yếu",
      "Ánh sáng mắt không khớp, da quá mịn, môi không sync tiếng Việt, khuôn mặt nhấp nháy khi nghiêng đầu",
      "Bố nói giọng Bắc thay vì giọng Nam như thường",
      "Cuộc gọi từ số lạ",
    ],
    correct: 1,
    explanation:
      "Deepfake video call qua Zalo đang là vấn nạn tại VN. Dấu hiệu: (1) mắt không phản chiếu cùng vật, (2) da quá trơn, (3) lip-sync không khớp tiếng Việt, (4) nhấp nháy khi quay đầu. XÁC MINH: hỏi câu bí mật gia đình, gọi lại qua số quen, yêu cầu đưa tay lên mặt.",
  },
  {
    question:
      "Phương pháp phân tích tần số (frequency analysis) phát hiện deepfake dựa trên gì?",
    options: [
      "Deepfake thường có âm thanh tần số cao",
      "Deepfake để lại artifact trong phổ Fourier mà mắt thường không thấy — GAN/Diffusion tạo pattern đặc trưng ở tần số cao",
      "Deepfake không có tần số thấp",
      "Phân tích tần số âm thanh của giọng nói",
    ],
    correct: 1,
    explanation:
      "GAN và Diffusion models tạo ảnh có 'dấu vân tay' đặc trưng trong miền tần số: pattern lặp lại ở high-frequency Fourier spectrum mà mắt người không thấy. Mỗi kiến trúc (StyleGAN, Stable Diffusion) có 'vân tay' khác nhau — giúp xác định cả nguồn gốc deepfake.",
  },
  {
    question: "Thách thức lớn nhất của deepfake detection hiện nay là gì?",
    options: [
      "Thiếu dữ liệu huấn luyện",
      "Generalization: detector train trên một loại deepfake (StyleGAN) thường kém trên loại khác (Diffusion), tạo cuộc chạy đua vũ trang",
      "Tốc độ xử lý quá chậm",
      "Không áp dụng được cho video",
    ],
    correct: 1,
    explanation:
      "Arms race: mỗi khi detector giỏi hơn, deepfake generator cũng giỏi hơn. Detector train trên StyleGAN deepfake có thể thất bại hoàn toàn trên Diffusion-based deepfake. Cần: (1) training đa dạng loại deepfake, (2) phương pháp không phụ thuộc kiến trúc (architecture-agnostic), (3) cập nhật liên tục.",
  },
  {
    question:
      "rPPG (remote photoplethysmography) dùng để phát hiện deepfake bằng cách nào?",
    options: [
      "Đo nhịp tim từ thay đổi màu da rất nhỏ theo nhịp tim — deepfake không có tín hiệu sinh học này",
      "Phân tích giọng nói để tìm bất thường",
      "Đo khoảng cách giữa hai mắt",
      "Đọc EXIF metadata của ảnh",
    ],
    correct: 0,
    explanation:
      "rPPG phát hiện nhịp tim bằng cách đo thay đổi màu da rất nhỏ (sub-pixel) khi máu chảy qua mao mạch. Người thật có tín hiệu 60-100 bpm ổn định, đồng bộ ở trán + má + cổ. Deepfake tạo frame độc lập → KHÔNG có tín hiệu pulse nhất quán. Phương pháp này khó bị qua mặt vì deepfake phải mô phỏng cả sinh lý học.",
  },
  {
    question:
      "Bạn muốn thử thách chủ động (active challenge) một người gọi video. Cách nào hiệu quả?",
    options: [
      "Yêu cầu họ cười",
      "Yêu cầu họ đưa bàn tay lên che một nửa mặt rồi bỏ ra, hoặc quay 90° sang bên, hoặc nhấn vào má",
      "Hỏi họ tên mình",
      "Chờ xem có artifact không",
    ],
    correct: 1,
    explanation:
      "Active challenge khai thác điểm yếu deepfake: (1) occlusion (che mặt) — deepfake không xử lý tốt vật cản, (2) profile view (quay 90°) — hầu hết GAN train trên frontal view, (3) pressure deformation (nhấn má) — deepfake không mô phỏng biến dạng da mềm. Kết hợp: yêu cầu thực hiện hành động ngẫu nhiên bạn tự nghĩ ra.",
  },
  {
    question:
      "C2PA (Content Authenticity Initiative) khác deepfake detection truyền thống ở điểm nào?",
    options: [
      "C2PA là detector mạnh hơn",
      "C2PA ký cryptographic vào metadata ngay khi camera chụp/AI tạo — xác minh NGUỒN GỐC thay vì phát hiện artifact, không bị arms race",
      "C2PA chỉ dùng cho video",
      "C2PA thay thế tất cả phương pháp khác",
    ],
    correct: 1,
    explanation:
      "C2PA (do Adobe, Microsoft, BBC, Nikon... hỗ trợ) gắn chữ ký số vào ảnh/video ngay khi sinh ra: camera chụp → ký 'chụp bởi iPhone 17, thời điểm X'; AI tạo → ký 'tạo bởi DALL-E 3'. Người xem verify chữ ký để biết nguồn gốc. Phương pháp này KHÔNG phụ thuộc vào artifact, nên không bị arms race — nhưng cần toàn bộ chuỗi sinh và phân phối hỗ trợ.",
  },
  {
    question:
      "Trong phân tích tần số, tỷ lệ năng lượng tần số cao của một ảnh thật thường là bao nhiêu?",
    options: [
      "Rất thấp (5-15%) — ảnh tự nhiên có phổ 1/f, năng lượng tập trung ở tần số thấp",
      "Rất cao (>80%)",
      "Bằng nhau ở mọi tần số",
      "Không có năng lượng tần số cao",
    ],
    correct: 0,
    explanation:
      "Ảnh tự nhiên tuân theo phổ 1/f (hay 1/f^α): năng lượng giảm khi tần số tăng. Tỷ lệ high-freq thường 5-15%. Deepfake (đặc biệt StyleGAN) có bump ở high-freq (40-70%) do upsampling layers tạo artifact đều đặn — dấu vân tay đặc trưng.",
  },
  {
    type: "fill-blank",
    question:
      "Deepfake detector được huấn luyện để phân biệt ảnh do AI {blank} và ảnh {blank} do camera ghi lại.",
    blanks: [
      { answer: "generated", accept: ["tạo", "sinh", "giả"] },
      { answer: "real", accept: ["thật", "that"] },
    ],
    explanation:
      "Deepfake detection về bản chất là bài toán nhị phân: phân biệt nội dung generated (do AI sinh) với nội dung real (do camera chụp/quay thật).",
  },
];

// Hàm tiện ích: hiển thị thanh probability detector
function ProbBar({ prob, color = "#ef4444" }: { prob: number; color?: string }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>Thật</span>
        <span className="font-semibold" style={{ color }}>
          P(fake) = {pct}%
        </span>
        <span>Giả</span>
      </div>
      <div className="h-3 rounded-full bg-surface overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: color }}
          className="h-full"
        />
      </div>
    </div>
  );
}

// Hàm tiện ích: bullet tín hiệu sinh học
function BioSignal({
  label,
  value,
  unit,
  good,
  hint,
}: {
  label: string;
  value: number | string;
  unit: string;
  good: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span
          className="text-sm font-bold"
          style={{ color: good ? "#22c55e" : "#ef4444" }}
        >
          {value} {unit}
        </span>
      </div>
      {hint ? <p className="text-[10px] text-muted mt-0.5">{hint}</p> : null}
    </div>
  );
}

// SVG khuôn mặt cách điệu — dùng để hiển thị 4 face cards
function StylizedFace({
  tone,
  highlight,
  isFake,
  showFrequency,
}: {
  tone: string;
  highlight: string | null;
  isFake: boolean;
  showFrequency: boolean;
}) {
  return (
    <svg viewBox="0 0 160 190" className="w-full h-auto">
      {/* nền */}
      <rect
        x={0}
        y={0}
        width={160}
        height={190}
        rx={12}
        fill={isFake ? "#fef2f2" : "#f0fdf4"}
      />
      {/* viền đầu */}
      <ellipse cx={80} cy={95} rx={55} ry={68} fill={tone} stroke="#92674a" strokeWidth={1.2} />
      {/* tóc */}
      <path
        d="M 25 68 Q 45 22, 80 18 Q 115 22, 135 68 Q 128 50, 80 42 Q 32 50, 25 68 Z"
        fill="#2a2118"
        opacity={0.92}
      />
      {/* mắt trái */}
      <ellipse cx={62} cy={85} rx={10} ry={5} fill="#fff" stroke="#0f172a" strokeWidth={0.8} />
      <circle cx={62} cy={85} r={3.4} fill="#2a3b4c" />
      <circle cx={61} cy={83.5} r={1.2} fill="#fff" />
      {/* mắt phải */}
      <ellipse cx={98} cy={85} rx={10} ry={5} fill="#fff" stroke="#0f172a" strokeWidth={0.8} />
      <circle cx={98} cy={85} r={3.4} fill="#2a3b4c" />
      {/* Với fake: phản chiếu sai vị trí (mô phỏng eye-reflection inconsistency) */}
      {isFake ? (
        <circle cx={100} cy={86.5} r={1.1} fill="#fff" />
      ) : (
        <circle cx={97} cy={83.5} r={1.2} fill="#fff" />
      )}
      {/* lông mày */}
      <path d="M 52 75 Q 62 71, 72 75" stroke="#2a2118" strokeWidth={1.5} fill="none" />
      <path d="M 88 75 Q 98 71, 108 75" stroke="#2a2118" strokeWidth={1.5} fill="none" />
      {/* mũi */}
      <path d="M 80 90 Q 76 105, 80 112 Q 84 108, 82 112" stroke="#92674a" strokeWidth={1} fill="none" />
      {/* miệng */}
      <path d="M 68 132 Q 80 140, 92 132" stroke="#b84b3e" strokeWidth={1.8} fill="none" />

      {/* highlight vùng khi click clue */}
      {highlight === "eyes" ? (
        <>
          <circle
            cx={62}
            cy={85}
            r={15}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="3 2"
          />
          <circle
            cx={98}
            cy={85}
            r={15}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="3 2"
          />
        </>
      ) : null}
      {highlight === "skin" ? (
        <path
          d="M 40 100 Q 50 110, 60 105 Q 80 115, 100 105 Q 110 110, 120 100"
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="3 2"
        />
      ) : null}
      {highlight === "mouth" ? (
        <path
          d="M 62 128 Q 80 146, 98 128"
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="3 2"
        />
      ) : null}
      {highlight === "hair" ? (
        <path
          d="M 25 68 Q 45 22, 80 18 Q 115 22, 135 68"
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="3 2"
        />
      ) : null}

      {/* overlay phổ tần số */}
      {showFrequency ? (
        <g opacity={0.8}>
          {Array.from({ length: 30 }, (_, i) => {
            const amp = isFake
              ? Math.abs(Math.sin(i * 1.7)) * 18 + (i > 18 ? 14 : 2)
              : Math.max(0, 22 - i * 0.7) + Math.random() * 1.5;
            return (
              <rect
                key={`freq-${i}`}
                x={10 + i * 4.7}
                y={172 - amp}
                width={3.5}
                height={amp}
                fill={isFake ? "#ef4444" : "#22c55e"}
                opacity={0.75}
              />
            );
          })}
          <line
            x1={10}
            y1={172}
            x2={150}
            y2={172}
            stroke="#0f172a"
            strokeWidth={0.5}
          />
          <text x={10} y={184} fontSize={11} fill="#64748b">
            low freq
          </text>
          <text x={130} y={184} fontSize={11} fill="#64748b">
            high
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export default function DeepfakeDetectionTopic() {
  const [selectedFaceId, setSelectedFaceId] = useState<string>("face-1");
  const [highlightClue, setHighlightClue] = useState<string | null>(null);
  const [showFrequency, setShowFrequency] = useState(false);

  // Arms race: hiển thị năm nào
  const [armsYearIdx, setArmsYearIdx] = useState(0);
  const armsEntry = ARMS_RACE[armsYearIdx];

  const selectedFace = useMemo(
    () => FACES.find((f) => f.id === selectedFaceId)!,
    [selectedFaceId],
  );

  const handleSelectFace = useCallback((id: string) => {
    setSelectedFaceId(id);
  }, []);

  const clues = [
    { id: "eyes", label: "Ánh sáng mắt" },
    { id: "skin", label: "Kết cấu da" },
    { id: "hair", label: "Đường viền tóc" },
    { id: "mouth", label: "Lip-sync" },
  ];

  // Tổng kết cho face đang chọn
  const totalArtifacts = selectedFace.artifacts.length;

  return (
    <>
      {/* ━━━ 1. PREDICTION GATE ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn nhận video call Zalo từ người thân xin chuyển tiền gấp. Video trông thật. Làm sao biết có phải deepfake?"
          options={[
            "Không thể biết — deepfake quá giống thật",
            "Quan sát kỹ: ánh sáng mắt, da, đường viền tóc, lip-sync, và YÊU CẦU XÁC MINH ngoài video",
            "Tin tưởng vì đó là video call thật",
          ]}
          correct={1}
          explanation="Deepfake 2025 rất khó phân biệt bằng mắt! Nhưng vẫn có dấu hiệu: ánh sáng mắt không khớp, da quá mịn, tóc nhoè, lip-sync sai. QUAN TRỌNG NHẤT: luôn xác minh ngoài video — gọi lại qua số quen, hỏi câu bí mật gia đình, yêu cầu hành động mà AI không giả được (đưa tay lên mặt)."
        >
          <p className="text-sm text-muted mt-2">
            Trong bài này, bạn sẽ đóng vai một thám tử pháp y AI, phân tích 4
            khuôn mặt (2 thật, 2 giả) và hiểu cuộc chạy đua vũ trang giữa
            generator và detector.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. VISUALIZATION — DEEPFAKE DETECTOR LAB ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Phòng lab pháp y">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-foreground leading-relaxed">
            Chọn một trong 4 khuôn mặt. Mỗi khuôn mặt sẽ trả về hồ sơ đầy đủ:
            tín hiệu sinh học, vân tay tần số, và xác suất detector.
          </p>
          <ProgressSteps
            current={2}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Lab",
              "A-ha",
              "Thử thách",
              "Lý thuyết",
              "Arms race",
              "Thực chiến",
              "Chi tiết",
              "Tóm tắt",
              "Quiz",
            ]}
          />
        </div>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Grid 4 face cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FACES.map((face) => {
                const active = face.id === selectedFaceId;
                return (
                  <button
                    type="button"
                    key={face.id}
                    onClick={() => handleSelectFace(face.id)}
                    className={`relative rounded-xl border-2 p-2 transition-all ${
                      active
                        ? "border-accent shadow-lg scale-[1.02]"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <StylizedFace
                      tone={face.skinTone}
                      highlight={active ? highlightClue : null}
                      isFake={face.isFake}
                      showFrequency={active && showFrequency}
                    />
                    <div className="mt-1 text-xs font-semibold text-foreground text-center">
                      {face.label}
                    </div>
                    {active ? (
                      <span
                        className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: face.isFake ? "#fee2e2" : "#dcfce7",
                          color: face.isFake ? "#b91c1c" : "#15803d",
                        }}
                      >
                        {face.isFake ? "FAKE" : "REAL"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Clue toggle bar */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted">Highlight vùng:</span>
              {clues.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() =>
                    setHighlightClue((prev) => (prev === c.id ? null : c.id))
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    highlightClue === c.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowFrequency((prev) => !prev)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showFrequency
                    ? "bg-warning text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {showFrequency ? "Ẩn phổ FFT" : "Hiện phổ FFT"}
              </button>
            </div>

            {/* Detector score bar */}
            <div className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">
                  Detector output — {selectedFace.label}
                </h4>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    background: selectedFace.isFake ? "#fee2e2" : "#dcfce7",
                    color: selectedFace.isFake ? "#b91c1c" : "#15803d",
                  }}
                >
                  Ground truth: {selectedFace.isFake ? "FAKE" : "REAL"}
                </span>
              </div>
              <ProbBar
                prob={selectedFace.detectorProb}
                color={selectedFace.isFake ? "#ef4444" : "#22c55e"}
              />
              <p className="text-xs text-muted">
                Detector trả về xác suất fake = {" "}
                <strong className="text-foreground">
                  {(selectedFace.detectorProb * 100).toFixed(0)}%
                </strong>
                . Ngưỡng quyết định thường là 0.5 (tùy use-case có thể điều
                chỉnh để ưu tiên precision hoặc recall).
              </p>
            </div>

            {/* Bio signals grid */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">
                Tín hiệu sinh trắc và vân tay
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <BioSignal
                  label="Nháy mắt"
                  value={selectedFace.blinkRate}
                  unit="lần/ph"
                  good={
                    selectedFace.blinkRate >= 12 && selectedFace.blinkRate <= 20
                  }
                  hint="Người thật: 12-20 lần/phút"
                />
                <BioSignal
                  label="Nhịp tim (rPPG)"
                  value={selectedFace.pulseBpm === 0 ? "—" : selectedFace.pulseBpm}
                  unit="bpm"
                  good={selectedFace.pulseBpm > 0}
                  hint="Đọc từ thay đổi màu da"
                />
                <BioSignal
                  label="Phản chiếu mắt"
                  value={(selectedFace.eyeReflectionConsistency * 100).toFixed(0)}
                  unit="% khớp"
                  good={selectedFace.eyeReflectionConsistency > 0.85}
                  hint="2 mắt phản chiếu giống"
                />
                <BioSignal
                  label="Năng lượng high-freq"
                  value={(selectedFace.highFreqEnergy * 100).toFixed(0)}
                  unit="%"
                  good={selectedFace.highFreqEnergy < 0.25}
                  hint="Ảnh thật: 5-20%"
                />
                <BioSignal
                  label="Đối xứng mặt"
                  value={(selectedFace.symmetryScore * 100).toFixed(0)}
                  unit="%"
                  good={selectedFace.symmetryScore < 0.75}
                  hint="Người thật: 55-70%"
                />
                <BioSignal
                  label="Ổn định mắt"
                  value={(selectedFace.gazeStability * 100).toFixed(0)}
                  unit="%"
                  good={selectedFace.gazeStability > 0.75}
                  hint="Người thật có micro-movement"
                />
              </div>
            </div>

            {/* Story + artifacts */}
            <div className="rounded-xl bg-background/60 border border-border p-4 space-y-2">
              <p className="text-xs text-muted italic">{selectedFace.story}</p>
              <div>
                <h5 className="text-xs font-bold text-foreground mb-1">
                  Manh mối pháp y ({totalArtifacts}):
                </h5>
                <ul className="space-y-1">
                  {selectedFace.artifacts.map((a, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground flex gap-2"
                    >
                      <span className="text-accent">›</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Deepfake detection giống{" "}
          <strong>giám định tranh giả</strong> — người thường nhìn bức tranh
          thấy bình thường, nhưng chuyên gia biết tìm: nét cọ không tự nhiên,
          tỷ lệ sai, chất liệu không đúng. AI phát hiện deepfake bằng cách tìm{" "}
          <strong>{'"nét cọ"'} của AI</strong>: pattern trong phổ Fourier, ánh
          sáng mắt, texture da, nhịp rPPG — những dấu vết mà AI tạo hình để
          lại mà mắt thường không thấy.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. INLINE CHALLENGES ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-4">
          <InlineChallenge
            question="Detector huấn luyện trên deepfake tạo bởi StyleGAN. Khi gặp deepfake tạo bởi Stable Diffusion, kết quả sẽ thế nào?"
            options={[
              "Phát hiện tốt vì deepfake nào cũng giống nhau",
              "Có thể THẤT BẠI HOÀN TOÀN vì mỗi kiến trúc tạo 'vân tay' khác nhau — đây là thách thức generalization",
              "Phát hiện tốt hơn vì Stable Diffusion tạo deepfake kém hơn",
              "Không ảnh hưởng gì",
            ]}
            correct={1}
            explanation="Generalization gap: StyleGAN và Diffusion tạo artifact khác nhau trong miền tần số. Detector 'học thuộc' artifact StyleGAN sẽ bỏ sót Diffusion deepfake. Giải pháp: train trên đa dạng loại deepfake, dùng multi-spectral analysis, và cập nhật liên tục."
          />
          <InlineChallenge
            question="Một video call nghi ngờ là deepfake. Bạn muốn dùng ACTIVE CHALLENGE nhanh trong vòng 5 giây. Cách nào tốt nhất?"
            options={[
              "Yêu cầu họ cười và nói 'xin chào'",
              "Yêu cầu họ dùng ngón tay CHẠM vào mũi rồi chạm vào cằm — quan sát bàn tay che một phần mặt và biến dạng da",
              "Hỏi tên của họ",
              "Gửi link để họ click",
            ]}
            correct={1}
            explanation="Active challenge tốt phải: (1) xảy ra trong khung hình (bàn tay che mặt ép deepfake xử lý occlusion), (2) biến dạng da (nhấn mũi làm da lún), (3) là hành động bạn NGẪU NHIÊN yêu cầu (không train sẵn được). Yêu cầu cười hoặc hỏi tên KHÔNG hiệu quả vì deepfake có thể mô phỏng."
          />
        </div>
      </LessonSection>

      {/* ━━━ 5. THEORY / EXPLANATION ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Deepfake Detection</strong> là các phương pháp phát hiện
            nội dung ảnh/video giả mạo tạo bởi AI (
            <TopicLink slug="gan">GAN</TopicLink>, Diffusion). Để phòng chống
            toàn diện, detection thường kết hợp với{" "}
            <TopicLink slug="ai-watermarking">AI watermarking</TopicLink> và
            content provenance (C2PA) để xác minh nguồn gốc nội dung ngay từ
            khâu sinh. Detection truyền thống có yếu điểm căn bản: luôn đi sau
            generator một bước.
          </p>

          <Callout variant="insight" title="Năm nhóm phương pháp phát hiện">
            <div className="space-y-2">
              <p>
                <strong>1. Phân tích sinh trắc:</strong> Kiểm tra blink rate,
                lip-sync, eye-reflection, rPPG pulse. Dễ hiểu nhưng deepfake
                mới đã vượt qua nhiều tiêu chí.
              </p>
              <p>
                <strong>2. Phân tích tần số (Fourier):</strong> Deepfake để
                lại {'"vân tay"'} trong phổ tần số cao. Mỗi kiến trúc (GAN,
                Diffusion) có vân tay riêng — nhưng tái train generator có
                thể xóa được.
              </p>
              <p>
                <strong>3. Neural detector:</strong> CNN/ViT (XceptionNet,
                EfficientNet, ConvNeXt) train trên tập ảnh thật + giả.
                Accuracy ~95% trên tập in-domain nhưng tụt mạnh trên deepfake
                mới.
              </p>
              <p>
                <strong>4. Temporal analysis (video):</strong> Kiểm tra nhất
                quán giữa frames — flickering, jitter, micro-movements không
                tự nhiên. Dùng 3D-CNN hoặc TimeSformer.
              </p>
              <p>
                <strong>5. Provenance / watermark:</strong> Không phát hiện
                artifact — chứng nhận nguồn gốc bằng chữ ký số. C2PA,
                SynthID. Đây là hướng bền vững nhất.
              </p>
            </div>
          </Callout>

          <p>
            Công thức phân tích tần số — deepfake có energy bất thường ở high
            frequency:
          </p>
          <LaTeX block>
            {"\\text{Score}_{\\text{fake}} = \\frac{\\sum_{f > f_0} |\\mathcal{F}(I)|^2}{\\sum_{f} |\\mathcal{F}(I)|^2}"}
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\mathcal{F}(I)"}</LaTeX> là Fourier transform của ảnh,{" "}
            <LaTeX>{"f_0"}</LaTeX> là ngưỡng tần số (thường 0.5 * Nyquist).
            Ảnh thật tuân theo phổ <LaTeX>{"1/f^\\alpha"}</LaTeX>: năng lượng
            giảm dần khi tần số tăng. Deepfake có bump bất thường do
            upsampling layers (deconvolution artifact).
          </p>

          <Callout variant="info" title="rPPG — đo nhịp tim từ video">
            Remote photoplethysmography đọc thay đổi màu da rất nhỏ (0.5-1%)
            tại vùng trán và má khi máu chảy qua mao mạch theo nhịp tim. Thuật
            toán POS (Plane-Orthogonal-to-Skin, Wang et al. 2017):
            <LaTeX block>
              {"S(t) = 3(1-\\alpha/2) R_n(t) - 2(1+\\alpha/2) G_n(t) + (1-\\alpha) B_n(t)"}
            </LaTeX>
            Sau đó dùng FFT tìm peak trong dải 0.7-4 Hz (42-240 bpm). Deepfake
            tạo frame độc lập → tín hiệu pulse không nhất quán → peak FFT yếu
            hoặc không tồn tại.
          </Callout>

          <p>Kiến trúc detector CNN cơ bản (face-forensics):</p>
          <CodeBlock language="python" title="deepfake_detector.py">
{`import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image

class DeepfakeDetector(nn.Module):
    """
    Kiến trúc detector 2 nhánh:
    - Nhánh 1: EfficientNet-B4 đọc ảnh RGB gốc
    - Nhánh 2: CNN đọc phổ FFT (high-freq features)
    - Fusion: concat + FC head
    """
    def __init__(self, num_classes: int = 2):
        super().__init__()

        # Nhánh RGB
        backbone = models.efficientnet_b4(weights=None)
        backbone.classifier = nn.Identity()
        self.rgb_branch = backbone
        self.rgb_dim = 1792

        # Nhánh tần số
        self.freq_branch = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
        )
        self.freq_dim = 128

        # Fusion head
        self.head = nn.Sequential(
            nn.Linear(self.rgb_dim + self.freq_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes),
        )

    @staticmethod
    def compute_spectrum(x: torch.Tensor) -> torch.Tensor:
        """x: [B, 3, H, W] -> log-magnitude spectrum [B, 1, H, W]."""
        gray = x.mean(dim=1, keepdim=True)
        fft = torch.fft.fft2(gray, norm="ortho")
        mag = torch.abs(torch.fft.fftshift(fft, dim=(-2, -1)))
        return torch.log1p(mag)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rgb_feat = self.rgb_branch(x)
        spectrum = self.compute_spectrum(x)
        freq_feat = self.freq_branch(spectrum)
        fused = torch.cat([rgb_feat, freq_feat], dim=1)
        return self.head(fused)


# ============== Inference pipeline ==============
def predict_deepfake(model, image_path: str, device: str = "cuda"):
    transform = transforms.Compose([
        transforms.Resize((380, 380)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])
    img = Image.open(image_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        logits = model(x)
        probs = F.softmax(logits, dim=-1)
        p_fake = probs[0, 1].item()

    if p_fake > 0.5:
        print(f"[CẢNH BÁO] Deepfake — confidence {p_fake:.1%}")
        print("Không nên tin tưởng. Xác minh qua kênh khác.")
    else:
        print(f"[OK] Có vẻ thật — confidence {1 - p_fake:.1%}")
        print("Vẫn nên xác minh nếu có yêu cầu tài chính/pháp lý.")
    return p_fake


if __name__ == "__main__":
    model = DeepfakeDetector(num_classes=2)
    model.load_state_dict(torch.load("checkpoints/detector_ff++_cdf.pth"))
    model.to("cuda")
    predict_deepfake(model, "evidence/zalo_call_frame_001.jpg")`}
          </CodeBlock>

          <Callout variant="warning" title="Deepfake lừa đảo tại Việt Nam">
            <div className="space-y-1">
              <p>
                <strong>Zalo video call:</strong> Kẻ lừa đảo dùng deepfake giả
                khuôn mặt người thân, gọi Zalo xin chuyển tiền gấp. Hàng
                nghìn vụ/năm, thiệt hại trung bình 50-500 triệu mỗi vụ.
              </p>
              <p>
                <strong>Giả mạo KOL/diễn viên:</strong> Deepfake giả
                MC/diễn viên quảng cáo sản phẩm lừa đảo trên Facebook/TikTok.
                Đã có các vụ giả MC Lại Văn Sâm, NSƯT Lê Khanh.
              </p>
              <p>
                <strong>Phòng tránh:</strong> (1) Gọi lại qua số quen/Zalo
                chính chủ, (2) Hỏi câu bí mật gia đình, (3) Active challenge
                (đưa tay che mặt, nhấn mũi), (4) KHÔNG chuyển tiền trong cùng
                cuộc gọi — hẹn 10 phút sau, (5) Báo công an 113 nếu nghi ngờ.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Pipeline detector thực tế">
            Mô hình học được đã tốt, nhưng production pipeline còn nhiều bước:
            face detection (MTCNN) → landmark alignment (68 points) → crop
            380x380 → augmentation (JPEG compression, Gaussian noise để mô
            phỏng social media) → ensemble 3-5 model khác nhau → threshold
            calibration. Bước cuối cùng — calibration — thường bị bỏ qua
            nhưng cực kỳ quan trọng khi deploy.
          </Callout>

          <p className="text-sm text-muted mt-3">
            Liên quan: khi generator cũng học từ detector feedback (
            <TopicLink slug="adversarial-robustness">adversarial</TopicLink>{" "}
            examples), detector phải được train với{" "}
            <TopicLink slug="adversarial-robustness">adversarial training</TopicLink>{" "}
            để không bị qua mặt bằng perturbation nhỏ.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. ARMS RACE TIMELINE ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Cuộc chạy đua vũ trang">
        <VisualizationSection>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Từ 2017 đến 2025: ai đang thắng?
              </h3>
              <p className="text-sm text-muted">
                Mỗi khi detector đạt ~99% trên tập hiện có, generator mới ra
                đời và kéo accuracy xuống ~60%. Đây là ví dụ điển hình của
                arms race trong AI safety.
              </p>
            </div>

            <div className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Năm: <strong className="text-foreground">{armsEntry.year}</strong>
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setArmsYearIdx((i) => Math.max(0, i - 1))}
                    disabled={armsYearIdx === 0}
                    className="px-2 py-1 text-xs rounded border border-border hover:bg-surface disabled:opacity-40"
                  >
                    ← trước
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setArmsYearIdx((i) =>
                        Math.min(ARMS_RACE.length - 1, i + 1),
                      )
                    }
                    disabled={armsYearIdx === ARMS_RACE.length - 1}
                    className="px-2 py-1 text-xs rounded border border-border hover:bg-surface disabled:opacity-40"
                  >
                    sau →
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                  <div className="text-xs text-red-700 dark:text-red-300 font-bold mb-1">
                    Generator mới
                  </div>
                  <div className="text-sm text-foreground font-semibold">
                    {armsEntry.generator}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Yếu điểm: {armsEntry.weakness}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-bold mb-1">
                    Detector phản công
                  </div>
                  <div className="text-sm text-foreground font-semibold">
                    {armsEntry.detectorInnovation}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Accuracy trên tập mới:{" "}
                    <strong
                      style={{
                        color:
                          armsEntry.detectorAccuracy > 85
                            ? "#15803d"
                            : armsEntry.detectorAccuracy > 70
                              ? "#b45309"
                              : "#b91c1c",
                      }}
                    >
                      {armsEntry.detectorAccuracy}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Mini timeline chart */}
              <svg viewBox="0 0 700 140" className="w-full">
                <text
                  x={10}
                  y={14}
                  fontSize={11}
                  fill="var(--text-tertiary, #64748b)"
                >
                  Detector accuracy theo thời gian (%)
                </text>
                <line
                  x1={40}
                  y1={110}
                  x2={680}
                  y2={110}
                  stroke="var(--border, #e2e8f0)"
                  strokeWidth={1}
                />
                {[50, 75, 100].map((y) => (
                  <g key={y}>
                    <line
                      x1={40}
                      y1={110 - (y - 50)}
                      x2={680}
                      y2={110 - (y - 50)}
                      stroke="var(--border, #e2e8f0)"
                      strokeWidth={0.5}
                      strokeDasharray="2 3"
                    />
                    <text
                      x={32}
                      y={113 - (y - 50)}
                      fontSize={11}
                      fill="var(--text-tertiary, #64748b)"
                      textAnchor="end"
                    >
                      {y}
                    </text>
                  </g>
                ))}
                {ARMS_RACE.map((e, i) => {
                  const x = 60 + (i * (620 / (ARMS_RACE.length - 1)));
                  const y = 110 - (e.detectorAccuracy - 50);
                  return (
                    <g key={e.year}>
                      <circle
                        cx={x}
                        cy={y}
                        r={i === armsYearIdx ? 6 : 4}
                        fill={i === armsYearIdx ? "#f59e0b" : "#3b82f6"}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                      {i > 0 ? (
                        <line
                          x1={60 + ((i - 1) * (620 / (ARMS_RACE.length - 1)))}
                          y1={110 - (ARMS_RACE[i - 1].detectorAccuracy - 50)}
                          x2={x}
                          y2={y}
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          opacity={0.5}
                        />
                      ) : null}
                      <text
                        x={x}
                        y={128}
                        fontSize={11}
                        textAnchor="middle"
                        fill="var(--text-tertiary, #64748b)"
                      >
                        {e.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <Callout variant="info" title="Bài học từ arms race">
              <p>
                Sau 8 năm, detector accuracy giảm từ 99% xuống 55% trên mỗi
                thế hệ generator mới. Không có detector nào {'"giải quyết'}
                {'"'} được deepfake mãi mãi. Giải pháp bền vững phải là:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>
                  <strong>Provenance-first:</strong> C2PA chữ ký số vào mọi
                  ảnh/video từ camera + AI — verify bằng public key
                </li>
                <li>
                  <strong>Watermark bắt buộc:</strong> Mỗi AI generator phải
                  nhúng watermark không xóa được (SynthID của Google)
                </li>
                <li>
                  <strong>Social verification:</strong> Xác minh qua kênh
                  khác là cuối cùng — không thay thế được
                </li>
              </ul>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 7. THỰC CHIẾN — PLAYBOOK ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Playbook thực chiến">
        <Callout variant="warning" title="Khi nhận cuộc gọi nghi ngờ">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Bước 1 — Đóng băng cảm xúc (3 giây):</strong> Lừa đảo
              luôn tạo áp lực khẩn cấp. Dừng, hít thở, không hành động ngay.
            </p>
            <p>
              <strong>Bước 2 — Active challenge (10 giây):</strong> {'"Bố ơi,'}
              {'"'} con muốn xem rõ mặt bố, bố đưa tay lên má trái rồi nói
              {' "'}chào con{'"'} nhé. Deepfake yếu ở occlusion + biến dạng
              da.
            </p>
            <p>
              <strong>Bước 3 — Câu hỏi bí mật (30 giây):</strong> Chọn câu mà
              chỉ người thật biết và khó tra cứu: {'"'}Năm lớp 8, con bị gì ở
              tay trái?{'"'} — câu có thông tin rất riêng tư.
            </p>
            <p>
              <strong>Bước 4 — Gọi lại qua kênh khác (2 phút):</strong> Cúp
              máy, gọi lại qua số đã lưu trong danh bạ. KHÔNG dùng số người
              gọi đến. Nếu không liên lạc được, gọi người thân khác xác nhận.
            </p>
            <p>
              <strong>Bước 5 — Nếu đã chuyển tiền:</strong> Báo ngân hàng
              khóa giao dịch trong 24h, báo công an 113, giữ lại mọi tin
              nhắn/lịch sử cuộc gọi làm chứng cứ.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ━━━ 8. COLLAPSIBLE DETAILS ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Chi tiết kỹ thuật">
        <div className="space-y-3">
          <CollapsibleDetail title="Vân tay tần số chi tiết — GAN vs Diffusion">
            <div className="text-sm text-foreground space-y-2">
              <p>
                <strong>StyleGAN fingerprint:</strong> Upsampling bằng
                transposed convolution với stride 2 tạo {'"checkerboard'}
                {'"'} artifact — đỉnh đều đặn tại các tần số{" "}
                <LaTeX>{"f = k \\cdot f_s / 2"}</LaTeX> với k = 1, 2, 3... Khi
                log-FFT, ta thấy {'"'}dots{'"'} đối xứng qua tâm.
              </p>
              <p>
                <strong>Diffusion fingerprint:</strong> Khác với GAN, diffusion
                sinh ảnh qua nhiều step denoising — artifact phân tán đều
                hơn ở mid-freq (10-30% Nyquist). Phổ có {'"'}halo{'"'} quanh
                trung tâm thay vì peak riêng lẻ.
              </p>
              <p>
                <strong>Universal detector:</strong> Wang et al. (2023)
                {'"'}CNN-generated images are surprisingly easy to spot{'"'}
                {' '}chỉ ra rằng detector train trên ProGAN có thể
                generalize sang nhiều GAN khác với augmentation đúng
                (Gaussian blur + JPEG). Nhưng generalization sang diffusion
                vẫn là vấn đề mở.
              </p>
              <p>
                <strong>Phản công:</strong> Generator mới (StyleGAN3) dùng
                alias-free upsampling để XÓA fingerprint tần số — nhưng tạo
                ra fingerprint khác (equivariance pattern). Đây chính là
                arms race ở tầng thuật toán.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Benchmark datasets và metrics">
            <div className="text-sm text-foreground space-y-2">
              <p>
                <strong>FaceForensics++ (FF++):</strong> 1000 video thật +
                4000 video giả (4 phương pháp: DeepFakes, Face2Face, FaceSwap,
                NeuralTextures). Benchmark chuẩn từ 2019. Xception đạt ~95%
                trên FF++ uncompressed, ~78% trên compressed.
              </p>
              <p>
                <strong>Celeb-DF v2:</strong> 590 video thật của celebrity +
                5639 video giả chất lượng cao. Khó hơn FF++ nhiều —
                detector FF++ tụt xuống ~65% accuracy.
              </p>
              <p>
                <strong>DeepFake Detection Challenge (DFDC):</strong>{" "}
                Facebook 2020, 124k video, nhiều augmentation. Winner đạt
                82% accuracy trên private test.
              </p>
              <p>
                <strong>DeeperForensics-1.0:</strong> 60k video với 7 loại
                degradation (blur, noise, compression, lighting...). Focus
                vào real-world robustness.
              </p>
              <p>
                <strong>Metrics:</strong> AUC-ROC (chuẩn nhất vì class
                balance), Accuracy, EER (Equal Error Rate). Thực tế nên báo
                cáo AUC riêng cho từng manipulation type, không gộp.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ━━━ 9. SUMMARY ━━━ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Deepfake Detection"
          points={[
            "5 nhóm dấu hiệu: sinh trắc (blink, rPPG), tần số (FFT fingerprint), neural (CNN/ViT), temporal (video), provenance (C2PA).",
            "Deepfake để lại 'vân tay' trong phổ Fourier — StyleGAN khác Diffusion khác Sora. Detector phải train đa dạng.",
            "Generalization gap là yếu điểm lớn nhất: detector train loại A thường fail trên loại B mới.",
            "rPPG đo nhịp tim từ thay đổi màu da — deepfake không có pulse signal nhất quán, khó giả.",
            "Arms race: từ 2017 đến 2025, detector accuracy rớt từ 99% xuống 55% mỗi thế hệ. Provenance/watermark là hướng bền vững.",
            "Tại VN: Zalo lừa đảo video call → playbook 5 bước: đóng băng, active challenge, câu hỏi bí mật, gọi lại kênh khác, báo 113 nếu cần.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 10. QUIZ ━━━ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
