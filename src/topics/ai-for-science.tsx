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

const TOTAL_STEPS = 7;

// ============================================================================
// DỮ LIỆU TĨNH: CÁC ĐỘT PHÁ & QUY TRÌNH PHÁT HIỆN THUỐC
// ----------------------------------------------------------------------------
// BREAKTHROUGHS: timeline rút gọn các cột mốc quan trọng của AI for Science.
// PIPELINE_STEPS: 5 bước của quy trình drug discovery — dùng cho ProgressSteps.
// ============================================================================

const BREAKTHROUGHS = [
  {
    year: "2020",
    name: "AlphaFold 2",
    field: "Sinh học",
    impact: "Dự đoán cấu trúc 200M+ protein",
    speedup: "Từ hàng năm xuống phút",
    color: "#22c55e",
  },
  {
    year: "2023",
    name: "GNoME",
    field: "Vật liệu",
    impact: "Khám phá 2.2M vật liệu mới",
    speedup: "800 năm nghiên cứu → 1 năm",
    color: "#3b82f6",
  },
  {
    year: "2024",
    name: "AlphaFold 3",
    field: "Thuốc",
    impact: "Dự đoán tương tác protein-drug-RNA",
    speedup: "Giảm 90% thời gian drug design",
    color: "#f59e0b",
  },
  {
    year: "2024",
    name: "AlphaProof",
    field: "Toán",
    impact: "Huy chương bạc IMO 2024",
    speedup: "Giải bài toán mở hàng thập kỷ",
    color: "#8b5cf6",
  },
  {
    year: "2024",
    name: "GenCast",
    field: "Khí hậu",
    impact: "Dự báo thời tiết 15 ngày chính xác hơn ECMWF",
    speedup: "Nhanh gấp 1000x so với model vật lý",
    color: "#06b6d4",
  },
] as const;

const PIPELINE_LABELS = [
  "Xác định target",
  "Sàng lọc hợp chất",
  "Tối ưu hoá lead",
  "Thử nghiệm tiền lâm sàng",
  "Thử nghiệm lâm sàng",
] as const;

// ============================================================================
// MOLECULE DATA
// ----------------------------------------------------------------------------
// Một phân tử ví dụ gồm các nguyên tử (node) và liên kết (edge). Toạ độ là 2D
// để dễ vẽ. Khi người học bấm "Run AI", ta tính một "binding affinity" giả
// lập dựa trên tỉ lệ heavy atoms và số liên kết — chỉ mang tính minh hoạ
// pedagogical. Trong thực tế phải dùng docking (AutoDock Vina) hoặc model học
// sâu (DiffDock, AlphaFold-Multimer).
// ============================================================================

type Atom = {
  id: string;
  element: "C" | "N" | "O" | "H" | "S" | "F";
  x: number;
  y: number;
};

type Bond = {
  from: string;
  to: string;
  order: 1 | 2 | 3;
};

type Molecule = {
  name: string;
  hint: string;
  atoms: Atom[];
  bonds: Bond[];
};

const ELEMENT_COLORS: Record<Atom["element"], string> = {
  C: "#475569",
  N: "#3b82f6",
  O: "#ef4444",
  H: "#cbd5e1",
  S: "#eab308",
  F: "#22c55e",
};

const CAFFEINE: Molecule = {
  name: "Caffeine",
  hint: "Ức chế adenosine receptor — giữ bạn tỉnh táo khi học.",
  atoms: [
    { id: "a1", element: "C", x: 100, y: 120 },
    { id: "a2", element: "N", x: 150, y: 90 },
    { id: "a3", element: "C", x: 200, y: 120 },
    { id: "a4", element: "C", x: 200, y: 170 },
    { id: "a5", element: "N", x: 150, y: 200 },
    { id: "a6", element: "C", x: 100, y: 170 },
    { id: "a7", element: "O", x: 50, y: 90 },
    { id: "a8", element: "O", x: 50, y: 200 },
    { id: "a9", element: "N", x: 250, y: 95 },
    { id: "a10", element: "C", x: 295, y: 130 },
    { id: "a11", element: "N", x: 250, y: 170 },
    { id: "a12", element: "C", x: 150, y: 40 },
    { id: "a13", element: "C", x: 150, y: 250 },
    { id: "a14", element: "C", x: 345, y: 130 },
  ],
  bonds: [
    { from: "a1", to: "a2", order: 1 },
    { from: "a2", to: "a3", order: 1 },
    { from: "a3", to: "a4", order: 2 },
    { from: "a4", to: "a5", order: 1 },
    { from: "a5", to: "a6", order: 1 },
    { from: "a6", to: "a1", order: 2 },
    { from: "a1", to: "a7", order: 2 },
    { from: "a6", to: "a8", order: 2 },
    { from: "a3", to: "a9", order: 1 },
    { from: "a9", to: "a10", order: 2 },
    { from: "a10", to: "a11", order: 1 },
    { from: "a11", to: "a4", order: 1 },
    { from: "a2", to: "a12", order: 1 },
    { from: "a5", to: "a13", order: 1 },
    { from: "a10", to: "a14", order: 1 },
  ],
};

