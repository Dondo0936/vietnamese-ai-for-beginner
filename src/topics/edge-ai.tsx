"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* =========================================================================
   METADATA
   ========================================================================= */

export const metadata: TopicMeta = {
  slug: "edge-ai",
  title: "Edge AI",
  titleVi: "AI biên — AI ngay trên thiết bị",
  description:
    "Triển khai mô hình AI trực tiếp trên thiết bị đầu cuối (điện thoại, IoT, camera) thay vì trên đám mây.",
  category: "infrastructure",
  tags: ["edge", "on-device", "mobile", "iot"],
  difficulty: "intermediate",
  relatedSlugs: [
    "inference-optimization",
    "small-language-models",
    "model-serving",
    "quantization",
    "distillation",
  ],
  vizType: "interactive",
};

/* =========================================================================
   HẰNG SỐ & DỮ LIỆU SO SÁNH
   =========================================================================
   Ta xây dựng một mô hình "đồ chơi" để so sánh hai lựa chọn triển khai:
     (A) Cloud AI  — gửi dữ liệu lên server, nhận kết quả về
     (B) Edge AI   — chạy model ngay trên chip của thiết bị

   Mỗi lựa chọn có 5 trục đánh giá:
     1. Latency  — độ trễ end-to-end (ms)
     2. Bandwidth — băng thông phải dùng (KB/request)
     3. Privacy  — điểm bảo mật dữ liệu (0-10)
     4. Cost     — chi phí vận hành tại quy mô lớn ($/tháng/1K req)
     5. Battery  — tiêu thụ pin (mW trung bình trong 1 request)

   Người học kéo thanh "chất lượng mạng" để thấy Cloud phụ thuộc mạng
   thế nào, còn Edge gần như không đổi.
   ========================================================================= */

const TOTAL_STEPS = 7;

interface DeviceExample {
  id: string;
  name: string;
  nameVi: string;
  icon: string;
  chip: string;
  taskVi: string;
  edgeWins: string[];
  cloudWins: string[];
}

const EXAMPLES: DeviceExample[] = [
  {
    id: "keyboard",
    name: "Smartphone Keyboard Prediction",
    nameVi: "Gợi ý gõ phím trên điện thoại",
    icon: "⌨️",
    chip: "Apple Neural Engine / Google Tensor",
    taskVi:
      "Gợi ý từ tiếp theo khi bạn đang gõ — cần trả kết quả trong 1 frame (16ms) để không giật.",
    edgeWins: [
      "Độ trễ < 16ms — gõ không cảm thấy lag",
      "Tin nhắn riêng tư không rời máy",
      "Hoạt động khi máy bay (airplane mode)",
      "Không tốn data 4G",
    ],
    cloudWins: [
      "Có thể dùng model lớn hơn (10B+)",
      "Cập nhật model dễ dàng",
    ],
  },
  {
    id: "camera",
    name: "Smart Camera Detection",
    nameVi: "Camera AI giám sát giao thông",
    icon: "📷",
    chip: "NVIDIA Jetson / Hailo-8 NPU",
    taskVi:
      "Phát hiện xe vượt đèn đỏ ở ngã tư Hà Nội — 30 FPS, không gián đoạn kể cả khi mạng đứt.",
    edgeWins: [
      "30 FPS ổn định không phụ thuộc 4G",
      "Bandwidth tiết kiệm — chỉ gửi metadata (JSON), không gửi video",
      "Hoạt động ngay cả khi mất mạng (nhiều ngã tư không có fiber)",
      "Chi phí bandwidth giảm 1000x so với streaming video về trung tâm",
    ],
    cloudWins: [
      "Phân tích tổng hợp nhiều camera (traffic flow city-wide)",
      "Retrain model khi có dữ liệu mới",
    ],
  },
  {
    id: "ane",
    name: "Apple Neural Engine (Face ID)",
    nameVi: "Apple Neural Engine — Face ID",
    icon: "🍎",
    chip: "Apple A17 Pro ANE (35 TOPS)",
    taskVi:
      "Mở khoá iPhone bằng khuôn mặt — so khớp 3D depth map với template an toàn trong Secure Enclave.",
    edgeWins: [
      "< 100ms từ nhìn vào điện thoại đến mở khoá",
      "Template khuôn mặt KHÔNG BAO GIỜ rời thiết bị",
      "Hoạt động offline 100%",
      "Không có server nào có thể bị hack để lộ face database",
    ],
    cloudWins: [
      "(Gần như không có lợi thế trong use case này)",
    ],
  },
  {
    id: "health",
    name: "Apple Watch Heart Monitor",
    nameVi: "Apple Watch — Nhịp tim bất thường",
    icon: "⌚",
    chip: "Apple S9 Neural Engine (4-core)",
    taskVi:
      "Phát hiện nhịp tim bất thường (AFib) real-time — phải chạy 24/7 mà không huỷ pin.",
    edgeWins: [
      "Liên tục theo dõi 24/7 không cần bật màn hình",
      "Dữ liệu y tế không rời cổ tay người dùng",
      "Không yêu cầu kết nối với iPhone lúc cảnh báo",
      "Tiết kiệm pin — không phải gửi 100Hz ECG signal qua Bluetooth",
    ],
    cloudWins: [
      "Phân tích xu hướng dài hạn có thể làm ở cloud",
    ],
  },
  {
    id: "translate",
    name: "Real-time Translation",
    nameVi: "Phiên dịch real-time (AirPods Pro)",
    icon: "🎧",
    chip: "H2 chip + iPhone NPU",
    taskVi:
      "Phiên dịch Anh ↔ Việt trong hội thoại — độ trễ phải < 500ms để không phá nhịp đối thoại.",
    edgeWins: [
      "Không phụ thuộc mạng khi đi du lịch nước ngoài",
      "Không data roaming tốn kém",
      "Cuộc nói chuyện riêng tư không đi qua server Apple",
    ],
    cloudWins: [
      "Model cloud (GPT-4o) dịch ngữ cảnh dài tốt hơn",
      "Hỗ trợ nhiều cặp ngôn ngữ hơn",
    ],
  },
];

