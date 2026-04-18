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
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Metadata (giữ nguyên)
// ─────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "chain-of-thought",
  title: "Chain-of-Thought",
  titleVi: "Chuỗi suy luận từng bước",
  description:
    "Kỹ thuật yêu cầu mô hình trình bày quá trình suy nghĩ từng bước để cải thiện khả năng lập luận.",
  category: "llm-concepts",
  tags: ["reasoning", "prompt", "cot", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "in-context-learning", "llm-overview"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────
// Kiểu dữ liệu nội bộ
// ─────────────────────────────────────────────────────────────────────────
type CotVariant = "zero-shot" | "few-shot" | "self-consistency";

interface Problem {
  id: string;
  domain: "math" | "logic" | "finance" | "physics";
  question: string;
  direct: {
    answer: string;
    reasoning: string;
    isCorrect: boolean;
  };
  cot: {
    answer: string;
    steps: string[];
    isCorrect: boolean;
  };
  // Mô phỏng self-consistency: nhiều lời giải độc lập, lấy phiếu bầu đa số
  samples: string[];
}

interface AccuracyRow {
  label: string;
  value: number; // 0..100
  tone: "neutral" | "good" | "best";
}

// ─────────────────────────────────────────────────────────────────────────
// Ngân hàng bài toán mẫu
// ─────────────────────────────────────────────────────────────────────────
const PROBLEMS: Problem[] = [
  {
    id: "discount-stack",
    domain: "finance",
    question:
      "Một cửa hàng giảm giá 20%, sau đó giảm tiếp 10% trên giá đã giảm. Tổng giảm giá thực tế là bao nhiêu phần trăm?",
    direct: {
      answer: "30%",
      reasoning: "20% + 10% = 30%",
      isCorrect: false,
    },
    cot: {
      answer: "28%",
      steps: [
        "Giả sử giá gốc = 100 đồng để dễ tính.",
        "Sau khi giảm 20%: 100 × (1 − 0.20) = 80 đồng.",
        "Sau khi giảm thêm 10% trên 80: 80 × (1 − 0.10) = 72 đồng.",
        "Tổng tiền đã giảm: 100 − 72 = 28 đồng.",
        "Quy ra phần trăm: 28 / 100 = 28% — KHÔNG phải 30%.",
      ],
      isCorrect: true,
    },
    samples: ["28%", "28%", "30%", "28%", "28%", "28%", "30%", "28%"],
  },
  {
    id: "switch-bulb",
    domain: "logic",
    question:
      "Trong phòng có 3 công tắc, ngoài phòng có 3 bóng đèn. Bạn chỉ được vào phòng đúng 1 lần. Làm sao biết công tắc nào nối với đèn nào?",
    direct: {
      answer: "Bật từng cái và chạy vào xem",
      reasoning:
        "Bật 1 → vào kiểm tra → quay ra bật cái khác. (Sai! chỉ được vào đúng 1 lần.)",
      isCorrect: false,
    },
    cot: {
      answer: "Dùng nhiệt của bóng đèn.",
      steps: [
        "Bật công tắc số 1 và chờ khoảng 5 phút cho bóng đèn nóng lên.",
        "Sau 5 phút, tắt công tắc số 1, bật công tắc số 2.",
        "Đi vào phòng ngay. Bóng đang SÁNG = công tắc số 2.",
        "Chạm vào hai bóng còn lại. Bóng NÓNG nhưng tắt = công tắc số 1.",
        "Bóng NGUỘI và tắt = công tắc số 3. Hoàn thành chỉ với 1 lần vào.",
      ],
      isCorrect: true,
    },
    samples: [
      "Dùng nhiệt",
      "Dùng nhiệt",
      "Bật từng cái",
      "Dùng nhiệt",
      "Dùng nhiệt",
      "Dùng nhiệt",
      "Dùng nhiệt",
      "Không biết",
    ],
  },
  {
    id: "train-meet",
    domain: "math",
    question:
      "Hai tàu chạy ngược chiều trên cùng đường ray, cách nhau 300 km. Tàu A chạy 60 km/h, tàu B chạy 90 km/h. Sau bao lâu thì hai tàu gặp nhau?",
    direct: {
      answer: "3 giờ",
      reasoning: "300 / (60 + 90) = 300 / 150 → nhưng AI hay nhầm là 300/90 ≈ 3.33 giờ hoặc 3 giờ chẵn.",
      isCorrect: false,
    },
    cot: {
      answer: "2 giờ",
      steps: [
        "Hai tàu chạy ngược chiều → tốc độ tiếp cận = tổng vận tốc.",
        "Tốc độ tiếp cận = 60 + 90 = 150 km/h.",
        "Thời gian = khoảng cách / tốc độ tiếp cận = 300 / 150.",
        "300 / 150 = 2 giờ chính xác.",
        "Kết luận: hai tàu gặp nhau sau đúng 2 giờ.",
      ],
      isCorrect: true,
    },
    samples: ["2h", "2h", "3h", "2h", "2h", "2h", "2.5h", "2h"],
  },
  {
    id: "bag-marbles",
    domain: "math",
    question:
      "Một túi có 5 viên bi đỏ và 3 viên bi xanh. Rút 2 viên liên tiếp KHÔNG hoàn lại. Xác suất cả 2 đều đỏ là bao nhiêu?",
    direct: {
      answer: "25/64",
      reasoning: "(5/8) × (5/8) = 25/64 — coi hai lần rút là độc lập (sai logic).",
      isCorrect: false,
    },
    cot: {
      answer: "5/14",
      steps: [
        "Lần 1: P(đỏ) = 5/8 vì có 5 đỏ trong tổng 8 viên.",
        "Sau khi rút 1 viên đỏ, còn 4 đỏ và 3 xanh → tổng 7 viên.",
        "Lần 2 (không hoàn lại): P(đỏ | đã rút đỏ) = 4/7.",
        "Nhân hai xác suất có điều kiện: (5/8) × (4/7) = 20/56.",
        "Rút gọn 20/56 = 5/14 ≈ 0.357 (không phải 25/64 ≈ 0.391).",
      ],
      isCorrect: true,
    },
    samples: ["5/14", "5/14", "25/64", "5/14", "5/14", "5/14", "5/14", "20/56"],
  },
  {
    id: "monty-hall",
    domain: "logic",
    question:
      "Trong trò Monty Hall: có 3 cửa, 1 có xe hơi, 2 có dê. Bạn chọn cửa 1. MC (biết trước) mở cửa 3 có dê. Bạn có nên đổi sang cửa 2?",
    direct: {
      answer: "Không cần đổi, 50/50",
      reasoning: "Còn 2 cửa, 1 xe và 1 dê → xác suất 50% mỗi cửa.",
      isCorrect: false,
    },
    cot: {
      answer: "CÓ, nên đổi — xác suất thắng 2/3",
      steps: [
        "Ban đầu: P(xe ở cửa 1) = 1/3, P(xe ở cửa 2 hoặc 3) = 2/3.",
        "MC biết vị trí xe, LUÔN mở cửa có dê (không ngẫu nhiên).",
        "Nếu xe ở cửa 2 hoặc 3 (xác suất 2/3): MC buộc phải mở cửa có dê trong hai cái đó, để lại cửa có xe.",
        "Do đó khi đổi sang cửa còn lại: thắng với xác suất 2/3.",
        "Không đổi: thắng chỉ với xác suất 1/3 (phải đoán đúng từ đầu).",
      ],
      isCorrect: true,
    },
    samples: ["đổi 2/3", "đổi 2/3", "50/50", "đổi 2/3", "đổi 2/3", "đổi", "50/50", "đổi 2/3"],
  },
  {
    id: "birthday-paradox",
    domain: "math",
    question:
      "Trong phòng có 23 người, xác suất ít nhất 2 người có cùng ngày sinh là bao nhiêu?",
    direct: {
      answer: "Khoảng 23/365 ≈ 6.3%",
      reasoning: "Có 23 người, so với 365 ngày → 23/365 ≈ 6%.",
      isCorrect: false,
    },
    cot: {
      answer: "Khoảng 50.7%",
      steps: [
        "Tính P(KHÔNG ai trùng) dễ hơn P(có trùng).",
        "Người 1 có 365 lựa chọn, người 2 còn 364, người 3 còn 363, …",
        "P(không trùng) = (365/365) × (364/365) × … × (343/365) (23 số hạng).",
        "Tính ra: P(không trùng) ≈ 0.4927.",
        "Vậy P(có trùng) = 1 − 0.4927 ≈ 0.5073 ≈ 50.7% — nghịch lý sinh nhật nổi tiếng.",
      ],
      isCorrect: true,
    },
    samples: ["50.7%", "~50%", "6%", "50%", "50.7%", "50%", "50%", "51%"],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Thông tin về từng biến thể CoT
// ─────────────────────────────────────────────────────────────────────────
const VARIANT_INFO: Record<
  CotVariant,
  {
    label: string;
    tagline: string;
    description: string;
    pros: string[];
    cons: string[];
    accuracyBoost: number; // % tương đối so với direct (giả lập)
  }
> = {
  "zero-shot": {
    label: "Zero-shot CoT",
    tagline: "Chỉ cần thêm 'Hãy suy nghĩ từng bước'",
    description:
      "Thêm một câu ma thuật vào cuối prompt mà không cần ví dụ mẫu. Đơn giản nhất, triển khai tức thời.",
    pros: [
      "Không cần soạn few-shot examples",
      "Triển khai trong 5 giây — thêm 1 dòng",
      "Hoạt động với mọi LLM đủ mạnh (>7B params)",
    ],
    cons: [
      "Chất lượng phụ thuộc khả năng reasoning gốc của model",
      "Đôi khi model bỏ qua chỉ dẫn và trả lời ngắn",
      "Với model nhỏ (<3B) hiệu quả giảm rõ rệt",
    ],
    accuracyBoost: 58,
  },
  "few-shot": {
    label: "Few-shot CoT",
    tagline: "Cho model 2-3 ví dụ mẫu có từng bước",
    description:
      "Trước câu hỏi thật, chèn 2-3 ví dụ mẫu đã giải sẵn với từng bước rõ ràng. Model học theo pattern.",
    pros: [
      "Chất lượng ổn định hơn zero-shot",
      "Kiểm soát được FORMAT của câu trả lời",
      "Hiệu quả cho domain-specific reasoning",
    ],
    cons: [
      "Tốn nhiều token trong prompt (ví dụ mẫu dài)",
      "Phải soạn ví dụ chất lượng cao",
      "Bias theo style ví dụ — có thể thiếu đa dạng",
    ],
    accuracyBoost: 72,
  },
  "self-consistency": {
    label: "Self-Consistency",
    tagline: "Chạy CoT nhiều lần rồi vote đáp án đa số",
    description:
      "Sinh 5-40 chuỗi suy luận khác nhau với temperature > 0, đếm phiếu bầu. Đáp án phổ biến nhất thắng.",
    pros: [
      "Tăng accuracy mạnh nhất trong 3 biến thể",
      "Tự-sửa lỗi ngẫu nhiên trong từng lần",
      "Không cần thay đổi model, chỉ cần sampling",
    ],
    cons: [
      "Đắt gấp 5-40 lần (chạy nhiều lần)",
      "Latency cao — không phù hợp real-time UX",
      "Chỉ hoạt động khi đáp án là symbol rời rạc (số, label)",
    ],
    accuracyBoost: 86,
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Câu hỏi kiểm tra
// ─────────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question: "Chain-of-Thought cải thiện LLM ở loại task nào nhất?",
    options: [
      "Dịch thuật đơn giản",
      "Bài toán logic và tính toán nhiều bước",
      "Tóm tắt văn bản",
      "Phân loại cảm xúc",
    ],
    correct: 1,
    explanation:
      "CoT giúp nhất ở task cần LẬP LUẬN nhiều bước — toán, logic, suy luận nhân quả. Với task đơn giản (dịch, phân loại), CoT ít có tác dụng và chỉ làm tốn token.",
  },
  {
    question: "Zero-shot CoT sử dụng prompt đơn giản nào?",
    options: [
      "'Trả lời nhanh nhất có thể'",
      "'Hãy suy nghĩ từng bước' (Let's think step by step)",
      "'Cho tôi 3 ví dụ trước'",
      "'Tóm tắt trong 1 câu'",
    ],
    correct: 1,
    explanation:
      "Chỉ cần thêm 'Let's think step by step' hoặc 'Hãy suy nghĩ từng bước' vào cuối prompt → cải thiện đáng kể. Paper Kojima et al. 2022 (NeurIPS) chứng minh điều này.",
  },
  {
    question: "Tại sao CoT hoạt động — về mặt kỹ thuật?",
    options: [
      "Vì AI có thêm thời gian suy nghĩ",
      "Vì mỗi bước trung gian cung cấp ngữ cảnh cho bước tiếp theo, giảm lỗi tích lũy",
      "Vì AI copy bài giải từ Internet",
      "Vì prompt dài hơn = tốt hơn",
    ],
    correct: 1,
    explanation:
      "Mỗi bước trung gian được sinh ra trở thành INPUT cho bước sau. Thay vì nhảy thẳng từ đề bài → đáp án (dễ sai), AI đi qua chuỗi suy luận — mỗi bước đơn giản hơn tổng thể.",
  },
  {
    type: "fill-blank",
    question:
      "Chain-of-Thought buộc mô hình trình bày {blank} trước khi đưa ra đáp án, giúp cải thiện chất lượng {blank} nhiều bước.",
    blanks: [
      { answer: "từng bước", accept: ["step-by-step", "từng-bước", "tung buoc"] },
      { answer: "suy luận", accept: ["reasoning", "lập luận"] },
    ],
    explanation:
      "CoT yêu cầu mô hình viết ra chuỗi từng bước trung gian thay vì nhảy thẳng tới đáp án. Hiệu quả đặc biệt cho toán, logic, lập kế hoạch.",
  },
  {
    question: "Self-Consistency khác Zero-shot CoT ở điểm cốt lõi nào?",
    options: [
      "Dùng model lớn hơn",
      "Sinh nhiều chuỗi reasoning khác nhau rồi bỏ phiếu đáp án đa số",
      "Không cần prompt 'suy nghĩ từng bước'",
      "Chạy offline trên CPU",
    ],
    correct: 1,
    explanation:
      "Self-Consistency sampling temperature > 0, tạo nhiều đường reasoning độc lập, rồi lấy đáp án phổ biến nhất. Giả định: đường đúng thường hội tụ về cùng đáp án.",
  },
  {
    question: "Khi nào KHÔNG nên dùng CoT?",
    options: [
      "Khi trả lời 'mèo hay chó dễ thương hơn'",
      "Khi cần phân loại 1 câu ngắn thành tích cực/tiêu cực",
      "Khi dịch 'Hello' sang tiếng Việt",
      "Tất cả các trường hợp trên",
    ],
    correct: 3,
    explanation:
      "Task đơn giản, subjective, hoặc không cần reasoning nhiều bước → CoT chỉ thêm token (tốn tiền + chậm) mà không cải thiện kết quả. Dùng có chọn lọc.",
  },
  {
    question:
      "Trong Few-shot CoT, vai trò của các ví dụ mẫu là gì?",
    options: [
      "Cho AI học facts mới",
      "Dạy AI format và STYLE trình bày reasoning qua in-context learning",
      "Giảm latency",
      "Thay thế fine-tuning",
    ],
    correct: 1,
    explanation:
      "Ví dụ mẫu không cung cấp kiến thức — chúng dạy AI cách PHÂN RÃ bài toán và format reasoning. Đây là in-context learning, không cập nhật weights.",
  },
  {
    question:
      "Mô hình reasoning mới (GPT-4o1, DeepSeek-R1) khác CoT truyền thống ở điểm nào?",
    options: [
      "Không dùng CoT nữa",
      "Học CoT qua RL trên bài toán, sinh long chain-of-thought nội tại trước khi trả lời",
      "Chỉ chạy trên GPU H100",
      "Cấm dùng prompt 'step by step'",
    ],
    correct: 1,
    explanation:
      "Reasoning models (o1, R1) được train bằng RL để TỰ sinh chain-of-thought dài (có thể hàng nghìn token), không cần prompt hint từ người dùng. CoT trở thành NỘI TẠI trong model.",
  },
  {
    question:
      "Trong Self-Consistency với N=5 samples, đáp án nào được chọn?",
    options: [
      "Đáp án của sample đầu tiên",
      "Đáp án xuất hiện nhiều lần nhất (majority vote)",
      "Trung bình số học của 5 đáp án",
      "Đáp án dài nhất",
    ],
    correct: 1,
    explanation:
      "Self-Consistency dùng majority vote: chạy N lần với temperature > 0 để tạo đa dạng reasoning, rồi chọn đáp án phổ biến nhất. Insight: reasoning đúng thường hội tụ cùng đáp án; reasoning sai phân tán.",
  },
  {
    question:
      "Tree-of-Thoughts (ToT) mở rộng CoT bằng cách nào?",
    options: [
      "Chạy CoT trên nhiều GPU cùng lúc",
      "Mô hình hoá reasoning như cây search — mỗi nút là một bước, có thể branch, evaluate, backtrack",
      "Dùng CoT với temperature = 0",
      "Chỉ cho phép đáp án dạng cây nhị phân",
    ],
    correct: 1,
    explanation:
      "ToT (Yao et al. 2023) xem mỗi bước reasoning là một nút trong cây, kết hợp LLM với BFS/DFS + state evaluator. Khi một nhánh có vẻ sai, backtrack. Hiệu quả cho puzzle, planning, game-playing — nơi CoT tuyến tính bị kẹt.",
  },
  {
    question:
      "Chi phí của Self-Consistency N=10 so với Zero-shot CoT là bao nhiêu?",
    options: [
      "Bằng nhau",
      "Gấp ~10 lần (tuyến tính theo N)",
      "Gấp 100 lần",
      "Rẻ hơn vì cache",
    ],
    correct: 1,
    explanation:
      "Self-Consistency chạy N lời giải độc lập → cost tuyến tính với N. Với N=10, bạn trả gấp 10 lần tiền API. Production thường dùng N=3-5, ít khi N=10+. ROI giảm dần sau N≈5.",
  },
  {
    type: "fill-blank",
    question:
      "Self-Consistency sampling cần temperature {blank}, còn Zero-shot CoT thường dùng temperature {blank} để output ổn định.",
    blanks: [
      { answer: "> 0", accept: ["lớn hơn 0", "cao", "0.7", "0.5 đến 1.0"] },
      { answer: "0", accept: ["= 0", "thấp", "0.0", "gần 0"] },
    ],
    explanation:
      "Self-Consistency cần đa dạng reasoning paths → temperature 0.5-1.0 để sampling đa dạng. Zero-shot CoT đơn lẻ nên dùng temperature 0 để output deterministic, dễ debug và reproduce. Hai mục tiêu trái ngược.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Các khối code minh hoạ
// ─────────────────────────────────────────────────────────────────────────
const CODE_OPENAI_COT = `# Zero-shot CoT với OpenAI Python SDK
from openai import OpenAI
client = OpenAI()

def solve_with_cot(problem: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Bạn là giáo viên giải toán cẩn thận. "
                    "Với mỗi bài toán, hãy TRÌNH BÀY từng bước suy luận, "
                    "rồi kết luận bằng dòng 'Đáp án: <kết quả>'."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"{problem}\\n\\n"
                    "Hãy suy nghĩ từng bước trước khi trả lời."
                ),
            },
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""


# Few-shot CoT: chèn 2 ví dụ mẫu có từng bước
FEW_SHOT = """
Ví dụ 1:
Q: 3 chiếc bánh giá 60.000đ, mua 5 chiếc thì bao nhiêu?
Suy nghĩ: 1 chiếc = 60.000 / 3 = 20.000đ. 5 chiếc = 5 × 20.000 = 100.000đ.
Đáp án: 100.000đ

Ví dụ 2:
Q: Giảm 10% rồi giảm 10% nữa thì tổng giảm bao nhiêu?
Suy nghĩ: 100 → 100 × 0.9 = 90 → 90 × 0.9 = 81. Đã giảm 100 - 81 = 19.
Đáp án: 19%
"""

def solve_few_shot(problem: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Bạn là giáo viên cẩn thận."},
            {
                "role": "user",
                "content": f"{FEW_SHOT}\\n\\nQ: {problem}\\nSuy nghĩ:",
            },
        ],
        temperature=0.0,
    )
    return resp.choices[0].message.content or ""


# Self-Consistency: chạy 5 lần rồi bỏ phiếu
from collections import Counter
import re

def extract_answer(text: str) -> str:
    m = re.search(r"Đáp án:\\s*(.+)", text)
    return (m.group(1).strip() if m else text.strip()[-40:])

def self_consistency(problem: str, n: int = 5) -> str:
    samples = []
    for _ in range(n):
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": f"{problem}\\nHãy suy nghĩ từng bước."},
            ],
            temperature=0.7,  # sampling đa dạng
        )
        samples.append(extract_answer(resp.choices[0].message.content or ""))
    # bỏ phiếu đa số
    return Counter(samples).most_common(1)[0][0]


if __name__ == "__main__":
    problem = (
        "Một cửa hàng giảm giá 20%, sau đó giảm tiếp 10% "
        "trên giá đã giảm. Tổng giảm thực tế là bao nhiêu phần trăm?"
    )
    print("Zero-shot:", solve_with_cot(problem))
    print("Few-shot:", solve_few_shot(problem))
    print("Self-Consistency (5 lần):", self_consistency(problem, n=5))`;

const CODE_LANGCHAIN_SPLITTERS = `# Gợi ý: LangChain Text Splitters (kèm ở bài Chunking)
# Ở bài CoT, dưới đây là template prompt dùng với LangChain.
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

# --- Zero-shot CoT prompt ---
zero_shot = ChatPromptTemplate.from_messages([
    ("system", "Bạn là giáo viên toán kiên nhẫn."),
    ("human", "{problem}\\n\\nHãy suy nghĩ từng bước."),
])

# --- Few-shot CoT prompt ---
few_shot = ChatPromptTemplate.from_messages([
    ("system", "Bạn là giáo viên. Trình bày suy luận rồi kết bằng 'Đáp án: ...'."),
    ("human",
     "Ví dụ: Giảm 10% rồi giảm 10% nữa → 100 → 90 → 81 → Đáp án: 19%.\\n"
     "Q: {problem}\\nSuy nghĩ:"),
])

# --- Self-consistency qua Runnable ---
import asyncio
from collections import Counter

async def self_consistency(problem: str, k: int = 5):
    tasks = [
        llm.ainvoke(zero_shot.format_prompt(problem=problem).to_messages())
        for _ in range(k)
    ]
    outs = await asyncio.gather(*tasks)
    texts = [o.content for o in outs]
    # parse đáp án đơn giản
    answers = [t.splitlines()[-1].replace("Đáp án:", "").strip() for t in texts]
    return Counter(answers).most_common(1)[0][0]

# Dùng:
# answer = asyncio.run(self_consistency("Giảm 20% rồi 10%", k=5))`;

// ─────────────────────────────────────────────────────────────────────────
// Component phụ: thanh bar chart accuracy
// ─────────────────────────────────────────────────────────────────────────
function AccuracyBar({ rows }: { rows: AccuracyRow[] }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const color =
          r.tone === "best"
            ? "bg-emerald-500"
            : r.tone === "good"
              ? "bg-sky-500"
              : "bg-red-400";
        const textColor =
          r.tone === "best"
            ? "text-emerald-600 dark:text-emerald-400"
            : r.tone === "good"
              ? "text-sky-600 dark:text-sky-400"
              : "text-red-500 dark:text-red-400";
        return (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-xs text-muted">{r.label}</span>
            <div className="relative flex-1 h-5 rounded-full bg-surface overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${r.value}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <span className={`w-12 text-right text-xs font-bold ${textColor}`}>
              {r.value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Component phụ: panel trả lời (Direct hoặc CoT)
// ─────────────────────────────────────────────────────────────────────────
function AnswerPanel({
  mode,
  problem,
  revealedSteps,
}: {
  mode: "direct" | "cot";
  problem: Problem;
  revealedSteps: number;
}) {
  if (mode === "direct") {
    const ok = problem.direct.isCorrect;
    return (
      <div
        className={`rounded-xl border p-4 ${
          ok
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/10"
            : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Direct Answer
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
            Không CoT
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          {problem.direct.reasoning}
        </p>
        <p
          className={`text-lg font-bold ${
            ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          → {problem.direct.answer} {ok ? "✓" : "✗"}
        </p>
        <p className="text-[11px] text-muted italic mt-2">
          Model nhảy thẳng tới đáp án — dễ sai trong bài nhiều bước.
        </p>
      </div>
    );
  }
  // CoT panel
  const steps = problem.cot.steps;
  const visible = steps.slice(0, revealedSteps);
  const final = revealedSteps >= steps.length;
  return (
    <div className="rounded-xl border border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-900/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Chain-of-Thought
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-500">
          Suy nghĩ từng bước
        </span>
      </div>
      <ol className="space-y-2">
        {visible.map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-start gap-2"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-200 dark:bg-sky-800 text-[10px] font-bold text-sky-700 dark:text-sky-300">
              {i + 1}
            </span>
            <span className="text-sm text-foreground leading-snug">{s}</span>
          </motion.li>
        ))}
      </ol>
      {final ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-3"
        >
          → {problem.cot.answer} ✓
        </motion.p>
      ) : (
        <p className="text-[11px] text-muted italic mt-2">
          Đã hiện {revealedSteps}/{steps.length} bước. Bấm &quot;Bước kế&quot; để tiếp tục.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Component phụ: Self-Consistency votes chart
// ─────────────────────────────────────────────────────────────────────────
function VotePanel({ samples, winner }: { samples: string[]; winner: string }) {
  const counts: Record<string, number> = {};
  samples.forEach((s) => {
    counts[s] = (counts[s] ?? 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Phiếu bầu đáp án (mô phỏng 8 lần chạy)
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          Thắng: {winner}
        </span>
      </div>
      {entries.map(([k, v]) => {
        const isWin = k === winner;
        return (
          <div key={k} className="flex items-center gap-2">
            <span
              className={`w-28 shrink-0 text-xs ${
                isWin ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted"
              }`}
            >
              {k}
            </span>
            <div className="flex-1 h-3 rounded-full bg-card overflow-hidden">
              <motion.div
                className={`h-full ${isWin ? "bg-emerald-500" : "bg-red-300 dark:bg-red-700"}`}
                initial={{ width: 0 }}
                animate={{ width: `${(v / max) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="w-8 text-right text-xs text-muted">{v}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────
export default function ChainOfThoughtTopic() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [variant, setVariant] = useState<CotVariant>("zero-shot");
  const [revealedSteps, setRevealedSteps] = useState(0);

  const problem = PROBLEMS[problemIdx];
  const variantInfo = VARIANT_INFO[variant];

  const accuracyRows: AccuracyRow[] = useMemo(
    () => [
      { label: "Direct (không CoT)", value: 31, tone: "neutral" },
      {
        label: VARIANT_INFO["zero-shot"].label,
        value: VARIANT_INFO["zero-shot"].accuracyBoost,
        tone: variant === "zero-shot" ? "good" : "neutral",
      },
      {
        label: VARIANT_INFO["few-shot"].label,
        value: VARIANT_INFO["few-shot"].accuracyBoost,
        tone: variant === "few-shot" ? "good" : "neutral",
      },
      {
        label: VARIANT_INFO["self-consistency"].label,
        value: VARIANT_INFO["self-consistency"].accuracyBoost,
        tone: variant === "self-consistency" ? "best" : "neutral",
      },
    ],
    [variant],
  );

  const revealNext = useCallback(() => {
    setRevealedSteps((s) => Math.min(s + 1, problem.cot.steps.length));
  }, [problem.cot.steps.length]);

  const revealAll = useCallback(() => {
    setRevealedSteps(problem.cot.steps.length);
  }, [problem.cot.steps.length]);

  const resetSteps = useCallback(() => {
    setRevealedSteps(0);
  }, []);

  const switchProblem = useCallback((idx: number) => {
    setProblemIdx(idx);
    setRevealedSteps(0);
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ━━━━━━━━━━━━━━━━ HOOK — dự đoán ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Cửa hàng giảm giá 20%, sau đó giảm thêm 10%. Tổng giảm bao nhiêu phần trăm?"
          options={["30%", "28%", "25%", "32%"]}
          correct={1}
          explanation="Không phải 30%! Giảm 20% trước: 100 → 80. Giảm 10% nữa trên 80: 80 × 0.9 = 72. Tổng giảm = 100 − 72 = 28%. Hầu hết mọi người (và AI khi không dùng CoT) cộng thẳng 20 + 10 → sai 30%. Chain-of-Thought buộc AI tính TỪNG BƯỚC để tránh đúng kiểu lỗi này."
        >
          <p className="text-sm text-muted mt-4">
            Ở dưới đây chúng ta sẽ so sánh hai cách AI trả lời — <strong className="text-foreground">trực tiếp</strong> và <strong className="text-foreground">theo Chain-of-Thought</strong> — trên cùng một bài toán, rồi đo độ chính xác qua các biến thể CoT khác nhau.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ VISUALIZATION ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Direct vs Chain-of-Thought
                </h3>
                <p className="text-xs text-muted">
                  Cùng đề bài → hai cách trả lời → hai kết quả khác nhau.
                </p>
              </div>
              <ProgressSteps
                current={Math.max(1, Math.min(revealedSteps + 1, problem.cot.steps.length))}
                total={problem.cot.steps.length}
                labels={problem.cot.steps.map((_, i) => `Bước ${i + 1}/${problem.cot.steps.length}`)}
              />
            </div>

            {/* Problem selector */}
            <div className="flex flex-wrap gap-2">
              {PROBLEMS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchProblem(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    problemIdx === i
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  Bài {i + 1} · {p.domain}
                </button>
              ))}
            </div>

            {/* Problem statement */}
            <div className="rounded-xl bg-surface p-4">
              <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block mb-1">
                Đề bài
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {problem.question}
              </p>
            </div>

            {/* Variant selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">
                  Biến thể CoT
                </span>
                <span className="text-[10px] text-muted italic">
                  {variantInfo.tagline}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(VARIANT_INFO) as CotVariant[]).map((v) => {
                  const info = VARIANT_INFO[v];
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariant(v)}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                        variant === v
                          ? "border-accent bg-accent-light text-accent-dark"
                          : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
                      }`}
                    >
                      <span className="block text-xs font-semibold">
                        {info.label}
                      </span>
                      <span className="block text-[10px] opacity-80">
                        +{info.accuracyBoost}% accuracy
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted leading-relaxed pt-1">
                {variantInfo.description}
              </p>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnswerPanel mode="direct" problem={problem} revealedSteps={0} />
              <AnswerPanel mode="cot" problem={problem} revealedSteps={revealedSteps} />
            </div>

            {/* Step-by-step controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={revealNext}
                disabled={revealedSteps >= problem.cot.steps.length}
                className="rounded-lg bg-accent text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
              >
                Bước kế →
              </button>
              <button
                type="button"
                onClick={revealAll}
                disabled={revealedSteps >= problem.cot.steps.length}
                className="rounded-lg bg-surface text-foreground text-xs font-medium px-3 py-1.5 disabled:opacity-40"
              >
                Hiện hết
              </button>
              <button
                type="button"
                onClick={resetSteps}
                className="rounded-lg bg-surface text-muted text-xs font-medium px-3 py-1.5"
              >
                Reset
              </button>
              <span className="text-[11px] text-muted ml-auto">
                Đang hiển thị: <strong>{revealedSteps}</strong>/{problem.cot.steps.length} bước
              </span>
            </div>

            {/* Variant-specific extras */}
            {variant === "self-consistency" && (
              <VotePanel
                samples={problem.samples}
                winner={problem.cot.answer}
              />
            )}

            {variant === "few-shot" && (
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Ví dụ mẫu trong prompt (mô phỏng)
                </span>
                <pre className="text-[11px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
{`Q: 3 chiếc bánh 60.000đ, mua 5 chiếc bao nhiêu?
Suy nghĩ: 60/3 = 20. 5×20 = 100.
Đáp án: 100.000đ

Q: Giảm 10% rồi 10% nữa, tổng giảm?
Suy nghĩ: 100 → 90 → 81. 100−81 = 19.
Đáp án: 19%

Q: ${problem.question.slice(0, 70)}...
Suy nghĩ: `}
                </pre>
              </div>
            )}

            {/* Accuracy bar chart */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Độ chính xác trên GSM8K (mô phỏng, ~8.5K bài toán lời)
                </span>
                <span className="text-[10px] text-muted">
                  Số thấp hơn công bố trong paper gốc 2022
                </span>
              </div>
              <AccuracyBar rows={accuracyRows} />
              <p className="text-[11px] text-muted leading-relaxed">
                GSM8K (Cobbe et al. 2021) là bộ chuẩn đánh giá toán lời lớp tiểu học. CoT đã biến điểm accuracy từ ~17-30% (zero-shot trực tiếp) thành 50-80%+ chỉ bằng thay đổi prompt, và Self-Consistency đẩy lên hơn 90% với các model hiện đại.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ AHA MOMENT ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <strong>Chain-of-Thought</strong> biến một cú nhảy xa thành nhiều bước đi ngắn. Model chỉ phải predict token tiếp theo — nếu khoảng cách từ câu hỏi đến đáp án quá xa, mỗi token bị &quot;gánh&quot; quá nhiều thông tin. CoT chèn các bước trung gian vào làm <em>bậc thang</em>: mỗi bước mới CHỈ cần suy ra từ bước vừa sinh, và mỗi bước là một bài toán con dễ hơn. Từ đó, <strong>giới hạn reasoning của model tăng lên mà không cần train lại.</strong>
        </AhaMoment>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ INLINE CHALLENGE #1 ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={4} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="Bạn muốn AI dịch 'Hello' sang tiếng Việt. Có cần dùng Chain-of-Thought không?"
          options={[
            "Có — luôn dùng CoT cho mọi task",
            "Không — dịch đơn giản không cần suy luận nhiều bước, CoT chỉ thêm chậm và tốn token",
            "Tùy — dùng CoT nếu câu dài",
          ]}
          correct={1}
          explanation="CoT chỉ hữu ích cho task CẦN SUY LUẬN: toán, logic, phân tích. Với task đơn giản như dịch 1 từ, CoT chỉ thêm token (tốn tiền + latency) mà không cải thiện kết quả."
        />
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ EXPLANATION ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Chain-of-Thought (CoT)</strong> là kỹ thuật{" "}
            <TopicLink slug="prompt-engineering">prompt engineering</TopicLink> yêu cầu LLM trình bày quá trình suy luận từng bước trước khi đưa ra đáp án cuối cùng — nền tảng của các{" "}
            <TopicLink slug="reasoning-models">reasoning model</TopicLink> hiện đại như o1, R1.
          </p>

          <Callout variant="insight" title="Vì sao CoT hoạt động — cái nhìn xác suất">
            LLM sinh text theo phân phối có điều kiện <LaTeX>{"P(y_t \\mid y_{<t}, x)"}</LaTeX>. Mỗi token mới chỉ nhìn thấy các token trước nó. Khi AI phải nhảy từ câu hỏi <LaTeX>{"x"}</LaTeX> thẳng tới đáp án <LaTeX>{"y"}</LaTeX>, xác suất <LaTeX>{"P(y \\mid x)"}</LaTeX> phải &quot;gánh&quot; toàn bộ chuỗi suy luận. CoT viết ra từng bước trung gian <LaTeX>{"r_1, r_2, \\dots, r_k"}</LaTeX>, phân tích phân phối thành tích <LaTeX>{"P(y \\mid x) = \\sum_{r} P(y \\mid r, x) \\, P(r \\mid x)"}</LaTeX> — mỗi bước là một subtask nhỏ, dễ ước lượng hơn.
          </Callout>

          <p>
            <strong>3 biến thể chính:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              <strong>Zero-shot CoT</strong> — Thêm &quot;Let&apos;s think step by step&quot; (Kojima et al. 2022, NeurIPS). Không ví dụ mẫu, chỉ 1 câu ma thuật. Tăng accuracy GSM8K từ ~17% → ~40% chỉ với GPT-3.
            </li>
            <li>
              <strong>Few-shot CoT</strong> — Chèn 2-8 ví dụ mẫu đã giải với từng bước (Wei et al. 2022). Dạng{" "}
              <TopicLink slug="in-context-learning">in-context learning</TopicLink>. Kiểm soát được format, stable hơn zero-shot.
            </li>
            <li>
              <strong>Self-Consistency</strong> — Chạy 5-40 lần với temperature &gt; 0, bỏ phiếu đáp án đa số (Wang et al. 2022, &quot;Self-Consistency Improves Chain of Thought Reasoning&quot;). Đẩy GSM8K lên 74%.
            </li>
          </ul>

          <p>
            Các biến thể mở rộng khác đáng biết: <strong>Tree-of-Thought</strong> (Yao et al. 2023, mở rộng thành cây search với backtracking), <strong>ReAct</strong> (kết hợp reasoning với tool-use), và <strong>Scratchpad</strong> (tương tự CoT nhưng tập trung vào toán số học).
          </p>

          <CodeBlock language="python" title="cot_openai.py — ba biến thể CoT dùng OpenAI SDK">
            {CODE_OPENAI_COT}
          </CodeBlock>

          <Callout variant="tip" title="Khi nào DÙNG CoT">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Toán số học, toán lời, xác suất, tổ hợp</li>
              <li>Logic, suy luận nhân quả, puzzle</li>
              <li>Phân tích code, debug, review security</li>
              <li>Lập kế hoạch nhiều bước (agent planning)</li>
              <li>Đọc hiểu tài liệu dài, trích xuất structured data</li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Khi nào KHÔNG cần CoT">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Dịch thuật, paraphrase, summarization ngắn</li>
              <li>Phân loại cảm xúc, spam/ham, intent classification</li>
              <li>Sinh text sáng tạo (thơ, slogan, caption)</li>
              <li>Lookup facts đơn giản (thủ đô nước nào)</li>
              <li>Task real-time cần latency &lt; 500ms</li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Chi tiết kỹ thuật: Self-Consistency vs Majority Voting">
            <div className="space-y-3 text-sm">
              <p>
                Self-Consistency không chỉ là &quot;chạy nhiều lần rồi vote&quot;. Wang et al. chứng minh: <strong>nếu reasoning đúng, nhiều đường đi khác nhau sẽ HỘI TỤ về cùng đáp án;</strong> nếu reasoning sai, các đáp án sai thường phân tán rải rác. Do đó, frequency của đáp án trong tập sample là một <em>proxy tốt</em> cho confidence.
              </p>
              <p>
                Công thức (đơn giản hoá): với <LaTeX>{"N"}</LaTeX> samples, đáp án thắng là
                <LaTeX block>{"\\hat{y} = \\arg\\max_{y \\in \\mathcal{Y}} \\sum_{i=1}^N \\mathbb{1}[f(r_i) = y]"}</LaTeX>
                trong đó <LaTeX>{"r_i"}</LaTeX> là reasoning chain thứ <LaTeX>{"i"}</LaTeX>, và <LaTeX>{"f(\\cdot)"}</LaTeX> là hàm extract đáp án cuối.
              </p>
              <p>
                <strong>Chi phí:</strong> tỉ lệ tuyến tính với <LaTeX>{"N"}</LaTeX>. Trên GPT-4o-mini giá ~$0.15/1M input tokens, 5 sample của 1 câu hỏi 500 token → ~$0.00038 vs $0.0000075 không Self-Consistency — đắt gấp 50 lần/câu hỏi. Ứng dụng production thường dùng <LaTeX>{"N = 3 - 5"}</LaTeX>, không lên 40.
              </p>
              <p>
                <strong>Temperature setting:</strong> Self-Consistency CHỈ hoạt động khi sampling đa dạng.
                Với <code>temperature = 0</code>, mọi sample sẽ giống hệt nhau (greedy decoding) → vote vô
                nghĩa. Paper gốc dùng <code>temperature = 0.7</code> với <code>top_p = 0.95</code>. Tăng
                temperature quá cao (&gt;1.2) thì reasoning bị noise, đáp án trở nên ngẫu nhiên — hiệu quả
                giảm. Sweet spot thường là 0.5-0.9 tuỳ task.
              </p>
              <p>
                <strong>Khi nào Self-Consistency THẤT BẠI?</strong> (1) Task có đáp án liên tục
                (regression, generation tự do) — majority vote không áp dụng được. (2) Task mà sai lầm có
                hệ thống: nếu model có bias, tất cả N samples đều sai cùng hướng. (3) Khi N quá nhỏ
                (N=2) — không đủ để dập tắt noise. (4) Task mà đáp án đúng là rare — majority có thể vote
                cho đáp án sai phổ biến (&quot;mode collapse&quot;).
              </p>
              <p>
                <strong>Biến thể &quot;Weighted Self-Consistency&quot;:</strong> thay vì đếm frequency,
                cộng xác suất (log-prob) của từng reasoning chain. Nhưng phần lớn API (OpenAI, Anthropic)
                không expose log-prob của full generation → khó triển khai production. Dùng đơn thuần
                majority vote là đủ tốt 90% tình huống.
              </p>
              <p>
                <strong>Universal Self-Consistency</strong> (Chen et al. 2023): thay vì extract đáp án
                cuối bằng regex, dùng một LLM call thứ hai để đọc N reasoning chains và chọn ra &quot;đáp
                án nhất quán nhất&quot;. Hoạt động với task có output dạng free-form (code, natural language).
                Trade-off: thêm 1 LLM call cho mỗi query.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tree-of-Thoughts (ToT) — khi CoT tuyến tính không đủ">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Tree-of-Thoughts</strong> (Yao et al. 2023, NeurIPS) mở rộng CoT từ chuỗi tuyến
                tính thành cây search. Mỗi nút trong cây là một &quot;thought&quot; (một bước reasoning
                trung gian), và LLM có thể: (1) <em>branch</em> — sinh nhiều nhánh từ cùng một nút, (2){" "}
                <em>evaluate</em> — chấm điểm mỗi nhánh về khả năng dẫn tới đáp án đúng, (3){" "}
                <em>backtrack</em> — quay lại nếu nhánh hiện tại có vẻ sai.
              </p>
              <p>
                <strong>Thuật toán ToT (đơn giản hoá):</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Bắt đầu với problem statement → root node.</li>
                <li>Expand: sinh <LaTeX>{"k"}</LaTeX> thought con (thường 3-5) từ nút hiện tại.</li>
                <li>Evaluate: dùng LLM tự chấm mỗi thought (&quot;sure / likely / impossible&quot; hoặc giá trị 0-1).</li>
                <li>Search: dùng BFS hoặc DFS với pruning — giữ <LaTeX>{"b"}</LaTeX> nhánh tốt nhất (beam).</li>
                <li>Nếu đạt goal state → return. Nếu dead end → backtrack về parent có score cao thứ 2.</li>
              </ol>
              <p>
                <strong>Khi nào ToT thắng CoT?</strong> Bài toán có multiple valid paths và cần so sánh:
                (1) <em>Game of 24</em> — kết hợp 4 số bằng phép tính để ra 24. CoT: 4% đúng, ToT: 74%
                đúng. (2) <em>Creative writing</em> với ràng buộc (viết truyện có exactly 4 twist). (3){" "}
                <em>Crossword puzzles</em> cần thử-sai có hệ thống. (4) <em>Code debugging</em> với nhiều
                hypothesis.
              </p>
              <p>
                <strong>Chi phí:</strong> ToT tốn 10-100 LLM calls cho 1 bài (vs 1 call của CoT). Latency
                và cost cực cao, thường chỉ dùng cho research hoặc bài toán high-stakes. Trong production,
                reasoning models (o1) là giải pháp &quot;ToT nội tại&quot; — model tự search trong suy
                nghĩ mà không cần orchestration bên ngoài.
              </p>
              <p>
                <strong>Graph-of-Thoughts (GoT)</strong> (Besta et al. 2023) mở rộng thêm: cho phép cạnh
                merge (hợp nhất 2 thought thành 1), tạo DAG thay vì cây. Áp dụng cho summarization nhiều
                nguồn, multi-document QA. Implementation phức tạp hơn đáng kể.
              </p>
              <p>
                <strong>Thư viện:</strong> <code>guidance</code>,{" "}
                <code>langchain.experimental.tree_of_thought</code>, <code>dspy.TreeOfThoughts</code>.
                Hiện tại vẫn là lĩnh vực research-heavy, chưa có API production cỡ OpenAI expose ToT
                native.
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="tip" title="Pitfall: CoT có thể 'ảo' — model tạo ra reasoning giả">
            <p>
              Nghiên cứu gần đây (Turpin et al. 2023, &quot;Language Models Don&apos;t Always Say What
              They Think&quot;) phát hiện: LLM đôi khi sinh chain-of-thought trông hợp lý nhưng KHÔNG
              phản ánh đúng quá trình thực sự dẫn tới đáp án. Ví dụ: model đã &quot;quyết định&quot; đáp
              án dựa trên bias trong training data, rồi sinh reasoning post-hoc để biện minh.
            </p>
            <p className="mt-2 text-sm">
              <strong>Hậu quả:</strong> không thể dùng reasoning chain làm &quot;lời giải thích&quot;
              đáng tin cậy cho hành vi của model. Đặc biệt nguy hiểm trong: (1) high-stakes decisions —
              y tế, pháp lý, tài chính, (2) audit / compliance — &quot;model giải thích tại sao quyết
              định&quot;, (3) debugging — fix chain nhưng model vẫn sai cùng cách.
            </p>
            <p className="mt-2 text-sm">
              <strong>Khắc phục:</strong> (1) dùng Self-Consistency — nếu reasoning thật, các đáp án hội
              tụ; (2) kiểm tra reasoning bằng verifier model riêng; (3) với model lớn, reasoning chính
              xác hơn, nhưng vẫn không đảm bảo 100%. Đây là lĩnh vực nghiên cứu mở (faithful reasoning,
              interpretability).
            </p>
          </Callout>

          <CollapsibleDetail title="So sánh CoT prompting vs Reasoning models (o1, R1)">
            <div className="space-y-3 text-sm">
              <p>
                <strong>CoT prompting</strong> là <em>dạy cách</em> reasoning qua prompt — model gốc không thay đổi. Hiệu quả tốt cho model &gt;7B params, nhưng hạn chế: (1) chain bị giới hạn bởi context window của prompt, (2) model không được train riêng cho reasoning, (3) lỗi tích lũy khi chain quá dài (&gt;20 bước).
              </p>
              <p>
                <strong>Reasoning models</strong> (OpenAI o1, DeepSeek-R1, QwQ) được train bằng RL trên phần thưởng &quot;đáp án đúng&quot;. Model học TỰ sinh chain-of-thought có thể dài hàng nghìn token, có khả năng tự sửa (self-correction), backtrack, và verify. CoT trở thành <em>nội tại</em>, không cần prompt hint.
              </p>
              <p>
                <strong>Khi nào dùng gì?</strong> CoT prompting: rẻ, đơn giản, đủ dùng cho đa số use case. Reasoning models: khi bài toán phức tạp (toán olympiad, code-gen khó, chứng minh), chấp nhận latency cao (10-60s) và giá gấp 5-10x.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="text-sm">
            <strong>Thực hành:</strong> bắt đầu với Zero-shot CoT. Nếu model trả lời không ổn định, chuyển sang Few-shot CoT. Nếu cần độ chính xác cao nhất (và có ngân sách), dùng Self-Consistency với <LaTeX>{"N = 5"}</LaTeX>. Với task cần reasoning phức tạp, cân nhắc{" "}
            <TopicLink slug="reasoning-models">reasoning models</TopicLink> thay vì tự prompt.
          </p>

          <CodeBlock language="python" title="cot_langchain.py — template CoT với LangChain">
            {CODE_LANGCHAIN_SPLITTERS}
          </CodeBlock>

          <Callout variant="info" title="Benchmarks đáng biết">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>GSM8K</strong> (Cobbe et al. 2021): 8.5K bài toán lời cấp tiểu học — benchmark kinh điển cho CoT.
              </li>
              <li>
                <strong>MATH</strong> (Hendrycks et al. 2021): 12.5K bài toán cấp 3-olympiad, khó hơn GSM8K nhiều.
              </li>
              <li>
                <strong>BBH (Big-Bench Hard)</strong>: 23 task đa dạng, CoT giúp mạnh nhất ở các task symbolic reasoning.
              </li>
              <li>
                <strong>HumanEval / MBPP</strong>: sinh code Python — CoT chain-of-thought giúp 5-15% accuracy.
              </li>
              <li>
                <strong>ARC-AGI</strong> (Chollet 2019): pattern-matching thị giác, rất khó — reasoning models o1/R1 mới vượt được baseline.
              </li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Lịch sử & papers nền tảng">
            <div className="space-y-3 text-sm">
              <p>
                <strong>2022-01 · Wei et al.</strong> — &quot;Chain-of-Thought Prompting Elicits Reasoning in Large Language Models&quot;. Paper đầu tiên chứng minh CoT giúp model &gt;100B params tăng mạnh ở toán & logic. Trước đó, người ta nghĩ scaling params là đủ.
              </p>
              <p>
                <strong>2022-05 · Kojima et al.</strong> — &quot;Large Language Models are Zero-Shot Reasoners&quot;. Phát hiện: chỉ cần thêm &quot;Let&apos;s think step by step&quot; (không ví dụ mẫu) cũng tăng GSM8K từ 17.7% → 40.7% trên InstructGPT. Cú huých quyết định.
              </p>
              <p>
                <strong>2022-10 · Wang et al.</strong> — &quot;Self-Consistency Improves Chain of Thought Reasoning&quot;. Sampling nhiều rồi vote → GSM8K PaLM-540B đạt 74% (so với 57% CoT đơn).
              </p>
              <p>
                <strong>2023 · Yao et al.</strong> — Tree of Thoughts (ToT) & ReAct. Mở rộng CoT thành cây search + tool-use.
              </p>
              <p>
                <strong>2024-09 · OpenAI o1</strong> — model đầu tiên train bằng RL để tự sinh long chain-of-thought. AIME 2024: GPT-4o ~13% → o1 ~83%.
              </p>
              <p>
                <strong>2025-01 · DeepSeek-R1</strong> — open-source reasoning model với kỹ thuật GRPO (Group Relative Policy Optimization), công khai full weights + recipe. Mở cửa cộng đồng tiếp cận reasoning.
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="info" title="Checklist triển khai CoT trong production">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Đo baseline không CoT trước khi thêm CoT — để biết gain thật.</li>
              <li>Đặt <code>max_tokens</code> đủ cao (CoT sinh dài hơn nhiều).</li>
              <li>Parse đáp án cuối chặt chẽ — regex trên &quot;Đáp án:&quot; hoặc dùng{" "}
                <TopicLink slug="structured-outputs">structured outputs</TopicLink>.
              </li>
              <li>Log cả chain để debug khi model sai (không chỉ đáp án cuối).</li>
              <li>Cân nhắc cache: cùng câu hỏi, cùng prompt template → cache cho nhanh.</li>
              <li>Rate-limit Self-Consistency: không chạy 40 samples cho mọi user.</li>
            </ul>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ INLINE CHALLENGE #2 ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách 2">
        <InlineChallenge
          question="Bạn đang xây trợ lý toán tiếng Việt cho học sinh cấp 2. Latency yêu cầu <3s, ngân sách vừa. Biến thể CoT nào phù hợp?"
          options={[
            "Self-Consistency N=20 vì cần chính xác",
            "Few-shot CoT — kiểm soát format lời giải, latency 1-2s, chi phí hợp lý",
            "Không dùng CoT, cho model trả lời thẳng",
            "Dùng reasoning model o1",
          ]}
          correct={1}
          explanation="Few-shot CoT là compromise tốt: kiểm soát được FORMAT lời giải (theo chuẩn tiếng Việt, phù hợp học sinh), latency vẫn chấp nhận được. Self-Consistency N=20 quá tốn tiền; o1 có latency 10-60s không phù hợp UX trẻ em; không CoT thì thiếu bước giải mà trẻ em cần học theo."
        />
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━ SUMMARY + QUIZ ━━━━━━━━━━━━━━━━ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          points={[
            "Chain-of-Thought buộc AI suy luận từng bước thay vì nhảy thẳng đến đáp án — biến cú nhảy xa thành nhiều bước đi ngắn.",
            "Hoạt động vì mỗi bước trung gian trở thành NGỮ CẢNH cho bước tiếp theo, giảm gánh nặng cho single-token prediction.",
            "Ba biến thể chính: Zero-shot CoT (thêm 'suy nghĩ từng bước'), Few-shot CoT (ví dụ mẫu), Self-Consistency (nhiều lần + vote).",
            "Hiệu quả nhất cho toán, logic, suy luận nhiều bước. KHÔNG cần cho dịch, phân loại, text sáng tạo.",
            "Reasoning models (o1, R1) học CoT qua RL, sinh chain nội tại — thế hệ tiếp theo của CoT prompting.",
            "Nguyên tắc production: Zero-shot CoT cho prototyping → Few-shot CoT cho format ổn định → Self-Consistency N=3-5 khi cần chính xác cao.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
