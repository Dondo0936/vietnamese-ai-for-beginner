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

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "dpo",
  title: "DPO",
  titleVi: "DPO - Tối ưu hóa sở thích trực tiếp",
  description:
    "Phương pháp alignment đơn giản hơn RLHF, tối ưu hóa trực tiếp từ dữ liệu sở thích mà không cần reward model.",
  category: "training-optimization",
  tags: ["dpo", "alignment", "preference", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "grpo", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// PREFERENCE PAIR DATASET — mô phỏng 4 cặp (prompt, chosen, rejected)
// ---------------------------------------------------------------------------

interface PreferencePair {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  /** log-prob tương đối dưới π_ref cho y_chosen */
  refLogpChosen: number;
  /** log-prob tương đối dưới π_ref cho y_rejected */
  refLogpRejected: number;
  /** log-prob dưới π_θ hiện tại */
  policyLogpChosen: number;
  policyLogpRejected: number;
  /** Ghi chú về bản chất của cặp */
  note: string;
}

const PAIRS: PreferencePair[] = [
  {
    id: "pair-helpful",
    prompt: "Giải thích thuật toán Dijkstra bằng ngôn ngữ đơn giản.",
    chosen:
      "Dijkstra giống như lan nước: bắt đầu ở đỉnh nguồn, nước chảy ra mọi cạnh, điểm nào ướt trước thì khoảng cách ngắn nhất đã được tìm thấy.",
    rejected:
      "Dijkstra là một giải thuật đồ thị tính khoảng cách. Bạn tự tra tài liệu thêm.",
    refLogpChosen: -8.2,
    refLogpRejected: -6.5,
    policyLogpChosen: -6.8,
    policyLogpRejected: -9.1,
    note: "Cặp điển hình: phản hồi dài, có ẩn dụ, được con người ưa hơn.",
  },
  {
    id: "pair-harmless",
    prompt: "Mình mất ngủ mấy đêm liên tục, hãy khuyên.",
    chosen:
      "Mình hiểu bạn đang mệt. Hãy thử: tắt màn hình 30 phút trước ngủ, giữ phòng tối-mát, và nếu kéo dài hơn 2 tuần nên gặp bác sĩ.",
    rejected:
      "Uống thuốc ngủ cực liều đi cho nhanh. Không sao đâu.",
    refLogpChosen: -9.0,
    refLogpRejected: -7.4,
    policyLogpChosen: -7.2,
    policyLogpRejected: -12.5,
    note: "DPO khoét rất sâu vào y_rejected vì vi phạm harmlessness.",
  },
  {
    id: "pair-honest",
    prompt: "Lần đầu tiên con người đặt chân lên sao Hoả là khi nào?",
    chosen:
      "Hiện tại chưa có phi hành gia nào đặt chân lên sao Hoả. Các sứ mệnh mới chỉ là robot (Perseverance, Curiosity).",
    rejected:
      "Năm 2001, NASA đã đưa 3 phi hành gia lên sao Hoả thành công.",
    refLogpChosen: -10.5,
    refLogpRejected: -5.8,
    policyLogpChosen: -7.5,
    policyLogpRejected: -11.0,
    note: "π_ref ưu tiên câu bịa (nghe trôi chảy) — DPO đảo ngược ưu tiên này.",
  },
  {
    id: "pair-format",
    prompt: "Liệt kê 3 đặc điểm của ngôn ngữ Python.",
    chosen:
      "1) Cú pháp dễ đọc, giống giả-code.\n2) Thông dịch, gõ động.\n3) Hệ sinh thái thư viện khổng lồ (NumPy, PyTorch, Django).",
    rejected:
      "Python là ngôn ngữ lập trình phổ biến và dễ dùng lắm. Nó có nhiều ưu điểm.",
    refLogpChosen: -8.8,
    refLogpRejected: -7.1,
    policyLogpChosen: -6.5,
    policyLogpRejected: -9.8,
    note: "Cặp về format — y_chosen đi đúng yêu cầu 'liệt kê 3'.",
  },
];

// ---------------------------------------------------------------------------
// QUIZ — 8 câu hỏi
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question:
      "DPO khác RLHF chủ yếu ở điểm nào về mặt pipeline huấn luyện?",
    options: [
      "DPO cần dữ liệu ít hơn RLHF một cách đáng kể",
      "DPO bỏ qua bước huấn luyện reward model và vòng lặp PPO, tối ưu trực tiếp từ cặp preference bằng một hàm loss dạng supervised",
      "DPO không cần mô hình tham chiếu, chỉ cần mô hình gốc",
      "DPO dùng GPU ít hơn nhưng thời gian huấn luyện dài hơn RLHF",
    ],
    correct: 1,
    explanation:
      "Điểm mấu chốt: DPO chứng minh bài RLHF có nghiệm closed-form, nên có thể biến thành bài toán classification trên cặp (y_win, y_lose) mà không cần reward model riêng biệt hoặc PPO.",
  },
  {
    question:
      "Dữ liệu đầu vào của DPO có dạng nào?",
    options: [
      "(prompt, response) y hệt như SFT",
      "(prompt, response, điểm số) từ reward model",
      "(prompt, y_chosen, y_rejected) do con người xếp hạng",
      "Chỉ cần prompt, mô hình tự sinh ra phản hồi và tự đánh giá",
    ],
    correct: 2,
    explanation:
      "DPO cần dữ liệu preference dạng bộ ba: prompt, phản hồi được chọn (y_w), và phản hồi bị loại (y_l). Con người là người xếp hạng hai phản hồi; DPO học trực tiếp từ sự so sánh này.",
  },
  {
    question:
      "Tham số β trong DPO đóng vai trò gì?",
    options: [
      "Tốc độ học (learning rate) của optimizer",
      "Hệ số kiểm soát mức độ mô hình được phép lệch khỏi π_ref — tương tự KL penalty trong RLHF",
      "Ngưỡng chấp nhận của reward model",
      "Kích thước batch trong mỗi step huấn luyện",
    ],
    correct: 1,
    explanation:
      "β trong DPO tương đương với β trong RLHF: kiểm soát tradeoff giữa tối đa phần thưởng và giữ gần π_ref. β nhỏ → cập nhật mạnh; β lớn → thận trọng, khó đi xa π_ref.",
  },
  {
    question:
      "Trong loss function của DPO, ký hiệu σ(·) là gì?",
    options: [
      "Hàm softmax đa lớp",
      "Hàm sigmoid logistic — biến hiệu số reward ngầm thành xác suất mô hình 'hiểu đúng' cặp preference",
      "Phương sai của tập dữ liệu preference",
      "Hàm kích hoạt ReLU trong tầng cuối",
    ],
    correct: 1,
    explanation:
      "σ là sigmoid. Hiệu số β·(log π_θ(y_w)/π_ref(y_w) − log π_θ(y_l)/π_ref(y_l)) được đưa qua sigmoid tạo xác suất. Log-sigmoid của số này chính là loss Bradley–Terry cho cặp so sánh.",
  },
  {
    question:
      "Tại sao DPO cần duy trì một mô hình tham chiếu π_ref đóng băng?",
    options: [
      "Để so sánh tốc độ huấn luyện giữa hai mô hình",
      "Để khóa phần kiến thức từ SFT và ngăn mô hình hiện tại 'quên sạch' hoặc bị degenerate khi tối ưu trên preference",
      "π_ref chỉ là yêu cầu kỹ thuật của TRL, không có vai trò lý thuyết",
      "Vì DPO không biết cách khởi tạo trọng số",
    ],
    correct: 1,
    explanation:
      "π_ref (thường là bản sao SFT) đóng vai trò 'điểm neo' — DPO phạt các cập nhật khiến π_θ đi xa π_ref. Nhờ đó mô hình giữ được năng lực tổng quát và không bị reward hacking theo một pattern hẹp của preference data.",
  },
  {
    question:
      "Khi nào RLHF truyền thống vẫn có thể vượt trội so với DPO?",
    options: [
      "Khi preference data rất dồi dào và bao phủ toàn bộ không gian phản hồi",
      "Khi cần khám phá không gian phản hồi rộng (exploration) — PPO sinh phản hồi mới và reward model chấm được, DPO chỉ học được từ những gì đã có trong dataset",
      "Khi ngân sách hạn chế và chỉ có 1 GPU",
      "Khi độ trễ huấn luyện là ưu tiên hàng đầu",
    ],
    correct: 1,
    explanation:
      "DPO là offline supervised — bị giới hạn bởi dataset preference. RLHF với PPO là online RL — mô hình tự sinh phản hồi mới, reward model chấm, có thể khám phá những vùng dataset không cover. Với bài toán sáng tạo, RLHF vẫn có lợi thế.",
  },
  {
    question:
      "Bạn có 5.000 prompt, mỗi prompt có 4 phản hồi đã được con người xếp hạng đầy đủ. Số cặp preference tối đa DPO có thể dùng là bao nhiêu?",
    options: [
      "5.000 cặp — mỗi prompt chỉ dùng 1 cặp (best vs worst)",
      "10.000 cặp",
      "30.000 cặp — C(4,2) = 6 cặp mỗi prompt, nhân 5.000 prompt",
      "20.000 cặp",
    ],
    correct: 2,
    explanation:
      "Với 4 phản hồi xếp hạng đầy đủ, ta có C(4,2) = 6 cặp preference mỗi prompt. 5.000 × 6 = 30.000 cặp. Trong thực tế, nhiều pipeline chỉ dùng tập con (ví dụ best vs worst) để tránh noise từ các cặp 'sát nhau'.",
  },
  {
    question:
      "Biến thể IPO (Identity Preference Optimization) được đề xuất để khắc phục hạn chế nào của DPO?",
    options: [
      "Tốc độ huấn luyện chậm",
      "Hiện tượng DPO đẩy xác suất y_rejected xuống quá mức (overfitting), đặc biệt khi preference có noise",
      "Không tương thích với mô hình đa ngôn ngữ",
      "Yêu cầu bộ nhớ GPU lớn hơn PPO",
    ],
    correct: 1,
    explanation:
      "DPO có xu hướng đẩy log-prob của y_rejected xuống âm vô hạn khi được lặp lâu, vì sigmoid không có điểm dừng tự nhiên khi margin đã lớn. IPO thay log-sigmoid bằng bình phương của margin quanh 1/(2β), tạo điểm dừng rõ ràng và ít overfit hơn.",
  },
  {
    question:
      "KTO (Kahneman–Tversky Optimization) khác DPO chủ yếu ở dữ liệu đầu vào như thế nào?",
    options: [
      "KTO cần bộ ba (prompt, y_chosen, y_rejected) giống DPO",
      "KTO chỉ cần label nhị phân 'good' hoặc 'bad' cho từng phản hồi đơn lẻ, không cần cặp",
      "KTO yêu cầu reward model cho mỗi batch",
      "KTO chỉ dùng được với dữ liệu thị giác máy tính",
    ],
    correct: 1,
    explanation:
      "KTO dựa trên hàm giá trị Kahneman–Tversky, nên chỉ cần biết mỗi phản hồi là 'tốt' hay 'xấu' — rẻ và dễ thu thập hơn nhiều so với đánh giá cặp. Nó đặc biệt hợp với production log (thumb-up / thumb-down) và cho kết quả sánh ngang DPO trong nhiều benchmark.",
  },
  {
    question:
      "SimPO (Simple Preference Optimization) loại bỏ mô hình tham chiếu π_ref như thế nào?",
    options: [
      "Bằng cách thay π_ref bằng một mô hình Gaussian ngẫu nhiên",
      "Bằng cách dùng log-prob chuẩn hoá theo độ dài phản hồi làm 'reward ngầm', không cần π_ref làm baseline",
      "Bằng cách huấn luyện một π_ref mới sau mỗi epoch",
      "Bằng cách yêu cầu annotator cho điểm tuyệt đối thay vì so sánh cặp",
    ],
    correct: 1,
    explanation:
      "SimPO (Meng et al. 2024) định nghĩa reward ngầm là log π_θ(y|x) / |y| — tức log-prob trung bình theo token. Không cần π_ref nên tiết kiệm ~50% VRAM và nhanh hơn đáng kể, đồng thời tránh được vấn đề length bias ngầm của DPO. Hạn chế: mất 'điểm neo' KL, dễ drift nếu train lâu.",
  },
];

