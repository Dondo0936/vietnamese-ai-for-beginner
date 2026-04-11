"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "computer-use",
  title: "Computer Use",
  titleVi: "AI sử dụng máy tính",
  description:
    "Khả năng AI Agent điều khiển giao diện người dùng — click, gõ phím, chụp ảnh màn hình",
  category: "emerging",
  tags: ["browser-use", "gui-agent", "automation"],
  difficulty: "intermediate",
  relatedSlugs: ["agent-architecture", "vlm", "agentic-workflows"],
  vizType: "interactive",
};

const AGENT_STEPS = [
  {
    label: "Quan sát",
    desc: "AI chụp screenshot màn hình hiện tại",
    screen: "search",
    action: "Chụp screenshot & phân tích giao diện",
    color: "#3b82f6",
  },
  {
    label: "Nhận diện",
    desc: "AI xác định các phần tử UI: nút bấm, ô nhập liệu, menu",
    screen: "search",
    action: "Tìm thấy: ô tìm kiếm tại (250, 45), nút Search tại (450, 45)",
    color: "#8b5cf6",
  },
  {
    label: "Hành động",
    desc: "AI click vào ô tìm kiếm và gõ nội dung",
    screen: "typing",
    action: "Click (250, 45) → Type 'Thời tiết Hà Nội'",
    color: "#f59e0b",
  },
  {
    label: "Quan sát lại",
    desc: "AI chụp screenshot mới sau hành động",
    screen: "results",
    action: "Chụp screenshot mới → Phân tích kết quả",
    color: "#22c55e",
  },
  {
    label: "Hoàn thành",
    desc: "AI đọc kết quả và tổng hợp thông tin",
    screen: "results",
    action: "Đọc kết quả: 'Hà Nội: 32°C, có mưa rào chiều'",
    color: "#ec4899",
  },
];

