"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "in-context-learning",
  title: "In-Context Learning",
  titleVi: "Học trong ngữ cảnh",
  description:
    "Khả năng LLM học và thực hiện tác vụ mới chỉ từ vài ví dụ trong prompt, không cần huấn luyện lại.",
  category: "llm-concepts",
  tags: ["icl", "few-shot", "zero-shot", "prompt"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "chain-of-thought", "fine-tuning-vs-prompting"],
  vizType: "static",
};

export default function InContextLearningTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đến một nước ngoài và cần học{" "}
          <strong>cách chào hỏi</strong>. Bạn không cần đi học cả khóa ngôn ngữ!
        </p>
        <p>
          Bạn chỉ cần quan sát vài người: người A cúi đầu và nói &quot;Konnichiwa&quot;,
          người B cúi đầu nói &quot;Ohayou&quot;. Từ <strong>vài ví dụ</strong> đó, bạn
          tự suy ra quy tắc: cúi đầu khi chào!
        </p>
        <p>
          LLM cũng vậy &mdash; chỉ cần xem <strong>vài ví dụ trong prompt</strong>,
          nó tự hiểu mẫu hình và áp dụng cho đầu vào mới, hoàn toàn không cần huấn
          luyện lại!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 380" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Ba chế độ học trong ngữ cảnh
            </text>

            {/* Zero-shot */}
            <rect x="15" y="45" width="210" height="310" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="120" y="72" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              Zero-shot
            </text>
            <text x="120" y="88" textAnchor="middle" fill="#64748b" fontSize="9">
              (Không có ví dụ)
            </text>

            <rect x="30" y="100" width="180" height="40" rx="6" fill="#334155" />
            <text x="120" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Dịch sang tiếng Anh:
            </text>
            <text x="120" y="132" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">
              &quot;Con mèo&quot; &rarr; ?
            </text>

            <rect x="30" y="155" width="180" height="35" rx="6" fill="#1e3a5f" />
            <text x="120" y="177" textAnchor="middle" fill="#93c5fd" fontSize="10">
              &quot;The cat&quot;
            </text>

            <rect x="30" y="210" width="180" height="55" rx="6" fill="#334155" />
            <text x="120" y="230" textAnchor="middle" fill="#64748b" fontSize="8">
              LLM dựa hoàn toàn vào
            </text>
            <text x="120" y="242" textAnchor="middle" fill="#64748b" fontSize="8">
              kiến thức đã huấn luyện.
            </text>
            <text x="120" y="254" textAnchor="middle" fill="#64748b" fontSize="8">
              Đơn giản nhưng ít kiểm soát.
            </text>

            {/* One-shot */}
            <rect x="245" y="45" width="210" height="310" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="350" y="72" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
              One-shot
            </text>
            <text x="350" y="88" textAnchor="middle" fill="#64748b" fontSize="9">
              (Một ví dụ)
            </text>

            <rect x="260" y="100" width="180" height="55" rx="6" fill="#334155" />
            <text x="350" y="116" textAnchor="middle" fill="#f59e0b" fontSize="8">
              Ví dụ:
            </text>
            <text x="350" y="130" textAnchor="middle" fill="#94a3b8" fontSize="9">
              &quot;Con chó&quot; &rarr; &quot;The dog&quot;
            </text>
            <text x="350" y="145" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">
              &quot;Con mèo&quot; &rarr; ?
            </text>

            <rect x="260" y="170" width="180" height="35" rx="6" fill="#1e3a5f" />
            <text x="350" y="192" textAnchor="middle" fill="#93c5fd" fontSize="10">
              &quot;The cat&quot;
            </text>

            <rect x="260" y="225" width="180" height="55" rx="6" fill="#334155" />
            <text x="350" y="245" textAnchor="middle" fill="#64748b" fontSize="8">
              Một ví dụ giúp LLM hiểu
            </text>
            <text x="350" y="257" textAnchor="middle" fill="#64748b" fontSize="8">
              định dạng mong muốn.
            </text>
            <text x="350" y="269" textAnchor="middle" fill="#64748b" fontSize="8">
              Cân bằng giữa đơn giản và hiệu quả.
            </text>

            {/* Few-shot */}
            <rect x="475" y="45" width="210" height="310" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="580" y="72" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Few-shot
            </text>
            <text x="580" y="88" textAnchor="middle" fill="#64748b" fontSize="9">
              (Nhiều ví dụ)
            </text>

            <rect x="490" y="100" width="180" height="80" rx="6" fill="#334155" />
            <text x="580" y="116" textAnchor="middle" fill="#22c55e" fontSize="8">
              Ví dụ 1:
            </text>
            <text x="580" y="130" textAnchor="middle" fill="#94a3b8" fontSize="9">
              &quot;Con chó&quot; &rarr; &quot;The dog&quot;
            </text>
            <text x="580" y="144" textAnchor="middle" fill="#22c55e" fontSize="8">
              Ví dụ 2:
            </text>
            <text x="580" y="158" textAnchor="middle" fill="#94a3b8" fontSize="9">
              &quot;Con cá&quot; &rarr; &quot;The fish&quot;
            </text>
            <text x="580" y="172" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">
              &quot;Con mèo&quot; &rarr; ?
            </text>

            <rect x="490" y="192" width="180" height="35" rx="6" fill="#1e3a5f" />
            <text x="580" y="214" textAnchor="middle" fill="#93c5fd" fontSize="10">
              &quot;The cat&quot;
            </text>

            <rect x="490" y="247" width="180" height="55" rx="6" fill="#334155" />
            <text x="580" y="267" textAnchor="middle" fill="#64748b" fontSize="8">
              Nhiều ví dụ giúp LLM nắm
            </text>
            <text x="580" y="279" textAnchor="middle" fill="#64748b" fontSize="8">
              vững mẫu hình. Chính xác nhất
            </text>
            <text x="580" y="291" textAnchor="middle" fill="#64748b" fontSize="8">
              nhưng tốn nhiều token hơn.
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>In-Context Learning (ICL)</strong> là khả năng đặc biệt của các mô hình
          ngôn ngữ lớn: chúng có thể thực hiện tác vụ mới chỉ bằng cách xem vài ví dụ
          trong prompt, mà không cần cập nhật trọng số (huấn luyện lại).
        </p>
        <p>Ba chế độ ICL:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Zero-shot:</strong> Không có ví dụ nào. LLM hoàn toàn dựa vào kiến
            thức đã học trong quá trình huấn luyện trước.
          </li>
          <li>
            <strong>One-shot:</strong> Cung cấp đúng một ví dụ mẫu. Giúp mô hình hiểu
            định dạng đầu vào và đầu ra mong muốn.
          </li>
          <li>
            <strong>Few-shot:</strong> Cung cấp 2-5 ví dụ mẫu. Cho kết quả chính xác nhất
            nhưng tốn nhiều token trong prompt.
          </li>
        </ol>
        <p>
          ICL là một trong những khả năng nổi bật nhất khiến LLM trở nên mạnh mẽ &mdash;
          chúng có thể thích ứng với tác vụ mới ngay lập tức mà không cần dữ liệu huấn
          luyện riêng hay fine-tuning tốn kém.
        </p>
      </ExplanationSection>
    </>
  );
}