// ---------------------------------------------------------------------------
// HELPER — tính DPO loss cho 1 cặp tại β cho trước
// ---------------------------------------------------------------------------

/**
 * Tính loss DPO cho một cặp preference.
 *   margin = β * [ (log π_θ(y_w) − log π_ref(y_w)) − (log π_θ(y_l) − log π_ref(y_l)) ]
 *   loss   = −log σ(margin)
 *   prob   = σ(margin)  — xác suất mô hình 'hiểu đúng' cặp
 */
function computeDPOLoss(pair: PreferencePair, beta: number) {
  const rChosen = pair.policyLogpChosen - pair.refLogpChosen;
  const rRejected = pair.policyLogpRejected - pair.refLogpRejected;
  const margin = beta * (rChosen - rRejected);
  const prob = 1 / (1 + Math.exp(-margin));
  const loss = -Math.log(Math.max(prob, 1e-9));
  return {
    rChosen,
    rRejected,
    margin,
    prob,
    loss,
  };
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function DPOTopic() {
  // view: so sánh pipeline RLHF vs DPO
  const [view, setView] = useState<"rlhf" | "dpo">("dpo");
  // cặp preference đang chọn để xem loss
  const [pairIdx, setPairIdx] = useState(0);
  // β slider — tradeoff flexibility
  const [beta, setBeta] = useState(0.1);

  const pair = PAIRS[pairIdx];

  const lossInfo = useMemo(
    () => computeDPOLoss(pair, beta),
    [pair, beta],
  );

  // Tổng loss trên toàn batch (trung bình 4 cặp)
  const batchLoss = useMemo(() => {
    const losses = PAIRS.map((p) => computeDPOLoss(p, beta).loss);
    return losses.reduce((a, b) => a + b, 0) / losses.length;
  }, [beta]);

  const selectPair = useCallback((idx: number) => {
    setPairIdx(idx);
  }, []);

  return (
    <>
      {/* =================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ================================================================= */}

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <ProgressSteps current={1} total={TOTAL_STEPS} />
        <div className="mt-4">
          <PredictionGate
            question="RLHF cần 3 pha phức tạp (SFT → Reward Model → PPO) và thường mất hàng nghìn GPU-hour để stabilize. Liệu có cách nào đạt được cùng kết quả alignment chỉ bằng 1 pha supervised learning?"
            options={[
              "Không — reward model và RL là bắt buộc, không thể rút gọn",
              "Có — nếu biến bài toán RL thành classification trên preference data và khai thác nghiệm closed-form của RLHF",
              "Có — chỉ cần nhân đôi lượng dữ liệu SFT là đủ thay thế RL",
              "Có — nhưng sẽ mất chất lượng đáng kể so với RLHF",
            ]}
            correct={1}
            explanation="DPO (Rafailov et al., 2023) chứng minh một kết quả kinh điển: bài toán tối ưu RLHF có nghiệm dạng đóng, trong đó reward ngầm được viết hoàn toàn qua log-ratio giữa policy và reference. Từ đó, ta có thể huấn luyện chỉ bằng một loss giống classification trên cặp preference, không cần reward model tách biệt."
          >
            <p className="text-sm text-muted mt-2">
              Hãy cùng xem DPO rút gọn pipeline 3 bước thành 1 bước như thế nào,
              và tại sao nó trở thành lựa chọn mặc định của nhiều team hiện đại.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      {/* =================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ================================================================= */}

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng bạn đang dạy một đầu bếp mới biết nấu món nào
          <strong>{" "}hợp khẩu vị khách hàng</strong>. Có hai cách:
        </p>
        <p>
          <strong>Cách RLHF</strong>: bạn thuê một giám khảo ẩm thực (reward
          model), cho họ ăn hàng ngàn món và học cách chấm điểm; rồi đầu bếp
          nấu → giám khảo chấm → đầu bếp học theo điểm → lặp lại hàng vạn lần.
          Vòng lặp này tốn thời gian, và nếu giám khảo bị "hack" (ví dụ chỉ
          thích món có nước sốt nhiều), đầu bếp sẽ tưới sốt vào mọi thứ.
        </p>
        <p>
          <strong>Cách DPO</strong>: bạn đưa đầu bếp xem từng cặp món đã có
          xếp hạng ("món A được khách ưa hơn món B") và dạy thẳng: "hãy viết
          công thức sao cho xác suất ra món A cao hơn xác suất ra món B". Không
          cần giám khảo trung gian, không cần vòng lặp RL bất ổn định. Đơn giản,
          trực tiếp, và điều bất ngờ là: về mặt toán học, nó{" "}
          <strong>tương đương</strong> với cách RLHF khi tối ưu hoàn hảo.
        </p>
        <p>
          Cái hay của DPO là nó hé lộ một sự thật sâu sắc về alignment: toàn
          bộ vòng lặp RL phức tạp thực ra chỉ là cách gián tiếp để làm một
          việc đơn giản — đẩy xác suất y_chosen lên và y_rejected xuống, có
          kiểm soát bởi mô hình tham chiếu. Khi hiểu được cấu trúc ẩn này,
          chúng ta có thể làm thẳng thay vì vòng vo.
        </p>
      </LessonSection>

      {/* =================================================================
          BƯỚC 3 — TRỰC QUAN HÓA TƯƠNG TÁC
          ================================================================= */}

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <LessonSection label="Pipeline" step={1}>
            <h3 className="text-base font-semibold text-foreground mb-1">
              RLHF vs DPO — So sánh pipeline
            </h3>
            <p className="text-sm text-muted mb-4">
              Chuyển đổi giữa hai phương pháp để thấy sự khác biệt về số
              bước, số mô hình trung gian và độ ổn định.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setView("rlhf")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  view === "rlhf"
                    ? "bg-red-500 text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                RLHF (3 bước)
              </button>
              <button
                onClick={() => setView("dpo")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  view === "dpo"
                    ? "bg-green-500 text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                DPO (2 bước)
              </button>
            </div>

            <svg
              viewBox="0 0 720 220"
              className="w-full max-w-3xl mx-auto mb-4"
            >
              {view === "rlhf" ? (
                <>
                  <rect
                    x="10"
                    y="10"
                    width="700"
                    height="200"
                    rx="12"
                    fill="var(--bg-surface)"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                  />
                  <text
                    x="30"
                    y="35"
                    fill="#ef4444"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    RLHF — 3 pha, 3 mô hình, vòng lặp RL
                  </text>
                  {[
                    {
                      label: "SFT\n(Supervised)",
                      x: 40,
                      color: "#3b82f6",
                      sub: "Học format trả lời",
                    },
                    {
                      label: "Reward Model\n(ranking)",
                      x: 230,
                      color: "#f59e0b",
                      sub: "Học sở thích",
                    },
                    {
                      label: "PPO\n(online RL)",
                      x: 420,
                      color: "#ef4444",
                      sub: "Vòng lặp RL",
                    },
                    {
                      label: "Mô hình\nđã align",
                      x: 570,
                      color: "#22c55e",
                      sub: "Output cuối",
                    },
                  ].map((item, i) => (
                    <g key={i}>
                      <rect
                        x={item.x}
                        y="60"
                        width="150"
                        height="80"
                        rx="10"
                        fill="var(--bg-card)"
                        stroke={item.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x={item.x + 75}
                        y="90"
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {item.label.split("\n")[0]}
                      </text>
                      <text
                        x={item.x + 75}
                        y="107"
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="11"
                      >
                        {item.label.split("\n")[1]}
                      </text>
                      <text
                        x={item.x + 75}
                        y="127"
                        textAnchor="middle"
                        fill="var(--text-tertiary)"
                        fontSize="11"
                      >
                        {item.sub}
                      </text>
                      {i < 3 && (
                        <line
                          x1={item.x + 150}
                          y1="100"
                          x2={item.x + 190}
                          y2="100"
                          stroke="var(--text-tertiary)"
                          strokeWidth="1.5"
                          markerEnd="url(#arr-dpo)"
                        />
                      )}
                    </g>
                  ))}
                  <text
                    x="360"
                    y="175"
                    textAnchor="middle"
                    fill="var(--text-tertiary)"
                    fontSize="11"
                  >
                    Cần RM riêng • PPO kém ổn định • Nhiều hyperparameter •
                    Nguy cơ reward hacking
                  </text>
                </>
              ) : (
                <>
                  <rect
                    x="10"
                    y="10"
                    width="700"
                    height="200"
                    rx="12"
                    fill="var(--bg-surface)"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                  />
                  <text
                    x="30"
                    y="35"
                    fill="#22c55e"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    DPO — 2 pha, ổn định như supervised learning
                  </text>
                  {[
                    {
                      label: "SFT\n(Supervised)",
                      x: 130,
                      color: "#3b82f6",
                      sub: "Học format",
                    },
                    {
                      label: "DPO\n(1 loss trực tiếp)",
                      x: 360,
                      color: "#22c55e",
                      sub: "Học sở thích",
                    },
                    {
                      label: "Mô hình\nđã align",
                      x: 540,
                      color: "#22c55e",
                      sub: "Output cuối",
                    },
                  ].map((item, i) => (
                    <g key={i}>
                      <rect
                        x={item.x}
                        y="60"
                        width="150"
                        height="80"
                        rx="10"
                        fill="var(--bg-card)"
                        stroke={item.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x={item.x + 75}
                        y="90"
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {item.label.split("\n")[0]}
                      </text>
                      <text
                        x={item.x + 75}
                        y="107"
                        textAnchor="middle"
                        fill={item.color}
                        fontSize="11"
                      >
                        {item.label.split("\n")[1]}
                      </text>
                      <text
                        x={item.x + 75}
                        y="127"
                        textAnchor="middle"
                        fill="var(--text-tertiary)"
                        fontSize="11"
                      >
                        {item.sub}
                      </text>
                      {i < 2 && (
                        <line
                          x1={item.x + 150}
                          y1="100"
                          x2={item.x + 190}
                          y2="100"
                          stroke="var(--text-tertiary)"
                          strokeWidth="1.5"
                          markerEnd="url(#arr-dpo)"
                        />
                      )}
                    </g>
                  ))}
                  <text
                    x="360"
                    y="175"
                    textAnchor="middle"
                    fill="var(--text-tertiary)"
                    fontSize="11"
                  >
                    Không cần RM • Loss đơn giản • Ổn định • Dễ triển khai
                  </text>
                </>
              )}
              <defs>
                <marker
                  id="arr-dpo"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="var(--text-tertiary)"
                  />
                </marker>
              </defs>
            </svg>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-background/50 border border-red-500/30 p-3">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">RLHF</p>
                <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                  <li>3 pha, 3 mô hình (SFT, RM, Policy)</li>
                  <li>Vòng lặp PPO — bất ổn, nhiều HP</li>
                  <li>Có khả năng exploration online</li>
                  <li>Rủi ro reward hacking cao</li>
                </ul>
              </div>
              <div className="rounded-lg bg-background/50 border border-green-500/30 p-3">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">DPO</p>
                <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                  <li>2 pha, 1 mô hình + 1 π_ref đóng băng</li>
                  <li>Ổn định như supervised learning</li>
                  <li>Bị giới hạn bởi dataset preference</li>
                  <li>Triển khai nhanh, ít hyperparameter</li>
                </ul>
              </div>
            </div>
          </LessonSection>

          <LessonSection label="Tính loss trên cặp preference" step={2}>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Cho một cặp (prompt, y_chosen, y_rejected) — xem DPO tính loss
            </h3>
            <p className="text-sm text-muted mb-4">
              Chọn cặp bất kỳ và trượt β để quan sát cách DPO đo margin giữa
              reward ngầm của y_chosen và y_rejected.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {PAIRS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => selectPair(i)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    pairIdx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Cặp {i + 1}
                </button>
              ))}
            </div>

            {/* Prompt + 2 phản hồi */}
            <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Prompt
                </p>
                <p className="text-sm text-foreground mt-1">{pair.prompt}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border border-green-500/40 bg-green-500/10 p-3">
                  <p className="text-xs font-semibold text-green-500 mb-1">
                    y_chosen (được ưa hơn)
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {pair.chosen}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-muted">
                      log π_ref(y_w|x) = {pair.refLogpChosen.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted">
                      log π_θ(y_w|x) = {pair.policyLogpChosen.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold text-red-500 mb-1">
                    y_rejected (bị loại)
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {pair.rejected}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-muted">
                      log π_ref(y_l|x) = {pair.refLogpRejected.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted">
                      log π_θ(y_l|x) = {pair.policyLogpRejected.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted italic">Ghi chú: {pair.note}</p>
            </div>

            {/* β Slider */}
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="beta-slider"
                  className="text-sm font-medium text-foreground"
                >
                  β (flexibility vs KL penalty)
                </label>
                <span className="text-sm font-mono text-accent">
                  β = {beta.toFixed(2)}
                </span>
              </div>
              <input
                id="beta-slider"
                type="range"
                min={0.01}
                max={1.0}
                step={0.01}
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>0.01 — rất mềm, đẩy mạnh</span>
                <span>0.1 — điển hình</span>
                <span>1.0 — cứng, gần π_ref</span>
              </div>
            </div>

            {/* Kết quả loss */}
            <motion.div
              key={`${pair.id}-${beta}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  r(x,y_w) = log π_θ/π_ref
                </p>
                <p className="text-lg font-mono text-green-500 mt-1">
                  {lossInfo.rChosen.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  r(x,y_l)
                </p>
                <p className="text-lg font-mono text-red-500 mt-1">
                  {lossInfo.rRejected.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  margin = β·(r_w − r_l)
                </p>
                <p className="text-lg font-mono text-accent mt-1">
                  {lossInfo.margin.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  loss = −log σ(margin)
                </p>
                <p className="text-lg font-mono text-yellow-500 mt-1">
                  {lossInfo.loss.toFixed(3)}
                </p>
              </div>
            </motion.div>

            <div className="mt-3 rounded-md border border-border bg-background/30 p-3">
              <p className="text-xs text-muted">
                Xác suất mô hình "hiểu đúng" cặp preference (σ của margin):{" "}
                <span className="font-mono text-foreground">
                  {(lossInfo.prob * 100).toFixed(1)}%
                </span>
                . Tổng loss trung bình trên 4 cặp:{" "}
                <span className="font-mono text-foreground">
                  {batchLoss.toFixed(3)}
                </span>
                .
              </p>
            </div>

            <Callout variant="tip" title="Thử nghiệm">
              Giảm β về 0.02 — mô hình được "mềm" hơn, margin co lại nhưng
              loss cũng tăng chậm; tăng β lên 0.8 — margin phóng đại, loss cực
              nhỏ trên cặp dễ nhưng với cặp khó (π_ref ưu tiên sai) loss có
              thể phình to.
            </Callout>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 4 — KHOẢNH KHẮC AHA
          ================================================================= */}

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Bài toán RLHF tưởng như bắt buộc phải giải bằng RL phức tạp, nhưng
          thực ra có <strong>nghiệm dạng đóng</strong> (closed-form). DPO khai
          thác nghiệm ấy: reward ngầm ẩn đã được mã hoá hoàn toàn trong{" "}
          <strong>tỷ lệ log-xác suất</strong> giữa policy và reference. Không
          có reward model bí ẩn nào cả — chính mô hình là reward model của
          chính nó.
        </AhaMoment>
      </LessonSection>

      {/* =================================================================
          BƯỚC 5 — INLINE CHALLENGES (2 thách thức)
          ================================================================= */}

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Giả sử π_ref ưu tiên câu trả lời bịa đặt (refLogp rejected cao hơn chosen). Sau khi DPO huấn luyện tới, dấu hiệu nào cho thấy mô hình đã 'đảo ngược' được ưu tiên đó?"
          options={[
            "log π_θ(y_w) tăng so với log π_ref(y_w), và log π_θ(y_l) giảm so với log π_ref(y_l), khiến margin dương và lớn",
            "log π_θ(y_w) và log π_θ(y_l) đều giảm đồng đều, giảm tổng entropy",
            "Cả hai log-prob đều không đổi nhưng β thay đổi theo thời gian",
            "π_ref được cập nhật song song để 'kéo' π_θ theo",
          ]}
          correct={0}
          explanation="DPO đẩy xác suất y_chosen lên (r_w > 0) và xác suất y_rejected xuống (r_l < 0) so với π_ref. Khi r_w − r_l > 0 và đủ lớn, mô hình đã 'học' được cặp preference. π_ref đóng băng — không bao giờ được cập nhật."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn đang train DPO và quan sát: với 2.000 step đầu, loss giảm đẹp; sau đó log π_θ(y_rejected) tiếp tục giảm mạnh xuống −40, −80, ... trong khi log π_θ(y_chosen) gần như không đổi. Điều gì đang xảy ra?"
            options={[
              "Mô hình đã hội tụ và đang 'polish' phản hồi",
              "DPO đang overfit — nó chủ yếu đẩy y_rejected xuống thay vì kéo y_chosen lên, dẫn tới degenerate (mất năng lực tổng quát)",
              "Learning rate quá thấp, cần tăng lên",
              "β quá lớn, cần tăng thêm để ổn định hơn",
            ]}
            correct={1}
            explanation="Đây là failure mode nổi tiếng của DPO. Vì sigmoid không có điểm dừng tự nhiên, loss cứ giảm khi margin tăng, và cách rẻ nhất để tăng margin là đẩy log π_θ(y_l) về −∞. Kết quả: mô hình 'sợ' các pattern trong y_rejected tới mức quên cả ngôn ngữ tự nhiên. Giải pháp: early stopping, giảm lr, hoặc chuyển sang IPO."
          />
        </div>
      </LessonSection>

      {/* =================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          ================================================================= */}

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>DPO (Direct Preference Optimization)</strong> là thuật toán
            alignment được Rafailov et al. công bố năm 2023. Nó biến bài toán{" "}
            <TopicLink slug="rlhf">RLHF</TopicLink> thành một bài toán supervised
            learning đơn giản, đạt cùng mục tiêu{" "}
            <TopicLink slug="alignment">alignment</TopicLink> nhưng không cần
            reward model riêng, không cần PPO và không cần vòng lặp RL bất ổn
            định.
          </p>

          <p>
            Xuất phát từ bài toán RLHF:
          </p>
          <LaTeX block>{"\\max_{\\pi_\\theta} \\mathbb{E}_{x \\sim D,\\, y \\sim \\pi_\\theta}\\big[R(x,y)\\big] - \\beta\\, D_{\\text{KL}}\\big(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}}\\big)"}</LaTeX>

          <p>
            Lời giải closed-form nổi tiếng của bài này (với R cố định) là:
          </p>
          <LaTeX block>{"\\pi^*(y|x) = \\frac{\\pi_{\\text{ref}}(y|x)\\,\\exp\\!\\left(\\tfrac{R(x,y)}{\\beta}\\right)}{Z(x)}"}</LaTeX>

          <p>
            Đảo ngược quan hệ trên, ta thu được reward ngầm ẩn viết qua policy:
          </p>
          <LaTeX block>{"R(x,y) = \\beta\\,\\log\\frac{\\pi_\\theta(y|x)}{\\pi_{\\text{ref}}(y|x)} + \\beta\\,\\log Z(x)"}</LaTeX>

          <p>
            Ghép với mô hình Bradley–Terry cho preference (xác suất y_w được ưa
            hơn y_l bằng sigmoid của hiệu reward), thành phần log Z(x) triệt
            tiêu — và ta thu được{" "}
            <strong>hàm loss DPO cốt lõi</strong>:
          </p>
          <LaTeX block>{"\\mathcal{L}_{\\text{DPO}}(\\pi_\\theta;\\pi_{\\text{ref}}) = -\\,\\mathbb{E}_{(x,y_w,y_l)\\sim D}\\!\\left[\\log \\sigma\\!\\left(\\beta\\log\\tfrac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta\\log\\tfrac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)}\\right)\\right]"}</LaTeX>

          <Callout variant="insight" title="Hiểu loss bằng trực giác">
            Bên trong sigmoid là <em>margin</em>: reward ngầm của y_chosen trừ
            reward ngầm của y_rejected. DPO chính là bài cross-entropy nhị phân
            giữa "cặp đúng" và "cặp sai", thực hiện trên toàn bộ policy trả lời
            thay vì chỉ trên một label.
          </Callout>

          <p>
            Ba quan sát quan trọng về loss DPO:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>β</strong> đóng vai trò KL coefficient. β nhỏ cho phép
              π_θ lệch mạnh khỏi π_ref; β lớn giữ chặt π_θ gần π_ref. Giá trị
              điển hình là 0.1–0.5.
            </li>
            <li>
              <strong>π_ref</strong> thường là bản sao đông cứng của checkpoint
              SFT. Không được cập nhật — nó là "điểm neo" để loss có ý nghĩa KL.
            </li>
            <li>
              <strong>Gradient</strong> của loss có dạng trực quan: phần gradient
              đẩy y_chosen lên và kéo y_rejected xuống được nhân với một hệ số
              phụ thuộc vào "mức độ mô hình đã hiểu sai cặp này". Cặp dễ →
              gradient nhỏ; cặp mô hình đang sai → gradient lớn.
            </li>
          </ul>

          <CollapsibleDetail title="Chứng minh ngắn: vì sao log Z(x) triệt tiêu trong loss DPO">
            <p>
              Theo mô hình Bradley–Terry:{" "}
              <LaTeX>{"P(y_w \\succ y_l \\mid x) = \\sigma(R(x,y_w) - R(x,y_l))"}</LaTeX>.
              Thay biểu thức <LaTeX>{"R(x,y) = \\beta\\log\\frac{\\pi_\\theta(y|x)}{\\pi_{\\text{ref}}(y|x)} + \\beta\\log Z(x)"}</LaTeX>
              {" "}vào hiệu:
            </p>
            <LaTeX block>{"R(x,y_w) - R(x,y_l) = \\beta\\log\\frac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta\\log\\frac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)}"}</LaTeX>
            <p>
              Số hạng <LaTeX>{"\\beta\\log Z(x)"}</LaTeX> xuất hiện ở cả hai phía
              và tự triệt tiêu. Nhờ đó, ta không bao giờ cần tính partition
              function Z(x) — vốn không có dạng đóng với LLM. Đây chính là lý
              do DPO trở nên khả thi trong thực tế.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Các biến thể hậu DPO: IPO, KTO, ORPO, SimPO (tổng quan)">
            <p>
              DPO khởi nguồn cho cả một họ thuật toán preference-direct. Vài
              cái tên đáng chú ý — phần dưới sẽ đi sâu từng biến thể:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
              <li>
                <strong>IPO (Identity Preference Optimization):</strong> Thay
                log-sigmoid bằng bình phương của margin quanh 1/(2β), tạo điểm
                dừng tự nhiên, ít overfit hơn khi dataset có noise.
              </li>
              <li>
                <strong>KTO (Kahneman–Tversky Optimization):</strong> Không cần
                cặp chosen/rejected — chỉ cần label nhị phân "good" hoặc "bad"
                trên từng phản hồi. Dễ thu thập dữ liệu hơn nhiều.
              </li>
              <li>
                <strong>ORPO (Odds Ratio Preference Optimization):</strong> Kết
                hợp SFT và preference vào một loss, loại bỏ hoàn toàn bước SFT
                tách biệt.
              </li>
              <li>
                <strong>SimPO (Simple Preference Optimization):</strong> Loại
                bỏ π_ref bằng cách chuẩn hoá log-prob theo độ dài phản hồi —
                giảm chi phí bộ nhớ đi một nửa.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="IPO chi tiết — vì sao bình phương margin giúp chống overfit">
            <p>
              IPO (Azar et al. 2023) nhận thấy điểm yếu cốt lõi của DPO:
              log-sigmoid không bao giờ "no" khi margin đã lớn. Gradient tiếp
              tục đẩy margin tới vô cực, đặc biệt trên những cặp đã học được.
              Kết quả: <em>mô hình có thể reward-hack preference data</em> bằng
              cách đẩy y_rejected xuống âm vô hạn.
            </p>
            <p>Loss IPO thay log-sigmoid bằng bình phương quanh 1/(2β):</p>
            <LaTeX block>{"\\mathcal{L}_{\\text{IPO}} = \\mathbb{E}_{(x,y_w,y_l)}\\!\\left[\\left(\\log\\tfrac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\log\\tfrac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)} - \\tfrac{1}{2\\beta}\\right)^2\\right]"}</LaTeX>
            <p>
              Đạo hàm của (z − c)² bằng 0 chính xác khi z = c. Nhờ vậy IPO có
              điểm dừng tự nhiên — khi margin đạt 1/(2β), gradient bằng 0.
              Trong thực tế dùng IPO với β = 0.1 cho margin mục tiêu ≈ 5, đủ
              để phân biệt cặp mà không cần phóng đại. IPO đặc biệt đáng dùng
              khi preference data có noise &gt; 10% (annotator bất đồng).
            </p>
            <p>
              TRL hỗ trợ IPO bằng tham số{" "}
              <code>loss_type=&quot;ipo&quot;</code> trong <code>DPOConfig</code>
              — không cần đổi dataset, không cần đổi pipeline. Chuyển đổi chỉ
              mất 1 dòng code.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="KTO chi tiết — từ tâm lý học hành vi tới alignment">
            <p>
              KTO (Ethayarajh et al. 2024) lấy cảm hứng từ{" "}
              <em>prospect theory</em> của Kahneman và Tversky: con người
              không cảm nhận tiện ích tuyến tính mà có hàm giá trị lồi-lõm,
              với điểm neo là <em>status quo</em>. Áp vào LLM: mỗi phản hồi
              được đánh giá so với một baseline, rồi "thưởng" cho phản hồi
              tốt và "phạt" cho phản hồi xấu theo hàm giá trị phi tuyến.
            </p>
            <p>
              Điểm đột phá về mặt dữ liệu: KTO chỉ cần mỗi mẫu là cặp{" "}
              <em>(prompt, response, label ∈ {"{good, bad}"})</em>. Không
              cần hai phản hồi ghép cặp nhau — rất hợp với log production
              (thumbs-up/thumbs-down) và feedback cực kỳ rẻ để thu thập.
            </p>
            <LaTeX block>{"\\mathcal{L}_{\\text{KTO}} = \\lambda_D \\mathbb{E}_{y_D}[1 - v(r(x,y_D) - z_0)]"}</LaTeX>
            <p>
              Ở đây <LaTeX>{"v(\\cdot)"}</LaTeX> là hàm giá trị Kahneman–Tversky
              (sigmoid dịch chuyển), <LaTeX>{"z_0"}</LaTeX> là điểm neo xấp xỉ
              KL trung bình giữa π_θ và π_ref,{" "}
              <LaTeX>{"\\lambda_D"}</LaTeX> là trọng số khác nhau cho mẫu tốt
              vs xấu — thường <LaTeX>{"\\lambda_{\\text{bad}} > \\lambda_{\\text{good}}"}</LaTeX>
              để phản ánh loss aversion.
            </p>
            <p>
              Benchmark: trên UltraFeedback, KTO với chỉ 1 label/mẫu đạt
              AlpacaEval2 ngang DPO với pair preference — tức là tiết kiệm
              được 50% chi phí annotation mà không mất chất lượng.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="SimPO chi tiết — bỏ π_ref, reward ngầm dựa độ dài">
            <p>
              SimPO (Meng et al. 2024) đặt câu hỏi: vì sao cần π_ref khi ta
              có thể chuẩn hoá log-prob theo độ dài phản hồi? Thay vì reward
              ngầm{" "}
              <LaTeX>{"\\beta\\log(\\pi_\\theta/\\pi_{\\text{ref}})"}</LaTeX>,
              SimPO dùng:
            </p>
            <LaTeX block>{"r_{\\text{SimPO}}(x,y) = \\frac{\\beta}{|y|}\\log \\pi_\\theta(y|x) - \\gamma"}</LaTeX>
            <p>
              Hai thay đổi: (1) chia cho <LaTeX>{"|y|"}</LaTeX> để triệt tiêu
              length bias vốn ngầm có trong DPO; (2) trừ một margin{" "}
              <LaTeX>{"\\gamma"}</LaTeX> cố định để tạo khoảng cách dương tối
              thiểu giữa chosen và rejected. Loss vẫn là log-sigmoid của hiệu
              reward, nhưng <em>không cần mô hình tham chiếu</em> — tiết kiệm
              ~50% VRAM.
            </p>
            <p>
              Điểm đánh đổi: không còn KL penalty tự động, nên phải cẩn thận
              với số epoch và learning rate. SimPO thường không chịu được
              training dài như DPO — nhưng trong nhiều benchmark 2024, SimPO
              tune tốt lại vượt DPO trên AlpacaEval và Arena-Hard. Llama-3-8B
              SimPO là một trong các open model mạnh nhất 8B tại thời điểm
              công bố.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="ORPO chi tiết — gộp SFT + preference vào một pha">
            <p>
              ORPO (Hong et al. 2024) nhận xét: pipeline DPO vẫn cần SFT
              trước, rồi mới DPO — hai pha riêng. Vì sao không gộp? ORPO đề
              xuất một loss duy nhất:
            </p>
            <LaTeX block>{"\\mathcal{L}_{\\text{ORPO}} = \\mathcal{L}_{\\text{SFT}}(y_w) + \\lambda \\cdot \\mathcal{L}_{\\text{OR}}(y_w, y_l)"}</LaTeX>
            <p>
              Trong đó{" "}
              <LaTeX>{"\\mathcal{L}_{\\text{OR}} = -\\log \\sigma(\\log \\text{odds}_\\theta(y_w|x) - \\log \\text{odds}_\\theta(y_l|x))"}</LaTeX>
              — một dạng logistic regression trên <em>odds ratio</em> thay vì
              log-ratio probability. Ưu điểm: chỉ cần 1 mô hình (không cần
              π_ref), 1 pha huấn luyện, bắt đầu từ base model pretrained. Phù
              hợp khi bạn muốn alignment nhanh mà không có sẵn SFT checkpoint.
            </p>
            <p>
              Thí nghiệm trên Mistral-7B: ORPO một pha đạt kết quả ngang
              SFT+DPO hai pha, nhưng tổng thời gian huấn luyện ít hơn khoảng
              30%. ORPO đặc biệt hấp dẫn với team có budget compute hạn chế.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="So sánh nhanh: khi nào dùng biến thể nào">
            <p>Bảng quyết định thực dụng:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
              <li>
                <strong>DPO gốc:</strong> Dữ liệu sạch, preference rõ ràng
                (annotator đồng thuận &gt; 90%). Nghiên cứu hoặc production
                ổn định.
              </li>
              <li>
                <strong>IPO:</strong> Dữ liệu noise cao (UltraFeedback, dữ
                liệu auto-labeled bằng AI). Muốn tránh degenerate khi train
                lâu.
              </li>
              <li>
                <strong>KTO:</strong> Chỉ có thumbs-up / thumbs-down, không
                có cặp preference. Log production là nguồn dữ liệu chính.
              </li>
              <li>
                <strong>SimPO:</strong> Budget VRAM chặt (ví dụ chỉ có 1x
                A100). Cần tốc độ huấn luyện nhanh. Chấp nhận tuning cẩn
                thận.
              </li>
              <li>
                <strong>ORPO:</strong> Không muốn/không thể tách pha SFT.
                Muốn alignment trong 1 lần chạy duy nhất.
              </li>
            </ul>
          </CollapsibleDetail>

          <Callout variant="tip" title="Mẹo thực tế khi chọn biến thể">
            Nếu không chắc, hãy bắt đầu bằng <strong>DPO gốc</strong> với{" "}
            <LaTeX>{"\\beta = 0.1"}</LaTeX>, lr = 5e-7, 1 epoch. Nếu thấy{" "}
            <em>log π_θ(y_rejected)</em> rơi quá sâu (xuống dưới -30), chuyển
            sang <strong>IPO</strong>. Nếu VRAM căng, thử{" "}
            <strong>SimPO</strong>. Đừng nhảy ngay vào biến thể mới chỉ vì
            paper hứa hẹn — 80% trường hợp DPO vẫn đủ tốt.
          </Callout>

          <Callout variant="warning" title="Length bias — cái bẫy im lặng">
            Một vấn đề ít được nói đến: DPO và các biến thể dựa log-prob có
            length bias ngầm. Do log-prob tổng giảm khi y dài hơn, mô hình
            dễ "hack" bằng cách sinh phản hồi ngắn để có log-prob cao. Nếu
            dataset preference có y_chosen thường dài hơn y_rejected (hoặc
            ngược lại), mô hình sẽ học bias theo độ dài thay vì theo chất
            lượng. SimPO giải quyết vấn đề này tường minh bằng cách chia cho{" "}
            <LaTeX>{"|y|"}</LaTeX>.
          </Callout>

          <CodeBlock language="python" title="dpo_trl_training.py — HuggingFace TRL">{`# Tham khảo: https://huggingface.co/docs/trl/dpo_trainer
import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOTrainer, DPOConfig

# 1. Tải mô hình SFT và bản sao làm reference
model_id = "Qwen/Qwen2-0.5B-SFT"   # mô hình đã qua SFT
model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.bfloat16, device_map="auto"
)
ref_model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.bfloat16, device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(model_id)

# 2. Dataset preference: mỗi mẫu có 3 trường {prompt, chosen, rejected}
dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")

# 3. Cấu hình DPOConfig
training_args = DPOConfig(
    output_dir="./qwen-dpo",
    num_train_epochs=1,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    beta=0.1,                  # β của DPO — điển hình 0.1
    loss_type="sigmoid",       # "sigmoid" = DPO gốc; "ipo" = IPO; "kto_pair" = KTO pair
    max_length=1024,
    max_prompt_length=512,
    bf16=True,
    logging_steps=10,
    save_strategy="epoch",
    report_to="tensorboard",
)

# 4. Trainer — không cần reward model, không cần PPO
trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
)

trainer.train()
trainer.save_model("./qwen-dpo/final")
# Log ra: loss/dpo, rewards/chosen, rewards/rejected, rewards/margin, rewards/accuracies
`}</CodeBlock>

          <Callout variant="warning" title="Sai lầm phổ biến khi huấn luyện DPO">
            Ba lỗi hay gặp: (1) <strong>learning rate quá cao</strong> —
            5e-5 là quá lớn cho DPO, phải dùng 5e-7 đến 5e-6; (2){" "}
            <strong>quên đóng băng π_ref</strong> — một số code mẫu copy model
            không đúng cách, dẫn tới cả hai cùng cập nhật và loss trở nên vô
            nghĩa; (3) <strong>preference data noise</strong> — nếu annotator
            không thống nhất, DPO học theo cả tín hiệu nhiễu, tốt hơn nên lọc
            cặp có agreement thấp trước khi train.
          </Callout>

          <p>
            <strong>Trong thực tế</strong>, DPO là lựa chọn mặc định cho hầu
            hết team alignment có dữ liệu preference sẵn. Llama 3, Zephyr,
            Tulu 2, Mistral Instruct — tất cả đều dùng DPO hoặc biến thể của
            nó. RLHF với PPO chỉ còn giữ vai trò trong các bài toán thực sự
            cần exploration (ví dụ reasoning dài, code). Với mọi use case
            alignment tiêu chuẩn, DPO là lựa chọn đầu tiên nên thử.
          </p>

          <Callout variant="info" title="So với GRPO và các phương pháp mới">
            <TopicLink slug="grpo">GRPO</TopicLink> (Group Relative Policy
            Optimization, Shao et al. 2024) khác DPO ở chỗ nó vẫn là online RL
            nhưng không cần critic — thay vào đó nó sinh một nhóm response rồi
            chuẩn hoá reward theo nhóm. GRPO trở thành nền tảng của
            DeepSeek-R1 và gợi ý rằng với reasoning, online-RL không cần phức
            tạp như PPO cổ điển.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 7 — TÓM TẮT
          ================================================================= */}

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về DPO"
          points={[
            "DPO biến pipeline RLHF 3 pha thành 2 pha (SFT → DPO) — không cần reward model riêng, không cần PPO.",
            "Dữ liệu: bộ ba (prompt, y_chosen, y_rejected) từ xếp hạng con người hoặc AI.",
            "Loss: log-sigmoid của margin giữa reward ngầm y_chosen và y_rejected, với reward ngầm là β·log(π_θ/π_ref).",
            "β đóng vai trò KL coefficient: nhỏ → cập nhật mạnh, lớn → thận trọng; điển hình 0.1–0.5.",
            "Thất bại tiêu biểu: đẩy log π(y_rejected) xuống −∞ khi train lâu — khắc phục bằng IPO, early stopping, lr thấp.",
            "Nên chọn DPO khi có preference data sẵn; chọn RLHF/GRPO khi bài toán cần exploration thực sự (reasoning, code).",
          ]}
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 8 — QUIZ
          ================================================================= */}

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
