"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "edge-ai",
  title: "Edge AI",
  titleVi: "AI biên — AI ngay trên thiết bị",
  description:
    "Triển khai mô hình AI trực tiếp trên thiết bị đầu cuối (điện thoại, IoT, camera) thay vì trên đám mây.",
  category: "infrastructure",
  tags: ["edge", "on-device", "mobile", "iot"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "small-language-models", "model-serving"],
  vizType: "interactive",
};

/* ── Cloud vs Edge comparison ── */
interface Scenario {
  name: string;
  cloudLatency: number;
  edgeLatency: number;
  cloudCost: string;
  edgeCost: string;
  privacy: "low" | "high";
  offline: boolean;
}

const SCENARIOS: Scenario[] = [
  { name: "Nhận diện khuôn mặt FPT Gate", cloudLatency: 350, edgeLatency: 30, cloudCost: "$0.01/req", edgeCost: "$0 (on-device)", privacy: "high", offline: true },
  { name: "Chatbot tiếng Việt trên điện thoại", cloudLatency: 800, edgeLatency: 200, cloudCost: "$0.03/req", edgeCost: "$0 (on-device)", privacy: "high", offline: true },
  { name: "Camera AI giám sát giao thông HN", cloudLatency: 500, edgeLatency: 50, cloudCost: "$100/tháng", edgeCost: "$30 (chip NPU)", privacy: "high", offline: true },
  { name: "Phiên dịch real-time hội nghị", cloudLatency: 200, edgeLatency: 150, cloudCost: "$0.02/phút", edgeCost: "$0 (on-device)", privacy: "low", offline: false },
];

const TOTAL_STEPS = 7;

