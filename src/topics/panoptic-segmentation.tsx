"use client";

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
  slug: "panoptic-segmentation",
  title: "Panoptic Segmentation",
  titleVi: "Phân đoạn toàn cảnh",
  description:
    "Kết hợp phân đoạn ngữ nghĩa và phân đoạn thể hiện, gán nhãn cho mọi pixel trong ảnh một cách toàn diện.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "unified"],
  difficulty: "advanced",
  relatedSlugs: ["semantic-segmentation", "instance-segmentation", "object-detection"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Panoptic Segmentation chia pixel thành 2 loại nào?",
    options: [
      "Foreground (tiền cảnh) và Background (nền)",
      "Stuff (vùng nền: bầu trời, đường) và Things (vật thể đếm được: xe, người)",
      "High-confidence và Low-confidence",
      "RGB và Grayscale",
    ],
    correct: 1,
    explanation: "Stuff = vùng nền không đếm được (bầu trời, đường, cỏ) -- chỉ cần nhãn lớp. Things = vật thể đếm được (xe #1, người #2) -- cần nhãn lớp + instance ID riêng.",
  },
  {
    question: "Panoptic Quality (PQ) được tính bằng công thức nào?",
    options: [
      "PQ = mAP + mIoU",
      "PQ = SQ (chất lượng phân đoạn) x RQ (chất lượng nhận dạng)",
      "PQ = IoU trung bình",
      "PQ = Precision x Recall",
    ],
    correct: 1,
    explanation: "PQ = SQ x RQ. SQ đo chất lượng mask (IoU trung bình của matched segments). RQ đo khả năng nhận dạng (F1 score). PQ đánh giá cả 2 khía cạnh cùng lúc!",
  },
  {
    question: "Mask2Former dùng kiến trúc gì để xử lý cả stuff và things thống nhất?",
    options: [
      "Hai mạng riêng biệt cho stuff và things",
      "Masked attention trong Transformer -- xử lý mọi segment bằng 1 kiến trúc duy nhất",
      "Chỉ dùng CNN truyền thống",
      "Graph Neural Network",
    ],
    correct: 1,
    explanation: "Mask2Former dùng Transformer decoder với masked attention: mỗi query tương ứng 1 segment (bất kể stuff hay things). Kiến trúc duy nhất xử lý tất cả, đơn giản và mạnh mẽ!",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function PanopticSegmentationTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Xe tự lái cần biết: đường ở đâu (stuff), vỉa hè ở đâu (stuff), và từng xe/người cụ thể (things). Cần kết hợp Semantic Segmentation + Instance Segmentation?"
          options={[
            "Chỉ cần Semantic Segmentation là đủ",
            "Chỉ cần Instance Segmentation là đủ",
            "Cần cả hai: Semantic cho stuff (đường, vỉa hè) + Instance cho things (xe, người)",
          ]}
          correct={2}
          explanation="Panoptic Segmentation = Semantic (gán nhãn mọi pixel: đường, bầu trời) + Instance (phân biệt xe #1, xe #2, người #3). MỌI pixel đều có nhãn -- không bỏ sót gì!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <svg viewBox="0 0 600 420" className="w-full max-w-2xl mx-auto">
              <text x="300" y="20" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="bold">
                So sánh 3 loại phân đoạn
              </text>

              {/* Semantic */}
              <rect x="20" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="107" y="55" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">Semantic</text>
              <rect x="25" y="60" width="165" height="35" fill="#60a5fa" opacity={0.5} />
              <rect x="25" y="95" width="165" height="40" fill="#94a3b8" opacity={0.5} />
              <rect x="25" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
              <rect x="50" y="100" width="30" height="20" fill="#ef4444" opacity={0.6} />
              <rect x="110" y="100" width="30" height="20" fill="#ef4444" opacity={0.6} />
              <rect x="105" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
              <text x="107" y="172" textAnchor="middle" fill="#64748b" fontSize="11">Cùng màu = cùng lớp</text>

              {/* Instance */}
              <rect x="213" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1.5" />
              <text x="300" y="55" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold">Instance</text>
              <rect x="218" y="60" width="165" height="115" fill="#1e293b" opacity={0.3} />
              <rect x="243" y="100" width="30" height="20" fill="#3b82f6" opacity={0.7} />
              <text x="258" y="114" textAnchor="middle" fill="white" fontSize="11">Xe #1</text>
              <rect x="303" y="100" width="30" height="20" fill="#22c55e" opacity={0.7} />
              <text x="318" y="114" textAnchor="middle" fill="white" fontSize="11">Xe #2</text>
              <rect x="350" y="85" width="18" height="35" fill="#f59e0b" opacity={0.7} />
              <text x="359" y="130" textAnchor="middle" fill="#f59e0b" fontSize="11">Ng. #1</text>
              <text x="300" y="172" textAnchor="middle" fill="#64748b" fontSize="11">Chỉ things, bỏ stuff</text>

              {/* Panoptic */}
              <rect x="405" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
              <text x="493" y="55" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">Panoptic</text>
              <rect x="410" y="60" width="165" height="35" fill="#60a5fa" opacity={0.5} />
              <rect x="410" y="95" width="165" height="40" fill="#94a3b8" opacity={0.5} />
              <rect x="410" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
              <rect x="490" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
              <rect x="435" y="100" width="30" height="20" fill="#3b82f6" opacity={0.8} />
              <text x="450" y="114" textAnchor="middle" fill="white" fontSize="11">Xe #1</text>
              <rect x="500" y="100" width="30" height="20" fill="#ec4899" opacity={0.8} />
              <text x="515" y="114" textAnchor="middle" fill="white" fontSize="11">Xe #2</text>
              <rect x="545" y="85" width="18" height="35" fill="#f59e0b" opacity={0.8} />
              <text x="554" y="130" textAnchor="middle" fill="#f59e0b" fontSize="11">Ng. #1</text>
              <text x="493" y="172" textAnchor="middle" fill="#64748b" fontSize="11">MỌI pixel có nhãn!</text>

              <text x="300" y="210" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="bold">Bảng so sánh</text>

              {/* Table */}
              {[
                { label: "Stuff (nền)", sem: true, inst: false, pan: true },
                { label: "Things (vật thể)", sem: "cùng màu", inst: true, pan: true },
                { label: "Mọi pixel", sem: true, inst: false, pan: true },
              ].map((row, i) => {
                const y = 225 + i * 25;
                return (
                  <g key={row.label}>
                    <rect x="50" y={y} width="120" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="110" y={y + 15} textAnchor="middle" fill="#94a3b8" fontSize="11">{row.label}</text>
                    {[
                      { val: row.sem, x: 235, c: "#3b82f6" },
                      { val: row.inst, x: 365, c: "#8b5cf6" },
                      { val: row.pan, x: 495, c: "#22c55e" },
                    ].map(({ val, x, c }) => (
                      <g key={`${row.label}-${x}`}>
                        <rect x={x - 65} y={y} width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                        <text x={x} y={y + 15} textAnchor="middle" fill={val === true ? "#22c55e" : val === false ? "#ef4444" : "#f59e0b"} fontSize="11">
                          {val === true ? "\u2713" : val === false ? "\u2717" : String(val)}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}

              <text x="300" y="320" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
                Panoptic = Semantic + Instance (tốt nhất cả hai!)
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Panoptic Segmentation giống <strong>bản đồ hoàn hảo</strong>{" "}của một khu phố: vừa tô màu
            đường/vỉa hè/bầu trời (<strong>stuff</strong>) vừa đánh số riêng từng xe, từng người
            (<strong>things</strong>). <strong>Không pixel nào bị bỏ sót!</strong>{" "}Mỗi pixel có đúng 1 nhãn:
            hoặc thuộc stuff class hoặc thuộc 1 instance cụ thể.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Panoptic Segmentation gán nhãn cho MỌI pixel. Nếu 1 pixel nằm ở ranh giới giữa 'đường' (stuff) và 'xe' (thing), gán cho cái nào?"
          options={[
            "Gán cho cả 2 (overlap)",
            "Gán cho thing (xe) vì thing có priority cao hơn stuff",
            "Không gán gì (bỏ qua)",
          ]}
          correct={1}
          explanation="Trong Panoptic Segmentation, mỗi pixel có ĐÚNG 1 nhãn (non-overlapping). Things có priority cao hơn stuff -- pixel ranh giới thuộc xe, không thuộc đường. Đảm bảo tính nhất quán!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Panoptic Segmentation</strong>{" "}(Kirillov et al., 2019) thống nhất semantic và instance
            segmentation: mỗi pixel được gán đúng 1 nhãn.
          </p>

          <Callout variant="insight" title="2 loại pixel">
            <div className="space-y-2 text-sm">
              <p><strong>Stuff (vùng nền):</strong>{" "}Không đếm được -- bầu trời, đường, cỏ, nước. Chỉ cần nhãn lớp.</p>
              <p><strong>Things (vật thể):</strong>{" "}Đếm được -- người, xe, động vật. Cần nhãn lớp + instance ID riêng.</p>
            </div>
          </Callout>

          <p><strong>Panoptic Quality (PQ)</strong>{" "}-- chỉ số đánh giá:</p>
          <LaTeX block>{"\\text{PQ} = \\underbrace{\\frac{\\sum_{(p,g) \\in TP} \\text{IoU}(p,g)}{|TP|}}_{\\text{SQ}} \\times \\underbrace{\\frac{|TP|}{|TP| + \\frac{1}{2}|FP| + \\frac{1}{2}|FN|}}_{\\text{RQ}}"}</LaTeX>
          <p className="text-sm text-muted">
            SQ (Segmentation Quality) = IoU trung bình. RQ (Recognition Quality) = F1 score. PQ = SQ x RQ.
          </p>

          <p><strong>Kiến trúc tiêu biểu:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Panoptic FPN (2019):</strong>{" "}Semantic head + Instance head trên FPN backbone</li>
            <li><strong>Panoptic-DeepLab (2020):</strong>{" "}Bottom-up approach, không cần box detection</li>
            <li><strong>MaskFormer (2021):</strong>{" "}Transformer decoder, xử lý stuff/things bằng mask prediction thống nhất</li>
            <li><strong>Mask2Former (2022):</strong>{" "}State-of-the-art, masked attention, 1 kiến trúc cho mọi loại segmentation</li>
          </ul>

          <Callout variant="warning" title="Ứng dụng thực tế">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Xe tự lái:</strong>{" "}Hiểu toàn diện cảnh đường phố (đường + vỉa hè + từng xe/người)</li>
              <li><strong>Robot:</strong>{" "}Điều hướng trong nhà, tránh vật cản + nhận diện đồ vật</li>
              <li><strong>Augmented Reality:</strong>{" "}Hiểu cảnh 3D hoàn chỉnh để chèn đối tượng ảo</li>
              <li><strong>Giám sát giao thông VN:</strong>{" "}Đếm từng xe + phân tích luồng giao thông</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Panoptic Segmentation với Mask2Former (Detectron2)">
{`from detectron2 import model_zoo
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
import cv2

# Config Mask2Former cho panoptic segmentation
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file(
    "COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml"
))
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
    "COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml"
)
predictor = DefaultPredictor(cfg)

# Dự đoán
img = cv2.imread("duong_pho_hanoi.jpg")
panoptic_seg, segments_info = predictor(img)["panoptic_seg"]

# panoptic_seg: (H, W) tensor - mỗi pixel có segment ID
# segments_info: danh sách dict {id, category_id, isthing, area}

for seg in segments_info:
    cat = seg["category_id"]
    is_thing = seg["isthing"]
    area = seg["area"]
    label = "thing" if is_thing else "stuff"
    print(f"Segment {seg['id']}: {label}, cat={cat}, area={area}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Panoptic = Semantic (stuff: đường, bầu trời) + Instance (things: xe #1, người #2). MỌI pixel có nhãn",
          "Stuff = vùng nền (không đếm), Things = vật thể (đếm được, cần instance ID)",
          "PQ = SQ x RQ: đánh giá cả chất lượng mask (SQ) lẫn nhận dạng (RQ)",
          "Mask2Former: state-of-the-art, 1 kiến trúc Transformer cho mọi loại segmentation",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