const ASPIRIN: Molecule = {
  name: "Aspirin",
  hint: "Ức chế COX — giảm đau, hạ sốt.",
  atoms: [
    { id: "b1", element: "C", x: 100, y: 150 },
    { id: "b2", element: "C", x: 150, y: 120 },
    { id: "b3", element: "C", x: 200, y: 150 },
    { id: "b4", element: "C", x: 200, y: 205 },
    { id: "b5", element: "C", x: 150, y: 235 },
    { id: "b6", element: "C", x: 100, y: 205 },
    { id: "b7", element: "C", x: 50, y: 120 },
    { id: "b8", element: "O", x: 50, y: 70 },
    { id: "b9", element: "O", x: 0, y: 150 },
    { id: "b10", element: "O", x: 150, y: 65 },
    { id: "b11", element: "C", x: 200, y: 40 },
    { id: "b12", element: "C", x: 250, y: 70 },
    { id: "b13", element: "O", x: 250, y: 15 },
  ],
  bonds: [
    { from: "b1", to: "b2", order: 2 },
    { from: "b2", to: "b3", order: 1 },
    { from: "b3", to: "b4", order: 2 },
    { from: "b4", to: "b5", order: 1 },
    { from: "b5", to: "b6", order: 2 },
    { from: "b6", to: "b1", order: 1 },
    { from: "b1", to: "b7", order: 1 },
    { from: "b7", to: "b8", order: 2 },
    { from: "b7", to: "b9", order: 1 },
    { from: "b2", to: "b10", order: 1 },
    { from: "b10", to: "b11", order: 1 },
    { from: "b11", to: "b12", order: 1 },
    { from: "b12", to: "b13", order: 2 },
  ],
};

const IBUPROFEN: Molecule = {
  name: "Ibuprofen",
  hint: "NSAID phổ biến — giảm viêm.",
  atoms: [
    { id: "c1", element: "C", x: 80, y: 150 },
    { id: "c2", element: "C", x: 130, y: 120 },
    { id: "c3", element: "C", x: 180, y: 150 },
    { id: "c4", element: "C", x: 180, y: 205 },
    { id: "c5", element: "C", x: 130, y: 235 },
    { id: "c6", element: "C", x: 80, y: 205 },
    { id: "c7", element: "C", x: 30, y: 120 },
    { id: "c8", element: "C", x: 0, y: 90 },
    { id: "c9", element: "C", x: 230, y: 120 },
    { id: "c10", element: "C", x: 280, y: 150 },
    { id: "c11", element: "O", x: 330, y: 120 },
    { id: "c12", element: "O", x: 280, y: 205 },
    { id: "c13", element: "C", x: 230, y: 60 },
    { id: "c14", element: "C", x: 280, y: 30 },
  ],
  bonds: [
    { from: "c1", to: "c2", order: 2 },
    { from: "c2", to: "c3", order: 1 },
    { from: "c3", to: "c4", order: 2 },
    { from: "c4", to: "c5", order: 1 },
    { from: "c5", to: "c6", order: 2 },
    { from: "c6", to: "c1", order: 1 },
    { from: "c1", to: "c7", order: 1 },
    { from: "c7", to: "c8", order: 1 },
    { from: "c3", to: "c9", order: 1 },
    { from: "c9", to: "c10", order: 1 },
    { from: "c10", to: "c11", order: 1 },
    { from: "c10", to: "c12", order: 2 },
    { from: "c9", to: "c13", order: 1 },
    { from: "c13", to: "c14", order: 1 },
  ],
};

const MOLECULES: Molecule[] = [CAFFEINE, ASPIRIN, IBUPROFEN];

// ============================================================================
// "BINDING AFFINITY" GIẢ LẬP
// ----------------------------------------------------------------------------
// Trong thực tế, affinity = −log(Kd) và cần docking simulation. Ở đây ta chỉ
// dùng một công thức đơn giản dựa trên số lượng và loại nguyên tử / liên kết
// để người học thấy "AI đưa ra một điểm số" — giá trị cụ thể chỉ để demo.
// ============================================================================

function simulatedAffinity(mol: Molecule): {
  score: number;
  confidence: number;
  notes: string[];
} {
  const heavy = mol.atoms.filter((a) => a.element !== "H").length;
  const polar = mol.atoms.filter((a) =>
    ["N", "O", "F", "S"].includes(a.element),
  ).length;
  const doubleBonds = mol.bonds.filter((b) => b.order === 2).length;

  // Heuristic hoàn toàn để minh hoạ:
  //   - heavy atoms đóng góp kích thước
  //   - polar atoms tạo liên kết hydrogen với receptor
  //   - vòng thơm (đếm qua double bonds) tạo π-stacking
  const rawScore =
    0.35 * heavy + 0.9 * polar + 0.55 * doubleBonds - 0.2 * mol.atoms.length;
  const score = Math.max(1, Math.min(10, rawScore / 2));

  // Độ tin cậy cũng giả lập, tỉ lệ thuận với số polar atom
  const confidence = Math.max(
    0.5,
    Math.min(0.98, 0.6 + polar / 20 + doubleBonds / 40),
  );

  const notes: string[] = [];
  if (polar >= 3) notes.push("Nhiều nhóm phân cực → H-bond donor/acceptor.");
  if (doubleBonds >= 4)
    notes.push("Hệ thơm phong phú → π-stacking với residue aromatic.");
  if (heavy > 18) notes.push("Kích thước lớn → có thể giảm bioavailability.");
  if (notes.length === 0) notes.push("Cấu trúc đơn giản — cần thêm phân cực.");

  return { score, confidence, notes };
}

