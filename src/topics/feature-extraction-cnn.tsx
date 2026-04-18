"use client";

import { useMemo, useState } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "feature-extraction-cnn",
  title: "CNN Feature Extraction",
  titleVi: "Trích xuất đặc trưng CNN",
  description:
    "Cách mạng nơ-ron tích chập tự động học và trích xuất đặc trưng thị giác từ đơn giản đến phức tạp qua các lớp.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "features"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "convolution", "image-classification"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU VÀ CẤU TRÚC
 * Một bức ảnh số 28×28 được mô phỏng dưới dạng mảng nhị phân.
 * Mỗi lớp conv có nhiều bộ lọc (filter); mỗi filter tạo ra một
 * feature map làm nổi bật vùng ảnh khớp với mẫu học được.
 * ────────────────────────────────────────────────────────────── */

// Ảnh số "3" dạng 28×28 (1 = pixel đen, 0 = pixel trắng).
// Giữ đơn giản bằng pattern đối xứng để các filter edge/curve
// có activation rõ ràng, dễ nhận biết trên SVG.
const DIGIT_3: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Bộ lọc 3×3 — mỗi filter đại diện cho một "mẫu" mà lớp conv học được.
// Conv1 (edges): phát hiện cạnh ngang/dọc/chéo bằng kernel giống Sobel.
// Conv2 (shapes): tổ hợp edges thành cong trái/phải, giao cắt, chấm.
// Conv3 (parts): bộ phận nét-số — móc trên, móc dưới, nút nối.
type Filter = {
  id: string;
  name: string;
  kernel: number[][]; // 3×3
  description: string;
  pattern: string; // mô tả lời
  tint: string;
  // Vùng ảnh gốc thường kích hoạt mạnh cho filter này
  highlights: Array<[number, number, number, number]>; // [x,y,w,h] trên grid 28×28
};

const CONV1_FILTERS: Filter[] = [
  {
    id: "edge-h",
    name: "Cạnh ngang",
    kernel: [
      [-1, -1, -1],
      [0, 0, 0],
      [1, 1, 1],
    ],
    description: "Kích hoạt tại các pixel có gradient dọc — tức biên ngang",
    pattern: "Giống bộ lọc Sobel ngang trong xử lý ảnh cổ điển.",
    tint: "#3b82f6",
    highlights: [
      [7, 3, 12, 2],
      [7, 18, 12, 2],
    ],
  },
  {
    id: "edge-v",
    name: "Cạnh dọc",
    kernel: [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ],
    description: "Kích hoạt tại biên theo chiều dọc — nét thẳng đứng",
    pattern: "Sobel dọc — phát hiện mọi nét thẳng đứng trong ảnh.",
    tint: "#60a5fa",
    highlights: [
      [6, 4, 2, 14],
      [17, 7, 2, 12],
    ],
  },
  {
    id: "edge-d1",
    name: "Cạnh chéo \\",
    kernel: [
      [1, 0, -1],
      [0, 0, 0],
      [-1, 0, 1],
    ],
    description: "Kích hoạt tại các nét chéo từ trái-trên xuống phải-dưới",
    pattern: "Gradient diagonal — building block cho các đường cong.",
    tint: "#2563eb",
    highlights: [
      [10, 9, 6, 4],
      [12, 15, 6, 4],
    ],
  },
  {
    id: "edge-d2",
    name: "Cạnh chéo /",
    kernel: [
      [-1, 0, 1],
      [0, 0, 0],
      [1, 0, -1],
    ],
    description: "Kích hoạt với nét chéo đảo — phải-trên xuống trái-dưới",
    pattern: "Bổ trợ cho \\, cùng nhau bao phủ mọi hướng cạnh.",
    tint: "#1d4ed8",
    highlights: [
      [14, 3, 5, 3],
      [8, 17, 5, 3],
    ],
  },
];

