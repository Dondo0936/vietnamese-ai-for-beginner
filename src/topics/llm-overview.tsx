"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "llm-overview",
  title: "LLM Overview",
  titleVi: "Tổng quan mô hình ngôn ngữ lớn",
  description:
    "Kiến trúc và nguyên lý hoạt động của các mô hình ngôn ngữ lớn (Large Language Models).",
  category: "llm-concepts",
  tags: ["llm", "transformer", "architecture", "overview"],
  difficulty: "beginner",
  relatedSlugs: ["transformer", "self-attention", "context-window"],
  vizType: "static",
};

export default function LLMOverviewTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng LLM là một <strong>học sinh siêu năng</strong> đã đọc gần
          như toàn bộ sách, báo, trang web trên Internet. Sau khi đọc, học sinh này
          có khả năng phi thường: <strong>dự đoán từ tiếp theo</strong> trong bất kỳ
          câu nào.
        </p>
        <p>
          Khi bạn hỏi &quot;Thủ đô của Việt Nam là...&quot;, học sinh này nhớ lại
          hàng triệu lần đã đọc câu tương tự và tự tin trả lời &quot;Hà Nội&quot;.
        </p>
        <p>
          Điều kỳ diệu là: chỉ từ việc <strong>dự đoán từ tiếp theo</strong>, LLM
          có thể dịch thuật, viết code, sáng tạo, và thậm chí suy luận logic!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 400" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Kiến trúc tổng quan LLM
            </text>

            {/* Input */}
            <rect x="50" y="50" width="600" height="50" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="350" y="70" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">
              Đầu vào (Input Tokens)
            </text>
            <text x="350" y="88" textAnchor="middle" fill="#94a3b8" fontSize="9">
              &quot;Thủ đô của Việt Nam là&quot; &rarr; [Thủ] [đô] [của] [Việt] [Nam] [là]
            </text>

            {/* Embedding */}
            <rect x="150" y="120" width="400" height="40" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="350" y="145" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">
              Nhúng (Embedding) + Mã hóa vị trí
            </text>

            {/* Arrow */}
            <line x1="350" y1="160" x2="350" y2="175" stroke="#475569" strokeWidth="1.5" />

            {/* Transformer blocks */}
            <rect x="100" y="175" width="500" height="120" rx="12" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
            <text x="350" y="198" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">
              Khối Transformer &times; N lớp
            </text>

            {/* Sub-components */}
            <rect x="120" y="210" width="200" height="35" rx="6" fill="#334155" stroke="#a78bfa" strokeWidth="1" />
            <text x="220" y="232" textAnchor="middle" fill="#a78bfa" fontSize="9">
              Multi-Head Self-Attention
            </text>

            <rect x="120" y="250" width="200" height="35" rx="6" fill="#334155" stroke="#a78bfa" strokeWidth="1" />
            <text x="220" y="272" textAnchor="middle" fill="#a78bfa" fontSize="9">
              Feed-Forward Network
            </text>

            <rect x="380" y="210" width="200" height="35" rx="6" fill="#334155" stroke="#a78bfa" strokeWidth="1" />
            <text x="480" y="232" textAnchor="middle" fill="#a78bfa" fontSize="9">
              Layer Normalization
            </text>

            <rect x="380" y="250" width="200" height="35" rx="6" fill="#334155" stroke="#a78bfa" strokeWidth="1" />
            <text x="480" y="272" textAnchor="middle" fill="#a78bfa" fontSize="9">
              Residual Connection
            </text>

            {/* Arrow */}
            <line x1="350" y1="295" x2="350" y2="315" stroke="#475569" strokeWidth="1.5" />

            {/* Output head */}
            <rect x="150" y="315" width="400" height="40" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="350" y="340" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
              Lớp đầu ra (Softmax &rarr; Xác suất từ tiếp theo)
            </text>

            {/* Output */}
            <rect x="200" y="370" width="300" height="25" rx="6" fill="#14532d" />
            <text x="350" y="387" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="bold">
              &quot;Hà Nội&quot; (xác suất: 94.7%)
            </text>

            {/* Scale info */}
            <rect x="50" y="370" width="130" height="25" rx="6" fill="#334155" />
            <text x="115" y="387" textAnchor="middle" fill="#64748b" fontSize="8">
              Hàng tỷ tham số
            </text>
          </svg>

          {/* Model comparison */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "GPT-4", params: "~1.7T", ctx: "128K" },
              { name: "Claude 3.5", params: "~175B", ctx: "200K" },
              { name: "Llama 3", params: "70B", ctx: "128K" },
              { name: "Gemini", params: "~1T", ctx: "1M+" },
            ].map((m) => (
              <div key={m.name} className="rounded-lg bg-background/50 border border-border p-3 text-center">
                <p className="text-sm font-bold text-foreground">{m.name}</p>
                <p className="text-xs text-muted">{m.params} tham số</p>
                <p className="text-xs text-muted">Context: {m.ctx}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mô hình ngôn ngữ lớn (LLM)</strong> là hệ thống AI được huấn luyện
          trên lượng văn bản khổng lồ để hiểu và sinh ngôn ngữ tự nhiên. Cốt lõi của
          LLM là kiến trúc Transformer với cơ chế self-attention.
        </p>
        <p>Quá trình xây dựng LLM gồm hai giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Pre-training (Huấn luyện trước):</strong> Mô hình học dự đoán từ tiếp
            theo trên hàng tỷ trang web, sách, code. Giai đoạn này tốn hàng triệu đô
            la và hàng nghìn GPU.
          </li>
          <li>
            <strong>Post-training (Tinh chỉnh):</strong> Gồm SFT (Supervised Fine-Tuning)
            và RLHF để mô hình học cách tuân theo chỉ dẫn và trả lời an toàn, hữu ích.
          </li>
        </ol>
        <p>
          LLM thực chất là một <strong>máy dự đoán xác suất từ tiếp theo</strong> siêu
          phức tạp. Nhờ quy mô huấn luyện khổng lồ, nó phát triển khả năng
          &quot;nổi bật&quot; (emergent abilities) như lập luận, viết code, dịch thuật
          mà không được dạy trực tiếp.
        </p>
      </ExplanationSection>
    </>
  );
}
