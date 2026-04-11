"use client";

import { useState, useMemo } from "react";
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
  { name: "Database", icon: "DB", color: "#3b82f6" },
  { name: "File System", icon: "FS", color: "#22c55e" },
  { name: "Web Search", icon: "WS", color: "#f59e0b" },
  { name: "Calendar", icon: "CAL", color: "#8b5cf6" },
  { name: "Slack", icon: "SL", color: "#ef4444" },
  { name: "GitHub", icon: "GH", color: "#06b6d4" },
];

const TOTAL_STEPS = 7;

export default function ModelContextProtocolTopic() {
  const [activeTool, setActiveTool] = useState(0);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "MCP giải quyết vấn đề gì mà function calling thông thường không giải quyết?",
      options: [
        "Gọi function nhanh hơn",
        "CHUẨN HOÁ giao thức: mọi LLM (Claude, GPT, Gemini) và mọi tool (Slack, DB, GitHub) nói cùng 'ngôn ngữ' → build 1 lần, dùng mọi nơi",
        "Hỗ trợ nhiều ngôn ngữ lập trình hơn",
      ],
      correct: 1,
      explanation: "Trước MCP: mỗi LLM có cách gọi tool riêng, mỗi tool cần adapter riêng cho mỗi LLM → N x M integrations. MCP: chuẩn hoá → mỗi tool build 1 MCP server, mỗi LLM connect tới bất kỳ MCP server nào → N + M integrations. Giống USB cho AI!",
    },
    {
      question: "MCP Server và MCP Client là gì?",
      options: [
        "Server = LLM, Client = tool",
        "Server = cung cấp tools/resources/prompts. Client = ứng dụng AI kết nối đến servers (ví dụ: Claude Desktop)",
        "Server và Client giống nhau",
      ],
      correct: 1,
      explanation: "MCP Server: wrap tool/data thành giao diện chuẩn (expose tools, resources, prompts). MCP Client: AI app (Claude Desktop, Cursor) kết nối đến nhiều servers. 1 Client kết nối nhiều Servers — giống 1 laptop cắm nhiều USB devices.",
    },
    {
      question: "MCP transport dùng gì để giao tiếp?",
      options: [
        "REST API thông thường",
        "JSON-RPC 2.0 qua stdio (local) hoặc SSE (remote) — bidirectional, async",
        "GraphQL",
      ],
      correct: 1,
      explanation: "MCP dùng JSON-RPC 2.0: lightweight, bidirectional. Stdio transport: cho local servers (Claude Desktop ↔ local tool). SSE (Server-Sent Events): cho remote servers. Không dùng REST vì cần bidirectional communication (server có thể push notifications).",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn Claude kết nối với Slack, Google Calendar, và PostgreSQL. Mỗi tool cần adapter riêng. Nếu chuyển sang GPT, phải viết lại hết. Có cách nào build 1 lần dùng mọi nơi?"
          options={[
            "Không — mỗi LLM có cách gọi tool khác nhau",
            "MCP (Model Context Protocol): chuẩn hoá giao thức, mỗi tool build 1 MCP server, mỗi LLM client đều kết nối được",
            "Dùng REST API là đủ",
          ]}
          correct={1}
          explanation="MCP là 'USB cho AI'! Trước đây: N LLMs x M tools = N*M integrations. Với MCP: N + M. Mỗi tool build 1 MCP server (chuẩn), mỗi AI app (Claude, Cursor) là MCP client → kết nối bất kỳ server nào. Build once, use everywhere!"
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Click vào <strong className="text-foreground">tool</strong>{" "}
          để xem cách MCP kết nối LLM với các dịch vụ bên ngoài.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              {/* LLM Client */}
              <rect x={230} y={10} width={140} height={40} rx={10} fill="#8b5cf6" />
              <text x={300} y={28} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">AI App (Client)</text>
              <text x={300} y={42} textAnchor="middle" fill="white" fontSize={7}>Claude Desktop / Cursor</text>

              {/* MCP Protocol layer */}
              <rect x={100} y={65} width={400} height={25} rx={4} fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={1} />
              <text x={300} y={82} textAnchor="middle" fill="#f59e0b" fontSize={9} fontWeight="bold">MCP Protocol (JSON-RPC 2.0)</text>

              {/* MCP Servers (tools) */}
              {TOOLS.map((t, i) => {
                const x = 55 + i * 90;
                const isActive = i === activeTool;
                return (
                  <g key={i} onClick={() => setActiveTool(i)} className="cursor-pointer">
                    <line x1={300} y1={50} x2={x} y2={95} stroke={isActive ? t.color : "#475569"} strokeWidth={isActive ? 2 : 0.5} />
                    <rect x={x - 38} y={100} width={76} height={40} rx={6}
                      fill={isActive ? t.color : "#1e293b"} stroke={t.color}
                      strokeWidth={isActive ? 2 : 1} opacity={isActive ? 1 : 0.4}
                    />
                    <text x={x} y={118} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{t.icon}</text>
                    <text x={x} y={132} textAnchor="middle" fill="white" fontSize={7}>{t.name}</text>
                  </g>
                );
              })}

              <text x={300} y={165} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Mỗi tool = 1 MCP Server | AI app kết nối bất kỳ server nào qua MCP
              </text>
              <text x={300} y={180} textAnchor="middle" fill="#64748b" fontSize={8}>
                Build 1 lần, dùng cho Claude, GPT, Gemini, Cursor, ... — giống USB cho AI
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Trước MCP: mỗi LLM x mỗi tool = integration riêng. 5 LLMs x 10 tools = 50 integrations.
            Với MCP: 5 LLMs + 10 tools = <strong>15 implementations</strong>{" "}(5 clients + 10 servers).
            Giống cách USB chuẩn hoá kết nối thiết bị — <strong>build once, connect everywhere</strong>!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn build MCP server cho PostgreSQL database nội bộ công ty. Ai có thể dùng server này?"
          options={[
            "Chỉ Claude Desktop (vì Anthropic tạo MCP)",
            "Bất kỳ MCP client nào: Claude Desktop, Cursor, Windsurf, hoặc app tự build — vì MCP là open standard",
            "Chỉ các app của Anthropic",
          ]}
          correct={1}
          explanation="MCP là open standard (MIT license)! Bất kỳ ai cũng có thể build client hoặc server. Đã có: Claude Desktop, Cursor, Windsurf, Continue, Sourcegraph Cody làm MCP clients. 1000+ community MCP servers trên GitHub. Ecosystem đang phát triển rất nhanh."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Model Context Protocol (MCP)</strong>{" "}
            là giao thức chuẩn hoá để kết nối LLM với tools và data sources — 'USB cho AI'.
          </p>
          <p><strong>3 primitives chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Tools:</strong>{" "}Functions mà LLM có thể gọi (query DB, send Slack, create file)</li>
            <li><strong>Resources:</strong>{" "}Data mà LLM có thể đọc (files, database records, API responses)</li>
            <li><strong>Prompts:</strong>{" "}Template prompts có tham số (reusable workflows)</li>
          </ul>

          <Callout variant="tip" title="MCP vs Function Calling">
            Function calling: LLM-specific (OpenAI format khác Anthropic format). MCP: chuẩn hoá cho TẤT CẢ LLMs. Function calling là cách LLM gọi tool. MCP là cách TOOLS expose chức năng cho bất kỳ LLM nào.
          </Callout>

          <p><strong>Architecture:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>MCP Client:</strong>{" "}AI app (Claude Desktop, Cursor) — initiate connections</li>
            <li><strong>MCP Server:</strong>{" "}Wrap tool/data — expose tools, resources, prompts</li>
            <li><strong>Transport:</strong>{" "}stdio (local) hoặc SSE (remote). JSON-RPC 2.0</li>
          </ul>

          <CodeBlock language="python" title="Build MCP Server cho PostgreSQL">
{`from mcp.server import Server
from mcp.types import Tool, TextContent
import asyncpg

server = Server("postgres-mcp")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="query",
            description="Chạy SQL query trên PostgreSQL",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL query"},
                },
                "required": ["sql"],
            },
        ),
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query":
        conn = await asyncpg.connect("postgresql://...")
        rows = await conn.fetch(arguments["sql"])
        return [TextContent(type="text", text=str(rows))]

# Chạy server — bất kỳ MCP client nào đều kết nối được
# Claude Desktop, Cursor, Windsurf, custom app...
if __name__ == "__main__":
    import mcp
    mcp.run(server, transport="stdio")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "MCP chuẩn hoá kết nối LLM với tools — 'USB cho AI'. Build 1 lần, dùng mọi nơi.",
          "3 primitives: Tools (functions), Resources (data), Prompts (templates).",
          "Client (AI app) ↔ Server (tool wrapper) qua JSON-RPC 2.0. Stdio (local) hoặc SSE (remote).",
          "Open standard (MIT): 1000+ community servers, nhiều clients (Claude, Cursor, Windsurf).",
          "Giảm từ N x M integrations xuống N + M — giống USB chuẩn hoá thiết bị.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
