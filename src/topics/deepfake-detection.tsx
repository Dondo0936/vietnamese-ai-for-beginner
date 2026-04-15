"use client";

import { useState, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
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
  difficulty: "intermediate",
  relatedSlugs: ["gan", "adversarial-robustness", "ai-watermarking"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const CLUES = [
  { id: "eyes", label: "Ánh sáng mắt", desc: "Phản chiếu trong 2 mắt KHÔNG KHỚP. Thực tế: cả 2 mắt phải phản chiếu cùng vật thể.", color: "#3b82f6" },
  { id: "skin", label: "Da và kết cấu", desc: "Da QUÁ MỊN, không có lỗ chân lông, nếp nhăn bị xoá. Deepfake thường 'trẻ hoá' da.", color: "#22c55e" },
  { id: "hair", label: "Đường viền tóc", desc: "Ranh giới tóc/da bị NHOÈ hoặc có artifact. Tóc là phần khó nhất cho deepfake.", color: "#f59e0b" },
  { id: "temporal", label: "Nhất quán thời gian", desc: "Khuôn mặt NHẤP NHÁY hoặc biến dạng khi quay đầu. Deepfake yếu ở profile view.", color: "#8b5cf6" },
  { id: "audio", label: "Lip-sync", desc: "Chuyển động MÔI KHÔNG KHỚP âm thanh. Đặc biệt rõ với tiếng Việt (nhiều nguyên âm mở).", color: "#ef4444" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Bạn nhận video call Zalo từ 'bố' xin chuyển 50 triệu gấp. Dấu hiệu nào cho thấy có thể là deepfake?",
    options: [
      "Chất lượng video thấp — có thể do mạng yếu",
      "Ánh sáng mắt không khớp, da quá mịn, môi không sync với lời nói, khuôn mặt nhấp nháy khi nghiêng đầu",
      "Bố nói giọng Bắc thay vì giọng Nam như thường",
      "Cuộc gọi từ số lạ",
    ],
    correct: 1,
    explanation:
      "Deepfake video call qua Zalo đang là vấn nạn tại VN. Dấu hiệu: (1) mắt không phản chiếu cùng vật, (2) da quá trơn, (3) lip-sync không khớp tiếng Việt, (4) nhấp nháy khi quay đầu. XÁC MINH: hỏi câu bí mật gia đình, gọi lại qua số quen, yêu cầu đưa tay lên mặt.",
  },
  {
    question: "Phương pháp phân tích tần số (frequency analysis) phát hiện deepfake dựa trên gì?",
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
    type: "fill-blank",
    question: "Deepfake detector được huấn luyện để phân biệt ảnh do AI {blank} và ảnh {blank} do camera ghi lại.",
    blanks: [
      { answer: "generated", accept: ["tạo", "sinh", "giả"] },
      { answer: "real", accept: ["thật", "that"] },
    ],
    explanation: "Deepfake detection về bản chất là bài toán nhị phân: phân biệt nội dung generated (do AI sinh) với nội dung real (do camera chụp/quay thật).",
  },
];

export default function DeepfakeDetectionTopic() {
  const [selectedClue, setSelectedClue] = useState("eyes");
  const clue = CLUES.find((c) => c.id === selectedClue)!;
  const handleClueChange = useCallback((id: string) => { setSelectedClue(id); }, []);

  return (
    <>
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
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Chọn từng dấu hiệu để hiểu cách {'"thám tử AI"'} phân biệt ảnh thật và deepfake. Mỗi dấu hiệu là một manh mối quan trọng.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CLUES.map((c) => (
                <button key={c.id} type="button" onClick={() => handleClueChange(c.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selectedClue === c.id ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <svg viewBox="0 0 620 240" className="w-full max-w-2xl mx-auto">
              {/* Real face */}
              <g transform="translate(50, 15)">
                <text x={110} y={0} textAnchor="middle" fontSize={12} fill="#22c55e" fontWeight="bold">Ảnh thật</text>
                <ellipse cx={110} cy={95} rx={70} ry={85} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
                <ellipse cx={85} cy={78} rx={14} ry={7} fill="white" stroke="#0f172a" strokeWidth={1} />
                <circle cx={85} cy={78} r={4.5} fill="#0f172a" />
                <circle cx={83} cy={76} r={2} fill="white" />
                <ellipse cx={135} cy={78} rx={14} ry={7} fill="white" stroke="#0f172a" strokeWidth={1} />
                <circle cx={135} cy={78} r={4.5} fill="#0f172a" />
                <circle cx={133} cy={76} r={2} fill="white" />
                <path d="M 105 92 Q 110 104, 115 92" fill="none" stroke="#d97706" strokeWidth={1} />
                <path d="M 90 125 Q 110 138, 130 125" fill="none" stroke="#dc2626" strokeWidth={2} />
              </g>

              {/* Fake face */}
              <g transform="translate(320, 15)">
                <text x={110} y={0} textAnchor="middle" fontSize={12} fill="#ef4444" fontWeight="bold">Deepfake</text>
                <ellipse cx={110} cy={95} rx={70} ry={85} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
                <ellipse cx={85} cy={78} rx={14} ry={7} fill="white" stroke="#0f172a" strokeWidth={1} />
                <circle cx={85} cy={78} r={4.5} fill="#0f172a" />
                <circle cx={83} cy={76} r={2} fill="white" />
                <ellipse cx={135} cy={78} rx={14} ry={7} fill="white" stroke="#0f172a" strokeWidth={1} />
                <circle cx={135} cy={78} r={4.5} fill="#0f172a" />
                <circle cx={138} cy={80} r={1.5} fill="white" />
                {selectedClue === "eyes" && (
                  <>
                    <circle cx={85} cy={76} r={18} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                    <circle cx={135} cy={78} r={18} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                  </>
                )}
                {selectedClue === "hair" && (
                  <path d="M 45 48 Q 75 15, 110 10 Q 145 15, 175 48" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="4 2" />
                )}
                <path d="M 105 92 Q 110 104, 115 92" fill="none" stroke="#d97706" strokeWidth={1} />
                <path d="M 90 125 Q 110 136, 130 125" fill="none" stroke="#dc2626" strokeWidth={2} />
              </g>

              {/* Clue detail */}
              <rect x={30} y={195} width={560} height={35} rx={6} fill={clue.color} opacity={0.15} />
              <text x={310} y={218} textAnchor="middle" fill={clue.color} fontSize={10} fontWeight="bold">
                {clue.label}: {clue.desc.length > 60 ? clue.desc.slice(0, 60) + "..." : clue.desc}
              </text>
            </svg>
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground"><strong>{clue.label}:</strong>{" "}{clue.desc}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Deepfake detection giống{" "}
          <strong>giám định tranh giả</strong>{" "}
          — người thường nhìn bức tranh thấy bình thường, nhưng chuyên gia biết tìm: nét cọ không tự nhiên, tỷ lệ sai, chất liệu không đúng. AI phát hiện deepfake bằng cách tìm{" "}
          <strong>{'"nét cọ"'} của AI</strong>: pattern trong phổ Fourier, ánh sáng mắt, texture da — những dấu vết mà AI tạo hình để lại.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
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
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p><strong>Deepfake Detection</strong>{" "} là các phương pháp phát hiện nội dung ảnh/video giả mạo tạo bởi AI ({" "}
            <TopicLink slug="gan">GAN</TopicLink>, Diffusion). Để phòng chống toàn diện, detection thường kết hợp với{" "}
            <TopicLink slug="ai-watermarking">AI watermarking</TopicLink>{" "}
            để xác minh nguồn gốc nội dung ngay từ khâu sinh.</p>
          <Callout variant="insight" title="Bốn phương pháp phát hiện chính">
            <div className="space-y-2">
              <p><strong>1. Phân tích sinh trắc:</strong>{" "} Kiểm tra ánh sáng mắt, nhịp nháy, lip-sync, chuyển động đầu. Dễ hiểu nhưng deepfake mới vượt qua được.</p>
              <p><strong>2. Phân tích tần số (Fourier):</strong>{" "} Deepfake để lại {'"vân tay"'} trong phổ tần số cao. Mỗi kiến trúc (GAN, Diffusion) có vân tay riêng.</p>
              <p><strong>3. Neural detector:</strong>{" "} CNN/ViT train trên tập ảnh thật + giả. EfficientNet và XceptionNet phổ biến. Accuracy ~95% nhưng yếu generalization.</p>
              <p><strong>4. Temporal analysis (video):</strong>{" "} Kiểm tra nhất quán giữa frames — deepfake hay nhấp nháy, biến dạng ở profile view.</p>
            </div>
          </Callout>
          <p>Phân tích tần số: ảnh deepfake có energy bất thường ở high frequency:</p>
          <LaTeX block>{"\\text{Score}_{\\text{fake}} = \\frac{\\sum_{f > f_0} |\\mathcal{F}(I)|^2}{\\sum_{f} |\\mathcal{F}(I)|^2} \\quad (\\text{tỷ lệ energy tần số cao})"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\mathcal{F}(I)"}</LaTeX> là Fourier transform của ảnh. Deepfake thường có tỷ lệ energy tần số cao bất thường so với ảnh thật — vì GAN/Diffusion tạo pattern lặp lại ở các chi tiết nhỏ.
          </p>
          <CodeBlock language="python" title="deepfake_detector.py">
{`import torch
from torchvision import transforms
from PIL import Image

# Tải detector (EfficientNet fine-tuned)
model = torch.hub.load(
    'pytorch/vision', 'efficientnet_b4', pretrained=False
)
# Load weights trained on FF++ + Celeb-DF + DeeperForensics
model.load_state_dict(torch.load("deepfake_detector.pth"))
model.eval()

# Phát hiện deepfake trong ảnh
transform = transforms.Compose([
    transforms.Resize((380, 380)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

image = Image.open("zalo_video_frame.jpg")
input_tensor = transform(image).unsqueeze(0)

with torch.no_grad():
    output = model(input_tensor)
    prob_fake = torch.sigmoid(output).item()

if prob_fake > 0.5:
    print(f"CANH BAO DEEPFAKE! (confidence: {prob_fake:.1%})")
    print("Khong nen tin tuong video nay.")
else:
    print(f"Co ve la that (confidence: {1-prob_fake:.1%})")
    print("Van nen xac minh bang cach khac.")`}
          </CodeBlock>
          <Callout variant="warning" title="Deepfake lừa đảo tại Việt Nam">
            <div className="space-y-1">
              <p><strong>Zalo video call:</strong>{" "} Kẻ lừa đảo dùng deepfake giả khuôn mặt người thân, gọi Zalo xin chuyển tiền gấp. Hàng nghìn vụ/năm.</p>
              <p><strong>Giả mạo người nổi tiếng:</strong>{" "} Deepfake giả MC/diễn viên quảng cáo sản phẩm lừa đảo trên Facebook/TikTok.</p>
              <p><strong>Phòng tránh:</strong>{" "} (1) Gọi lại qua số quen, (2) Hỏi câu bí mật gia đình, (3) Yêu cầu đưa tay lên mặt (deepfake yếu ở occlusion), (4) KHÔNG chuyển tiền qua video call.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Cuộc chạy đua vũ trang">
          <Callout variant="info" title="Arms race: Deepfake vs Detection">
            <div className="space-y-2">
              <p><strong>2019:</strong>{" "} Deepfake dễ phát hiện (da nhoè, mắt sai). Detector accuracy ~99%.</p>
              <p><strong>2022:</strong>{" "} Deepfake cải thiện đáng kể. Detector accuracy giảm ~90% trên loại mới.</p>
              <p><strong>2025:</strong>{" "} Deepfake real-time qua video call. Detector cần multi-modal (ảnh + audio + temporal).</p>
              <p><strong>Tương lai:</strong>{" "} Watermarking + provenance (C2PA standard) có thể hiệu quả hơn detection.</p>
            </div>
          </Callout>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Deepfake Detection"
          points={[
            "5 dấu hiệu: ánh sáng mắt, da quá mịn, tóc nhoè, temporal flickering, lip-sync sai.",
            "4 phương pháp: sinh trắc, Fourier analysis, neural detector (CNN/ViT), temporal analysis.",
            "Thách thức: generalization gap — detector train trên GAN thất bại trên Diffusion deepfake.",
            "Deepfake lừa đảo Zalo là vấn nạn tại VN — luôn xác minh: gọi lại số quen, hỏi bí mật gia đình.",
            "Tương lai: kết hợp detection + watermarking + provenance (C2PA) cho phòng chống toàn diện.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
