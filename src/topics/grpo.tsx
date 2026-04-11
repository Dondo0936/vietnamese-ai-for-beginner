"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "grpo",
  title: "GRPO",
  titleVi: "GRPO - Tối ưu hóa chính sách theo nhóm",
  description:
    "Phương pháp alignment hiệu quả, sử dụng phần thưởng nhóm thay vì reward model riêng biệt.",
  category: "training-optimization",
  tags: ["grpo", "alignment", "reinforcement-learning", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "dpo", "fine-tuning"],
  vizType: "static",
};

export default function GRPOTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng ba cách <strong>chấm bài thi viết</strong>:
        </p>
        <p>
          <strong>PPO (RLHF):</strong> Thuê một giám khảo chuyên nghiệp (reward model)
          chấm từng bài. Chính xác nhưng phải trả lương giám khảo và chờ chấm bài.
        </p>
        <p>
          <strong>DPO:</strong> Cho học sinh xem cặp bài mẫu (tốt/xấu) và tự rút kinh
          nghiệm. Đơn giản nhưng cần nhiều cặp so sánh.
        </p>
        <p>
          <strong>GRPO:</strong> Cho mỗi học sinh viết <strong>nhiều phiên bản</strong>,
          rồi so sánh giữa các phiên bản của chính họ. Phiên bản nào tốt hơn trung bình
          nhóm thì được khuyến khích. <strong>Không cần giám khảo</strong>, chỉ cần so
          sánh trong nhóm!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 450" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              So sánh PPO vs DPO vs GRPO
            </text>

            {/* PPO */}
            <rect x="15" y="45" width="210" height="380" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="120" y="72" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              PPO (RLHF)
            </text>

            {[
              { text: "Mô hình sinh", y: 90, color: "#334155" },
              { text: "Reward Model chấm", y: 140, color: "#7f1d1d" },
              { text: "PPO cập nhật", y: 190, color: "#334155" },
              { text: "KL constraint", y: 240, color: "#334155" },
            ].map((item, i) => (
              <g key={i}>
                <rect x="30" y={item.y} width="180" height="35" rx="6" fill={item.color} />
                <text x="120" y={item.y + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {item.text}
                </text>
                {i < 3 && (
                  <text x="120" y={item.y + 48} textAnchor="middle" fill="#475569" fontSize="12">&darr;</text>
                )}
              </g>
            ))}

            <rect x="30" y="300" width="180" height="50" rx="6" fill="#334155" />
            <text x="120" y="318" textAnchor="middle" fill="#ef4444" fontSize="8">
              Cần Reward Model riêng
            </text>
            <text x="120" y="332" textAnchor="middle" fill="#ef4444" fontSize="8">
              RL không ổn định
            </text>
            <text x="120" y="346" textAnchor="middle" fill="#ef4444" fontSize="8">
              Tốn tài nguyên nhất
            </text>

            {/* DPO */}
            <rect x="245" y="45" width="210" height="380" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="350" y="72" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
              DPO
            </text>

            {[
              { text: "Dữ liệu sở thích", y: 90, color: "#334155" },
              { text: "(y_win, y_lose)", y: 130, color: "#334155" },
              { text: "Tối ưu trực tiếp", y: 180, color: "#334155" },
              { text: "Preference loss", y: 230, color: "#334155" },
            ].map((item, i) => (
              <g key={i}>
                <rect x="260" y={item.y} width="180" height="35" rx="6" fill={item.color} />
                <text x="350" y={item.y + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {item.text}
                </text>
                {i < 3 && (
                  <text x="350" y={item.y + 48} textAnchor="middle" fill="#475569" fontSize="12">&darr;</text>
                )}
              </g>
            ))}

            <rect x="260" y="300" width="180" height="50" rx="6" fill="#334155" />
            <text x="350" y="318" textAnchor="middle" fill="#f59e0b" fontSize="8">
              Không cần Reward Model
            </text>
            <text x="350" y="332" textAnchor="middle" fill="#f59e0b" fontSize="8">
              Cần dữ liệu cặp so sánh
            </text>
            <text x="350" y="346" textAnchor="middle" fill="#f59e0b" fontSize="8">
              Đơn giản, ổn định
            </text>

            {/* GRPO */}
            <rect x="475" y="45" width="210" height="380" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
            <text x="580" y="72" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              GRPO
            </text>

            {[
              { text: "Mô hình sinh N mẫu", y: 90, color: "#14532d" },
              { text: "Tính reward nhóm", y: 140, color: "#14532d" },
              { text: "Chuẩn hóa: r - mean(R)", y: 190, color: "#14532d" },
              { text: "Cập nhật chính sách", y: 240, color: "#14532d" },
            ].map((item, i) => (
              <g key={i}>
                <rect x="490" y={item.y} width="180" height="35" rx="6" fill={item.color} />
                <text x="580" y={item.y + 22} textAnchor="middle" fill="#86efac" fontSize="9">
                  {item.text}
                </text>
                {i < 3 && (
                  <text x="580" y={item.y + 48} textAnchor="middle" fill="#475569" fontSize="12">&darr;</text>
                )}
              </g>
            ))}

            <rect x="490" y="300" width="180" height="50" rx="6" fill="#14532d" />
            <text x="580" y="318" textAnchor="middle" fill="#22c55e" fontSize="8">
              Không cần Reward Model
            </text>
            <text x="580" y="332" textAnchor="middle" fill="#22c55e" fontSize="8">
              Không cần dữ liệu cặp
            </text>
            <text x="580" y="346" textAnchor="middle" fill="#22c55e" fontSize="8">
              Hiệu quả, linh hoạt nhất
            </text>
          </svg>

          {/* Key insight */}
          <div className="rounded-lg bg-background/50 border border-green-500/30 p-4">
            <p className="text-sm font-semibold text-green-400 mb-2">
              Ý tưởng cốt lõi của GRPO
            </p>
            <p className="text-xs text-muted">
              Với mỗi prompt, sinh ra một nhóm G câu trả lời. Tính reward cho từng câu,
              rồi chuẩn hóa bằng cách trừ trung bình nhóm: advantage = r_i - mean(R).
              Câu trả lời tốt hơn trung bình được tăng xác suất, câu kém hơn bị giảm.
              Không cần reward model hay critic riêng biệt!
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>GRPO (Group Relative Policy Optimization)</strong> là phương pháp
          alignment được DeepSeek giới thiệu, tối ưu hóa chính sách dựa trên so sánh
          tương đối trong nhóm phản hồi thay vì cần reward model riêng.
        </p>
        <p>Cách GRPO hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Sinh nhóm phản hồi:</strong> Với mỗi prompt, mô hình sinh ra G
            câu trả lời khác nhau (thường G = 8-64).
          </li>
          <li>
            <strong>Tính reward:</strong> Mỗi câu trả lời được cho điểm bằng hàm reward
            đơn giản (có thể là rule-based hoặc verifier).
          </li>
          <li>
            <strong>Chuẩn hóa nhóm:</strong> Advantage = (reward - trung bình nhóm) /
            độ lệch chuẩn nhóm. Biến phần thưởng tuyệt đối thành tương đối.
          </li>
          <li>
            <strong>Cập nhật:</strong> Tối đa hóa advantage với ràng buộc KL, tương
            tự PPO nhưng không cần critic/value function.
          </li>
        </ol>
        <p>
          GRPO đặc biệt hiệu quả cho các bài toán có <strong>verifiable reward</strong>{" "}
          (toán, code, logic) nơi ta có thể kiểm tra đáp án đúng/sai tự động. Đây là
          kỹ thuật đằng sau thành công của DeepSeek-R1.
        </p>
      </ExplanationSection>
    </>
  );
}
