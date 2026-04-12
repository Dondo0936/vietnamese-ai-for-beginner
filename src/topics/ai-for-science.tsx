"use client";

import { useMemo } from "react";
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
  slug: "ai-for-science",
  title: "AI for Science",
  titleVi: "AI cho Khoa học — Phòng thí nghiệm ảo",
  description:
    "Ứng dụng AI để đẩy nhanh khám phá khoa học, từ dự đoán cấu trúc protein đến thiết kế vật liệu mới.",
  category: "emerging",
  tags: ["science", "protein", "drug-discovery", "materials"],
  difficulty: "advanced",
  relatedSlugs: ["world-models", "reasoning-models", "synthetic-data"],
  vizType: "interactive",
};

const BREAKTHROUGHS = [
  { year: "2020", name: "AlphaFold 2", field: "Sinh học", impact: "Dự đoán cấu trúc 200M+ protein", speedup: "Từ hàng năm xuống phút", color: "#22c55e" },
  { year: "2023", name: "GNoME", field: "Vật liệu", impact: "Khám phá 2.2M vật liệu mới", speedup: "800 năm nghiên cứu → 1 năm", color: "#3b82f6" },
  { year: "2024", name: "AlphaFold 3", field: "Thuốc", impact: "Dự đoán tương tác protein-drug", speedup: "Giảm 90% thời gian drug design", color: "#f59e0b" },
  { year: "2024", name: "AlphaProof", field: "Toán", impact: "Huy chương vàng IMO 2024", speedup: "Giải bài toán mở hàng thập kỷ", color: "#8b5cf6" },
];

const TOTAL_STEPS = 7;