export default function EdgeAITopic() {
  const [activeScenario, setActiveScenario] = useState(0);
  const scenario = SCENARIOS[activeScenario];

  const latencyRatio = (scenario.cloudLatency / scenario.edgeLatency).toFixed(1);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Edge AI phù hợp nhất cho tình huống nào?",
      options: [
        "Huấn luyện model GPT-4 từ đầu",
        "Camera AI phát hiện cháy rừng ở vùng không có 4G",
        "Phân tích big data warehouse hàng terabyte",
      ],
      correct: 1,
      explanation: "Camera giám sát cháy rừng cần: phản hồi tức thì (latency thấp), hoạt động ngoại tuyến (không có mạng), xử lý tại chỗ (không gửi video lên cloud). Đây là use case điển hình của Edge AI.",
    },
    {
      question: "Thách thức lớn nhất khi triển khai LLM trên điện thoại là gì?",
      options: [
        "Không có GPU trên điện thoại",
        "Bộ nhớ RAM hạn chế (6-12GB) không đủ cho model lớn",
        "Điện thoại không chạy được Python",
      ],
      correct: 1,
      explanation: "Điện thoại hiện đại có NPU (Neural Processing Unit), nhưng RAM chỉ 6-12GB chia sẻ với hệ điều hành. Model 7B INT4 cần ~4GB — vừa đủ. Model 70B thì không thể. Đây là lý do quantization cực kỳ quan trọng cho Edge AI.",
    },
    {
      question: "Federated Learning giúp Edge AI giải quyết vấn đề gì?",
      options: [
        "Tăng tốc inference trên thiết bị",
        "Huấn luyện model từ dữ liệu phân tán trên nhiều thiết bị mà không cần gửi dữ liệu lên server",
        "Giảm kích thước model để chạy trên chip nhỏ",
      ],
      correct: 1,
      explanation: "Federated Learning: mỗi thiết bị huấn luyện cục bộ, chỉ gửi gradient (không phải dữ liệu) lên server để tổng hợp. Dữ liệu nhạy cảm (ảnh khuôn mặt, tin nhắn) không rời thiết bị — đảm bảo quyền riêng tư.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Camera AI ở ngã tư Hà Nội cần phát hiện xe vượt đèn đỏ trong 50ms. Internet 4G có latency 100-500ms. Giải pháp nào khả thi?"
          options={[
            "Gửi video lên cloud server để xử lý",
            "Chạy model AI ngay trên chip trong camera (Edge AI)",
            "Đợi kết nối 5G ổn định rồi triển khai",
          ]}
          correct={1}
          explanation="Khi latency là yêu cầu sống còn, Edge AI là giải pháp duy nhất. Xử lý ngay tại thiết bị: 30-50ms thay vì 100-500ms qua mạng. Giống nấu ăn tại nhà thay vì đặt ship — có ngay, không phụ thuộc ai!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn từng <strong className="text-foreground">tình huống thực tế</strong>{" "}
          để so sánh Cloud AI vs Edge AI về latency, chi phí và bảo mật.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScenario(i)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    activeScenario === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 240" className="w-full max-w-2xl mx-auto">
              {/* Cloud side */}
              <rect x={30} y={20} width={240} height={95} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
              <text x={150} y={42} textAnchor="middle" fill="#3b82f6" fontSize={12} fontWeight="bold">Cloud AI</text>
              <text x={150} y={62} textAnchor="middle" fill="#94a3b8" fontSize={9}>Latency: {scenario.cloudLatency}ms</text>
              <text x={150} y={78} textAnchor="middle" fill="#94a3b8" fontSize={9}>Chi phí: {scenario.cloudCost}</text>
              <text x={150} y={94} textAnchor="middle" fill="#94a3b8" fontSize={9}>Cần internet, dữ liệu lên cloud</text>

              {/* VS */}
              <text x={300} y={70} textAnchor="middle" fill="#f59e0b" fontSize={16} fontWeight="bold">VS</text>

              {/* Edge side */}
              <rect x={330} y={20} width={240} height={95} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={450} y={42} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight="bold">Edge AI</text>
              <text x={450} y={62} textAnchor="middle" fill="#94a3b8" fontSize={9}>Latency: {scenario.edgeLatency}ms</text>
              <text x={450} y={78} textAnchor="middle" fill="#94a3b8" fontSize={9}>Chi phí: {scenario.edgeCost}</text>
              <text x={450} y={94} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {scenario.offline ? "Hoạt động offline" : "Cần mạng cho một số tính năng"}
              </text>

              {/* Latency comparison bar */}
              <text x={300} y={145} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Edge nhanh hơn {latencyRatio}x
              </text>

              {/* Cloud bar */}
              <rect x={100} y={160} width={400} height={18} rx={4} fill="#1e293b" />
              <rect x={100} y={160} width={400} height={18} rx={4} fill="#ef4444" opacity={0.6} />
              <text x={110} y={173} fill="white" fontSize={9} fontWeight="bold">Cloud: {scenario.cloudLatency}ms</text>

              {/* Edge bar */}
              <rect x={100} y={185} width={400} height={18} rx={4} fill="#1e293b" />
              <rect x={100} y={185} width={400 * (scenario.edgeLatency / scenario.cloudLatency)} height={18} rx={4} fill="#22c55e" />
              <text x={110} y={198} fill="white" fontSize={9} fontWeight="bold">Edge: {scenario.edgeLatency}ms</text>

              {/* Privacy indicator */}
              <text x={300} y={225} textAnchor="middle" fill={scenario.privacy === "high" ? "#22c55e" : "#f59e0b"} fontSize={10}>
                Bảo mật dữ liệu: {scenario.privacy === "high" ? "Cao (dữ liệu ở trên thiết bị)" : "Trung bình"}
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Edge AI không thay thế Cloud AI — chúng <strong>bổ sung cho nhau</strong>!{" "}
            Pattern phổ biến nhất: Edge xử lý nhanh tại chỗ (nhận diện khuôn mặt, lọc spam),
            Cloud xử lý các tác vụ phức tạp (fine-tuning, analytics). Giống xe máy đi trong phố nhanh hơn ô tô,
            nhưng đi đường dài thì cần ô tô!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model MobileNet (3MB) và ResNet-152 (230MB) đều nhận diện ảnh. MobileNet accuracy 71%, ResNet 78%. Triển khai trên camera IoT (RAM 512MB), bạn chọn model nào?"
          options={[
            "ResNet-152 vì accuracy cao hơn 7%",
            "MobileNet vì vừa RAM, latency thấp, accuracy đủ dùng",
            "Không dùng model nào, gửi ảnh lên cloud",
          ]}
          correct={1}
          explanation="Với RAM 512MB, ResNet-152 (230MB weights + activations) có thể không chạy được. MobileNet (3MB) thoải mái, inference 20ms. Accuracy 71% đủ cho nhiều ứng dụng (phát hiện chuyển động, đếm người). Edge AI là nghệ thuật cân bằng: đủ tốt + đủ nhanh + đủ nhỏ."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Edge AI</strong>{" "}
            là việc triển khai model AI trực tiếp trên thiết bị đầu cuối — điện thoại, camera, cảm biến IoT — thay vì gửi dữ liệu lên cloud để xử lý.
          </p>

          <p><strong>Ba ưu điểm cốt lõi:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Latency cực thấp:</strong>{" "}Xử lý tại chỗ, không có network round-trip (ms thay vì giây)</li>
            <li><strong>Bảo mật dữ liệu:</strong>{" "}Dữ liệu không rời thiết bị — tuân thủ GDPR, PDPA</li>
            <li><strong>Hoạt động offline:</strong>{" "}Không phụ thuộc internet — quan trọng cho nông thôn, nhà máy</li>
          </ul>

          <p><strong>Trade-off Edge vs Cloud:</strong></p>
          <LaTeX block>{"\\text{Total Latency}_{\\text{cloud}} = t_{\\text{upload}} + t_{\\text{inference}} + t_{\\text{download}} \\gg t_{\\text{edge inference}}"}</LaTeX>

          <LaTeX block>{"\\text{Cost}_{\\text{edge}} = \\text{Hardware (one-time)} \\quad vs \\quad \\text{Cost}_{\\text{cloud}} = \\text{Pay-per-request (ongoing)}"}</LaTeX>

          <Callout variant="info" title="Edge AI tại Việt Nam">
            VinAI triển khai Edge AI trên xe VinFast (nhận diện biển báo, người đi bộ). Camera giám sát giao thông ở Hà Nội, TP.HCM dùng chip AI để đếm xe, phát hiện tai nạn real-time mà không cần bandwidth lớn.
          </Callout>

          <p><strong>Kỹ thuật tối ưu cho Edge:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Quantization:</strong>{" "}INT8/INT4 giảm 4-8x model size, chip Edge có INT8 accelerator</li>
            <li><strong>Knowledge Distillation:</strong>{" "}Model lớn (teacher) dạy model nhỏ (student) — giữ 95% accuracy</li>
            <li><strong>Architecture Search:</strong>{" "}Tự động thiết kế kiến trúc phù hợp chip cụ thể (NAS)</li>
          </ul>

          <p><strong>Hardware Edge AI:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Apple Neural Engine:</strong>{" "}16-core NPU, 15.8 TOPS — chạy Stable Diffusion trên iPhone</li>
            <li><strong>Google Tensor:</strong>{" "}TPU on-chip cho Pixel — real-time translation, photo AI</li>
            <li><strong>NVIDIA Jetson:</strong>{" "}GPU nhỏ gọn cho robot, drone, camera AI</li>
            <li><strong>Qualcomm Hexagon:</strong>{" "}NPU trên Snapdragon — model 7B chạy được trên điện thoại</li>
          </ul>

          <CodeBlock language="python" title="Triển khai Edge AI với TensorFlow Lite">
{`import tensorflow as tf

# Chuyển model sang TFLite + quantize INT8
converter = tf.lite.TFLiteConverter.from_saved_model("my_model")
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]

# Representative dataset cho calibration
def representative_data():
    for img in calibration_images[:100]:
        yield [img.astype("float32")]

converter.representative_dataset = representative_data
tflite_model = converter.convert()

# Model gốc: 95MB → TFLite INT8: 24MB (giảm 4x)
# Latency trên Pixel 8: 230ms → 45ms (nhanh 5x)
with open("model_edge.tflite", "wb") as f:
    f.write(tflite_model)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Edge AI chạy model ngay trên thiết bị — latency cực thấp, bảo mật cao, hoạt động offline.",
          "Không thay thế Cloud AI mà bổ sung: Edge xử lý nhanh tại chỗ, Cloud xử lý tác vụ phức tạp.",
          "Quantization + Distillation + NAS giúp model nhỏ gọn chạy được trên chip có RAM hạn chế.",
          "NPU (Apple, Google, Qualcomm) ngày càng mạnh — model 7B đã chạy được trên điện thoại.",
          "Ứng dụng Việt Nam: camera giao thông, xe tự lái VinFast, nhận diện khuôn mặt chấm công.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