/* --- Mô hình tính toán so sánh Cloud vs Edge theo chất lượng mạng --- */
/*
  networkQuality ∈ [0..100]
    100 = WiFi 6 lab condition    (RTT ~20ms)
     50 = 4G bình thường           (RTT ~120ms)
     20 = 4G yếu ở vùng núi        (RTT ~400ms)
      0 = Không có mạng            (RTT ~∞)
*/

interface Metrics {
  latencyMs: number;
  bandwidthKB: number;
  privacyScore: number; // 0..10 (càng cao càng tốt)
  costPer1K: number;    // USD / 1000 requests
  batteryMw: number;    // mW trung bình
  available: boolean;   // có chạy được không?
}

function cloudMetrics(networkQuality: number, taskWeight = 1): Metrics {
  // networkQuality 0..100 → RTT ngược
  const q = Math.max(1, networkQuality);
  const rtt = 20 + (400 * (100 - q)) / 100; // 20ms..420ms
  const uploadKB = 25 * taskWeight;  // ảnh/audio chunk
  const inferMs = 80 * taskWeight;   // GPU server nhanh
  const downloadKB = 2 * taskWeight;
  const latency = rtt + inferMs + rtt * 0.3;
  const bandwidth = uploadKB + downloadKB;
  const privacy = 3; // dữ liệu rời thiết bị → thấp
  const cost = 2.5 * taskWeight; // $2.5 / 1K req (GPU server + egress)
  const battery = 180; // radio 4G + CPU chờ
  return {
    latencyMs: latency,
    bandwidthKB: bandwidth,
    privacyScore: privacy,
    costPer1K: cost,
    batteryMw: battery,
    available: networkQuality > 5,
  };
}

function edgeMetrics(_networkQuality: number, taskWeight = 1): Metrics {
  return {
    latencyMs: 35 * taskWeight, // NPU chạy model đã quantize INT8
    bandwidthKB: 0,
    privacyScore: 9, // dữ liệu không rời máy
    costPer1K: 0.02 * taskWeight, // gần như chỉ là pin
    batteryMw: 90, // NPU tiết kiệm hơn radio 4G
    available: true, // luôn chạy được
  };
}

/* =========================================================================
   COMPONENT CHÍNH
   ========================================================================= */

