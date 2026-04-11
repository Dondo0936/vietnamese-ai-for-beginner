"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "model-context-protocol",
  title: "Model Context Protocol (MCP)",
  titleVi: "Giao thức ngữ cảnh mô hình",
  description:
    "Giao thức chuẩn hoá kết nối LLM với công cụ và nguồn dữ liệu bên ngoài",
  category: "emerging",
  tags: ["protocol", "tools", "standardization"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "orchestration", "agent-architecture"],
  vizType: "interactive",
};

const TOOLS = [
  {
    id: "database",
    name: "Cơ sở dữ liệu",
    icon: "DB",
    color: "#3b82f6",
    messages: [
      "Client gửi: tools/call {name: 'query_db', args: {sql: 'SELECT...'}}",
      "MCP Server chuyển tiếp tới Database adapter",
      "Database trả về kết quả",
      "MCP Server gửi response về Client",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    icon: "GH",
    color: "#8b5cf6",
    messages: [
      "Client gửi: tools/call {name: 'create_pr', args: {title: '...'}}",
      "MCP Server chuyển tiếp tới GitHub adapter",
      "GitHub API tạo Pull Request",
      "MCP Server gửi response về Client",
    ],
  },
  {
    id: "filesystem",
    name: "File System",
    icon: "FS",
    color: "#22c55e",
    messages: [
      "Client gửi: tools/call {name: 'read_file', args: {path: '...'}}",
      "MCP Server chuyển tiếp tới File System adapter",
      "File System đọc và trả nội dung",
      "MCP Server gửi response về Client",
    ],
  },
  {
    id: "web",
    name: "Web Search",
    icon: "WS",
    color: "#f59e0b",
    messages: [
      "Client gửi: tools/call {name: 'search', args: {query: '...'}}",
      "MCP Server chuyển tiếp tới Web Search adapter",
      "Search engine trả về kết quả",
      "MCP Server gửi response về Client",
    ],
  },
];

export default function ModelContextProtocolTopic() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [messageStep, setMessageStep] = useState(0);

  const tool = TOOLS.find((t) => t.id === selectedTool);

  const handleToolClick = (id: string) => {
    setSelectedTool(id);
    setMessageStep(0);
  };

  const nextMessage = () => {
    if (tool && messageStep < tool.messages.length - 1) {
      setMessageStep(messageStep + 1);
    }
  };

  const svgW = 700;
  const svgH = 300;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>USB-C cho AI</strong>. Trước khi có USB-C, mỗi
          thiết bị cần một loại cáp riêng — Lightning cho iPhone, micro-USB cho
          Android, HDMI cho màn hình. Rất phiền phức!
        </p>
        <p>
          Tương tự, trước MCP, mỗi <strong>công cụ AI</strong> cần một{" "}
          <strong>connector riêng</strong> — mỗi LLM kết nối với database, GitHub,
          hay file system theo cách khác nhau. MCP cung cấp{" "}
          <strong>một giao thức chuẩn</strong> duy nhất để bất kỳ AI model nào cũng
          kết nối được với bất kỳ công cụ nào — giống như USB-C hoạt động cho điện
          thoại, laptop, và màn hình.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Nhấn vào một công cụ để xem luồng thông điệp qua giao thức MCP.
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-3xl mx-auto">
            <defs>
              <marker id="mcpArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
              </marker>
              <marker id="mcpArrowBack" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                <polygon points="8 0, 0 3, 8 6" fill="#22c55e" />
              </marker>
            </defs>

            {/* Client box */}
            <rect x={20} y={80} width={120} height={100} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
            <text x={80} y={115} textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
              MCP Client
            </text>
            <text x={80} y={132} textAnchor="middle" fill="#94a3b8" fontSize="8">
              (Claude, GPT,
            </text>
            <text x={80} y={143} textAnchor="middle" fill="#94a3b8" fontSize="8">
              ứng dụng AI)
            </text>
            <text x={80} y={170} textAnchor="middle" fill="#64748b" fontSize="7">
              JSON-RPC
            </text>

            {/* Arrow Client → Server */}
            <line x1={140} y1={115} x2={230} y2={115} stroke="#60a5fa" strokeWidth={1.5} markerEnd="url(#mcpArrow)" />
            <line x1={230} y1={145} x2={140} y2={145} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#mcpArrowBack)" />
            <text x={185} y={108} textAnchor="middle" fill="#60a5fa" fontSize="7">request</text>
            <text x={185} y={160} textAnchor="middle" fill="#22c55e" fontSize="7">response</text>

            {/* MCP Server box */}
            <rect x={230} y={60} width={160} height={140} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={310} y={85} textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold">
              MCP Server
            </text>

            {/* Server capabilities */}
            {["Resources", "Tools", "Prompts"].map((cap, i) => (
              <g key={cap}>
                <rect x={245} y={95 + i * 30} width={130} height={22} rx={4} fill="#334155" stroke="#6366f1" strokeWidth={0.5} />
                <text x={310} y={110 + i * 30} textAnchor="middle" fill="#a5b4fc" fontSize="8">
                  {cap}
                </text>
              </g>
            ))}

            {/* Arrows Server → Tools */}
            <line x1={390} y1={130} x2={470} y2={80} stroke="#60a5fa" strokeWidth={1} markerEnd="url(#mcpArrow)" />
            <line x1={390} y1={130} x2={470} y2={130} stroke="#60a5fa" strokeWidth={1} markerEnd="url(#mcpArrow)" />
            <line x1={390} y1={130} x2={470} y2={180} stroke="#60a5fa" strokeWidth={1} markerEnd="url(#mcpArrow)" />
            <line x1={390} y1={130} x2={470} y2={230} stroke="#60a5fa" strokeWidth={1} markerEnd="url(#mcpArrow)" />

            {/* Tool boxes */}
            {TOOLS.map((t, i) => {
              const y = 60 + i * 50;
              const isSelected = selectedTool === t.id;
              return (
                <g
                  key={t.id}
                  onClick={() => handleToolClick(t.id)}
                  className="cursor-pointer"
                >
                  <rect
                    x={470}
                    y={y}
                    width={120}
                    height={38}
                    rx={8}
                    fill={isSelected ? t.color : "#1e293b"}
                    stroke={t.color}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 1 : 0.7}
                  />
                  <text
                    x={495}
                    y={y + 16}
                    fill={isSelected ? "white" : t.color}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    [{t.icon}]
                  </text>
                  <text
                    x={530}
                    y={y + 16}
                    fill={isSelected ? "white" : "#e2e8f0"}
                    fontSize="9"
                  >
                    {t.name}
                  </text>
                  <text
                    x={530}
                    y={y + 30}
                    fill={isSelected ? "rgba(255,255,255,0.7)" : "#64748b"}
                    fontSize="7"
                  >
                    Nhấn để xem
                  </text>
                </g>
              );
            })}

            {/* Title labels */}
            <text x={80} y={55} textAnchor="middle" fill="#64748b" fontSize="9">
              Ứng dụng AI
            </text>
            <text x={310} y={45} textAnchor="middle" fill="#64748b" fontSize="9">
              Giao thức chuẩn
            </text>
            <text x={530} y={45} textAnchor="middle" fill="#64748b" fontSize="9">
              Công cụ &amp; Dữ liệu
            </text>

            {/* Highlight for USB-C metaphor */}
            <rect x={210} y={260} width={280} height={25} rx={6} fill="#1e293b" stroke="#f59e0b" strokeWidth={1} />
            <text x={350} y={277} textAnchor="middle" fill="#f59e0b" fontSize="9">
              MCP = Chuẩn kết nối chung (như USB-C cho AI)
            </text>
          </svg>

          {/* Message flow */}
          {tool && (
            <div className="space-y-3">
              <div className="rounded-lg bg-background/50 border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Luồng giao tiếp: {tool.name}
                </p>
                <div className="space-y-2">
                  {tool.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded font-mono ${
                        i <= messageStep
                          ? "bg-card border border-border text-foreground"
                          : "text-muted opacity-40"
                      }`}
                    >
                      {i + 1}. {msg}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={nextMessage}
                  disabled={messageStep >= tool.messages.length - 1}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Bước tiếp theo
                </button>
              </div>
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Model Context Protocol (MCP)</strong> là giao thức mã nguồn mở do
          Anthropic phát triển, chuẩn hóa cách các ứng dụng AI kết nối với nguồn dữ
          liệu và công cụ bên ngoài.
        </p>

        <p>Kiến trúc MCP gồm ba thành phần:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>MCP Client:</strong> Phía ứng dụng AI (Claude Desktop, IDE, chatbot).
            Client gửi yêu cầu theo định dạng chuẩn JSON-RPC.
          </li>
          <li>
            <strong>MCP Server:</strong> Phía công cụ/dữ liệu. Server expose ba loại
            khả năng: <strong>Resources</strong> (dữ liệu có thể đọc), <strong>Tools</strong>{" "}
            (hành động có thể thực thi), và <strong>Prompts</strong> (template hướng dẫn).
          </li>
          <li>
            <strong>Transport Layer:</strong> Kết nối giữa client và server qua
            stdio, HTTP/SSE, hoặc WebSocket.
          </li>
        </ol>

        <p>Tại sao MCP quan trọng?</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Chuẩn hóa:</strong> Thay vì mỗi AI app viết connector riêng cho
            từng dịch vụ, chỉ cần một MCP server cho mỗi dịch vụ, mọi AI app đều
            dùng được.
          </li>
          <li>
            <strong>Bảo mật:</strong> MCP server kiểm soát quyền truy cập, AI không
            trực tiếp truy cập dữ liệu nhạy cảm.
          </li>
          <li>
            <strong>So với Function Calling:</strong> Function calling là cơ chế của
            riêng mỗi LLM provider. MCP là giao thức chung, provider-agnostic,
            cho phép tái sử dụng giữa các nền tảng.
          </li>
        </ul>
        <p>
          Hiện tại, MCP đang được tích hợp vào Claude Desktop, VS Code, Cursor, và
          nhiều công cụ AI khác, tạo nên hệ sinh thái kết nối thống nhất cho AI.
        </p>
      </ExplanationSection>
    </>
  );
}
