"use client";

import { useMemo } from "react";
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
  slug: "ai-for-science",
  title: "AI for Science",
  titleVi: "AI cho Khoa hoc — Phong thi nghiem ao",
  description:
    "Ung dung AI de day nhanh kham pha khoa hoc, tu du doan cau truc protein den thiet ke vat lieu moi.",
  category: "emerging",
  tags: ["science", "protein", "drug-discovery", "materials"],
  difficulty: "advanced",
  relatedSlugs: ["world-models", "reasoning-models", "synthetic-data"],
  vizType: "interactive",
};

const BREAKTHROUGHS = [
  { year: "2020", name: "AlphaFold 2", field: "Sinh hoc", impact: "Du doan cau truc 200M+ protein", speedup: "Tu hang nam xuong phut", color: "#22c55e" },
  { year: "2023", name: "GNoME", field: "Vat lieu", impact: "Kham pha 2.2M vat lieu moi", speedup: "800 nam nghien cuu → 1 nam", color: "#3b82f6" },
  { year: "2024", name: "AlphaFold 3", field: "Thuoc", impact: "Du doan tuong tac protein-drug", speedup: "Giam 90% thoi gian drug design", color: "#f59e0b" },
  { year: "2024", name: "AlphaProof", field: "Toan", impact: "Huy chuong vang IMO 2024", speedup: "Giai bai toan mo hang thap ky", color: "#8b5cf6" },
];

const TOTAL_STEPS = 7;