export default function EdgeAITopic() {
  const [networkQuality, setNetworkQuality] = useState(50);
  const [activeExample, setActiveExample] = useState(1); // default: camera
  const [showEdgeOnly, setShowEdgeOnly] = useState(false);

  const example = EXAMPLES[activeExample];

  /* Điều chỉnh "độ nặng tác vụ" theo ví dụ — keyboard nhẹ hơn camera */
  const taskWeight = useMemo(() => {
    switch (example.id) {
      case "keyboard": return 0.3;
      case "health": return 0.4;
      case "ane": return 0.8;
      case "translate": return 1.1;
      case "camera": return 1.4;
      default: return 1;
    }
  }, [example.id]);

  const cloud = useMemo(
    () => cloudMetrics(networkQuality, taskWeight),
    [networkQuality, taskWeight],
  );
  const edge = useMemo(
    () => edgeMetrics(networkQuality, taskWeight),
    [networkQuality, taskWeight],
  );

  const latencyRatio = useMemo(() => {
    if (!cloud.available) return Infinity;
    return cloud.latencyMs / edge.latencyMs;
  }, [cloud, edge]);

  const bandwidthRatio = useMemo(() => {
    if (edge.bandwidthKB === 0) return Infinity;
    return cloud.bandwidthKB / edge.bandwidthKB;
  }, [cloud, edge]);

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNetworkQuality(parseInt(e.target.value, 10));
    },
    [],
  );

  /* =======================================================================
     QUIZ (8 câu)
     ======================================================================= */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Edge AI phù hợp nhất cho tình huống nào?",
        options: [
          "Huấn luyện model GPT-4 từ đầu",
          "Camera AI phát hiện cháy rừng ở vùng không có 4G",
          "Phân tích big data warehouse hàng terabyte",
          "Generate video 4K dài 10 phút",
        ],
        correct: 1,
        explanation:
          "Camera giám sát cháy rừng cần: phản hồi tức thì (latency thấp), hoạt động ngoại tuyến (không có mạng), xử lý tại chỗ (không gửi video lên cloud). Training, big data analytics, và sinh video 4K đều là workload nặng cần GPU farm — thuộc phạm vi của cloud.",
      },
      {
        question:
          "Thách thức lớn nhất khi triển khai LLM trên điện thoại là gì?",
        options: [
          "Không có GPU trên điện thoại",
          "Bộ nhớ RAM hạn chế (6–12GB) không đủ cho model lớn",
          "Điện thoại không chạy được Python",
          "Apple không cho phép AI trên iPhone",
        ],
        correct: 1,
        explanation:
          "Điện thoại hiện đại có NPU (Neural Processing Unit), nhưng RAM chỉ 6–12GB chia sẻ với hệ điều hành. Model 7B INT4 cần ~4GB — vừa đủ. Model 70B thì không thể. Đây là lý do quantization cực kỳ quan trọng cho Edge AI.",
      },
      {
        question: "Federated Learning giúp Edge AI giải quyết vấn đề gì?",
        options: [
          "Tăng tốc inference trên thiết bị",
          "Huấn luyện model từ dữ liệu phân tán trên nhiều thiết bị mà không cần gửi dữ liệu lên server",
          "Giảm kích thước model để chạy trên chip nhỏ",
          "Chuyển model từ FP32 sang INT8",
        ],
        correct: 1,
        explanation:
          "Federated Learning: mỗi thiết bị huấn luyện cục bộ, chỉ gửi gradient (không phải dữ liệu) lên server để tổng hợp. Dữ liệu nhạy cảm (ảnh khuôn mặt, tin nhắn) không rời thiết bị — đảm bảo quyền riêng tư.",
      },
      {
        question:
          "Khi người dùng ở vùng mạng yếu (RTT ~500ms), điều gì xảy ra với Cloud AI?",
        options: [
          "Latency tổng cộng tăng vọt và trải nghiệm người dùng kém",
          "Không ảnh hưởng gì — cloud luôn trả lời trong 100ms",
          "Model tự động nhỏ hơn",
          "Bảo mật tăng lên",
        ],
        correct: 0,
        explanation:
          "Cloud AI bị chi phối bởi network RTT. RTT 500ms nghĩa là chỉ riêng upload + download đã tốn 1 giây, trước cả khi server bắt đầu inference. Đây là lý do các ứng dụng cần real-time (camera, keyboard, AR) buộc phải chọn Edge.",
      },
      {
        question:
          "Apple Neural Engine (ANE) trên iPhone được thiết kế chủ yếu để?",
        options: [
          "Render đồ hoạ 3D cho game",
          "Tăng tốc inference của model neural network với mức tiêu thụ pin rất thấp",
          "Giải mã video 8K",
          "Chạy JavaScript trong Safari",
        ],
        correct: 1,
        explanation:
          "ANE là một NPU (Neural Processing Unit) chuyên biệt — khoảng 35 TOPS trên A17 Pro. Thiết kế để tăng tốc phép nhân ma trận (GEMM) và convolution với hiệu quả năng lượng cao hơn GPU khoảng 10x. Chính ANE giúp Face ID, Apple Intelligence, Camera AI chạy mà không làm nóng máy.",
      },
      {
        question:
          "Tại sao smart camera giám sát giao thông thường chạy Edge AI thay vì stream video về trung tâm?",
        options: [
          "Vì Edge AI luôn chính xác hơn Cloud AI",
          "Vì bandwidth + latency + độ tin cậy — stream 30fps từ 1000 camera sẽ nghẽn mạng và tốn chi phí khổng lồ",
          "Vì luật bắt buộc",
          "Vì không có GPU trên cloud",
        ],
        correct: 1,
        explanation:
          "1 camera 1080p 30fps ~5Mbps. 1000 camera = 5Gbps liên tục, chưa kể egress cloud rất đắt. Edge chỉ gửi metadata JSON (\"biển số 29A-123, thời điểm 08:15, vi phạm đèn đỏ\") → giảm băng thông 1000x. Đồng thời, nếu mạng đứt, camera vẫn hoạt động.",
      },
      {
        question:
          "Quantization INT8 có tác dụng gì trong Edge AI?",
        options: [
          "Giảm ~4x kích thước model và cho phép dùng NPU INT8 tốc độ cao",
          "Tăng accuracy của model",
          "Làm model chạy được Python",
          "Giúp model hiểu nhiều ngôn ngữ hơn",
        ],
        correct: 0,
        explanation:
          "Quantize từ FP32 sang INT8 giảm 4x bộ nhớ (mỗi trọng số từ 4 byte xuống 1 byte). Quan trọng hơn, NPU Edge (ANE, Hexagon, Jetson) có instruction INT8 nhanh hơn FP32 gấp 4–8 lần. Accuracy thường chỉ giảm < 1%.",
      },
      {
        type: "fill-blank",
        question:
          "Edge AI chạy mô hình {blank} (trực tiếp trên thiết bị) thay vì cloud. Để vừa RAM hạn chế, kỹ thuật phổ biến nhất là {blank} (giảm số bit/tham số).",
        blanks: [
          {
            answer: "on-device",
            accept: [
              "on device",
              "trên thiết bị",
              "tren thiet bi",
              "ondevice",
            ],
          },
          {
            answer: "quantization",
            accept: [
              "lượng tử hoá",
              "luong tu hoa",
              "int8",
              "int4",
              "lượng tử hóa",
            ],
          },
        ],
        explanation:
          "On-device inference giảm latency xuống 10–50ms (so với 200–500ms qua cloud), bảo mật dữ liệu và hoạt động offline. Quantization INT8/INT4 giảm model 4–8x để vừa RAM điện thoại/IoT.",
      },
    ],
    [],
  );

  /* =======================================================================
     RENDER
     ======================================================================= */

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────────
         STEP 1 — PREDICTION GATE
         ─────────────────────────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Camera AI ở ngã tư Hà Nội cần phát hiện xe vượt đèn đỏ trong 50ms. Internet 4G có latency 100–500ms. Giải pháp nào khả thi?"
          options={[
            "Gửi video lên cloud server để xử lý",
            "Chạy model AI ngay trên chip trong camera (Edge AI)",
            "Đợi kết nối 5G ổn định rồi triển khai",
          ]}
          correct={1}
          explanation="Khi latency là yêu cầu sống còn, Edge AI là giải pháp duy nhất. Xử lý ngay tại thiết bị: 30–50ms thay vì 100–500ms qua mạng. Giống nấu ăn tại nhà thay vì đặt ship — có ngay, không phụ thuộc ai!"
        >
          {/* =============================================================
             ANALOGY
             ============================================================= */}
          <div className="mt-4 rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Phép ẩn dụ: Bếp nhà vs Nhà hàng giao tận nơi
            </p>
            <p className="text-sm text-muted leading-relaxed">
              <strong>Cloud AI</strong> như đặt đồ ăn từ nhà hàng nổi tiếng:
              đồ ăn ngon (model lớn, accuracy cao) nhưng phải đợi giao (network
              RTT), và mỗi lần tốn phí ship (chi phí cloud). Nếu đứt đường thì
              không ăn được (mất mạng).
              <br />
              <br />
              <strong>Edge AI</strong> như tự nấu trong bếp nhà: nấu nhanh hơn
              (latency thấp), riêng tư (dữ liệu không rời nhà), không tốn phí
              ship hằng tháng. Đổi lại, bếp nhỏ hơn — phải chọn công thức đơn
              giản (model sau khi quantize). Thực tế thường kết hợp cả hai:
              bữa ăn hằng ngày tự nấu, dịp đặc biệt gọi nhà hàng.
            </p>
          </div>

          {/* =============================================================
             STEP 2 — INTERACTIVE VIZ
             ============================================================= */}
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Chọn một <strong className="text-foreground">ví dụ thực tế</strong>,
              rồi kéo thanh <em>chất lượng mạng</em> để thấy Cloud AI và Edge
              AI thay đổi thế nào theo 5 trục:{" "}
              <strong>latency, bandwidth, privacy, cost, battery</strong>.
            </p>

            <VisualizationSection topicSlug="edge-ai">
              <div className="space-y-5">
                {/* ─── Chọn ví dụ ─── */}
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">
                    1. Chọn ví dụ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex, i) => (
                      <button
                        key={ex.id}
                        onClick={() => setActiveExample(i)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                          activeExample === i
                            ? "bg-accent text-white"
                            : "bg-card border border-border text-muted hover:text-foreground"
                        }`}
                      >
                        <span className="mr-1">{ex.icon}</span>
                        {ex.nameVi}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Thông tin ví dụ ─── */}
                <div className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <p className="font-semibold text-foreground mb-1">
                    <span className="mr-1">{example.icon}</span>
                    {example.nameVi}
                  </p>
                  <p className="text-xs text-muted mb-2">
                    <strong>Chip Edge:</strong> {example.chip}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {example.taskVi}
                  </p>
                </div>

                {/* ─── Slider chất lượng mạng ─── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-muted">
                      2. Chất lượng mạng:
                    </p>
                    <p className="text-xs font-mono text-foreground">
                      {networkQuality === 0
                        ? "Mất mạng hoàn toàn"
                        : networkQuality < 15
                          ? "Mạng rất yếu (vùng sâu)"
                          : networkQuality < 40
                            ? "4G yếu"
                            : networkQuality < 70
                              ? "4G trung bình"
                              : networkQuality < 90
                                ? "WiFi tốt"
                                : "WiFi 6 / Lab"}{" "}
                      ({networkQuality})
                    </p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={networkQuality}
                    onChange={handleNetworkChange}
                    className="w-full accent-accent"
                    aria-label="Chất lượng mạng"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-muted">
                    <span>Mất mạng</span>
                    <span>4G yếu</span>
                    <span>4G OK</span>
                    <span>WiFi</span>
                    <span>WiFi 6</span>
                  </div>
                </div>

                {/* ─── Bảng so sánh 5 trục ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Cloud card */}
                  <div
                    className={`rounded-lg border-2 p-4 transition-all ${
                      cloud.available
                        ? "border-blue-500/60 bg-blue-50/10"
                        : "border-red-500/60 bg-red-50/10 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-blue-500 text-sm">
                        ☁️ Cloud AI
                      </p>
                      {!cloud.available && (
                        <span className="text-[10px] font-bold text-red-500">
                          KHÔNG KHẢ DỤNG
                        </span>
                      )}
                    </div>
                    <MetricRow
                      label="Latency"
                      value={
                        cloud.available
                          ? `${cloud.latencyMs.toFixed(0)} ms`
                          : "∞"
                      }
                      tone="warn"
                    />
                    <MetricRow
                      label="Bandwidth"
                      value={`${cloud.bandwidthKB.toFixed(1)} KB/req`}
                      tone="warn"
                    />
                    <MetricRow
                      label="Privacy"
                      value={`${cloud.privacyScore}/10`}
                      tone="warn"
                    />
                    <MetricRow
                      label="Cost"
                      value={`$${cloud.costPer1K.toFixed(2)} / 1K req`}
                      tone="warn"
                    />
                    <MetricRow
                      label="Battery"
                      value={`${cloud.batteryMw} mW`}
                      tone="warn"
                    />
                  </div>

                  {/* Edge card */}
                  <div className="rounded-lg border-2 border-green-500/60 bg-green-50/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-green-500 text-sm">
                        📱 Edge AI
                      </p>
                      <span className="text-[10px] font-bold text-green-500">
                        LUÔN KHẢ DỤNG
                      </span>
                    </div>
                    <MetricRow
                      label="Latency"
                      value={`${edge.latencyMs.toFixed(0)} ms`}
                      tone="ok"
                    />
                    <MetricRow
                      label="Bandwidth"
                      value="0 KB"
                      tone="ok"
                    />
                    <MetricRow
                      label="Privacy"
                      value={`${edge.privacyScore}/10`}
                      tone="ok"
                    />
                    <MetricRow
                      label="Cost"
                      value={`$${edge.costPer1K.toFixed(2)} / 1K req`}
                      tone="ok"
                    />
                    <MetricRow
                      label="Battery"
                      value={`${edge.batteryMw} mW`}
                      tone="ok"
                    />
                  </div>
                </div>

                {/* ─── Bar so sánh latency ─── */}
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-semibold text-muted mb-2">
                    So sánh latency trực quan:
                  </p>
                  <div className="space-y-2">
                    <BarRow
                      label="Cloud"
                      value={
                        cloud.available
                          ? cloud.latencyMs
                          : 1000
                      }
                      max={Math.max(cloud.latencyMs, edge.latencyMs, 300)}
                      color="#3b82f6"
                      suffix="ms"
                      disabled={!cloud.available}
                    />
                    <BarRow
                      label="Edge"
                      value={edge.latencyMs}
                      max={Math.max(cloud.latencyMs, edge.latencyMs, 300)}
                      color="#22c55e"
                      suffix="ms"
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted">
                    {cloud.available ? (
                      <>
                        Edge nhanh hơn{" "}
                        <strong className="text-foreground">
                          {latencyRatio.toFixed(1)}×
                        </strong>{" "}
                        · tiết kiệm băng thông{" "}
                        <strong className="text-foreground">
                          {Number.isFinite(bandwidthRatio)
                            ? "∞"
                            : `${bandwidthRatio.toFixed(0)}×`}
                        </strong>
                      </>
                    ) : (
                      <>
                        Cloud <strong>không hoạt động</strong> khi mất mạng —
                        Edge vẫn bình thường!
                      </>
                    )}
                  </p>
                </div>

                {/* ─── Điểm mạnh chi tiết ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-green-500/30 bg-green-50/5 p-3">
                    <p className="font-bold text-green-500 mb-1">
                      Edge thắng ở đâu:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted">
                      {example.edgeWins.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-50/5 p-3">
                    <p className="font-bold text-blue-500 mb-1">
                      Cloud thắng ở đâu:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted">
                      {example.cloudWins.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* ─── Toggle chỉ xem Edge ─── */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEdgeOnly}
                      onChange={(e) => setShowEdgeOnly(e.target.checked)}
                      className="accent-accent"
                    />
                    <span>
                      Chỉ hiển thị tình huống Edge-only (device offline)
                    </span>
                  </label>
                </div>
                {showEdgeOnly && (
                  <div className="rounded-lg border border-accent/40 bg-accent-light/20 p-3 text-xs leading-relaxed">
                    <p className="font-semibold text-accent-dark mb-1">
                      Kịch bản offline-first:
                    </p>
                    <p className="text-muted">
                      Face ID mở khoá iPhone ngay cả khi ở trong thang máy không
                      có sóng. Apple Watch phát hiện AFib cả khi bạn đi bơi
                      (không có iPhone bên cạnh). Camera quan sát rừng quốc
                      gia không có fiber nhưng vẫn báo cháy qua LoRa khi phát
                      hiện khói. Đây là vùng Edge AI{" "}
                      <strong>buộc phải</strong> thắng — không có lựa chọn
                      Cloud.
                    </p>
                  </div>
                )}
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* =============================================================
             STEP 3 — AHA MOMENT
             ============================================================= */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Edge AI không thay thế Cloud AI — chúng{" "}
                <strong>bổ sung cho nhau</strong>. Mô hình phổ biến nhất là
                <em> hybrid</em>: Edge xử lý những gì cần tức thì và riêng tư
                (gõ phím, nhận diện khuôn mặt, phát hiện chuyển động), Cloud xử
                lý những tác vụ phức tạp cần model lớn hoặc dữ liệu toàn cục
                (summarization, analytics, fine-tuning). Câu hỏi không phải{" "}
                <em>&quot;Edge hay Cloud?&quot;</em> mà là{" "}
                <em>&quot;mỗi request nên chạy ở đâu?&quot;</em>. Khi bạn bấm
                chụp trên iPhone, việc <em>khử nhiễu</em> chạy trên ANE (Edge),
                còn việc <em>tìm ảnh cũ khi bạn search &quot;con mèo năm
                2022&quot;</em> có thể dùng index đã được xây từ trước. Hai hệ
                thống này hợp tác, không đối đầu.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* =============================================================
             STEP 4 — 2 INLINE CHALLENGES
             ============================================================= */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <InlineChallenge
              question="Model MobileNet (3MB) và ResNet-152 (230MB) đều nhận diện ảnh. MobileNet accuracy 71%, ResNet 78%. Triển khai trên camera IoT (RAM 512MB), bạn chọn model nào?"
              options={[
                "ResNet-152 vì accuracy cao hơn 7%",
                "MobileNet vì vừa RAM, latency thấp, accuracy đủ dùng",
                "Không dùng model nào, gửi ảnh lên cloud",
              ]}
              correct={1}
              explanation="Với RAM 512MB, ResNet-152 (230MB weights + activations runtime) thường không chạy nổi khi OS + các tiến trình khác đã chiếm chỗ. MobileNet (3MB) thoải mái, inference 20ms. Accuracy 71% đủ cho nhiều ứng dụng (phát hiện chuyển động, đếm người). Edge AI là nghệ thuật cân bằng: đủ tốt + đủ nhanh + đủ nhỏ."
            />

            <div className="mt-3">
              <InlineChallenge
                question="Một ứng dụng phiên dịch real-time yêu cầu độ trễ < 300ms để không phá nhịp đối thoại. Khi người dùng đang đi du lịch ở vùng núi (RTT 600ms), giải pháp nào hợp lý?"
                options={[
                  "Dùng model cloud GPT-4 vì dịch tốt hơn",
                  "Hybrid: dùng model nhỏ on-device khi offline / mạng yếu, tự động chuyển sang cloud khi có WiFi",
                  "Không cho người dùng dùng khi không có mạng",
                ]}
                correct={1}
                explanation="600ms RTT có nghĩa chưa tính inference đã vượt budget 300ms của bạn. Model nhỏ on-device (3B–7B quantize INT4) có thể chạy trong 150ms trên ANE / Snapdragon NPU. Pattern hybrid này — fallback thông minh giữa Edge và Cloud — là kiến trúc tiêu chuẩn cho sản phẩm Apple Intelligence, Google Translate Pro, và các app dịch cao cấp."
              />
            </div>
          </LessonSection>

          {/* =============================================================
             STEP 5 — EXPLANATION
             ============================================================= */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection topicSlug="edge-ai">
              {/* ─── Định nghĩa ─── */}
              <p>
                <strong>Edge AI</strong> (AI biên) là việc triển khai mô hình
                machine learning <em>trực tiếp trên thiết bị đầu cuối</em> —
                điện thoại, camera, cảm biến IoT, xe hơi, tai nghe — thay vì
                gửi dữ liệu lên cloud để xử lý. Từ <em>&quot;biên&quot;</em>{" "}
                (edge) đối lập với <em>&quot;trung tâm&quot;</em> (core/cloud):
                tính toán diễn ra ở rìa mạng, gần nơi dữ liệu được sinh ra.
              </p>

              <p>
                <strong>Ba ưu điểm cốt lõi:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Latency cực thấp:</strong> Xử lý tại chỗ, không có
                  network round-trip (ms thay vì giây).
                </li>
                <li>
                  <strong>Bảo mật dữ liệu:</strong> Dữ liệu không rời thiết bị
                  — tuân thủ GDPR, HIPAA, PDPA.
                </li>
                <li>
                  <strong>Hoạt động offline:</strong> Không phụ thuộc internet
                  — quan trọng cho nông thôn, nhà máy, y tế di động.
                </li>
              </ul>

              {/* ─── Công thức trade-off ─── */}
              <p>
                <strong>Mô hình latency Cloud vs Edge:</strong>
              </p>
              <LaTeX block>
                {String.raw`t_{\text{cloud}} = t_{\text{upload}} + t_{\text{queue}} + t_{\text{infer,cloud}} + t_{\text{download}}`}
              </LaTeX>
              <LaTeX block>
                {String.raw`t_{\text{edge}} = t_{\text{infer,edge}}`}
              </LaTeX>
              <p className="text-sm leading-relaxed">
                Trong điều kiện mạng kém hoặc tác vụ nhỏ, thành phần{" "}
                <LaTeX>{String.raw`t_{\text{upload}} + t_{\text{download}}`}</LaTeX>{" "}
                thường lấn át tất cả — khiến Cloud AI không thể cạnh tranh với
                Edge dù server có GPU mạnh hơn.
              </p>

              <p>
                <strong>Mô hình chi phí:</strong>
              </p>
              <LaTeX block>
                {String.raw`\text{Cost}_{\text{edge}} = \text{Hardware (CAPEX, 1 lần)} + \text{điện}`}
              </LaTeX>
              <LaTeX block>
                {String.raw`\text{Cost}_{\text{cloud}} = \underbrace{\text{GPU-hour}}_{\text{OPEX}} + \underbrace{\text{egress}}_{\$/GB} \quad \text{(ongoing)}`}
              </LaTeX>
              <p className="text-sm leading-relaxed">
                Điểm hoà vốn (breakeven) phụ thuộc vào số request/tháng. Với 1
                camera streaming 24/7, CAPEX $500 cho NPU Hailo-8 rẻ hơn sau
                ~2–3 tháng so với streaming video về cloud.
              </p>

              {/* ─── Callout 1 ─── */}
              <Callout variant="info" title="Edge AI tại Việt Nam">
                VinAI triển khai Edge AI trên xe VinFast (nhận diện biển báo,
                người đi bộ, lane assist). Camera giám sát giao thông ở Hà Nội
                và TP.HCM dùng chip AI để đếm xe, phát hiện tai nạn real-time
                mà không cần bandwidth lớn — thường kết hợp với{" "}
                <TopicLink slug="model-serving">model serving</TopicLink>{" "}
                ở cloud cho các tác vụ phức tạp.
              </Callout>

              {/* ─── Kỹ thuật tối ưu ─── */}
              <p>
                <strong>Kỹ thuật tối ưu cho Edge:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>
                    <TopicLink slug="quantization">Quantization</TopicLink>:
                  </strong>{" "}
                  INT8/INT4 giảm 4–8× model size, chip Edge có INT8
                  accelerator.
                </li>
                <li>
                  <strong>
                    Knowledge{" "}
                    <TopicLink slug="distillation">Distillation</TopicLink>:
                  </strong>{" "}
                  Model lớn (teacher) dạy model nhỏ (student) — giữ 95%
                  accuracy.
                </li>
                <li>
                  <strong>Pruning:</strong> Xoá ~50% trọng số nhỏ nhất mà hầu
                  như không giảm accuracy, chạy nhanh hơn trên NPU hỗ trợ
                  sparsity.
                </li>
                <li>
                  <strong>Neural Architecture Search (NAS):</strong> Tự động
                  thiết kế kiến trúc phù hợp chip cụ thể (MobileNet, EfficientNet
                  ra đời theo cách này).
                </li>
                <li>
                  <strong>Operator fusion:</strong> Gộp Conv+BN+ReLU thành 1
                  kernel duy nhất, tiết kiệm đọc/ghi bộ nhớ.
                </li>
              </ul>

              {/* ─── Callout 2 ─── */}
              <Callout
                variant="tip"
                title="Nguyên tắc thiết kế Edge model"
              >
                Đừng cố ép model cloud nguyên bản vào Edge. Thay vào đó, thiết
                kế model <em>từ đầu</em> cho Edge: kiến trúc Mobile-friendly
                (depthwise-separable conv, linear bottleneck), ít kênh hơn,
                resolution thấp hơn. MobileNet, EfficientNet, MobileViT là các
                họ model được thiết kế như vậy.
              </Callout>

              {/* ─── Hardware ─── */}
              <p>
                <strong>Hardware Edge AI quan trọng:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Apple Neural Engine (ANE):</strong> 16-core NPU, 35
                  TOPS trên A17 Pro — chạy Stable Diffusion XL trên iPhone 15
                  Pro, Face ID, Apple Intelligence.
                </li>
                <li>
                  <strong>Google Tensor G3:</strong> TPU on-chip cho Pixel —
                  real-time translation, Magic Eraser, Night Sight.
                </li>
                <li>
                  <strong>NVIDIA Jetson Orin:</strong> GPU nhỏ gọn (275 TOPS)
                  cho robot, drone, camera AI công nghiệp.
                </li>
                <li>
                  <strong>Qualcomm Hexagon NPU:</strong> NPU trên Snapdragon 8
                  Gen 3 — model 7B chạy được trên điện thoại Android cao cấp.
                </li>
                <li>
                  <strong>Hailo-8:</strong> NPU 26 TOPS chuyên dụng cho camera
                  IoT, tiêu thụ ~2.5W.
                </li>
                <li>
                  <strong>Coral Edge TPU (Google):</strong> USB stick 4 TOPS
                  cho prototyping và IoT module.
                </li>
              </ul>

              {/* ─── Callout 3 ─── */}
              <Callout
                variant="warning"
                title="Pitfall: Không phải model nào cũng nên đẩy ra Edge"
              >
                Nếu tác vụ yêu cầu <em>tri thức toàn cục</em> (ví dụ:{" "}
                &quot;search toàn bộ Wikipedia&quot;) hoặc <em>model quá
                lớn</em> (GPT-4o, Gemini Ultra), Edge là lựa chọn sai. Người
                tạo sản phẩm cần phân loại request thành các lớp{" "}
                <em>cheap-local</em>, <em>routable-hybrid</em>, và{" "}
                <em>must-cloud</em>, rồi định tuyến từng request đúng chỗ.
              </Callout>

              {/* ─── Code block 1: TFLite ─── */}
              <CodeBlock
                language="python"
                title="Triển khai Edge AI với TensorFlow Lite (quantize INT8)"
              >
{`import tensorflow as tf

# ── 1. Chuyển model sang TFLite + quantize INT8 ──
converter = tf.lite.TFLiteConverter.from_saved_model("my_model")
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]

# Representative dataset cho calibration
# NPU cần biết phân bố activation để chọn scale/zero-point
def representative_data():
    for img in calibration_images[:100]:
        yield [img.astype("float32")]

converter.representative_dataset = representative_data
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS_INT8
]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()

# Model gốc: 95MB  →  TFLite INT8: 24MB  (giảm 4x)
# Latency trên Pixel 8 Tensor G3:
#   FP32 CPU  : 230ms
#   INT8 NPU  :  45ms  (nhanh 5x, tiết kiệm pin 6x)
with open("model_edge.tflite", "wb") as f:
    f.write(tflite_model)

# ── 2. Chạy inference trên thiết bị ──
interpreter = tf.lite.Interpreter(model_path="model_edge.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

interpreter.set_tensor(input_details[0]["index"], input_int8)
interpreter.invoke()
prediction = interpreter.get_tensor(output_details[0]["index"])`}
              </CodeBlock>

              {/* ─── Code block 2: CoreML ─── */}
              <CodeBlock
                language="python"
                title="Convert PyTorch → CoreML cho Apple Neural Engine"
              >
{`# coremltools biến model PyTorch/TF thành .mlpackage chạy trên ANE.
# ANE là NPU chuyên dụng trên A-series / M-series chip —
# hiệu năng/Watt cao hơn GPU ~10x cho tác vụ neural network.

import torch
import coremltools as ct

# 1) Trace model
model.eval()
example_input = torch.rand(1, 3, 224, 224)
traced = torch.jit.trace(model, example_input)

# 2) Convert — quantize weights FP16 để vừa ANE
mlmodel = ct.convert(
    traced,
    inputs=[ct.ImageType(
        name="image",
        shape=(1, 3, 224, 224),
        scale=1/255.0,
        bias=[0, 0, 0],
    )],
    compute_precision=ct.precision.FLOAT16,  # ANE ưa FP16
    compute_units=ct.ComputeUnit.CPU_AND_NE,  # ép chạy trên ANE khi có thể
    minimum_deployment_target=ct.target.iOS17,
)

# 3) Sau khi convert, có thể lượng tử hoá thêm xuống 4-bit
# (giảm model xuống ~4x, dùng cho LLM on-device)
from coremltools.optimize.coreml import (
    OpLinearQuantizerConfig, OptimizationConfig, linear_quantize_weights,
)
cfg = OptimizationConfig(
    global_config=OpLinearQuantizerConfig(mode="linear_symmetric", dtype="int4")
)
mlmodel_int4 = linear_quantize_weights(mlmodel, config=cfg)
mlmodel_int4.save("MobileClassifier.mlpackage")

# Swift side (iOS app):
# let model = try MobileClassifier(configuration: MLModelConfiguration())
# let out = try model.prediction(image: pixelBuffer)
# → chạy < 10ms trên iPhone 15 Pro, 0 request lên server`}
              </CodeBlock>

              {/* ─── Callout 4 ─── */}
              <Callout
                variant="tip"
                title="Điểm tựa thiết kế: Privacy by Architecture"
              >
                Edge AI cho phép <em>&quot;privacy by architecture&quot;</em> —
                không cần tin người vận hành cloud, không cần audit server,
                không cần mã hoá homomorphic đắt đỏ. Dữ liệu đơn giản là{" "}
                <strong>không rời khỏi thiết bị</strong>. Đây là lý do Apple
                quảng bá Face ID, Apple Intelligence, và Private Cloud Compute
                như các tính năng chủ lực: khác biệt hoá dựa trên niềm tin.
              </Callout>

              {/* ─── CollapsibleDetail 1: Federated Learning ─── */}
              <CollapsibleDetail title="Chi tiết: Federated Learning — train trên nhiều thiết bị mà dữ liệu không rời máy">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Federated Learning (FL)</strong> giải quyết một
                    vấn đề có vẻ mâu thuẫn: <em>làm thế nào để cải thiện model
                    từ dữ liệu hàng triệu người dùng, nhưng không bao giờ gửi
                    dữ liệu đó lên server?</em>
                  </p>
                  <p>Ý tưởng:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>
                      Server gửi <em>model hiện tại</em>{" "}
                      <LaTeX>{String.raw`\theta_t`}</LaTeX> xuống tất cả client.
                    </li>
                    <li>
                      Mỗi client <LaTeX>{"k"}</LaTeX> train vài epoch trên dữ
                      liệu cục bộ <LaTeX>{String.raw`\mathcal{D}_k`}</LaTeX>{" "}
                      → nhận được trọng số mới{" "}
                      <LaTeX>{String.raw`\theta_t^k`}</LaTeX>.
                    </li>
                    <li>
                      Client chỉ gửi lên server <em>cập nhật</em>{" "}
                      <LaTeX>
                        {String.raw`\Delta_k = \theta_t^k - \theta_t`}
                      </LaTeX>
                      .
                    </li>
                    <li>
                      Server tổng hợp (FedAvg):{" "}
                      <LaTeX>
                        {String.raw`\theta_{t+1} = \theta_t + \sum_k \frac{n_k}{N} \Delta_k`}
                      </LaTeX>
                      .
                    </li>
                  </ol>
                  <p>
                    Dữ liệu thô <LaTeX>{String.raw`\mathcal{D}_k`}</LaTeX>{" "}
                    không bao giờ rời thiết bị. Gboard (bàn phím Google) đã
                    dùng FL từ 2017 để cải thiện gợi ý từ mà không thu thập
                    tin nhắn của người dùng.
                  </p>
                  <p>
                    Để bảo vệ thêm, kết hợp FL với{" "}
                    <strong>Differential Privacy</strong> (thêm nhiễu vào{" "}
                    <LaTeX>{String.raw`\Delta_k`}</LaTeX>) và{" "}
                    <strong>Secure Aggregation</strong> (server chỉ thấy tổng,
                    không thấy từng client).
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ─── CollapsibleDetail 2: Roofline model ─── */}
              <CollapsibleDetail title="Chi tiết: Mô hình Roofline — tại sao NPU không phải lúc nào cũng nhanh hơn CPU">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Roofline model</strong> là công cụ giúp hiểu xem
                    một phép tính bị giới hạn bởi <em>compute</em> hay{" "}
                    <em>memory bandwidth</em>. Gọi:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <LaTeX>{"P"}</LaTeX>: Peak FLOPS của chip (35 TOPS cho
                      ANE)
                    </li>
                    <li>
                      <LaTeX>{"B"}</LaTeX>: Memory bandwidth (GB/s)
                    </li>
                    <li>
                      <LaTeX>{"I"}</LaTeX>: Arithmetic intensity của kernel
                      (FLOPs / byte truy cập)
                    </li>
                  </ul>
                  <p>Tốc độ thực tế bị chặn bởi:</p>
                  <LaTeX block>
                    {String.raw`\text{Perf} = \min(P,\; I \cdot B)`}
                  </LaTeX>
                  <p>
                    Phép conv 3×3 trên ảnh lớn có{" "}
                    <LaTeX>{"I"}</LaTeX> cao → compute-bound → NPU thắng lớn.
                    Phép <em>element-wise</em> (softmax, layernorm) có{" "}
                    <LaTeX>{"I"}</LaTeX> thấp → memory-bound → NPU và CPU gần
                    như bằng nhau. Đây là lý do một số model chạy trên NPU{" "}
                    <strong>chậm hơn</strong> GPU dù NPU có peak TOPS cao hơn:
                    workload không phù hợp.
                  </p>
                  <p>
                    Khi tối ưu model cho Edge, hãy đo roofline, rồi chọn chip
                    có tỷ lệ <LaTeX>{"P/B"}</LaTeX> phù hợp với model của bạn,
                    không chỉ nhìn con số TOPS trên marketing deck.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ─── Ứng dụng ─── */}
              <p>
                <strong>Ứng dụng thực tế:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Keyboard prediction (Gboard, SwiftKey):</strong> mô
                  hình RNN/Transformer nhỏ gợi ý từ tiếp theo, train tại chỗ
                  qua Federated Learning.
                </li>
                <li>
                  <strong>Face ID / Windows Hello:</strong> nhận diện 3D depth
                  map trong Secure Enclave — template không rời chip.
                </li>
                <li>
                  <strong>Apple Watch AFib / ECG:</strong> phát hiện nhịp tim
                  bất thường real-time, chạy 24/7 không hao pin.
                </li>
                <li>
                  <strong>Traffic camera (Hà Nội, TP.HCM):</strong> đếm xe,
                  phát hiện vi phạm mà không stream video về trung tâm.
                </li>
                <li>
                  <strong>Xe tự lái (VinFast, Tesla):</strong> perception
                  pipeline chạy toàn bộ on-board — an toàn khi mất mạng.
                </li>
                <li>
                  <strong>Drone nông nghiệp:</strong> phát hiện sâu bệnh trên
                  cánh đồng lúa ở vùng không có 4G.
                </li>
                <li>
                  <strong>AR kính thông minh (Meta Ray-Ban, Apple Vision
                  Pro):</strong> tracking 90Hz — chỉ Edge mới đủ nhanh.
                </li>
              </ul>

              {/* ─── Pitfalls ─── */}
              <p>
                <strong>Pitfalls thường gặp khi làm Edge AI:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Drift accuracy sau quantize:</strong> Bỏ qua bước
                  calibration với representative dataset → accuracy giảm mạnh.
                  Luôn đo lại trên test set thực tế sau khi INT8.
                </li>
                <li>
                  <strong>Thermal throttling:</strong> NPU chạy 100% liên tục
                  sẽ nóng → chip tự giảm tốc. Đo trong điều kiện thực (không
                  phải lab 20°C).
                </li>
                <li>
                  <strong>Fragmentation hệ điều hành:</strong> Android có
                  nhiều chip khác nhau (Qualcomm, MediaTek, Exynos, Tensor).
                  Model có thể chạy khác nhau trên mỗi chip.
                </li>
                <li>
                  <strong>Không thể update nhanh:</strong> Cloud có thể
                  hot-deploy model mới trong phút. Edge phải qua App Store
                  review + người dùng tải update — chậm hàng ngày/tuần.
                </li>
                <li>
                  <strong>Debug khó:</strong> Không có log server. Cần
                  telemetry cẩn thận, tôn trọng privacy (chỉ gửi metric, không
                  gửi dữ liệu).
                </li>
                <li>
                  <strong>Lock-in framework:</strong> Chọn TFLite, CoreML, hay
                  ONNX Runtime quyết định bạn có thể chạy trên chip nào sau
                  này.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          {/* =============================================================
             STEP 6 — MINI SUMMARY
             ============================================================= */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Sáu điều cần nhớ về Edge AI"
              points={[
                "Edge AI chạy model ngay trên thiết bị — latency cực thấp, bảo mật cao, hoạt động offline.",
                "Không thay thế Cloud AI mà bổ sung (hybrid): Edge xử lý nhanh tại chỗ, Cloud xử lý tác vụ phức tạp cần tri thức toàn cục.",
                "Quantization + Distillation + Pruning + NAS giúp model nhỏ gọn chạy được trên chip có RAM hạn chế.",
                "NPU (Apple ANE, Google Tensor, Qualcomm Hexagon, Jetson) ngày càng mạnh — model 7B đã chạy được trên điện thoại.",
                "5 trục đánh giá: latency, bandwidth, privacy, cost, battery — Edge thường thắng 4/5 khi mạng kém.",
                "Ứng dụng Việt Nam: camera giao thông Hà Nội/TP.HCM, xe tự lái VinFast, nhận diện khuôn mặt chấm công, drone nông nghiệp.",
              ]}
            />
          </LessonSection>

          {/* =============================================================
             STEP 7 — QUIZ
             ============================================================= */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-green-500"
      : "text-amber-500";
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0 text-xs">
      <span className="text-muted">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
  suffix,
  disabled,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix: string;
  disabled?: boolean;
}) {
  const width = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-muted font-semibold">{label}</span>
      <div className="flex-1 h-4 rounded-full bg-surface-hover overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all duration-200 ease-out"
          style={{
            width: `${width}%`,
            background: color,
            opacity: disabled ? 0.35 : 1,
          }}
        />
      </div>
      <span className="w-20 text-right font-mono text-foreground">
        {disabled ? "N/A" : `${value.toFixed(0)} ${suffix}`}
      </span>
    </div>
  );
}