export default function ComputerUseTopic() {
  const [step, setStep] = useState(0);

  const currentStep = AGENT_STEPS[step];

  const nextStep = () => {
    if (step < AGENT_STEPS.length - 1) setStep(step + 1);
  };

  const reset = () => setStep(0);

  const svgW = 600;
  const svgH = 350;

  // Simulated browser screen elements
  const renderScreen = (screenType: string) => {
    const screenX = 100;
    const screenY = 50;
    const screenW = 400;
    const screenH = 250;

    return (
      <g>
        {/* Browser frame */}
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          rx={8}
          fill="#0f172a"
          stroke="#475569"
          strokeWidth={2}
        />

        {/* Title bar */}
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={25}
          rx={8}
          fill="#1e293b"
        />
        <rect
          x={screenX}
          y={screenY + 17}
          width={screenW}
          height={8}
          fill="#1e293b"
        />
        {/* Traffic lights */}
        <circle cx={screenX + 15} cy={screenY + 12} r={4} fill="#ef4444" />
        <circle cx={screenX + 30} cy={screenY + 12} r={4} fill="#f59e0b" />
        <circle cx={screenX + 45} cy={screenY + 12} r={4} fill="#22c55e" />

        {/* URL bar */}
        <rect
          x={screenX + 60}
          y={screenY + 5}
          width={screenW - 80}
          height={15}
          rx={3}
          fill="#334155"
        />
        <text
          x={screenX + 70}
          y={screenY + 16}
          fill="#94a3b8"
          fontSize="7"
          fontFamily="monospace"
        >
          https://search.example.com
        </text>

        {/* Search bar */}
        <rect
          x={screenX + 80}
          y={screenY + 55}
          width={240}
          height={28}
          rx={14}
          fill="#1e293b"
          stroke={step >= 2 ? "#3b82f6" : "#475569"}
          strokeWidth={step >= 2 ? 2 : 1}
        />

        {/* Search text */}
        {screenType === "typing" || screenType === "results" ? (
          <text
            x={screenX + 95}
            y={screenY + 73}
            fill="#e2e8f0"
            fontSize="9"
          >
            Thời tiết Hà Nội
          </text>
        ) : (
          <text
            x={screenX + 95}
            y={screenY + 73}
            fill="#64748b"
            fontSize="9"
          >
            Tìm kiếm...
          </text>
        )}

        {/* Search button */}
        <rect
          x={screenX + 330}
          y={screenY + 57}
          width={50}
          height={24}
          rx={12}
          fill="#3b82f6"
        />
        <text
          x={screenX + 355}
          y={screenY + 73}
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
        >
          Tìm
        </text>

        {/* Search results (only in results state) */}
        {screenType === "results" && (
          <g>
            <rect
              x={screenX + 30}
              y={screenY + 100}
              width={340}
              height={55}
              rx={6}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth={1}
            />
            <text
              x={screenX + 45}
              y={screenY + 118}
              fill="#3b82f6"
              fontSize="9"
              fontWeight="bold"
            >
              Thời tiết Hà Nội hôm nay
            </text>
            <text
              x={screenX + 45}
              y={screenY + 133}
              fill="#e2e8f0"
              fontSize="8"
            >
              Nhiệt độ: 32°C | Độ ẩm: 75%
            </text>
            <text
              x={screenX + 45}
              y={screenY + 146}
              fill="#94a3b8"
              fontSize="8"
            >
              Có mưa rào vào buổi chiều
            </text>

            <rect
              x={screenX + 30}
              y={screenY + 165}
              width={340}
              height={45}
              rx={6}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth={1}
            />
            <text
              x={screenX + 45}
              y={screenY + 183}
              fill="#3b82f6"
              fontSize="9"
              fontWeight="bold"
            >
              Dự báo 7 ngày - Hà Nội
            </text>
            <text
              x={screenX + 45}
              y={screenY + 198}
              fill="#94a3b8"
              fontSize="8"
            >
              Chi tiết dự báo thời tiết theo giờ...
            </text>
          </g>
        )}

        {/* AI cursor indicator */}
        {step === 2 && (
          <g>
            {/* Cursor arrow pointing to search box */}
            <polygon
              points={`${screenX + 200},${screenY + 90} ${screenX + 200},${screenY + 105} ${screenX + 210},${screenY + 100}`}
              fill="#ef4444"
            />
            <text
              x={screenX + 215}
              y={screenY + 102}
              fill="#ef4444"
              fontSize="8"
              fontWeight="bold"
            >
              AI cursor
            </text>
          </g>
        )}

        {/* Bounding boxes for element detection */}
        {step === 1 && (
          <g>
            <rect
              x={screenX + 78}
              y={screenY + 53}
              width={244}
              height={32}
              rx={4}
              fill="none"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={screenX + 200}
              y={screenY + 50}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="7"
            >
              input_field (250, 45)
            </text>

            <rect
              x={screenX + 328}
              y={screenY + 55}
              width={54}
              height={28}
              rx={4}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={screenX + 355}
              y={screenY + 50}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="7"
            >
              button (450, 45)
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>dạy một robot sử dụng máy tính</strong>{" "}
          giống như cách con người dùng. Robot không kết nối qua API hay code — nó{" "}
          <strong>nhìn vào màn hình</strong> (chụp screenshot), <strong>nhận diện</strong>{" "}
          các nút bấm và ô nhập liệu, rồi <strong>click, gõ chữ, cuộn trang</strong>{" "}
          giống hệt người dùng.
        </p>
        <p>
          Thay vì gọi API thời tiết trực tiếp, AI mở trình duyệt, gõ &quot;thời tiết
          Hà Nội&quot; vào ô tìm kiếm, nhấn Enter, đọc kết quả trên màn hình, và trả
          lời cho bạn. Chậm hơn API nhưng <strong>hoạt động với mọi ứng dụng</strong>{" "}
          — không cần API hay tích hợp đặc biệt.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Nhấn &quot;Bước tiếp&quot; để xem AI Agent thao tác trên giao diện: quan sát
            &rarr; nhận diện &rarr; hành động &rarr; quan sát lại.
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
            {/* Screen */}
            {renderScreen(currentStep.screen)}

            {/* AI Agent label */}
            <rect x={10} y={80} width={75} height={40} rx={8} fill="#1e293b" stroke={currentStep.color} strokeWidth={2} />
            <text x={47} y={98} textAnchor="middle" fill={currentStep.color} fontSize="9" fontWeight="bold">
              AI Agent
            </text>
            <text x={47} y={112} textAnchor="middle" fill="#94a3b8" fontSize="7">
              (VLM)
            </text>

            {/* Arrow from AI to screen */}
            <line x1={85} y1={100} x2={100} y2={100} stroke={currentStep.color} strokeWidth={1.5} markerEnd="url(#cuArrow)" />
            <defs>
              <marker id="cuArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#60a5fa" />
              </marker>
            </defs>

            {/* Step indicator */}
            <rect x={10} y={svgH - 55} width={svgW - 20} height={45} rx={8} fill="#1e293b" stroke={currentStep.color} strokeWidth={1} />
            <text x={30} y={svgH - 30} fill={currentStep.color} fontSize="10" fontWeight="bold">
              Bước {step + 1}: {currentStep.label}
            </text>
            <text x={30} y={svgH - 17} fill="#94a3b8" fontSize="8">
              {currentStep.action}
            </text>

            {/* Step progress dots */}
            {AGENT_STEPS.map((_, i) => (
              <circle
                key={`dot-${i}`}
                cx={svgW - 80 + i * 14}
                cy={svgH - 33}
                r={4}
                fill={i <= step ? AGENT_STEPS[i].color : "#334155"}
                stroke={i === step ? "white" : "none"}
                strokeWidth={i === step ? 1.5 : 0}
              />
            ))}
          </svg>

          <div className="flex justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Đặt lại
            </button>
            <button
              onClick={nextStep}
              disabled={step >= AGENT_STEPS.length - 1}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Bước tiếp theo
            </button>
          </div>

          {/* Action space */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "Click", icon: "Click(x, y)", active: step === 2 },
              { name: "Type", icon: "Type('text')", active: step === 2 },
              { name: "Scroll", icon: "Scroll(dx, dy)", active: false },
              { name: "Screenshot", icon: "Screenshot()", active: step === 0 || step === 3 },
            ].map((action) => (
              <div
                key={action.name}
                className={`rounded-lg border p-2 text-center ${
                  action.active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-background/50"
                }`}
              >
                <p className="text-xs font-bold text-foreground">{action.name}</p>
                <p className="text-xs text-muted font-mono">{action.icon}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Computer Use</strong> (AI sử dụng máy tính) cho phép AI Agent
          tương tác với máy tính qua <strong>giao diện người dùng</strong> thay vì
          API — nhìn vào màn hình, click, gõ phím, cuộn trang giống người dùng.
        </p>

        <p>Cách hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Quan sát (Observe):</strong> AI chụp screenshot màn hình hiện tại
            và sử dụng mô hình thị giác (Vision Language Model) để hiểu nội dung.
          </li>
          <li>
            <strong>Nhận diện (Identify):</strong> Xác định các phần tử UI — nút bấm,
            ô nhập liệu, menu, link — và tọa độ của chúng trên màn hình.
          </li>
          <li>
            <strong>Hành động (Act):</strong> Thực hiện thao tác: click tại tọa độ
            (x, y), gõ văn bản, cuộn trang, kéo thả, nhấn tổ hợp phím.
          </li>
          <li>
            <strong>Quan sát lại (Re-observe):</strong> Chụp screenshot mới để xem
            kết quả hành động, rồi lặp lại vòng lặp.
          </li>
        </ol>

        <p>Thách thức:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Độ trễ (Latency):</strong> Mỗi hành động cần chụp screenshot,
            gửi lên model, đợi phân tích — chậm hơn nhiều so với API trực tiếp.
          </li>
          <li>
            <strong>Khôi phục lỗi:</strong> Nếu click sai vị trí hoặc trang load lỗi,
            AI cần nhận biết và tự sửa — đòi hỏi khả năng suy luận tốt.
          </li>
          <li>
            <strong>Bảo mật:</strong> AI truy cập giao diện giống người dùng, cần
            kiểm soát quyền truy cập cẩn thận.
          </li>
        </ul>

        <p>
          <strong>Ứng dụng:</strong> Tự động hóa web (điền form, đặt vé), test giao
          diện ứng dụng, hỗ trợ người dùng không thành thạo công nghệ, và tự động hóa
          quy trình nội bộ mà không cần xây API riêng.
        </p>
      </ExplanationSection>
    </>
  );
}