const CONV2_FILTERS: Filter[] = [
  {
    id: "curve-r",
    name: "Cong phải",
    kernel: [
      [0, 1, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ],
    description: "Tổ hợp các cạnh để phát hiện đường cong mở phải — như nửa trên số 3",
    pattern: "Từ cạnh + cạnh chéo, lớp 2 dựng được cong trái/phải.",
    tint: "#a855f7",
    highlights: [[6, 3, 14, 8]],
  },
  {
    id: "curve-l",
    name: "Cong trái",
    kernel: [
      [1, 1, 0],
      [1, 0, -1],
      [1, 0, -1],
    ],
    description: "Đường cong mở trái — nửa dưới số 3 hoặc mặt trong chữ C",
    pattern: "Phản đối xứng của cong phải theo trục tung.",
    tint: "#9333ea",
    highlights: [[6, 14, 14, 8]],
  },
  {
    id: "junction",
    name: "Giao cắt",
    kernel: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    description: "Phát hiện nơi hai nét giao nhau — dấu + hoặc nút thắt",
    pattern: "Giúp phân biệt số 4, chữ T, giao điểm đường ray.",
    tint: "#c084fc",
    highlights: [[14, 10, 5, 5]],
  },
  {
    id: "blob",
    name: "Chấm tròn",
    kernel: [
      [1, 1, 1],
      [1, 2, 1],
      [1, 1, 1],
    ],
    description: "Vùng đặc/cụm pixel — dấu chấm, vòng tròn nhỏ, chấm trên chữ i",
    pattern: "Gaussian blob — hữu ích cho số 0, mắt người, đồng tử.",
    tint: "#7e22ce",
    highlights: [
      [9, 9, 4, 4],
      [15, 15, 3, 3],
    ],
  },
];

const CONV3_FILTERS: Filter[] = [
  {
    id: "loop-top",
    name: "Nút trên",
    kernel: [
      [1, 1, 1],
      [1, 0, 1],
      [0, 1, 1],
    ],
    description: "Vòng kín ở nửa trên — đặc trưng cốt lõi của số 3, 8, 9",
    pattern: "Tổ hợp cong trái + cong phải thành một loop nhỏ.",
    tint: "#ec4899",
    highlights: [[7, 3, 13, 8]],
  },
  {
    id: "loop-bot",
    name: "Nút dưới",
    kernel: [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    description: "Vòng kín ở nửa dưới — phân biệt 3 với 2, 8 với 0",
    pattern: "Đặc trưng bộ phận đã đủ nhận diện đối tượng riêng phần.",
    tint: "#db2777",
    highlights: [[7, 14, 13, 8]],
  },
  {
    id: "connector",
    name: "Nối giữa",
    kernel: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    description: "Nét ngang nối nút trên và nút dưới — điểm thắt giữa số 3",
    pattern: "Không có nó, mạng dễ nhầm 3 thành E ngược.",
    tint: "#f472b6",
    highlights: [[10, 10, 8, 3]],
  },
  {
    id: "tail",
    name: "Đuôi mở",
    kernel: [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ],
    description: "Đầu mở — đuôi trên hoặc dưới của các chữ số",
    pattern: "Phân biệt số 3 với 8 (8 kín hoàn toàn, 3 có 2 đầu mở).",
    tint: "#be185d",
    highlights: [
      [17, 3, 4, 3],
      [17, 18, 4, 3],
    ],
  },
];

// Mức độ "hưng phấn" mà mỗi filter deep thích — phục vụ activation maximization.
// Đây là ảnh tổng hợp (synthetic) tối đa hóa activation của một neuron.
type ActivationPattern = {
  filterId: string;
  grid: number[][]; // 7×7 mô phỏng ảnh tối đa hóa neuron deep
};

const ACTIVATION_MAX: ActivationPattern[] = [
  {
    filterId: "loop-top",
    grid: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    filterId: "loop-bot",
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
    ],
  },
  {
    filterId: "connector",
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    filterId: "tail",
    grid: [
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

// Thông tin về các lớp — được dùng cho bảng Feature Hierarchy.
interface LayerInfo {
  name: string;
  depth: string;
  description: string;
  features: string[];
  color: string;
  example: string;
  receptiveField: string;
  filterCount: string;
}

const LAYERS: LayerInfo[] = [
  {
    name: "Conv1",
    depth: "Lớp nông",
    description: "Cạnh, góc, gradient",
    features: ["Cạnh ngang", "Cạnh dọc", "Cạnh chéo \\", "Cạnh chéo /"],
    color: "#3b82f6",
    example: "Giống bộ lọc Sobel/Prewitt/Canny trong xử lý ảnh truyền thống",
    receptiveField: "3×3 pixel",
    filterCount: "~64 filter",
  },
  {
    name: "Conv2",
    depth: "Lớp giữa nông",
    description: "Kết cấu, cong, chấm",
    features: ["Cong phải", "Cong trái", "Giao cắt", "Chấm tròn"],
    color: "#8b5cf6",
    example: "Nhận ra vân vải, hoa văn gạch bông Việt Nam, nếp mái ngói",
    receptiveField: "7×7 pixel",
    filterCount: "~128 filter",
  },
  {
    name: "Conv3",
    depth: "Lớp giữa sâu",
    description: "Bộ phận đối tượng",
    features: ["Nút trên", "Nút dưới", "Nối giữa", "Đuôi mở"],
    color: "#ec4899",
    example: "Nhận ra đèn pha xe máy, nón bảo hiểm, logo trên áo",
    receptiveField: "15×15 pixel",
    filterCount: "~256 filter",
  },
  {
    name: "Conv4+",
    depth: "Lớp cuối",
    description: "Đối tượng hoàn chỉnh",
    features: ["Khuôn mặt", "Xe máy", "Nón lá", "Bát phở"],
    color: "#22c55e",
    example: "Phân biệt được Honda Wave vs Yamaha Exciter, phở vs bún bò Huế",
    receptiveField: "31×31 pixel+",
    filterCount: "~512 filter",
  },
];

// Các ứng dụng thực tiễn.
const APPLICATIONS: Array<{ name: string; detail: string }> = [
  {
    name: "OCR căn cước công dân",
    detail: "CNN backbone trích xuất đặc trưng nét chữ → transformer đọc chuỗi ký tự. Dùng rộng rãi ở ngân hàng, viễn thông Việt Nam.",
  },
  {
    name: "Phân loại sản phẩm Shopee / Tiki",
    detail: "ResNet / EfficientNet pretrained ImageNet, fine-tune thêm trên ảnh sản phẩm nội địa — giảm thời gian huấn luyện 90%.",
  },
  {
    name: "Kiểm tra chất lượng vải dệt",
    detail: "Đặc trưng texture ở lớp giữa bắt được lỗi sợi, đốm nhuộm mà mắt thường bỏ sót trên chuyền sản xuất.",
  },
  {
    name: "Chẩn đoán X-quang phổi",
    detail: "CNN phát hiện nốt, đám mờ, xơ — đặc trưng bộ phận ở lớp sâu khớp với biểu hiện bệnh lý.",
  },
  {
    name: "Nhận dạng biển số xe",
    detail: "Edge detection ở lớp nông + part detection ở lớp sâu → tách ký tự biển số trước khi nhận dạng.",
  },
  {
    name: "Camera giao thông thông minh",
    detail: "Phát hiện mũ bảo hiểm, đeo khẩu trang, vi phạm tốc độ dựa trên đặc trưng đối tượng ở lớp sâu.",
  },
];

// Các pitfall phổ biến.
const PITFALLS: Array<{ name: string; detail: string }> = [
  {
    name: "Dead ReLU ở lớp nông",
    detail: "Khi learning rate quá lớn, nhiều filter Conv1 có output = 0 trên mọi ảnh — coi như lớp conv biến mất một phần. Khắc phục: warmup, LeakyReLU, hoặc khởi tạo He.",
  },
  {
    name: "Receptive field nhỏ hơn đối tượng",
    detail: "Nếu ảnh đầu vào có đối tượng lớn nhưng mạng nông → RF cuối cùng không đủ để 'nhìn' cả đối tượng, mô hình mất context. Dùng dilated conv hoặc tăng depth.",
  },
  {
    name: "Overfitting trên đặc trưng nền",
    detail: "CNN có thể học đặc trưng nền thay vì đối tượng (ví dụ: mọi ảnh bò đều có cỏ → mô hình học cỏ). Khắc phục: data augmentation mạnh, Grad-CAM để kiểm tra.",
  },
  {
    name: "Texture bias",
    detail: "ImageNet khuyến khích CNN học texture thay vì shape. Mô hình có thể phân loại sai khi texture bị thay đổi. Dùng Stylized-ImageNet để giảm bias.",
  },
];

// Câu hỏi kiểm tra — 8 câu bao phủ: hierarchy, receptive field, transfer learning,
// activation maximization, translation invariance, và ứng dụng.
const QUIZ: QuizQuestion[] = [
  {
    question: "Lớp đầu tiên của CNN thường học được đặc trưng gì?",
    options: [
      "Khuôn mặt hoàn chỉnh",
      "Cạnh, góc, gradient màu sắc — đặc trưng đơn giản nhất",
      "Bộ phận đối tượng (mắt, tai)",
      "Texture và pattern phức tạp",
    ],
    correct: 1,
    explanation:
      "Lớp đầu luôn học các đặc trưng cơ bản nhất: cạnh ngang, dọc, chéo, gradient. Đây là building blocks cho mọi đặc trưng phức tạp hơn ở lớp sau. Visualize filter Conv1 trên AlexNet/VGG/ResNet: bạn sẽ thấy gần giống bộ lọc Gabor / Sobel.",
  },
  {
    question: "Tại sao đặc trưng CNN có thể 'chuyển giao' (transfer) sang tác vụ khác?",
    options: [
      "Vì CNN luôn cho kết quả giống nhau",
      "Vì các lớp đầu học đặc trưng chung (cạnh, texture) — hữu ích cho mọi ảnh",
      "Vì CNN không cần huấn luyện",
      "Vì transfer learning miễn phí",
    ],
    correct: 1,
    explanation:
      "Các lớp đầu học đặc trưng phổ quát (cạnh, kết cấu) áp dụng được cho mọi ảnh tự nhiên. Chỉ lớp cuối mới specific cho tác vụ. Đây là nền tảng Transfer Learning — bạn có thể lấy ResNet50 pretrained ImageNet, thay FC layer, fine-tune vài epoch là có mô hình tốt cho Shopee.",
  },
  {
    question: "Receptive field tăng dần qua các lớp CNN có ý nghĩa gì?",
    options: [
      "Mỗi neuron ở lớp sâu 'nhìn' một vùng ảnh gốc lớn hơn",
      "Mạng chạy nhanh hơn",
      "Ảnh đầu vào bị phóng to",
      "Số parameter tăng lên",
    ],
    correct: 0,
    explanation:
      "Receptive field là vùng pixel trên ảnh gốc mà 1 neuron 'nhìn thấy'. Lớp sâu hơn có receptive field lớn hơn, nên có thể nhận biết cấu trúc lớn hơn (từ cạnh → bộ phận → đối tượng). Công thức truy hồi: RF_l = RF_{l-1} + (k_l-1) × ∏ s_i.",
  },
  {
    question: "Bạn huấn luyện CNN nhưng lớp Conv1 chỉ học được filter ngẫu nhiên — không giống cạnh. Nguyên nhân nào khả dĩ nhất?",
    options: [
      "Dataset quá nhỏ hoặc learning rate quá cao gây dead ReLU",
      "Ảnh có quá nhiều màu",
      "Mạng quá sâu",
      "Dùng GPU sai loại",
    ],
    correct: 0,
    explanation:
      "Lớp Conv1 mà không hội tụ thành edge detector là dấu hiệu cảnh báo: có thể do batch quá nhỏ, lr sốc, hoặc dead ReLU. Thử giảm lr, warmup, hoặc kiểm tra initialization (He init cho ReLU). Luôn visualize filter đầu tiên để chẩn đoán.",
  },
  {
    question: "Activation maximization hiển thị điều gì về một neuron ở lớp sâu?",
    options: [
      "Ảnh test có loss cao nhất",
      "Ảnh tối ưu hóa nhân tạo khiến neuron đó kích hoạt cực đại — tiết lộ 'khái niệm' mà neuron học",
      "Trọng số của neuron",
      "Gradient của loss",
    ],
    correct: 1,
    explanation:
      "Activation maximization (Erhan 2009, Olah 2017) tối ưu hóa ảnh đầu vào để một neuron cho activation cực đại. Ảnh thu được cho thấy neuron đang 'tìm' mẫu nào — ví dụ lớp sâu có thể lộ ra hình con chó, bánh xe, hoặc kết cấu lá cây.",
  },
  {
    question: "CNN bất biến với phép dịch chuyển (translation invariant) nhờ đâu?",
    options: [
      "Do ReLU",
      "Do weight sharing trong phép tích chập + pooling",
      "Do batch normalization",
      "Do dropout",
    ],
    correct: 1,
    explanation:
      "Weight sharing nghĩa là cùng một filter được áp dụng ở mọi vị trí. Nếu đối tượng di chuyển, filter vẫn kích hoạt — chỉ là ở vị trí khác. Max pooling sau đó gom activation, tạo invariance cục bộ. Đó là lý do CNN mạnh hơn MLP cho ảnh.",
  },
  {
    question: "Khi fine-tune ResNet50 cho 50 lớp sản phẩm Shopee, chiến lược nào hợp lý?",
    options: [
      "Xóa toàn bộ trọng số và huấn luyện lại",
      "Freeze Conv1–Conv3, chỉ train Conv4 + FC, lr nhỏ cho lớp pretrained",
      "Chỉ train Conv1",
      "Không cần thay lớp FC",
    ],
    correct: 1,
    explanation:
      "Các lớp nông học đặc trưng phổ quát — không cần train lại. Freeze chúng, chỉ cập nhật lớp sâu + FC với lr nhỏ (1e-4) để không phá trọng số pretrained. Đây là chiến lược 'feature extraction + fine-tune' chuẩn mực cho transfer learning.",
  },
  {
    question: "Grad-CAM làm gì?",
    options: [
      "Tối ưu hóa tốc độ GPU",
      "Tạo heatmap hiển thị vùng ảnh quan trọng cho dự đoán của CNN",
      "Cắt giảm số parameter",
      "Huấn luyện CNN không cần nhãn",
    ],
    correct: 1,
    explanation:
      "Grad-CAM (Selvaraju 2017) dùng gradient của lớp cuối để tạo heatmap. Nó cho thấy CNN 'nhìn' chỗ nào khi quyết định. Công cụ không thể thiếu để kiểm tra mô hình có bị học đặc trưng nền không — rất hữu ích cho ứng dụng y tế.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * HELPER: Tính feature map bằng cách áp filter 3×3 lên ảnh 28×28.
 * Để đơn giản: tích chập valid, không padding, kết quả 26×26.
 * Chúng ta co xuống còn 14×14 để vẽ cho gọn (lấy mỗi pixel thứ 2).
 * ────────────────────────────────────────────────────────────── */

function convolve(img: number[][], kernel: number[][]): number[][] {
  const h = img.length;
  const w = img[0].length;
  const kh = kernel.length;
  const kw = kernel[0].length;
  const out: number[][] = [];
  for (let y = 0; y < h - kh + 1; y++) {
    const row: number[] = [];
    for (let x = 0; x < w - kw + 1; x++) {
      let sum = 0;
      for (let ky = 0; ky < kh; ky++) {
        for (let kx = 0; kx < kw; kx++) {
          sum += img[y + ky][x + kx] * kernel[ky][kx];
        }
      }
      // ReLU + chuẩn hoá về [0,1] bằng chia cho giá trị tối đa lý thuyết
      row.push(Math.max(0, sum) / 4);
    }
    out.push(row);
  }
  return out;
}

function downsample(grid: number[][], stride = 2): number[][] {
  const out: number[][] = [];
  for (let y = 0; y < grid.length; y += stride) {
    const row: number[] = [];
    for (let x = 0; x < grid[0].length; x += stride) {
      // max pooling 2×2
      const v = Math.max(
        grid[y]?.[x] ?? 0,
        grid[y]?.[x + 1] ?? 0,
        grid[y + 1]?.[x] ?? 0,
        grid[y + 1]?.[x + 1] ?? 0,
      );
      row.push(v);
    }
    out.push(row);
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ────────────────────────────────────────────────────────────── */

export default function FeatureExtractionCnnTopic() {
  // Tab đang chọn: "input" | "conv1" | "conv2" | "conv3" | "actmax"
  const [tab, setTab] = useState<"input" | "conv1" | "conv2" | "conv3" | "actmax">("input");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [hoverPixel, setHoverPixel] = useState<[number, number] | null>(null);

  const activeFilters: Filter[] = useMemo(() => {
    if (tab === "conv1") return CONV1_FILTERS;
    if (tab === "conv2") return CONV2_FILTERS;
    if (tab === "conv3") return CONV3_FILTERS;
    if (tab === "actmax") return CONV3_FILTERS;
    return [];
  }, [tab]);

  const currentFilter = useMemo(() => {
    if (!selectedFilter) return activeFilters[0] ?? null;
    return activeFilters.find((f) => f.id === selectedFilter) ?? activeFilters[0] ?? null;
  }, [activeFilters, selectedFilter]);

  // Tính feature map cho filter đang chọn.
  const featureMap = useMemo(() => {
    if (!currentFilter) return null;
    const conv = convolve(DIGIT_3, currentFilter.kernel);
    return downsample(conv, 2); // 13×13 đại khái
  }, [currentFilter]);

  // Ảnh activation-max cho filter deep.
  const actMaxGrid = useMemo(() => {
    if (!currentFilter) return null;
    const found = ACTIVATION_MAX.find((a) => a.filterId === currentFilter.id);
    return found?.grid ?? null;
  }, [currentFilter]);

  return (
    <>
      {/* ─────────────── STEP 1: PREDICTION ─────────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn nhìn ảnh chụp phố cổ Hội An và nhận ra ngay: mái ngói, đèn lồng, du khách. Bộ não bạn xử lý thế nào?"
          options={[
            "Nhận ra ngay toàn bộ cảnh trong 1 bước",
            "Xử lý từ chi tiết nhỏ (cạnh, màu) → hình dạng → bộ phận → đối tượng",
            "So sánh với mọi ảnh đã thấy từ trước",
          ]}
          correct={1}
          explanation="Thị giác con người (và CNN) xử lý theo thứ bậc: từ cạnh/góc đơn giản → kết cấu/hình dạng → bộ phận → nhận ra đối tượng hoàn chỉnh. Hubel & Wiesel đã chứng minh điều này trong vỏ não thị giác mèo năm 1959 — các tế bào đơn giản phản ứng với cạnh, tế bào phức tạp phản ứng với pattern. CNN mô phỏng lại y hệt hệ thống này bằng các lớp xếp chồng. Đây là Feature Hierarchy!"
        >
          {/* ─────────────── STEP 2: VISUALIZATION ─────────────── */}
          <LessonSection step={2} totalSteps={8} label="Khám phá — Xem từng lớp CNN nhìn gì">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              Tương tự{" "}
              <TopicLink slug="convolution">phép tích chập</TopicLink>{" "}
              nhưng có học: chúng ta đưa chữ số &ldquo;3&rdquo; kích thước 28×28 pixel vào CNN. Mỗi
              lớp tích chập có nhiều <em>filter</em> — bạn bấm vào từng filter để thấy nó phản ứng
              ở đâu trên ảnh, và feature map thu được trông ra sao. Ba lớp đầu học đặc trưng càng
              lúc càng trừu tượng; với lớp sâu ta dùng thêm <em>activation maximization</em> để
              &ldquo;lộ&rdquo; ra khái niệm mà neuron đang tìm.
            </p>

            <VisualizationSection topicSlug={metadata.slug}>
              {/* Tabs chọn lớp */}
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { id: "input" as const, label: "Ảnh gốc 28×28", tint: "#64748b" },
                  { id: "conv1" as const, label: "Conv1 — cạnh", tint: LAYERS[0].color },
                  { id: "conv2" as const, label: "Conv2 — hình dạng", tint: LAYERS[1].color },
                  { id: "conv3" as const, label: "Conv3 — bộ phận", tint: LAYERS[2].color },
                  { id: "actmax" as const, label: "Activation Max (deep)", tint: LAYERS[3].color },
                ].map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id);
                        setSelectedFilter(null);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "text-white"
                          : "border-border bg-card text-foreground hover:bg-surface"
                      }`}
                      style={active ? { backgroundColor: t.tint, borderColor: t.tint } : {}}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Panel hiển thị */}
              <div className="rounded-xl border border-border bg-background p-4">
                {tab === "input" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">
                      Ảnh đầu vào 28×28 pixel (MNIST-like). Di chuột lên các ô để xem tọa độ. Đây
                      là dữ liệu thô mà CNN nhận được — không có bất kỳ feature nào được định
                      nghĩa sẵn. Mạng tự học ra mọi thứ!
                    </p>
                    <svg viewBox="0 0 280 300" className="w-full max-w-md mx-auto">
                      <text x={140} y={16} textAnchor="middle" fontSize={11} fill="#94a3b8">
                        Digit &ldquo;3&rdquo; dạng grayscale 28×28
                      </text>
                      {DIGIT_3.map((row, y) =>
                        row.map((v, x) => (
                          <rect
                            key={`${x}-${y}`}
                            x={10 + x * 9}
                            y={25 + y * 9}
                            width={9}
                            height={9}
                            fill={v === 1 ? "#0f172a" : "#f8fafc"}
                            stroke="#e2e8f0"
                            strokeWidth={0.3}
                            onMouseEnter={() => setHoverPixel([x, y])}
                            onMouseLeave={() => setHoverPixel(null)}
                          />
                        )),
                      )}
                      {hoverPixel && (
                        <rect
                          x={10 + hoverPixel[0] * 9}
                          y={25 + hoverPixel[1] * 9}
                          width={9}
                          height={9}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                        />
                      )}
                    </svg>
                    <div className="text-center text-xs text-muted">
                      {hoverPixel
                        ? `Pixel (${hoverPixel[0]}, ${hoverPixel[1]}) — giá trị ${DIGIT_3[hoverPixel[1]][hoverPixel[0]]}`
                        : "Di chuột lên pixel để xem tọa độ."}
                    </div>
                  </div>
                )}

                {(tab === "conv1" || tab === "conv2" || tab === "conv3") && currentFilter && (
                  <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                    {/* Cột trái: ảnh gốc + highlight vùng phản ứng mạnh */}
                    <div>
                      <div className="mb-2 text-xs font-semibold text-foreground">
                        Vùng ảnh được filter &ldquo;{currentFilter.name}&rdquo; kích hoạt mạnh
                      </div>
                      <svg viewBox="0 0 280 280" className="w-full">
                        {DIGIT_3.map((row, y) =>
                          row.map((v, x) => (
                            <rect
                              key={`h-${x}-${y}`}
                              x={10 + x * 9}
                              y={10 + y * 9}
                              width={9}
                              height={9}
                              fill={v === 1 ? "#0f172a" : "#f8fafc"}
                              stroke="#e2e8f0"
                              strokeWidth={0.3}
                            />
                          )),
                        )}
                        {currentFilter.highlights.map((rect, i) => (
                          <rect
                            key={`hl-${i}`}
                            x={10 + rect[0] * 9}
                            y={10 + rect[1] * 9}
                            width={rect[2] * 9}
                            height={rect[3] * 9}
                            fill={currentFilter.tint}
                            fillOpacity={0.25}
                            stroke={currentFilter.tint}
                            strokeWidth={1.8}
                            rx={3}
                          />
                        ))}
                      </svg>
                      <p className="mt-2 text-xs text-muted">{currentFilter.pattern}</p>
                    </div>

                    {/* Cột phải: kernel + feature map */}
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 text-xs font-semibold text-foreground">
                          Kernel 3×3 đã học
                        </div>
                        <svg viewBox="0 0 130 130" className="w-full max-w-[160px]">
                          {currentFilter.kernel.map((row, y) =>
                            row.map((v, x) => {
                              const norm = (v + 1) / 2; // [-1..1] → [0..1]
                              const color = v > 0 ? currentFilter.tint : v < 0 ? "#1f2937" : "#64748b";
                              return (
                                <g key={`k-${x}-${y}`}>
                                  <rect
                                    x={10 + x * 37}
                                    y={10 + y * 37}
                                    width={35}
                                    height={35}
                                    fill={color}
                                    fillOpacity={0.15 + Math.abs(v) * 0.45}
                                    stroke={color}
                                    strokeWidth={1}
                                    rx={3}
                                  />
                                  <text
                                    x={10 + x * 37 + 17.5}
                                    y={10 + y * 37 + 22}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fill="#e2e8f0"
                                    fontWeight="bold"
                                  >
                                    {v}
                                  </text>
                                  <title>{`w[${y},${x}] = ${v}, norm=${norm.toFixed(2)}`}</title>
                                </g>
                              );
                            }),
                          )}
                        </svg>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-semibold text-foreground">
                          Feature map (output sau ReLU + pool 2×2)
                        </div>
                        <svg viewBox="0 0 200 200" className="w-full max-w-[240px]">
                          {featureMap?.map((row, y) =>
                            row.map((v, x) => (
                              <rect
                                key={`fm-${x}-${y}`}
                                x={5 + x * 14}
                                y={5 + y * 14}
                                width={13}
                                height={13}
                                fill={currentFilter.tint}
                                fillOpacity={Math.min(1, v * 2)}
                                stroke={currentFilter.tint}
                                strokeOpacity={0.25}
                                strokeWidth={0.5}
                                rx={1}
                              />
                            )),
                          )}
                        </svg>
                        <p className="mt-2 text-[11px] text-muted">
                          Ô càng sáng — activation càng cao — tức filter &ldquo;thấy&rdquo; mẫu của
                          mình tại vị trí đó trên ảnh gốc.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "actmax" && currentFilter && (
                  <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                    <div>
                      <div className="mb-2 text-xs font-semibold text-foreground">
                        Ảnh tối ưu hóa activation — &ldquo;bộ não&rdquo; của neuron
                      </div>
                      <svg viewBox="0 0 260 260" className="w-full">
                        {actMaxGrid?.map((row, y) =>
                          row.map((v, x) => (
                            <rect
                              key={`am-${x}-${y}`}
                              x={20 + x * 30}
                              y={20 + y * 30}
                              width={30}
                              height={30}
                              fill={v === 1 ? currentFilter.tint : "#0f172a"}
                              fillOpacity={v === 1 ? 0.85 : 0.6}
                              stroke="#1e293b"
                              strokeWidth={0.5}
                              rx={2}
                            />
                          )),
                        )}
                      </svg>
                      <p className="mt-2 text-xs text-muted">
                        Tối ưu hóa gradient ascent trên ảnh đầu vào để neuron này cho activation
                        cực đại. Ảnh tổng hợp lộ ra khái niệm mà neuron tìm kiếm.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="font-semibold text-foreground">
                          Cách làm — activation maximization
                        </div>
                        <ol className="mt-2 list-decimal list-inside space-y-1 text-muted">
                          <li>Khởi tạo ảnh x bằng nhiễu ngẫu nhiên.</li>
                          <li>
                            Đưa x qua CNN, lấy activation của neuron mục tiêu a = f(x).
                          </li>
                          <li>Tính gradient ∂a/∂x — hướng cần dịch pixel để a tăng.</li>
                          <li>x ← x + η · ∂a/∂x — gradient ASCENT (không descent!).</li>
                          <li>Lặp 100–500 bước, thêm regularization (TV, jitter) tránh nhiễu.</li>
                          <li>Ảnh thu được = &ldquo;khái niệm&rdquo; của neuron đó.</li>
                        </ol>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3">
                        <div className="font-semibold text-foreground">
                          Tại sao phải dùng regularization?
                        </div>
                        <p className="mt-1 text-muted">
                          Không regularize thì ảnh sẽ thành noise adversarial — activation cao
                          nhưng mắt người không nhận ra gì. Thêm smoothness prior (TV), jitter và
                          lọc tần số cao giúp ảnh &ldquo;giống người&rdquo; hơn, tiết lộ concept
                          thực sự mà neuron đại diện.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách filter — chỉ hiển thị khi tab là conv1/2/3/actmax */}
                {tab !== "input" && activeFilters.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {activeFilters.map((f) => {
                      const active = currentFilter?.id === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFilter(f.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-[11px] transition-all ${
                            active
                              ? "border-2 text-foreground"
                              : "border-border bg-card text-muted hover:bg-surface"
                          }`}
                          style={active ? { borderColor: f.tint, backgroundColor: `${f.tint}15` } : {}}
                        >
                          <div className="font-semibold text-foreground">{f.name}</div>
                          <div className="mt-1 line-clamp-2 text-muted">{f.description}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sơ đồ hierarchy tổng quan */}
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <div className="mb-2 text-xs font-semibold text-foreground">
                  Thứ bậc đặc trưng (feature hierarchy)
                </div>
                <svg viewBox="0 0 640 140" className="w-full">
                  <defs>
                    <linearGradient id="fhGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={LAYERS[0].color} />
                      <stop offset="33%" stopColor={LAYERS[1].color} />
                      <stop offset="66%" stopColor={LAYERS[2].color} />
                      <stop offset="100%" stopColor={LAYERS[3].color} />
                    </linearGradient>
                  </defs>
                  {LAYERS.map((layer, i) => {
                    const x = 20 + i * 150;
                    const h = 60 - i * 6;
                    return (
                      <g key={layer.name}>
                        <rect
                          x={x}
                          y={40}
                          width={130}
                          height={h}
                          rx={8}
                          fill={layer.color}
                          fillOpacity={0.25}
                          stroke={layer.color}
                          strokeWidth={1.5}
                        />
                        <text x={x + 65} y={32} textAnchor="middle" fontSize={11} fontWeight="bold" fill={layer.color}>
                          {layer.name}
                        </text>
                        <text x={x + 65} y={40 + h / 2 - 4} textAnchor="middle" fontSize={10} fill="#e2e8f0">
                          {layer.description}
                        </text>
                        <text x={x + 65} y={40 + h / 2 + 10} textAnchor="middle" fontSize={9} fill="#94a3b8">
                          RF {layer.receptiveField}
                        </text>
                        {i < LAYERS.length - 1 && (
                          <line
                            x1={x + 130}
                            y1={40 + h / 2}
                            x2={x + 150}
                            y2={40 + (60 - (i + 1) * 6) / 2}
                            stroke="#475569"
                            strokeWidth={1.2}
                            markerEnd="url(#arrow)"
                          />
                        )}
                      </g>
                    );
                  })}
                  <rect x={20} y={120} width={610} height={6} rx={3} fill="url(#fhGrad)" opacity={0.7} />
                  <text x={20} y={115} fontSize={9} fill={LAYERS[0].color}>
                    Đơn giản · RF nhỏ
                  </text>
                  <text x={630} y={115} fontSize={9} fill={LAYERS[3].color} textAnchor="end">
                    Trừu tượng · RF lớn
                  </text>
                </svg>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────────── STEP 3: AHA ─────────────── */}
          <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                CNN <strong>không được lập trình</strong> để phát hiện cạnh hay mắt mèo — nó{" "}
                <strong>tự học</strong> mọi thứ qua dữ liệu! Lớp 1 tự phát hiện cạnh vì cạnh là
                đặc trưng hữu ích nhất để giảm loss. Từ cạnh, lớp tiếp tổ hợp thành kết cấu, rồi
                bộ phận, rồi đối tượng.{" "}
                <strong>Mọi thứ đều emergent từ backpropagation!</strong>
              </p>
              <p className="text-sm text-muted mt-2">
                Hubel &amp; Wiesel (Nobel 1981) khi khảo sát vỏ não thị giác mèo đã thấy V1 có
                &ldquo;simple cells&rdquo; phản ứng với cạnh, V2/V4 phản ứng với pattern, IT
                (inferotemporal) phản ứng với đối tượng. CNN được thiết kế mô phỏng hierarchy này
                — và khi huấn luyện trên ImageNet, filter Conv1 hội tụ thành Gabor-like gần giống
                simple cells trong não mèo!
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ─────────────── STEP 4: CHALLENGE 1 ─────────────── */}
          <LessonSection step={4} totalSteps={8} label="Thử thách 1 — Transfer Learning">
            <InlineChallenge
              question="Bạn có mô hình CNN huấn luyện trên ImageNet (phân loại 1000 lớp). Bạn muốn dùng nó để phân loại ảnh sản phẩm Shopee (50 lớp). Nên làm gì?"
              options={[
                "Huấn luyện lại từ đầu vì bài toán khác hoàn toàn",
                "Giữ nguyên các lớp đầu (đặc trưng chung), chỉ thay và fine-tune lớp cuối",
                "Chỉ cần thay lớp Softmax từ 1000 thành 50",
              ]}
              correct={1}
              explanation="Các lớp đầu học cạnh, texture — phổ quát cho mọi ảnh tự nhiên. Chỉ cần thay lớp cuối (FC + Softmax) cho 50 lớp mới và fine-tune. Đây là Transfer Learning — tiết kiệm 90% thời gian huấn luyện và cho accuracy tốt hơn nếu dataset đích nhỏ. Lưu ý: phải dùng learning rate nhỏ (1e-4) cho lớp pretrained, lr thường cho lớp mới, để không phá trọng số đã học."
            />
          </LessonSection>

          {/* ─────────────── STEP 4b: CHALLENGE 2 ─────────────── */}
          <LessonSection step={4} totalSteps={8} label="Thử thách 2 — Receptive field">
            <InlineChallenge
              question="Mạng có 4 lớp conv 3×3 liên tiếp, stride=1, không pooling. Một neuron ở lớp 4 'nhìn' vùng bao nhiêu pixel trên ảnh gốc?"
              options={[
                "3×3 pixel — giống kernel",
                "9×9 pixel — tổng kích thước các kernel",
                "9×9 pixel theo công thức RF_l = RF_{l-1} + (k_l - 1) × ∏ s_i",
                "12×12 pixel",
              ]}
              correct={2}
              explanation="RF_1 = 3. RF_2 = 3 + (3-1)·1 = 5. RF_3 = 5 + 2·1 = 7. RF_4 = 7 + 2·1 = 9. Stride = 1 nên tích strides trước đó = 1. Với 4 lớp conv 3×3, mỗi neuron lớp 4 'nhìn' 9×9 pixel của ảnh gốc. Nếu thêm pooling stride 2 thì RF tăng nhanh hơn nhiều — đó là lý do các CNN thực tế dùng pooling để tăng RF hiệu quả."
            />
          </LessonSection>

          {/* ─────────────── STEP 5: EXPLANATION ─────────────── */}
          <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
            <ExplanationSection>
              <p>
                <strong>Feature Extraction</strong> trong CNN là quá trình tự động học các biểu
                diễn (representation) có ý nghĩa từ dữ liệu thô. Mỗi lớp tích chập trích xuất đặc
                trưng ở mức trừu tượng khác nhau, xếp chồng thành một <em>hierarchy</em> tương tự
                cách vỏ não thị giác người xử lý ảnh.
              </p>

              <Callout variant="insight" title="Feature Hierarchy (Thứ bậc đặc trưng)">
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    <strong>Low-level (Conv1–Conv2):</strong> cạnh, góc, gradient — phổ quát cho
                    mọi ảnh tự nhiên. Filter hội tụ thành Gabor-like / Sobel-like.
                  </li>
                  <li>
                    <strong>Mid-level (Conv3–Conv4):</strong> kết cấu, hình dạng, pattern lặp.
                    Bắt đầu có ý nghĩa ngữ nghĩa hạn chế (sọc vằn, da dê, hoa văn).
                  </li>
                  <li>
                    <strong>High-level (Conv5+):</strong> bộ phận đối tượng, rồi đối tượng hoàn
                    chỉnh. Neuron có thể nhạy với khuôn mặt, bánh xe, cửa sổ.
                  </li>
                </ol>
              </Callout>

              <p className="mt-3">
                <strong>Receptive Field</strong> tăng dần qua các lớp theo công thức truy hồi:
              </p>
              <LaTeX block>{"RF_l = RF_{l-1} + (k_l - 1) \\times \\prod_{i=1}^{l-1} s_i"}</LaTeX>
              <p className="text-sm text-muted">
                Với <LaTeX>{"k_l"}</LaTeX> là kích thước kernel và <LaTeX>{"s_i"}</LaTeX> là
                stride ở lớp i. Receptive field lớn hơn cho phép nhận biết cấu trúc lớn hơn trên
                ảnh gốc. Nếu ảnh đầu vào có đối tượng lớn hơn RF hiệu dụng, mạng sẽ mất context —
                giải pháp là tăng depth, dùng dilated convolution, hoặc pooling sớm.
              </p>

              <p className="mt-3">
                <strong>Weight sharing</strong> — cùng một kernel được trượt qua toàn ảnh — đem
                lại hai thứ: (1) giảm số tham số (cần cho ảnh lớn), và (2){" "}
                <em>translation equivariance</em>: nếu đối tượng dịch chuyển, feature map cũng
                dịch chuyển tương ứng. Kết hợp với max pooling, CNN đạt{" "}
                <em>translation invariance</em> cục bộ, rất phù hợp với ảnh tự nhiên.
              </p>

              <LaTeX block>
                {"(f * g)(x, y) = \\sum_{u=-k}^{k} \\sum_{v=-k}^{k} f(x+u, y+v) \\cdot g(u, v)"}
              </LaTeX>

              <Callout variant="warning" title="Transfer Learning — Sức mạnh của đặc trưng CNN">
                <p className="text-sm">
                  Đặc trưng CNN học được có thể <strong>chuyển giao</strong> sang tác vụ khác.
                  Các lớp đầu (đặc trưng chung) được giữ nguyên, chỉ fine-tune lớp cuối cho tác
                  vụ mới. Ví dụ: ResNet pretrained trên ImageNet dùng cho phân loại ảnh CCCD, sản
                  phẩm Shopee, hoặc X-quang phổi. Luôn phải nhớ dùng learning rate nhỏ cho lớp
                  pretrained để không phá trọng số đã học.
                </p>
              </Callout>

              <Callout variant="info" title="Translation invariance đến từ đâu?">
                <p className="text-sm">
                  Tích chập mang tính equivariant (cùng dịch chuyển), còn pooling (max/avg) biến
                  equivariant thành invariant cục bộ. Nếu bạn muốn invariance với xoay hoặc scale,
                  cần data augmentation hoặc các kiến trúc đặc biệt như Spatial Transformer
                  Network, Group Equivariant CNN.
                </p>
              </Callout>

              <Callout variant="tip" title="Đọc kết quả bằng Grad-CAM">
                <p className="text-sm">
                  Đừng bao giờ deploy CNN mà không visualize! Grad-CAM tạo heatmap trên ảnh gốc,
                  cho thấy vùng nào ảnh hưởng đến dự đoán. Nó tiết lộ CNN có đang nhìn đúng đối
                  tượng không, hay đang học đặc trưng nền (ví dụ: mô hình phân loại &ldquo;chó
                  husky&rdquo; hóa ra chỉ nhìn tuyết sau lưng — paper nổi tiếng của Ribeiro 2016).
                </p>
              </Callout>

              <CodeBlock language="python" title="Feature Extraction + Transfer Learning (PyTorch)">
{`import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# Load ResNet-50 pretrained trên ImageNet
resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

# ── Cách 1: Dùng CNN làm feature extractor ──────────────
# Bỏ lớp FC cuối, lấy feature vector 2048-d cho downstream tasks
feature_extractor = nn.Sequential(*list(resnet.children())[:-1])
feature_extractor.eval()

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

img = Image.open("product.jpg").convert("RGB")
x = preprocess(img).unsqueeze(0)  # (1, 3, 224, 224)

with torch.no_grad():
    features = feature_extractor(x)   # (1, 2048, 1, 1)
    features = features.flatten(1)    # (1, 2048)

# Có thể dùng features này cho k-NN search, clustering, SVM...

# ── Cách 2: Fine-tune cho 50 lớp sản phẩm Shopee ────────
resnet.fc = nn.Linear(2048, 50)  # thay lớp cuối

# Freeze các lớp sâu nhưng không phải cuối để giữ đặc trưng chung
for name, param in resnet.named_parameters():
    if "layer4" not in name and "fc" not in name:
        param.requires_grad = False

# Hai nhóm optimizer: lr nhỏ cho pretrained, lr thường cho head mới
optimizer = torch.optim.AdamW([
    {"params": resnet.layer4.parameters(), "lr": 1e-4},
    {"params": resnet.fc.parameters(),     "lr": 1e-3},
], weight_decay=1e-4)

scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)

# Training loop chuẩn — 5–20 epoch là đủ vì pretrained đã mạnh
`}
              </CodeBlock>

              <CodeBlock language="python" title="Activation Maximization — tiết lộ khái niệm của neuron">
{`import torch
import torch.nn.functional as F
from torchvision import models

model = models.vgg16(weights=models.VGG16_Weights.DEFAULT).eval()

# Mục tiêu: tối ưu ảnh để activation của filter #243 trong conv5_3 cực đại
target_layer = model.features[28]      # conv5_3
target_filter = 243

# Bắt đầu từ nhiễu ngẫu nhiên
x = torch.randn(1, 3, 224, 224, requires_grad=True)
optimizer = torch.optim.Adam([x], lr=0.05)

activation = None
def hook(module, input, output):
    global activation
    activation = output[:, target_filter]  # (1, H, W)

handle = target_layer.register_forward_hook(hook)

for step in range(300):
    optimizer.zero_grad()
    _ = model(x)
    # GRADIENT ASCENT: maximize activation trung bình
    loss = -activation.mean()
    # Total variation regularization — giúp ảnh mượt, giống người
    tv = ((x[:, :, :, 1:] - x[:, :, :, :-1]).abs().mean()
        + (x[:, :, 1:, :] - x[:, :, :-1, :]).abs().mean())
    (loss + 1e-2 * tv).backward()
    optimizer.step()

    # Jitter nhỏ — phá regularity lặp
    with torch.no_grad():
        x.data = torch.roll(x.data, shifts=(1, 1), dims=(2, 3))

handle.remove()
# x bây giờ là ảnh tối ưu hóa — visualize nó sẽ lộ "khái niệm" mà filter 243 tìm
`}
              </CodeBlock>

              <CollapsibleDetail title="Mở rộng — Gradient-weighted Class Activation Map (Grad-CAM)">
                <p className="text-sm">
                  Grad-CAM lấy gradient của class score y^c đối với feature map A^k của một lớp
                  conv (thường là lớp conv cuối):
                </p>
                <LaTeX block>
                  {"\\alpha_k^c = \\frac{1}{Z} \\sum_{i,j} \\frac{\\partial y^c}{\\partial A_{ij}^k}"}
                </LaTeX>
                <LaTeX block>
                  {"L^c_{\\text{Grad-CAM}} = \\text{ReLU}\\left(\\sum_k \\alpha_k^c A^k\\right)"}
                </LaTeX>
                <p className="text-sm text-muted">
                  Kết quả là heatmap cùng kích thước với feature map, sau đó upsample về kích
                  thước ảnh gốc. Vùng nóng cho biết đâu là bằng chứng CNN dùng để đưa ra quyết
                  định. Rất hữu ích khi debug mô hình y tế: nếu heatmap nằm trên viền ảnh thay vì
                  trên tổn thương, mô hình đang học spurious correlation.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Mở rộng — Khi nào KHÔNG nên transfer learning?">
                <p className="text-sm">
                  Transfer learning gần như luôn thắng khi dataset đích nhỏ/vừa (&lt;50K ảnh) và
                  domain không quá xa ImageNet (ảnh tự nhiên, sản phẩm, y tế nhẹ). Nhưng nó có
                  thể KÉM hơn training from scratch nếu:
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-muted">
                  <li>
                    Domain rất khác — ví dụ ảnh siêu âm, radar SAR, hình ảnh hiển vi — pretrained
                    có thể gây &ldquo;negative transfer&rdquo;. Thử DINO/MAE self-supervised
                    pretraining trên chính domain của bạn.
                  </li>
                  <li>
                    Dataset đích rất lớn (&gt;1M ảnh, cân bằng) — training from scratch có thể
                    đạt chất lượng tương đương và không bị ràng buộc kiến trúc pretrained.
                  </li>
                  <li>
                    Tác vụ không phải classification thuần (ví dụ: reconstruction, image-to-image)
                    — khi đó U-Net-like backbone từ đầu thường tốt hơn.
                  </li>
                </ul>
              </CollapsibleDetail>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-sm font-semibold text-foreground">Ứng dụng thực tế</div>
                  <ul className="mt-2 space-y-2 text-xs text-muted">
                    {APPLICATIONS.map((app) => (
                      <li key={app.name}>
                        <strong className="text-foreground">{app.name}:</strong> {app.detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-sm font-semibold text-foreground">Pitfall thường gặp</div>
                  <ul className="mt-2 space-y-2 text-xs text-muted">
                    {PITFALLS.map((p) => (
                      <li key={p.name}>
                        <strong className="text-foreground">{p.name}:</strong> {p.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ExplanationSection>
          </LessonSection>

          {/* ─────────────── STEP 6: MINI SUMMARY ─────────────── */}
          <LessonSection step={6} totalSteps={8} label="Tóm tắt">
            <MiniSummary
              title="Ghi nhớ về Feature Extraction trong CNN"
              points={[
                "CNN trích xuất đặc trưng theo thứ bậc: cạnh → kết cấu → bộ phận → đối tượng. Mọi thứ emergent từ backpropagation — không cần thiết kế thủ công.",
                "Lớp nông (Conv1–2) học đặc trưng phổ quát; lớp sâu học đặc trưng specific cho tác vụ. Đây là nền tảng của transfer learning.",
                "Receptive field tăng dần theo công thức RF_l = RF_{l-1} + (k_l-1)·∏s_i — lớp sâu nhìn vùng ảnh gốc lớn hơn, bắt được context rộng hơn.",
                "Weight sharing + pooling mang lại translation invariance — lý do CNN thắng MLP cho ảnh tự nhiên.",
                "Activation maximization và Grad-CAM là hai công cụ cốt lõi để hiểu CNN học gì — luôn dùng chúng trước khi deploy.",
                "Pitfall phổ biến: dead ReLU Conv1, receptive field không đủ, texture bias, overfitting trên đặc trưng nền — Grad-CAM giúp phát hiện sớm.",
              ]}
            />
          </LessonSection>

          {/* ─────────────── STEP 7: QUIZ ─────────────── */}
          <LessonSection step={7} totalSteps={8} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>

          {/* ─────────────── STEP 8: KẾT LUẬN ─────────────── */}
          <LessonSection step={8} totalSteps={8} label="Kết luận">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground leading-relaxed">
              <p>
                Bạn đã thấy CNN &ldquo;mổ xẻ&rdquo; ảnh ra sao: từ những đường cạnh vô danh ở
                lớp đầu, tổ hợp thành hình dạng, rồi bộ phận, và cuối cùng là đối tượng hoàn
                chỉnh. Điều kỳ diệu là toàn bộ hierarchy này <em>không được lập trình</em> — nó{" "}
                <em>mọc ra</em> từ dữ liệu qua backpropagation.
              </p>
              <p className="mt-2 text-muted">
                Bước tiếp theo: khám phá các kiến trúc CNN hiện đại (
                <TopicLink slug="cnn">CNN cơ bản</TopicLink>, ResNet, EfficientNet) và tìm hiểu
                cách kết hợp chúng với transformer trong computer vision hiện đại.
              </p>
            </div>
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