export default function AIForScienceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "AlphaFold 2 giai quyet van de gi ma nha khoa hoc mat 50 nam?",
      options: [
        "Tao protein moi",
        "Du doan cau truc 3D cua protein tu chuoi amino acid — 'protein folding problem'",
        "Tim thuoc tri COVID",
      ],
      correct: 1,
      explanation: "Protein folding: tu chuoi amino acid (1D) → cau truc 3D. Truoc AlphaFold: X-ray crystallography mat hang thang/trieu USD cho 1 protein. AlphaFold: phut, mien phi. Da du doan 200M+ protein (gan nhu toan bo protein da biet).",
    },
    {
      question: "Tai sao AI for Science khac voi AI cho nganh khac?",
      options: [
        "Dung GPU dat hon",
        "Can hieu va ton trong quy luat vat ly (symmetry, conservation laws) — khong chi pattern matching",
        "Chi dung cho nghien cuu, khong cho ung dung",
      ],
      correct: 1,
      explanation: "AI cho science can 'physics-informed': hieu symmetry (phep doi xung), conservation laws (bao toan nang luong), equivariance (xoay phan tu khong doi tinh chat). GNN (Graph Neural Networks) va equivariant architectures duoc thiet ke dac biet cho dieu nay.",
    },
    {
      question: "AI co the thay the nha khoa hoc khong?",
      options: [
        "Co — AI da giai duoc IMO",
        "Khong hoan toan — AI accelerate nghien cuu (hypothesis generation, simulation) nhung can nha khoa hoc validate va interpret",
        "Khong — AI chi xu ly data",
      ],
      correct: 1,
      explanation: "AI la 'postdoc sieu nang': du doan nhanh, kham pha hypothesis, simulate experiments. Nhung can nha khoa hoc: dat cau hoi dung, thiet ke experiment, validate ket qua, interpret y nghia. AI + Human scientist = discovery nhanh hon 100x.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="De tim ra 1 loai thuoc moi, truyen thong mat 10-15 nam va 2.6 ty USD. AI co the giam bao nhieu?"
          options={[
            "Giam 10% — AI chi ho tro phan nho",
            "Giam 50-70% thoi gian va chi phi — AI accelerate moi giai doan tu target identification den clinical trials",
            "Giam 100% — AI tu thiet ke thuoc hoan chinh",
          ]}
          correct={1}
          explanation="AI giam tu 10-15 nam xuong 3-5 nam, tu 2.6 ty USD xuong 500M-1B. AlphaFold du doan target structure, ML screen trieu hop chat, AI optimize lead compounds. Nhung van can clinical trials (con nguoi) de validate. Giong buong mo phong: bay gia truoc, bay that sau."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Cac dot pha AI for Science
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            AlphaFold du doan cau truc <strong>200 trieu protein</strong>{" "}
            — nhieu hon tong so protein da duoc giai boi nha khoa hoc trong lich su! GNoME kham pha{" "}
            <strong>2.2 trieu vat lieu moi</strong>{" "}— tuong duong 800 nam nghien cuu truyen thong.
            AI khong thay the nha khoa hoc — no cho ho <strong>sieu nang luc</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Ban muon dung AI thiet ke vat lieu pin mat troi moi. Can mo hinh hieu: doi xung tinh the, lien ket hoa hoc, tinh chat dien tu. Kien truc ML nao phu hop?"
          options={[
            "CNN — nhan dien anh tinh the",
            "Equivariant GNN — hieu do thi phan tu, ton trong doi xung vat ly (xoay/tich phan tu → tinh chat khong doi)",
            "Transformer — xu ly chuoi SMILES",
          ]}
          correct={1}
          explanation="Equivariant GNN (vi du: MACE, NequIP) duoc thiet ke dac biet cho molecular systems. Equivariance: xoay phan tu → predictions xoay theo (khong thay doi tinh chat scalar). Bao toan doi xung vat ly → model chinh xac hon, generalize tot hon, can it data hon."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>AI for Science</strong>{" "}
            ung dung AI de day nhanh kham pha khoa hoc — tu du doan cau truc protein den thiet ke vat lieu va giai toan.
          </p>
          <p><strong>Physics-Informed ML:</strong></p>
          <LaTeX block>{"\\mathcal{L} = \\underbrace{\\mathcal{L}_{\\text{data}}}_{\\text{fit observations}} + \\underbrace{\\lambda \\cdot \\mathcal{L}_{\\text{physics}}}_{\\text{satisfy physical laws}}"}</LaTeX>

          <Callout variant="tip" title="Equivariance">
            Equivariant architecture: neu input bi xoay/dich chuyen, output cung xoay/dich chuyen tuong ung. Quan trong cho molecules (xoay phan tu khong doi tinh chat) va physics (doi xung bao toan). Khong equivariant → model can nhieu data hon de 'hoc' luat nay.
          </Callout>

          <p><strong>4 lĩnh vực chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Protein/Drug:</strong>{" "}AlphaFold (structure), RFDiffusion (design), molecular docking</li>
            <li><strong>Materials:</strong>{" "}GNoME (discovery), ML potentials (simulation nhanh 1000x)</li>
            <li><strong>Climate:</strong>{" "}GenCast (du bao thoi tiet chinh xac hon physics models)</li>
            <li><strong>Math:</strong>{" "}AlphaProof (theorem proving), AlphaGeometry (hinh hoc)</li>
          </ul>

          <CodeBlock language="python" title="Du doan cau truc protein voi AlphaFold">
{`# AlphaFold inference (simplified)
from alphafold.model import model
from alphafold.data import pipeline

# Input: chuoi amino acid
sequence = "MKFLILLFNILCLFPVLAADNHGVS..."  # Protein sequence

# Pipeline: MSA search + template search + feature extraction
features = pipeline.process(sequence)

# Du doan cau truc 3D
prediction = model.predict(features)
# Output: toa do 3D cua moi atom
# Confidence: pLDDT score (0-100)

print(f"Predicted structure: {prediction['atom_positions'].shape}")
print(f"Confidence: {prediction['plddt'].mean():.1f}/100")
# Tu chuoi amino acid → cau truc 3D trong vai phut
# Truoc day: X-ray crystallography mat hang thang + trieu USD`}
          </CodeBlock>

          <Callout variant="info" title="AI for Science tai Viet Nam">
            VinAI nghien cuu AI cho y te (X-ray analysis, drug repurposing). Dai hoc Bach Khoa HN ung dung ML cho materials science. Nhieu lab Viet dung AlphaFold mien phi cho nghien cuu protein. Co hoi lon cho Viet Nam: it can big data, can hieu biet domain.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "AI for Science: day nhanh kham pha 100-1000x — AlphaFold, GNoME, GenCast, AlphaProof.",
          "Physics-informed ML: ket hop data-driven voi quy luat vat ly (symmetry, conservation).",
          "Equivariant architectures (GNN) ton trong doi xung vat ly — chinh xac hon, can it data hon.",
          "AI la 'postdoc sieu nang': du doan nhanh, simulate, kham pha. Nhung can nha khoa hoc validate.",
          "Drug discovery: tu 15 nam/2.6B USD xuong 3-5 nam/500M. Materials: 800 nam → 1 nam.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