export default function AIForScienceTopic() {
  // --------------------------------------------------------------------------
  // STATE: lựa chọn phân tử, trạng thái "đang chạy AI", bước hiện tại của
  // pipeline drug discovery.
  // --------------------------------------------------------------------------
  const [moleculeIdx, setMoleculeIdx] = useState(0);
  const [runState, setRunState] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [pipelineStep, setPipelineStep] = useState(1);

  const molecule = MOLECULES[moleculeIdx];

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------
  const result = useMemo(() => simulatedAffinity(molecule), [molecule]);

  const handleRunAI = useCallback(() => {
    setRunState("running");
    // Giả lập latency của một inference model
    setTimeout(() => setRunState("done"), 900);
  }, []);

  const handleChangeMolecule = useCallback((idx: number) => {
    setMoleculeIdx(idx);
    setRunState("idle");
  }, []);

  const atomById = useMemo(() => {
    const map: Record<string, Atom> = {};
    for (const a of molecule.atoms) map[a.id] = a;
    return map;
  }, [molecule]);

  // --------------------------------------------------------------------------
  // QUIZ QUESTIONS (8 câu)
  // --------------------------------------------------------------------------
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "AlphaFold 2 giải quyết vấn đề gì mà nhà khoa học mất 50 năm?",
        options: [
          "Tạo protein mới",
          "Dự đoán cấu trúc 3D của protein từ chuỗi amino acid — 'protein folding problem'",
          "Tìm thuốc trị COVID",
        ],
        correct: 1,
        explanation:
          "Protein folding: từ chuỗi amino acid (1D) → cấu trúc 3D. Trước AlphaFold: X-ray crystallography mất hàng tháng/triệu USD cho 1 protein. AlphaFold: phút, miễn phí. Đã dự đoán 200M+ protein (gần như toàn bộ protein đã biết).",
      },
      {
        question: "Tại sao AI for Science khác với AI cho ngành khác?",
        options: [
          "Dùng GPU đắt hơn",
          "Cần hiểu và tôn trọng quy luật vật lý (symmetry, conservation laws) — không chỉ pattern matching",
          "Chỉ dùng cho nghiên cứu, không cho ứng dụng",
        ],
        correct: 1,
        explanation:
          "AI cho science cần 'physics-informed': hiểu symmetry (phép đối xứng), conservation laws (bảo toàn năng lượng), equivariance (xoay phân tử không đổi tính chất). GNN (Graph Neural Networks) và equivariant architectures được thiết kế đặc biệt cho điều này.",
      },
      {
        question: "AI có thể thay thế nhà khoa học không?",
        options: [
          "Có — AI đã giải được IMO",
          "Không hoàn toàn — AI accelerate nghiên cứu (hypothesis generation, simulation) nhưng cần nhà khoa học validate và interpret",
          "Không — AI chỉ xử lý data",
        ],
        correct: 1,
        explanation:
          "AI là 'postdoc siêu năng': dự đoán nhanh, khám phá hypothesis, simulate experiments. Nhưng cần nhà khoa học: đặt câu hỏi đúng, thiết kế experiment, validate kết quả, interpret ý nghĩa. AI + Human scientist = discovery nhanh hơn 100x.",
      },
      {
        question:
          "Một Graph Neural Network (GNN) biểu diễn phân tử bằng cách nào?",
        options: [
          "Chuỗi SMILES như một chuỗi ký tự",
          "Graph với atoms là node, bonds là edge — message passing giữa các neighbor để học biểu diễn",
          "Hình ảnh 2D của phân tử",
        ],
        correct: 1,
        explanation:
          "GNN: mỗi atom có một embedding, mỗi bond truyền thông điệp giữa atom liền kề. Sau nhiều vòng message passing, node embedding tổng hợp thông tin local. Kiến trúc này tự nhiên cho molecules — không cần linearize.",
      },
      {
        question:
          "AlphaFold 3 khác AlphaFold 2 ở điểm nổi bật nào?",
        options: [
          "Chạy nhanh gấp 10 lần",
          "Hỗ trợ đa phân tử: protein-protein, protein-DNA/RNA, protein-ligand — quan trọng cho drug design",
          "Dùng ít GPU hơn",
        ],
        correct: 1,
        explanation:
          "AlphaFold 3 (2024) mở rộng sang tương tác multi-modal: protein với RNA, DNA, small molecule, ion... Đặc biệt quan trọng với thiết kế thuốc vì thuốc = small molecule gắn vào protein target.",
      },
      {
        question:
          "Vì sao equivariant architectures (MACE, NequIP) cần ít data hơn?",
        options: [
          "Vì model nhỏ hơn",
          "Vì các đối xứng vật lý (xoay, tịnh tiến) được cài sẵn — model không cần học lại từ data",
          "Vì chúng chỉ dùng CPU",
        ],
        correct: 1,
        explanation:
          "Nếu bạn train model không equivariant, nó phải học 'xoay phân tử không đổi tính chất' từ data augmentation. Equivariant model cài đối xứng này vào kiến trúc → tiết kiệm parameters, cần ít data, generalize tốt hơn trên OOD.",
      },
      {
        question:
          "Tại sao 'in silico' screening không thay thế được lab screening?",
        options: [
          "AI chưa đủ thông minh",
          "Model có thể lệch với thực tế (domain shift, ADMET, tác dụng phụ) — cần lab xác nhận",
          "Luật chưa cho phép",
        ],
        correct: 1,
        explanation:
          "In silico (AI) loại bỏ sớm 99% ứng cử viên tồi → rẻ, nhanh. Nhưng 1% còn lại vẫn cần in vitro (tế bào) và in vivo (sinh vật) để kiểm tra toxicity, pharmacokinetics, tác dụng phụ thật. AI là bộ lọc đầu, không phải thẩm phán cuối.",
      },
      {
        question:
          "Giá trị thực tế của GNoME là gì?",
        options: [
          "Khám phá 2.2M candidate vật liệu — 380k trong số đó dự đoán bền ở điều kiện thường, mở đường cho pin, superconductor, catalyst mới",
          "Thay thế toàn bộ nhà khoa học vật liệu",
          "Giải quyết biến đổi khí hậu",
        ],
        correct: 0,
        explanation:
          "GNoME (DeepMind, 2023) dùng GNN + active learning để khám phá gần 2.2M cấu trúc tinh thể mới; 380k được dự đoán ổn định. Các nhóm thực nghiệm đã tổng hợp thành công hàng trăm mẫu → confirm khả năng tìm vật liệu mới nhanh 100-1000x.",
      },
    ],
    [],
  );

  // --------------------------------------------------------------------------
  // SVG helpers
  // --------------------------------------------------------------------------
  const molSvgW = 420;
  const molSvgH = 280;

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
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Khám phá"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Bạn đang đứng trong một "phòng thí nghiệm ảo". Chọn một phân
              tử ở danh sách bên dưới, quan sát đồ thị nguyên tử–liên kết,
              rồi bấm <strong className="text-foreground">Run AI</strong> để
              mô hình dự đoán điểm{" "}
              <em>binding affinity</em> với một protein mục tiêu giả lập. Sau
              đó, lướt qua timeline các đột phá và quy trình drug discovery
              để hiểu vị trí của bước này trong bức tranh tổng.
            </p>

            <VisualizationSection>
              <div className="space-y-6">
                {/* ------- MOLECULE SELECTOR ------- */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted mr-2">
                    Chọn phân tử:
                  </span>
                  {MOLECULES.map((m, i) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleChangeMolecule(i)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        i === moleculeIdx
                          ? "border-accent bg-accent/15 text-foreground"
                          : "border-border text-muted hover:bg-surface"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                {/* ------- MOLECULE + AI OUTPUT ------- */}
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 rounded-xl border border-border bg-card/40 p-3">
                    <svg
                      viewBox={`0 0 ${molSvgW} ${molSvgH}`}
                      className="w-full"
                    >
                      <text
                        x={molSvgW / 2}
                        y={16}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={11}
                        fontWeight="bold"
                      >
                        {molecule.name} — {molecule.hint}
                      </text>

                      {/* Bonds */}
                      {molecule.bonds.map((b, i) => {
                        const a = atomById[b.from];
                        const c = atomById[b.to];
                        if (!a || !c) return null;
                        const dx = c.x - a.x;
                        const dy = c.y - a.y;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const nx = -dy / len;
                        const ny = dx / len;
                        return (
                          <g key={`bond-${i}`}>
                            <line
                              x1={a.x}
                              y1={a.y}
                              x2={c.x}
                              y2={c.y}
                              stroke="#64748b"
                              strokeWidth={1.5}
                            />
                            {b.order === 2 && (
                              <line
                                x1={a.x + nx * 4}
                                y1={a.y + ny * 4}
                                x2={c.x + nx * 4}
                                y2={c.y + ny * 4}
                                stroke="#64748b"
                                strokeWidth={1.5}
                              />
                            )}
                            {b.order === 3 && (
                              <>
                                <line
                                  x1={a.x + nx * 4}
                                  y1={a.y + ny * 4}
                                  x2={c.x + nx * 4}
                                  y2={c.y + ny * 4}
                                  stroke="#64748b"
                                  strokeWidth={1.5}
                                />
                                <line
                                  x1={a.x - nx * 4}
                                  y1={a.y - ny * 4}
                                  x2={c.x - nx * 4}
                                  y2={c.y - ny * 4}
                                  stroke="#64748b"
                                  strokeWidth={1.5}
                                />
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Atoms */}
                      {molecule.atoms.map((a) => (
                        <motion.g
                          key={a.id}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <circle
                            cx={a.x}
                            cy={a.y}
                            r={11}
                            fill={ELEMENT_COLORS[a.element]}
                            stroke="#0f172a"
                            strokeWidth={1.5}
                          />
                          <text
                            x={a.x}
                            y={a.y + 3.5}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fill="white"
                          >
                            {a.element}
                          </text>
                        </motion.g>
                      ))}

                      {/* Overlay "AI active" */}
                      {runState === "running" && (
                        <g>
                          <rect
                            x={0}
                            y={0}
                            width={molSvgW}
                            height={molSvgH}
                            fill="#0f172a"
                            opacity={0.45}
                          />
                          <motion.circle
                            cx={molSvgW / 2}
                            cy={molSvgH / 2}
                            r={18}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={3}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: [0.5, 1.3, 0.5] }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                            }}
                          />
                          <text
                            x={molSvgW / 2}
                            y={molSvgH / 2 + 40}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize={11}
                          >
                            Đang chạy model GNN...
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="rounded-xl border border-border bg-card/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted">
                        Binding affinity dự đoán
                      </div>
                      <div className="mt-1 font-mono text-2xl text-accent">
                        {runState === "done"
                          ? result.score.toFixed(2)
                          : "—"}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Thang 1-10 (10 = gắn rất chặt).
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted">
                        Confidence
                      </div>
                      <div className="mt-1 font-mono text-base text-foreground">
                        {runState === "done"
                          ? `${(result.confidence * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Mô phỏng — thực tế dùng pLDDT / ipTM tương tự
                        AlphaFold.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAI}
                      disabled={runState === "running"}
                      className="rounded-lg border border-accent bg-accent/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {runState === "running"
                        ? "Đang chạy..."
                        : runState === "done"
                          ? "Chạy lại"
                          : "Run AI"}
                    </button>

                    {runState === "done" && (
                      <div className="rounded-xl border border-border bg-card/40 p-3 text-xs text-muted">
                        <div className="font-medium text-foreground mb-1">
                          Model notes:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* ------- ALPHA FOLD TIMELINE ------- */}
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <svg viewBox="0 0 600 220" className="w-full">
                    <text
                      x={300}
                      y={16}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      Các đột phá AI for Science
                    </text>
                    {BREAKTHROUGHS.map((b, i) => {
                      const y = 30 + i * 36;
                      return (
                        <g key={i}>
                          <rect
                            x={20}
                            y={y}
                            width={560}
                            height={32}
                            rx={6}
                            fill="#1e293b"
                            stroke={b.color}
                            strokeWidth={1.5}
                          />
                          <text
                            x={40}
                            y={y + 14}
                            fill={b.color}
                            fontSize={9}
                            fontWeight="bold"
                          >
                            {b.year}
                          </text>
                          <text
                            x={100}
                            y={y + 14}
                            fill="#e2e8f0"
                            fontSize={9}
                            fontWeight="bold"
                          >
                            {b.name}
                          </text>
                          <text
                            x={210}
                            y={y + 14}
                            fill="#94a3b8"
                            fontSize={8}
                          >
                            {b.field}
                          </text>
                          <text
                            x={280}
                            y={y + 14}
                            fill="#94a3b8"
                            fontSize={8}
                          >
                            {b.impact}
                          </text>
                          <text
                            x={40}
                            y={y + 26}
                            fill="#64748b"
                            fontSize={7}
                          >
                            {b.speedup}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* ------- DRUG DISCOVERY PIPELINE ------- */}
                <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Pipeline phát hiện thuốc
                    </h4>
                    <ProgressSteps
                      current={pipelineStep}
                      total={PIPELINE_LABELS.length}
                      labels={[...PIPELINE_LABELS]}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PIPELINE_LABELS.map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPipelineStep(i + 1)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          i + 1 === pipelineStep
                            ? "border-accent bg-accent/15 text-foreground"
                            : "border-border text-muted hover:bg-surface"
                        }`}
                      >
                        {i + 1}. {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted leading-relaxed">
                    {pipelineStep === 1 &&
                      "Xác định target: protein gây bệnh. AI (AlphaFold) dự đoán cấu trúc 3D của target → biết 'ổ khoá' cần mở."}
                    {pipelineStep === 2 &&
                      "Sàng lọc: quét hàng triệu small-molecule trong library. AI docking (DiffDock) loại bỏ 99% hợp chất không khớp — từ 10⁶ còn 10⁴ candidate."}
                    {pipelineStep === 3 &&
                      "Tối ưu hoá lead: generative AI (RFDiffusion, MolGPT) đề xuất biến thể có affinity cao hơn, độc tính thấp hơn, hoà tan tốt hơn."}
                    {pipelineStep === 4 &&
                      "Tiền lâm sàng: thử trên tế bào, động vật. AI tích hợp ADMET prediction → chọn hợp chất ít side-effect."}
                    {pipelineStep === 5 &&
                      "Lâm sàng: thử trên người (pha 1→3). AI hỗ trợ phân tầng bệnh nhân, dự đoán response, tăng tỷ lệ thành công."}
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AlphaFold dự đoán cấu trúc{" "}
                <strong>200 triệu protein</strong> — nhiều hơn tổng số
                protein đã được giải bởi nhà khoa học trong cả lịch sử loài
                người! GNoME khám phá{" "}
                <strong>2.2 triệu vật liệu mới</strong>, tương đương 800 năm
                nghiên cứu truyền thống. Điều thay đổi không phải là "AI
                giỏi hơn nhà khoa học", mà là{" "}
                <em>
                  nhà khoa học vừa có thêm một kính hiển vi phóng đại khả
                  năng dự đoán lên 1000x
                </em>
                . Việc họ làm tuần sau chính là việc họ hình dung cho 10 năm
                tới.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <div className="space-y-4">
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

              <InlineChallenge
                question="Bạn chạy AlphaFold cho một protein 'orphan' chưa ai giải cấu trúc, và nhận pLDDT trung bình 45/100. Nên làm gì?"
                options={[
                  "Tin hoàn toàn output — AlphaFold rất chính xác",
                  "Coi là giả thuyết sơ bộ — pLDDT thấp nghĩa là vùng linh động/disordered, cần thêm thí nghiệm (SAXS, NMR) để xác nhận",
                  "Bỏ đi và dùng mô hình khác",
                ]}
                correct={1}
                explanation="pLDDT (predicted local distance difference test) là confidence nội bộ của AlphaFold: >90 tốt, 70-90 khá, 50-70 cần cẩn trọng, <50 có thể là vùng disorder. Với protein ít homolog, AlphaFold dựa ít vào MSA → confidence thấp. Kết hợp thực nghiệm giúp xác nhận."
              />
            </div>
          </LessonSection>

          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Lý thuyết"
          >
            <ExplanationSection>
              <p>
                <strong>AI for Science</strong> ứng dụng AI để đẩy nhanh
                khám phá khoa học — từ dự đoán cấu trúc protein đến thiết kế
                vật liệu và giải toán. Ở những bài toán cần suy luận sâu
                (AlphaProof, AlphaGeometry), AI for Science tận dụng mạnh
                các{" "}
                <TopicLink slug="reasoning-models">reasoning models</TopicLink>
                {" "}để đưa ra chuỗi chứng minh dài. Ở những bài toán cần
                sinh dữ liệu huấn luyện cho hoá học/sinh học vốn ít nhãn, nó
                kết hợp với{" "}
                <TopicLink slug="synthetic-data">synthetic data</TopicLink>.
              </p>

              <p>
                <strong>Physics-Informed ML:</strong> bên cạnh data
                observations, hàm mất mát còn ràng buộc luật vật lý —
                bảo toàn năng lượng, đối xứng, tính liên tục...
              </p>
              <LaTeX block>
                {
                  "\\mathcal{L} = \\underbrace{\\mathcal{L}_{\\text{data}}}_{\\text{fit observations}} + \\underbrace{\\lambda \\cdot \\mathcal{L}_{\\text{physics}}}_{\\text{satisfy physical laws}}"
                }
              </LaTeX>
              <p>
                Với equivariance, phép biến đổi trên input có đối ứng trên
                output:
              </p>
              <LaTeX block>
                {
                  "f(g \\cdot x) = g \\cdot f(x) \\quad \\forall g \\in G"
                }
              </LaTeX>
              <p>
                Trong đó G là nhóm đối xứng (xoay SO(3), tịnh tiến, hoán vị
                atom). Cài G vào kiến trúc → model tự động biết rằng xoay
                phân tử không đổi năng lượng.
              </p>

              <Callout variant="tip" title="Equivariance là gì?">
                Equivariant architecture: nếu input bị xoay/dịch chuyển,
                output cũng xoay/dịch chuyển tương ứng. Quan trọng cho
                molecules (xoay phân tử không đổi tính chất) và physics
                (đối xứng bảo toàn). Không equivariant → model cần nhiều
                data hơn để "học" luật này một cách ngầm định.
              </Callout>

              <p className="mt-3">
                <strong>Bốn lĩnh vực chủ chốt hiện nay:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Protein/Drug:</strong> AlphaFold (structure),
                  RFDiffusion (design), DiffDock (molecular docking),
                  AlphaFold 3 (multi-modal interactions).
                </li>
                <li>
                  <strong>Materials:</strong> GNoME (discovery), MACE/NequIP
                  (ML potentials — simulation nhanh 1000x so với DFT).
                </li>
                <li>
                  <strong>Climate:</strong> GenCast, GraphCast (dự báo thời
                  tiết/khí hậu chính xác hơn mô hình vật lý truyền thống).
                </li>
                <li>
                  <strong>Math:</strong> AlphaProof (theorem proving),
                  AlphaGeometry 2 (hình học Olympic).
                </li>
              </ul>

              <Callout
                variant="info"
                title="So sánh AI vs simulation vật lý truyền thống"
              >
                DFT (Density Functional Theory) mất hàng giờ cho 1 phân tử
                nhỏ. ML potentials như MACE đạt độ chính xác tương đương
                nhưng nhanh gấp 10³–10⁶ lần → mô phỏng được system lớn,
                thời gian dài (dynamics), mở ra vật liệu mới.
              </Callout>

              <Callout
                variant="warning"
                title="Cảnh báo: out-of-distribution"
              >
                Model học từ các protein/phân tử đã biết; khi gặp cấu trúc
                kỳ lạ (protein màng, intrinsically disordered, hợp chất
                siêu lớn), dự đoán có thể lệch. Luôn xem confidence
                (pLDDT/ipTM) và validate bằng thực nghiệm trước khi công bố.
              </Callout>

              <Callout
                variant="insight"
                title="AI + nhà khoa học, không thay thế"
              >
                AI là <em>postdoc siêu năng</em>: dự đoán nhanh, thử hàng
                triệu hypothesis, simulate. Nhưng đặt câu hỏi đúng, thiết
                kế thí nghiệm, diễn giải kết quả vẫn cần con người có kiến
                thức domain. Các lab dẫn đầu hiện nay đều là
                <em> tổ hợp</em> chứ không phải "AI thuần".
              </Callout>

              <CodeBlock
                language="python"
                title="Dự đoán cấu trúc protein với AlphaFold (sơ lược)"
              >
{`# AlphaFold inference (đã đơn giản hoá)
from alphafold.model import model
from alphafold.data import pipeline

# Input: chuỗi amino acid một ký tự (fasta)
sequence = "MKFLILLFNILCLFPVLAADNHGVS..."  # Protein sequence

# Pipeline: MSA search + template search + feature extraction
features = pipeline.process(sequence)

# Dự đoán cấu trúc 3D
prediction = model.predict(features)
# Output: toạ độ 3D của mỗi atom (N, Ca, C, O, side-chain)
# Confidence: pLDDT per-residue (0-100), ipTM cho đa chuỗi

print(f"Predicted structure: {prediction['atom_positions'].shape}")
print(f"Confidence: {prediction['plddt'].mean():.1f}/100")

# Lưu ra PDB để xem bằng PyMOL / ChimeraX
from alphafold.common import protein as protein_module
pdb_str = protein_module.to_pdb(prediction)
with open("output.pdb", "w") as f:
    f.write(pdb_str)

# Thực tế: dùng ColabFold (open-source) — pipeline nhẹ hơn,
# chạy được trên Colab miễn phí, phù hợp lab nhỏ.`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="GNN cho binding affinity — khung mẫu với PyTorch Geometric"
              >
{`import torch
import torch.nn.functional as F
from torch_geometric.nn import GINConv, global_mean_pool
from torch_geometric.loader import DataLoader

class MolGNN(torch.nn.Module):
    """Graph Neural Network ước lượng binding affinity của một phân tử
    với một protein mục tiêu (target đã fix)."""

    def __init__(self, atom_feat_dim=10, hidden=128, num_layers=3):
        super().__init__()
        self.embed = torch.nn.Linear(atom_feat_dim, hidden)
        self.convs = torch.nn.ModuleList([
            GINConv(torch.nn.Sequential(
                torch.nn.Linear(hidden, hidden),
                torch.nn.ReLU(),
                torch.nn.Linear(hidden, hidden),
            )) for _ in range(num_layers)
        ])
        self.head = torch.nn.Sequential(
            torch.nn.Linear(hidden, hidden),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(hidden, 1),
        )

    def forward(self, data):
        x = self.embed(data.x)
        for conv in self.convs:
            x = F.relu(conv(x, data.edge_index))
        # Pooling sang representation toàn phân tử
        g = global_mean_pool(x, data.batch)
        return self.head(g).squeeze(-1)


def train(model, loader, optim):
    model.train()
    for batch in loader:
        optim.zero_grad()
        pred = model(batch)
        loss = F.mse_loss(pred, batch.y)
        loss.backward()
        optim.step()


# Pipeline khái quát:
# 1. Convert SMILES → graph (RDKit) với atom features + edge index
# 2. Tạo Dataset, DataLoader
# 3. Train MolGNN với MSE trên −log(Kd)
# 4. Đánh giá trên tập ngoài — luôn giữ scaffold split, tránh leakage
#    do phân tử cùng "khung" rơi vào cả train và test.`}
              </CodeBlock>

              <Callout
                variant="info"
                title="AI for Science tại Việt Nam"
              >
                VinAI nghiên cứu AI cho y tế (X-ray, drug repurposing). Đại
                học Bách Khoa HN và VNU ứng dụng ML cho materials science.
                Nhiều lab Việt dùng AlphaFold/ColabFold miễn phí cho nghiên
                cứu protein. Cơ hội lớn: ít cần big data, cần hiểu biết
                domain và cộng tác liên ngành.
              </Callout>

              <CollapsibleDetail title="Cấu trúc dữ liệu và message passing trong GNN">
                <p className="text-sm">
                  Một phân tử được biểu diễn như đồ thị G = (V, E), với V
                  là tập nguyên tử và E là tập liên kết. Mỗi node v có vec
                  trạng thái h_v^(0). Qua mỗi lớp GNN:
                </p>
                <LaTeX block>
                  {
                    "h_v^{(l+1)} = \\text{UPDATE}\\left(h_v^{(l)}, \\bigoplus_{u \\in N(v)} \\text{MSG}(h_u^{(l)}, h_v^{(l)}, e_{uv})\\right)"
                  }
                </LaTeX>
                <p className="text-sm">
                  Sau L lớp, mỗi node "thấy" được hàng xóm trong bán kính L
                  bước. Readout (global pooling) tổng hợp các node thành
                  đại diện toàn phân tử. Các biến thể phổ biến: GCN, GAT,
                  GIN, Message Passing Neural Network (MPNN), SchNet (liên
                  tục radial), DimeNet (bond angles), và equivariant variants
                  như EGNN, MACE.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Vì sao AlphaFold thắng được 'grand challenge' 50 năm?">
                <p className="text-sm">
                  Protein folding từng được Levinthal paradox mô tả: không
                  gian cấu hình khổng lồ, tìm ngẫu nhiên sẽ mất thời gian
                  nhiều hơn tuổi của vũ trụ. Thiên nhiên làm được trong
                  micro-giây nhờ energy landscape có hình phễu.
                </p>
                <p className="text-sm mt-2">
                  AlphaFold 2 hội tụ 3 yếu tố:
                </p>
                <ul className="list-disc list-inside text-sm pl-2 space-y-1 mt-1">
                  <li>
                    <strong>MSA (Multiple Sequence Alignment):</strong>{" "}
                    đồng tiến hoá cung cấp tín hiệu về cặp residue nào
                    tiếp xúc nhau.
                  </li>
                  <li>
                    <strong>Evoformer:</strong> attention 2D trên cặp
                    residue, cập nhật đồng thời MSA và pair representation.
                  </li>
                  <li>
                    <strong>Structure module:</strong> sinh toạ độ 3D trực
                    tiếp, áp dụng loss hình học chứ không chỉ distance
                    map. Equivariant frame giữ cho model có đầu ra xoay
                    đúng khi input xoay.
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  Kết quả là GDT_TS trung bình ~92 trên CASP14 — tương đương
                  với phương pháp thực nghiệm tốt nhất, trong vài phút thay
                  vì nhiều tháng.
                </p>
              </CollapsibleDetail>

              <p className="mt-4">
                <strong>Bảng so sánh nhanh các công cụ:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted">
                        Công cụ
                      </th>
                      <th className="text-left py-2 pr-4 text-muted">
                        Lĩnh vực
                      </th>
                      <th className="text-left py-2 text-muted">
                        Ghi chú sử dụng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">AlphaFold 2/3</td>
                      <td className="py-2 pr-4">Protein structure</td>
                      <td className="py-2">
                        Mã nguồn mở (AF2), AF3 có qua web server
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">ColabFold</td>
                      <td className="py-2 pr-4">Protein (nhẹ)</td>
                      <td className="py-2">
                        Chạy trên Colab free — phù hợp lab nhỏ
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">RFDiffusion</td>
                      <td className="py-2 pr-4">Protein design</td>
                      <td className="py-2">
                        Generative — sinh cấu trúc từ constraint
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">DiffDock</td>
                      <td className="py-2 pr-4">Docking</td>
                      <td className="py-2">
                        Diffusion-based molecular docking
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2 pr-4">MACE / NequIP</td>
                      <td className="py-2 pr-4">ML potentials</td>
                      <td className="py-2">
                        Equivariant, dùng cho MD simulation
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">GenCast</td>
                      <td className="py-2 pr-4">Dự báo thời tiết</td>
                      <td className="py-2">
                        Diffusion ensemble — 15 ngày, chính xác hơn ECMWF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ExplanationSection>
          </LessonSection>

          <LessonSection
            step={6}
            totalSteps={TOTAL_STEPS}
            label="Tóm tắt"
          >
            <MiniSummary
              title="Ghi nhớ nhanh"
              points={[
                "AI for Science đẩy nhanh khám phá 100-1000x — AlphaFold, GNoME, GenCast, AlphaProof là các mốc tiêu biểu.",
                "Physics-informed ML: kết hợp data-driven với quy luật vật lý (symmetry, conservation, equivariance).",
                "Equivariant architectures (GNN, MACE, NequIP) tôn trọng đối xứng vật lý — chính xác hơn, cần ít data hơn.",
                "AI là 'postdoc siêu năng': dự đoán nhanh, simulate, đề xuất hypothesis. Nhưng nhà khoa học vẫn cần validate.",
                "Drug discovery: từ 15 năm/2.6B USD xuống 3-5 năm/500M. Materials: 800 năm → 1 năm.",
                "Luôn xem confidence (pLDDT, ipTM) và kiểm tra OOD — không coi output AI là sự thật cuối cùng.",
              ]}
            />
          </LessonSection>

          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Kiểm tra"
          >
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
