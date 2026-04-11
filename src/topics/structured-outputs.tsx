"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "structured-outputs",
  title: "Structured Outputs",
  titleVi: "Đầu ra có cấu trúc",
  description:
    "Kỹ thuật đảm bảo LLM sinh ra JSON, XML hoặc schema cố định thay vì văn bản tự do",
  category: "emerging",
  tags: ["json-mode", "schema", "constrained-decoding"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "prompt-engineering", "guardrails"],
  vizType: "static",
};

export default function StructuredOutputsTopic() {
  const svgW = 700;
  const svgH = 450;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác nhau giữa <strong>viết một bài văn tự do</strong>{" "}
          và <strong>điền một tờ khai thuế</strong>. Bài văn tự do cho phép bạn viết
          bất kỳ thứ gì — nhưng rất khó xử lý tự động. Tờ khai thuế có{" "}
          <strong>ô cố định</strong>: họ tên, mã số thuế, thu nhập — máy tính dễ dàng
          đọc và xử lý.
        </p>
        <p>
          <strong>Structured Outputs</strong> giống như bắt AI &quot;điền tờ khai&quot;
          thay vì &quot;viết văn tự do&quot;. Bạn cho AI một <strong>schema</strong>{" "}
          (mẫu form) và AI phải trả lời đúng theo format đó — không thêm, không bớt,
          không sai kiểu dữ liệu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-3xl mx-auto">
            <text
              x={svgW / 2}
              y={22}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="13"
              fontWeight="bold"
            >
              Free Text vs Structured Output
            </text>

            {/* LEFT SIDE: Free Text */}
            <rect x={20} y={40} width={310} height={170} rx={10} fill="#1e293b" stroke="#ef4444" strokeWidth={1.5} />
            <text x={175} y={62} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
              Đầu ra tự do (Free Text)
            </text>

            {/* Simulated free text */}
            <rect x={35} y={72} width={280} height={90} rx={6} fill="#0f172a" />
            <text x={45} y={90} fill="#94a3b8" fontSize="8" fontFamily="monospace">
              &quot;Sản phẩm iPhone 15 Pro Max có giá
            </text>
            <text x={45} y={103} fill="#94a3b8" fontSize="8" fontFamily="monospace">
              khoảng 34.990.000 VNĐ, màu xanh titan,
            </text>
            <text x={45} y={116} fill="#94a3b8" fontSize="8" fontFamily="monospace">
              dung lượng 256GB. Sản phẩm này hiện
            </text>
            <text x={45} y={129} fill="#94a3b8" fontSize="8" fontFamily="monospace">
              đang còn hàng tại các cửa hàng chính
            </text>
            <text x={45} y={142} fill="#94a3b8" fontSize="8" fontFamily="monospace">
              hãng trên toàn quốc...&quot;
            </text>

            {/* Problem markers */}
            <text x={175} y={178} textAnchor="middle" fill="#ef4444" fontSize="8">
              Khó parse, format không nhất quán
            </text>
            <text x={175} y={192} textAnchor="middle" fill="#ef4444" fontSize="8">
              Không thể validate tự động
            </text>

            {/* ARROW */}
            <text x={svgW / 2} y={125} textAnchor="middle" fill="#64748b" fontSize="20">
              &rarr;
            </text>

            {/* RIGHT SIDE: Structured */}
            <rect x={370} y={40} width={310} height={170} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
            <text x={525} y={62} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
              Đầu ra có cấu trúc (JSON)
            </text>

            {/* JSON output */}
            <rect x={385} y={72} width={280} height={90} rx={6} fill="#0f172a" />
            <text x={395} y={88} fill="#22c55e" fontSize="8" fontFamily="monospace">
              {'{'}
            </text>
            <text x={405} y={100} fill="#3b82f6" fontSize="8" fontFamily="monospace">
              &quot;name&quot;: <tspan fill="#f59e0b">&quot;iPhone 15 Pro Max&quot;</tspan>,
            </text>
            <text x={405} y={112} fill="#3b82f6" fontSize="8" fontFamily="monospace">
              &quot;price&quot;: <tspan fill="#a78bfa">34990000</tspan>,
            </text>
            <text x={405} y={124} fill="#3b82f6" fontSize="8" fontFamily="monospace">
              &quot;color&quot;: <tspan fill="#f59e0b">&quot;Xanh titan&quot;</tspan>,
            </text>
            <text x={405} y={136} fill="#3b82f6" fontSize="8" fontFamily="monospace">
              &quot;storage&quot;: <tspan fill="#f59e0b">&quot;256GB&quot;</tspan>,
            </text>
            <text x={405} y={148} fill="#3b82f6" fontSize="8" fontFamily="monospace">
              &quot;in_stock&quot;: <tspan fill="#a78bfa">true</tspan>
            </text>
            <text x={395} y={158} fill="#22c55e" fontSize="8" fontFamily="monospace">
              {'}'}
            </text>

            {/* Success markers */}
            <text x={525} y={178} textAnchor="middle" fill="#22c55e" fontSize="8">
              Parse dễ dàng, validate tự động
            </text>
            <text x={525} y={192} textAnchor="middle" fill="#22c55e" fontSize="8">
              Tích hợp API trực tiếp
            </text>

            {/* CONSTRAINED DECODING section */}
            <rect x={40} y={230} width={620} height={190} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={1.5} />
            <text x={svgW / 2} y={255} textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">
              Cách hoạt động: Constrained Decoding
            </text>

            {/* Step 1: Schema */}
            <rect x={60} y={270} width={130} height={65} rx={6} fill="#334155" stroke="#f59e0b" strokeWidth={1} />
            <text x={125} y={288} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
              1. JSON Schema
            </text>
            <text x={125} y={303} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Định nghĩa cấu trúc:
            </text>
            <text x={125} y={315} textAnchor="middle" fill="#94a3b8" fontSize="7">
              kiểu dữ liệu, bắt buộc/tùy chọn
            </text>
            <text x={125} y={327} textAnchor="middle" fill="#94a3b8" fontSize="7">
              giá trị cho phép
            </text>

            {/* Arrow */}
            <polygon points="195,300 210,295 195,290" fill="#475569" />

            {/* Step 2: Grammar */}
            <rect x={215} y={270} width={130} height={65} rx={6} fill="#334155" stroke="#3b82f6" strokeWidth={1} />
            <text x={280} y={288} textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">
              2. Grammar/FSM
            </text>
            <text x={280} y={303} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Chuyển schema thành
            </text>
            <text x={280} y={315} textAnchor="middle" fill="#94a3b8" fontSize="7">
              finite state machine
            </text>
            <text x={280} y={327} textAnchor="middle" fill="#94a3b8" fontSize="7">
              kiểm soát token hợp lệ
            </text>

            {/* Arrow */}
            <polygon points="350,300 365,295 350,290" fill="#475569" />

            {/* Step 3: Mask */}
            <rect x={370} y={270} width={130} height={65} rx={6} fill="#334155" stroke="#ec4899" strokeWidth={1} />
            <text x={435} y={288} textAnchor="middle" fill="#ec4899" fontSize="9" fontWeight="bold">
              3. Token Masking
            </text>
            <text x={435} y={303} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Mỗi bước sinh token,
            </text>
            <text x={435} y={315} textAnchor="middle" fill="#94a3b8" fontSize="7">
              chặn các token vi phạm
            </text>
            <text x={435} y={327} textAnchor="middle" fill="#94a3b8" fontSize="7">
              schema &rarr; luôn hợp lệ
            </text>

            {/* Arrow */}
            <polygon points="505,300 520,295 505,290" fill="#475569" />

            {/* Step 4: Output */}
            <rect x={525} y={270} width={120} height={65} rx={6} fill="#334155" stroke="#22c55e" strokeWidth={1} />
            <text x={585} y={288} textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">
              4. Valid JSON
            </text>
            <text x={585} y={303} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Output 100% tuân thủ
            </text>
            <text x={585} y={315} textAnchor="middle" fill="#94a3b8" fontSize="7">
              schema, không cần
            </text>
            <text x={585} y={327} textAnchor="middle" fill="#94a3b8" fontSize="7">
              retry hoặc sửa lỗi
            </text>

            {/* Key insight */}
            <rect x={120} y={350} width={460} height={28} rx={6} fill="#1a2332" stroke="#f59e0b" strokeWidth={1} />
            <text x={350} y={368} textAnchor="middle" fill="#f59e0b" fontSize="9">
              Mỗi token sinh ra đều bị kiểm tra — chỉ token hợp lệ mới được chọn
            </text>

            {/* Labels */}
            <text x={350} y={435} textAnchor="middle" fill="#64748b" fontSize="9">
              Constrained Decoding đảm bảo output luôn đúng cấu trúc, không cần parse/retry
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Structured Outputs</strong> là kỹ thuật đảm bảo LLM sinh ra dữ liệu
          theo định dạng cố định (JSON, XML, v.v.) thay vì văn bản tự do. Đây là yêu
          cầu thiết yếu khi tích hợp AI vào ứng dụng thực tế.
        </p>

        <p>Các phương pháp chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>JSON Mode:</strong> Yêu cầu LLM trả về JSON hợp lệ. Đơn giản nhưng
            không đảm bảo tuân thủ schema cụ thể.
          </li>
          <li>
            <strong>Schema Enforcement:</strong> Cung cấp JSON Schema, LLM phải sinh
            output khớp 100% với schema — đúng tên trường, đúng kiểu dữ liệu, đúng
            cấu trúc.
          </li>
          <li>
            <strong>Constrained Decoding:</strong> Tại mỗi bước sinh token, chặn tất
            cả token vi phạm grammar/schema. Ví dụ: sau dấu &quot;:&quot; trong key
            &quot;price&quot;, chỉ cho phép token số, không cho phép chữ.
          </li>
          <li>
            <strong>Grammar-based Generation:</strong> Sử dụng context-free grammar
            (GBNF) để định nghĩa không gian output cho phép. Linh hoạt hơn JSON Schema.
          </li>
        </ol>

        <p>
          <strong>Function Calling</strong> thực chất cũng là một dạng structured
          output — LLM sinh ra tên hàm và tham số dưới dạng JSON thay vì thực thi trực
          tiếp.
        </p>

        <p>Ứng dụng thực tế:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Trích xuất thông tin từ tài liệu (hóa đơn, CV, hợp đồng)</li>
          <li>Tạo dữ liệu huấn luyện tự động theo format chuẩn</li>
          <li>API response cho ứng dụng frontend</li>
          <li>Chuỗi xử lý AI pipeline nơi output của bước trước là input bước sau</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
