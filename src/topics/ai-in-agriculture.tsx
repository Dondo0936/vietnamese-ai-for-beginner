"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-agriculture", title: "AI in Agriculture", titleVi: "AI trong Nông nghiệp", description: "Ứng dụng AI trong phát hiện sâu bệnh, dự báo mùa vụ và nông nghiệp chính xác tại Việt Nam", category: "applied-ai", tags: ["crop", "pest-detection", "precision-farming"], difficulty: "beginner", relatedSlugs: ["image-classification", "object-detection", "edge-ai"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInAgricultureTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI phát hiện bệnh lúa bằng cách nào?", options: ["Đo độ ẩm đất", "Chụp ảnh lá lúa bằng điện thoại → CNN phân loại bệnh (đạo ôn, vàng lá, khô vằn) → gợi ý cách trị với accuracy 90%+", "Đo nhiệt độ không khí"], correct: 1, explanation: "CNN (MobileNet/EfficientNet) nhận diện triệu chứng bệnh từ ảnh lá: màu sắc (vàng, nâu), hình dạng vết bệnh, vị trí. App trên điện thoại: nông dân chụp ảnh → AI phân loại → gợi ý thuốc/cách xử lý. Đã có apps như PlantVillage, Plantix dùng ở VN." },
    { question: "Precision farming là gì?", options: ["Farming chính xác từng cm", "Dùng AI + sensors + drone để TỐI ƯU tại từng vùng nhỏ: bao nhiêu nước, bao nhiêu phân, khi nào thu hoạch — thay vì 'làm đồng đều' toàn cánh đồng", "Chỉ dùng trong nhà kính"], correct: 1, explanation: "Precision farming: không phun thuốc đều toàn ruộng mà chỉ phun chỗ nào bị sâu. Không tưới đều mà tưới theo độ ẩm từng vùng. Giảm 30-50% nước + phân + thuốc, tăng 15-25% năng suất. Drones + sensors + AI = farming 4.0. Việt Nam đang pilot ở Đồng bằng sông Cửu Long." },
    { question: "Thách thức lớn nhất của AI nông nghiệp tại Việt Nam?", options: ["Thiếu GPU", "Hạ tầng: internet không ổn định ở nông thôn, nông dân chưa quen công nghệ, data cụ thể cho giống cây VN còn thiếu", "Thiếu đất nông nghiệp"], correct: 1, explanation: "3 thách thức chính: (1) Internet ở nông thôn không ổn định → cần Edge AI (chạy trên điện thoại offline), (2) Nông dân cần app đơn giản (tiếng Việt, giao diện dễ dùng), (3) Data giống cây VN (lúa, cà phê, thanh long) không nhiều như data cây tây Âu. Cần tự collect và label." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Nông dân Đồng Tháp trồng 10 ha lúa. Một vùng bị đạo ôn nhưng chưa nhìn thấy rõ. Khi phát hiện thì đã lan 3 ha. AI giúp thế nào?" options={["AI không liên quan đến nông nghiệp", "Drone bay quét + AI phân tích ảnh → phát hiện bệnh SỚM (trước mắt thường 1-2 tuần) → chỉ cần xử lý 0.5 ha thay vì 3 ha", "AI dự báo thời tiết"]} correct={1} explanation="Drone + multispectral camera chụp ruộng → AI phân tích: vùng nào stress (chưa có triệu chứng mắt thường nhưng spectral signature khác). Phát hiện sớm 1-2 tuần → xử lý 0.5 ha thay vì 3 ha → tiết kiệm 80% thuốc + cứu 70% năng suất. Đã được pilot ở Cần Thơ, An Giang!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>AI nông nghiệp là <strong>nông dân 4.0</strong>: thay vì nhìn trời đoán thời tiết, dùng <strong>AI dự báo</strong>. Thay vì phun thuốc toàn ruộng, dùng <strong>drone chỉ phun chỗ bị bệnh</strong>. Thay vì thu hoạch theo lịch, dùng <strong>AI phân tích độ chín</strong>. Giảm 30-50% chi phí, tăng 15-25% năng suất. Việt Nam — nước nông nghiệp — có thể hưởng lợi RẤT LỚN!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="App AI phát hiện bệnh cây cần chạy trên điện thoại nông dân (RAM 2-3GB, không có internet ổn định). Chọn model nào?" options={["ResNet-152 (230MB, cần internet)", "MobileNet V3 quantized INT8 (5MB, chạy offline, 50ms trên điện thoại cũ)", "GPT-4 Vision API"]} correct={1} explanation="Nông thôn VN: internet không ổn định → cần offline. Điện thoại cũ 2-3GB RAM → model phải nhỏ. MobileNet V3 INT8: 5MB, accuracy 88% (đủ cho 90% use cases), chạy 50ms, offline. Edge AI là giải pháp duy nhất cho nông nghiệp nông thôn!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>AI in Agriculture</strong>{" "}ứng dụng AI để phát hiện bệnh, tối ưu tưới tiêu, dự báo năng suất — nông nghiệp chính xác (precision farming).</p>
        <p><strong>4 ứng dụng chính:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Phát hiện sâu bệnh:</strong>{" "}CNN từ ảnh lá → phân loại bệnh (accuracy 90%+)</li>
          <li><strong>Precision farming:</strong>{" "}Sensors + AI tối ưu nước, phân, thuốc từng vùng</li>
          <li><strong>Dự báo năng suất:</strong>{" "}Satellite + weather + soil data → predict yield</li>
          <li><strong>Robot thu hoạch:</strong>{" "}Computer vision + robotics cho thu hoạch tự động</li>
        </ul>
        <Callout variant="info" title="AI Nông nghiệp tại Việt Nam">VNPT: platform nông nghiệp thông minh cho Đồng bằng sông Cửu Long. FPT: AI dự báo thời tiết cho nông nghiệp. Nhiều startup: CropX VN, AgriConnect. Mekong delta (lúa), Tây Nguyên (cà phê), Ninh Thuận (nho) đang pilot.</Callout>
        <CodeBlock language="python" title="Phát hiện bệnh cây trên điện thoại">{`import tensorflow as tf

# Model nhỏ cho điện thoại: MobileNet V3
model = tf.keras.applications.MobileNetV3Small(
    input_shape=(224, 224, 3),
    classes=10,  # 10 loại bệnh lúa
    weights=None,
)
model.load_weights("disease_model.h5")

# Quantize cho điện thoại (5MB, offline)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
# Kết quả: 5MB, 50ms trên điện thoại, accuracy 88%

# Nông dân chụp ảnh lá → model phân loại:
# "Đạo ôn (70%), Khô vằn (20%), Bình thường (10%)"
# + Gợi ý: "Phun thuốc Tricyclazole, liều 1g/lít"`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["4 ứng dụng: Phát hiện bệnh (CNN), Precision farming (sensors+AI), Dự báo năng suất, Robot thu hoạch.", "Edge AI bắt buộc: nông thôn không có internet ổn định → model chạy offline trên điện thoại.", "Precision farming: giảm 30-50% nước/thuốc/phân, tăng 15-25% năng suất.", "VN có lợi thế: nước nông nghiệp lớn, nhiều bài toán (lúa, cà phê, thuỷ sản) cần AI.", "Thách thức: internet nông thôn, data giống cây VN còn thiếu, nông dân cần app đơn giản."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
