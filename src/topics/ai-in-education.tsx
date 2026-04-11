"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-education",
  title: "AI in Education",
  titleVi: "AI trong Giáo dục",
  description:
    "Ứng dụng AI trong cá nhân hoá học tập, chấm bài tự động và trợ lý giảng dạy thông minh",
  category: "applied-ai",
  tags: ["personalization", "tutoring", "assessment"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "rag", "recommendation-systems"],
  vizType: "static",
};

export default function AIInEducationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>gia sư riêng</strong> hiểu rõ từng điểm
          mạnh và yếu của bạn.{" "}
          <em>
            &quot;Như có một gia sư riêng hiểu rõ từng điểm mạnh và yếu của bạn.&quot;
          </em>{" "}
          Gia sư này điều chỉnh bài học <strong>theo đúng tốc độ</strong> của bạn — nếu
          bạn giỏi toán nhưng yếu tiếng Anh, họ sẽ cho bạn bài toán khó hơn nhưng ôn
          lại ngữ pháp cơ bản.
        </p>
        <p>
          Khác với lớp học truyền thống nơi một giáo viên phải dạy 40–50 học sinh cùng
          một bài, AI có thể tạo <strong>40 lộ trình học khác nhau</strong> cho 40 học
          sinh — mỗi lộ trình được thiết kế riêng. Giống như từ &quot;một lớp học&quot;
          biến thành <strong>&quot;40 lớp học 1-1&quot;</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 400" className="w-full max-w-2xl mx-auto">
            <text x={300} y={22} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              AI trong Giáo dục — 3 Ứng dụng chính
            </text>

            {/* === Application 1: Adaptive Learning Path === */}
            <g>
              {/* Student Profile */}
              <rect x={20} y={45} width={120} height={90} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
              <text x={80} y={65} textAnchor="middle" fill="#3b82f6" fontSize={10} fontWeight="bold">
                Hồ sơ học sinh
              </text>
              <circle cx={80} cy={90} r={15} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1} />
              <text x={80} y={95} textAnchor="middle" fill="#3b82f6" fontSize={14}>
                👤
              </text>
              <text x={80} y={120} textAnchor="middle" fill="#94a3b8" fontSize={7}>
                Điểm mạnh, yếu, tốc độ
              </text>

              {/* Arrow */}
              <line x1={140} y1={90} x2={165} y2={90} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowEduBlue)" />

              {/* AI Engine */}
              <rect x={165} y={55} width={110} height={70} rx={12} fill="#3b82f6" fillOpacity={0.12} stroke="#3b82f6" strokeWidth={1.5} />
              <text x={220} y={78} textAnchor="middle" fill="#3b82f6" fontSize={10} fontWeight="bold">
                AI cá nhân hoá
              </text>
              <text x={220} y={93} textAnchor="middle" fill="#3b82f6" fontSize={8}>
                Adaptive Learning
              </text>
              <text x={220} y={108} textAnchor="middle" fill="#3b82f6" fontSize={8}>
                Knowledge Graph
              </text>

              {/* Arrow */}
              <line x1={275} y1={90} x2={300} y2={90} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrowEduBlue)" />

              {/* Result */}
              <rect x={300} y={45} width={280} height={90} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={440} y={65} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Lộ trình học cá nhân hoá
              </text>
              {/* Learning path nodes */}
              {[
                { label: "Cơ bản", x: 330, color: "#22c55e" },
                { label: "Trung bình", x: 390, color: "#f59e0b" },
                { label: "Nâng cao", x: 450, color: "#ef4444" },
                { label: "Thành thạo", x: 530, color: "#8b5cf6" },
              ].map((node, i) => (
                <g key={i}>
                  <circle cx={node.x} cy={95} r={12} fill={node.color} fillOpacity={0.2} stroke={node.color} strokeWidth={1.5} />
                  <text x={node.x} y={99} textAnchor="middle" fill={node.color} fontSize={7} fontWeight="bold">
                    {i + 1}
                  </text>
                  <text x={node.x} y={120} textAnchor="middle" fill="#94a3b8" fontSize={6.5}>
                    {node.label}
                  </text>
                  {i < 3 && (
                    <line
                      x1={node.x + 14}
                      y1={95}
                      x2={[390, 450, 530][i] - 14}
                      y2={95}
                      stroke="#475569"
                      strokeWidth={1}
                      strokeDasharray="3,2"
                    />
                  )}
                </g>
              ))}
            </g>

            {/* === Application 2: Automated Grading === */}
            <g>
              {/* Input */}
              <rect x={20} y={155} width={120} height={90} rx={10} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
              <text x={80} y={178} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                Bài luận / Bài tập
              </text>
              <circle cx={80} cy={203} r={15} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={1} />
              <text x={80} y={208} textAnchor="middle" fill="#f59e0b" fontSize={14}>
                📝
              </text>
              <text x={80} y={233} textAnchor="middle" fill="#94a3b8" fontSize={7}>
                Văn bản, code, toán
              </text>

              {/* Arrow */}
              <line x1={140} y1={200} x2={165} y2={200} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowEduAmber)" />

              {/* AI Engine */}
              <rect x={165} y={165} width={110} height={70} rx={12} fill="#f59e0b" fillOpacity={0.12} stroke="#f59e0b" strokeWidth={1.5} />
              <text x={220} y={188} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
                AI chấm bài
              </text>
              <text x={220} y={203} textAnchor="middle" fill="#f59e0b" fontSize={8}>
                NLP / LLM
              </text>
              <text x={220} y={218} textAnchor="middle" fill="#f59e0b" fontSize={8}>
                Rubric-based
              </text>

              {/* Arrow */}
              <line x1={275} y1={200} x2={300} y2={200} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowEduAmber)" />

              {/* Result */}
              <rect x={300} y={155} width={280} height={90} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={440} y={178} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Phản hồi chi tiết
              </text>
              <text x={440} y={198} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Điểm số: 8.5/10 — Nội dung tốt, cần cải thiện
              </text>
              <text x={440} y={213} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                cấu trúc luận điểm và trích dẫn nguồn
              </text>
              <text x={440} y={228} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Gợi ý: Xem lại cách viết đoạn kết luận
              </text>
            </g>

            {/* === Application 3: Intelligent Tutoring === */}
            <g>
              {/* Input */}
              <rect x={20} y={265} width={120} height={90} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={80} y={288} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">
                Câu hỏi học sinh
              </text>
              <circle cx={80} cy={313} r={15} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={1} />
              <text x={80} y={318} textAnchor="middle" fill="#8b5cf6" fontSize={14}>
                ❓
              </text>
              <text x={80} y={343} textAnchor="middle" fill="#94a3b8" fontSize={7}>
                &quot;Em không hiểu đạo hàm&quot;
              </text>

              {/* Arrow */}
              <line x1={140} y1={310} x2={165} y2={310} stroke="#8b5cf6" strokeWidth={2} markerEnd="url(#arrowEduPurple)" />

              {/* AI Engine */}
              <rect x={165} y={275} width={110} height={70} rx={12} fill="#8b5cf6" fillOpacity={0.12} stroke="#8b5cf6" strokeWidth={1.5} />
              <text x={220} y={298} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">
                AI gia sư
              </text>
              <text x={220} y={313} textAnchor="middle" fill="#8b5cf6" fontSize={8}>
                Intelligent Tutor
              </text>
              <text x={220} y={328} textAnchor="middle" fill="#8b5cf6" fontSize={8}>
                RAG + LLM
              </text>

              {/* Arrow */}
              <line x1={275} y1={310} x2={300} y2={310} stroke="#8b5cf6" strokeWidth={2} markerEnd="url(#arrowEduPurple)" />

              {/* Result */}
              <rect x={300} y={265} width={280} height={90} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <text x={440} y={288} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">
                Giải thích tuỳ chỉnh
              </text>
              <text x={440} y={308} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Giải thích bằng ví dụ phù hợp trình độ
              </text>
              <text x={440} y={323} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Bài tập luyện tập theo mức độ
              </text>
              <text x={440} y={338} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                Hỏi ngược lại để kiểm tra hiểu biết
              </text>
            </g>

            {/* Self-reference note */}
            <rect x={100} y={370} width={400} height={25} rx={8} fill="#22c55e" fillOpacity={0.1} stroke="#22c55e" strokeWidth={1} strokeDasharray="4,2" />
            <text x={300} y={387} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">
              💡 Ứng dụng bạn đang dùng chính là ví dụ của AI trong Giáo dục!
            </text>

            {/* Arrow markers */}
            <defs>
              <marker id="arrowEduBlue" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#3b82f6" />
              </marker>
              <marker id="arrowEduAmber" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#f59e0b" />
              </marker>
              <marker id="arrowEduPurple" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#8b5cf6" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI trong Giáo dục (AI in Education)</strong> là việc ứng dụng trí tuệ
          nhân tạo để cá nhân hoá trải nghiệm học tập, tự động hoá công việc của giáo
          viên, và tạo ra những công cụ học tập thông minh hơn. Đây là lĩnh vực đang
          phát triển rất nhanh, đặc biệt sau sự bùng nổ của ChatGPT và các mô hình ngôn
          ngữ lớn (LLM).
        </p>
        <p>Các ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lộ trình học cá nhân hoá (Personalized Learning Paths):</strong> AI
            phân tích điểm mạnh, điểm yếu, tốc độ học và phong cách học của từng học sinh
            để tạo lộ trình riêng. Ví dụ: nếu bạn đã hiểu CNN, AI sẽ bỏ qua bài cơ bản
            và đưa thẳng đến Transfer Learning — giống như ứng dụng bạn đang dùng!
          </li>
          <li>
            <strong>Chấm bài tự động (Automated Grading):</strong> AI sử dụng NLP và LLM
            để chấm bài luận, bài tập tự luận — không chỉ cho điểm mà còn đưa ra phản
            hồi chi tiết về nội dung, cấu trúc, ngữ pháp. Giúp giáo viên tiết kiệm hàng
            giờ chấm bài mỗi ngày.
          </li>
          <li>
            <strong>Hệ thống gia sư thông minh (Intelligent Tutoring Systems):</strong>{" "}
            AI đóng vai trò gia sư ảo — trả lời câu hỏi, giải thích khái niệm khó bằng
            nhiều cách khác nhau cho đến khi học sinh hiểu. Sử dụng kỹ thuật Socratic
            questioning — hỏi ngược lại để giúp học sinh tự tìm ra đáp án.
          </li>
          <li>
            <strong>Phân tích học tập (Learning Analytics):</strong> AI phân tích dữ liệu
            hành vi học tập (thời gian, tần suất, kết quả) để phát hiện học sinh có nguy
            cơ bỏ học hoặc tụt hậu, giúp giáo viên can thiệp kịp thời.
          </li>
          <li>
            <strong>Tạo nội dung giáo dục (AI-Powered Content Generation):</strong> AI
            tạo bài giảng, câu hỏi trắc nghiệm, ví dụ minh hoạ, và thậm chí là hình ảnh
            trực quan — giúp giáo viên chuẩn bị bài nhanh hơn. Ứng dụng này là một ví dụ
            điển hình!
          </li>
        </ol>
        <p>
          <strong>Lưu ý quan trọng:</strong> AI trong giáo dục không nhằm thay thế giáo
          viên mà là <strong>công cụ hỗ trợ</strong>. Giáo viên vẫn đóng vai trò không
          thể thay thế trong việc truyền cảm hứng, phát triển kỹ năng mềm, và hỗ trợ
          cảm xúc cho học sinh. AI giúp giáo viên giảm tải công việc lặp đi lặp lại
          để tập trung vào những gì con người làm tốt nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
