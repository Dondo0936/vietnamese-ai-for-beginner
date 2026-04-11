"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "planning",
  title: "Planning",
  titleVi: "Lập kế hoạch — AI biết chia để trị",
  description:
    "Khả năng của AI Agent phân tách vấn đề phức tạp thành chuỗi bước nhỏ hơn và thực hiện có chiến lược.",
  category: "ai-agents",
  tags: ["planning", "decomposition", "agent"],
  difficulty: "intermediate",
  relatedSlugs: ["agent-architecture", "react-framework", "agentic-workflows"],
  vizType: "interactive",
};

interface Task {
  id: number;
  label: string;
  done: boolean;
  children?: Task[];
}

const INITIAL_PLAN: Task[] = [
  {
    id: 1,
    label: "Thu thập yêu cầu",
    done: false,
    children: [
      { id: 11, label: "Phân tích câu hỏi", done: false },
      { id: 12, label: "Xác định phạm vi", done: false },
    ],
  },
  {
    id: 2,
    label: "Tìm kiếm thông tin",
    done: false,
    children: [
      { id: 21, label: "Tra cứu cơ sở dữ liệu", done: false },
      { id: 22, label: "Tìm kiếm trên web", done: false },
    ],
  },
  { id: 3, label: "Tổng hợp kết quả", done: false },
  { id: 4, label: "Trả lời người dùng", done: false },
];

export default function PlanningTopic() {
  const [plan, setPlan] = useState<Task[]>(INITIAL_PLAN);

  const toggleTask = (id: number) => {
    setPlan((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, done: !t.done };
        if (t.children) {
          return {
            ...t,
            children: t.children.map((c) =>
              c.id === id ? { ...c, done: !c.done } : c
            ),
            done: t.children.every((c) => (c.id === id ? !c.done : c.done)),
          };
        }
        return t;
      })
    );
  };

  const resetPlan = () => setPlan(INITIAL_PLAN);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần <strong>tổ chức một bữa tiệc sinh nhật</strong>. Bạn không
          thể làm tất cả cùng lúc — thay vào đó, bạn chia thành các bước:
        </p>
        <p>
          1) Lập danh sách khách mời → 2) Đặt nhà hàng → 3) Mua bánh kem →
          4) Gửi lời mời → 5) Trang trí → 6) Tổ chức tiệc.
        </p>
        <p>
          Một số bước có thể làm <strong>song song</strong> (mua bánh và gửi lời mời),
          trong khi một số phải <strong>tuần tự</strong> (đặt nhà hàng trước khi trang trí).
          AI Agent lập kế hoạch theo cách tương tự!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">Nhấn vào từng bước để đánh dấu hoàn thành:</p>
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {plan.map((task, i) => {
              const y = 15 + i * 70;
              return (
                <g key={task.id}>
                  <g onClick={() => toggleTask(task.id)} className="cursor-pointer">
                    <rect
                      x={30}
                      y={y}
                      width={200}
                      height={36}
                      rx={8}
                      fill={task.done ? "#22c55e" : "#1e293b"}
                      stroke={task.done ? "#4ade80" : "#475569"}
                      strokeWidth={2}
                    />
                    <text x={130} y={y + 23} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                      {task.done ? "✓ " : ""}{task.label}
                    </text>
                  </g>
                  {task.children?.map((child, j) => (
                    <g key={child.id} onClick={() => toggleTask(child.id)} className="cursor-pointer">
                      <line x1={230} y1={y + 18} x2={310} y2={y + j * 35} stroke="#475569" strokeWidth={1.5} />
                      <rect
                        x={310}
                        y={y + j * 35 - 14}
                        width={180}
                        height={28}
                        rx={6}
                        fill={child.done ? "#22c55e" : "#1e293b"}
                        stroke={child.done ? "#4ade80" : "#475569"}
                        strokeWidth={1.5}
                      />
                      <text x={400} y={y + j * 35 + 4} textAnchor="middle" fill="white" fontSize={10}>
                        {child.done ? "✓ " : ""}{child.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          <div className="flex justify-center">
            <button
              onClick={resetPlan}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground"
            >
              Đặt lại kế hoạch
            </button>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Lập kế hoạch (Planning)</strong> là khả năng cốt lõi giúp AI Agent giải quyết
          các nhiệm vụ phức tạp bằng cách chia nhỏ thành các bước có thể thực hiện được.
        </p>
        <p>Có hai chiến lược lập kế hoạch chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lập kế hoạch trước (Plan-then-Execute):</strong> Agent tạo toàn bộ kế hoạch
            trước khi bắt đầu thực hiện. Phù hợp khi bài toán có cấu trúc rõ ràng.
          </li>
          <li>
            <strong>Lập kế hoạch động (Adaptive Planning):</strong> Agent lập kế hoạch từng bước,
            điều chỉnh dựa trên kết quả trung gian. Linh hoạt hơn nhưng có thể chậm hơn.
          </li>
        </ol>
        <p>
          Kỹ thuật phổ biến bao gồm <strong>phân rã nhiệm vụ</strong> (task decomposition),
          <strong> cây tìm kiếm</strong> (tree of thought), và <strong>phản ánh</strong> (reflection)
          — nơi Agent tự đánh giá và sửa kế hoạch khi cần.
        </p>
      </ExplanationSection>
    </>
  );
}