export default function AIForScienceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "AlphaFold 2 giải quyết vấn đề gì mà nhà khoa học mất 50 năm?",
      options: [
        "Tạo protein mới",
        "Dự đoán cấu trúc 3D của protein từ chuỗi amino acid — 'protein folding problem'",
        "Tìm thuốc trị COVID",
      ],
      correct: 1,
      explanation: "Protein folding: từ chuỗi amino acid (1D) → cấu trúc 3D. Trước AlphaFold: X-ray crystallography mất hàng tháng/triệu USD cho 1 protein. AlphaFold: phút, miễn phí. Đã dự đoán 200M+ protein (gần như toàn bộ protein đã biết).",
    },
    {
      question: "Tại sao AI for Science khác với AI cho ngành khác?",
      options: [
        "Dùng GPU đắt hơn",
        "Cần hiểu và tôn trọng quy luật vật lý (symmetry, conservation laws) — không chỉ pattern matching",
        "Chỉ dùng cho nghiên cứu, không cho ứng dụng",
      ],
      correct: 1,
      explanation: "AI cho science cần 'physics-informed': hiểu symmetry (phép đối xứng), conservation laws (bảo toàn năng lượng), equivariance (xoay phân tử không đổi tính chất). GNN (Graph Neural Networks) và equivariant architectures được thiết kế đặc biệt cho điều này.",
    },
    {
      question: "AI có thể thay thế nhà khoa học không?",
      options: [
        "Có — AI đã giải được IMO",
        "Không hoàn toàn — AI accelerate nghiên cứu (hypothesis generation, simulation) nhưng cần nhà khoa học validate và interpret",
        "Không — AI chỉ xử lý data",
      ],
      correct: 1,
      explanation: "AI là 'postdoc siêu năng': dự đoán nhanh, khám phá hypothesis, simulate experiments. Nhưng cần nhà khoa học: đặt câu hỏi đúng, thiết kế experiment, validate kết quả, interpret ý nghĩa. AI + Human scientist = discovery nhanh hơn 100x.",
    },
    {
      type: "fill-blank",
      question: "AlphaFold đã cách mạng hoá ngành sinh học bằng cách dự đoán cấu trúc 3D của {blank}, đẩy nhanh {blank} thuốc và vật liệu hàng trăm lần.",
      blanks: [
        { answer: "protein", accept: ["proteins", "prô-tê-in"] },
        { answer: "discovery", accept: ["khám phá", "kham pha", "research", "nghiên cứu"] },
      ],
      explanation: "AlphaFold 2 (2020) dự đoán cấu trúc 3D của 200M+ protein từ chuỗi amino acid — đột phá của '50-year grand challenge'. Kết hợp với GNoME (materials), AlphaFold 3 (drug interaction), AI tăng tốc discovery trong sinh học, hoá học, vật liệu.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Để tìm ra 1 loại thuốc mới, truyền thống mất 10-15 năm và 2.6 tỷ USD. AI có thể giảm bao nhiêu?"
          options={[
            "Giảm 10% — AI chỉ hỗ trợ phần nhỏ",
            "Giảm 50-70% thời gian và chi phí — AI accelerate mọi giai đoạn từ target identification đến clinical trials",
            "Giảm 100% — AI tự thiết kế thuốc hoàn chỉnh",
          ]}
          correct={1}
          explanation="AI giảm từ 10-15 năm xuống 3-5 năm, từ 2.6 tỷ USD xuống 500M-1B. AlphaFold dự đoán target structure, ML screen triệu hợp chất, AI optimize lead compounds. Nhưng vẫn cần clinical trials (con người) để validate. Giống buồng mô phỏng: bay giả trước, bay thật sau."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Các đột phá AI for Science
              </text>
              {BREAKTHROUGHS.map((b, i) => {
                const y = 30 + i * 42;
                return (
                  <g key={i}>
                    <rect x={20} y={y} width={560} height={35} rx={6} fill="#1e293b" stroke={b.color} strokeWidth={1.5} />
                    <text x={40} y={y + 15} fill={b.color} fontSize={9} fontWeight="bold">{b.year}</text>
                    <text x={100} y={y + 15} fill="#e2e8f0" fontSize={9} fontWeight="bold">{b.name}</text>
                    <text x={230} y={y + 15} fill="#94a3b8" fontSize={8}>{b.field}</text>
                    <text x={300} y={y + 15} fill="#94a3b8" fontSize={8}>{b.impact}</text>
                    <text x={40} y={y + 28} fill="#64748b" fontSize={7}>{b.speedup}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            AlphaFold dự đoán cấu trúc <strong>200 triệu protein</strong>{" "}
            — nhiều hơn tổng số protein đã được giải bởi nhà khoa học trong lịch sử! GNoME khám phá{" "}
            <strong>2.2 triệu vật liệu mới</strong>{" "}— tương đương 800 năm nghiên cứu truyền thống.
            AI không thay thế nhà khoa học — nó cho họ <strong>siêu năng lực</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn muốn dùng AI thiết kế vật liệu pin mặt trời mới. Cần mô hình hiểu: đối xứng tinh thể, liên kết hoá học, tính chất điện tử. Kiến trúc ML nào phù hợp?"
          options={[
            "CNN — nhận diện ảnh tinh thể",
            "Equivariant GNN — hiểu đồ thị phân tử, tôn trọng đối xứng vật lý (xoay/tịnh tiến phân tử → tính chất không đổi)",
            "Transformer — xử lý chuỗi SMILES",
          ]}
          correct={1}
          explanation="Equivariant GNN (ví dụ: MACE, NequIP) được thiết kế đặc biệt cho molecular systems. Equivariance: xoay phân tử → predictions xoay theo (không thay đổi tính chất scalar). Bảo toàn đối xứng vật lý → model chính xác hơn, generalize tốt hơn, cần ít data hơn."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>AI for Science</strong>{" "}
            ứng dụng AI để đẩy nhanh khám phá khoa học — từ dự đoán cấu trúc protein đến thiết kế vật liệu và giải toán. Ở những bài toán cần suy luận sâu (AlphaProof, AlphaGeometry), AI for Science tận dụng mạnh các{" "}
            <TopicLink slug="reasoning-models">reasoning models</TopicLink>{" "}
            để đưa ra chuỗi chứng minh dài.
          </p>
          <p><strong>Physics-Informed ML:</strong></p>
          <LaTeX block>{"\\mathcal{L} = \\underbrace{\\mathcal{L}_{\\text{data}}}_{\\text{fit observations}} + \\underbrace{\\lambda \\cdot \\mathcal{L}_{\\text{physics}}}_{\\text{satisfy physical laws}}"}</LaTeX>

          <Callout variant="tip" title="Equivariance">
            Equivariant architecture: nếu input bị xoay/dịch chuyển, output cũng xoay/dịch chuyển tương ứng. Quan trọng cho molecules (xoay phân tử không đổi tính chất) và physics (đối xứng bảo toàn). Không equivariant → model cần nhiều data hơn để 'học' luật này.
          </Callout>

          <p><strong>4 lĩnh vực chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Protein/Drug:</strong>{" "}AlphaFold (structure), RFDiffusion (design), molecular docking</li>
            <li><strong>Materials:</strong>{" "}GNoME (discovery), ML potentials (simulation nhanh 1000x)</li>
            <li><strong>Climate:</strong>{" "}GenCast (dự báo thời tiết chính xác hơn physics models)</li>
            <li><strong>Math:</strong>{" "}AlphaProof (theorem proving), AlphaGeometry (hình học)</li>
          </ul>

          <CodeBlock language="python" title="Dự đoán cấu trúc protein với AlphaFold">
{`# AlphaFold inference (simplified)
from alphafold.model import model
from alphafold.data import pipeline

# Input: chuỗi amino acid
sequence = "MKFLILLFNILCLFPVLAADNHGVS..."  # Protein sequence

# Pipeline: MSA search + template search + feature extraction
features = pipeline.process(sequence)

# Dự đoán cấu trúc 3D
prediction = model.predict(features)
# Output: toạ độ 3D của mỗi atom
# Confidence: pLDDT score (0-100)

print(f"Predicted structure: {prediction['atom_positions'].shape}")
print(f"Confidence: {prediction['plddt'].mean():.1f}/100")
# Từ chuỗi amino acid → cấu trúc 3D trong vài phút
# Trước đây: X-ray crystallography mất hàng tháng + triệu USD`}
          </CodeBlock>

          <Callout variant="info" title="AI for Science tại Việt Nam">
            VinAI nghiên cứu AI cho y tế (X-ray analysis, drug repurposing). Đại học Bách Khoa HN ứng dụng ML cho materials science. Nhiều lab Việt dùng AlphaFold miễn phí cho nghiên cứu protein. Cơ hội lớn cho Việt Nam: ít cần big data, cần hiểu biết domain.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "AI for Science: đẩy nhanh khám phá 100-1000x — AlphaFold, GNoME, GenCast, AlphaProof.",
          "Physics-informed ML: kết hợp data-driven với quy luật vật lý (symmetry, conservation).",
          "Equivariant architectures (GNN) tôn trọng đối xứng vật lý — chính xác hơn, cần ít data hơn.",
          "AI là 'postdoc siêu năng': dự đoán nhanh, simulate, khám phá. Nhưng cần nhà khoa học validate.",
          "Drug discovery: từ 15 năm/2.6B USD xuống 3-5 năm/500M. Materials: 800 năm → 1 năm.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
