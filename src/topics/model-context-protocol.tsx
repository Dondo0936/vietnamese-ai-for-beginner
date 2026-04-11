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
  titleVi: "Giao thuc ngu canh mo hinh",
  description:
    "Giao thuc chuan hoa ket noi LLM voi cong cu va nguon du lieu ben ngoai",
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
      question: "MCP giai quyet van de gi ma function calling thong thuong khong giai quyet?",
      options: [
        "Goi function nhanh hon",
        "CHUAN HOA giao thuc: moi LLM (Claude, GPT, Gemini) va moi tool (Slack, DB, GitHub) noi cung 'ngon ngu' → build 1 lan, dung moi noi",
        "Ho tro nhieu ngon ngu lap trinh hon",
      ],
      correct: 1,
      explanation: "Truoc MCP: moi LLM co cach goi tool rieng, moi tool can adapter rieng cho moi LLM → N x M integrations. MCP: chuan hoa → moi tool build 1 MCP server, moi LLM connect toi bat ky MCP server nao → N + M integrations. Giong USB cho AI!",
    },
    {
      question: "MCP Server va MCP Client la gi?",
      options: [
        "Server = LLM, Client = tool",
        "Server = cung cap tools/resources/prompts. Client = ung dung AI ket noi den servers (vi du: Claude Desktop)",
        "Server va Client giong nhau",
      ],
      correct: 1,
      explanation: "MCP Server: wrap tool/data thanh giao dien chuan (expose tools, resources, prompts). MCP Client: AI app (Claude Desktop, Cursor) ket noi den nhieu servers. 1 Client ket noi nhieu Servers — giong 1 laptop cam nhieu USB devices.",
    },
    {
      question: "MCP transport dung gi de giao tiep?",
      options: [
        "REST API thong thuong",
        "JSON-RPC 2.0 qua stdio (local) hoac SSE (remote) — bidirectional, async",
        "GraphQL",
      ],
      correct: 1,
      explanation: "MCP dung JSON-RPC 2.0: lightweight, bidirectional. Stdio transport: cho local servers (Claude Desktop ↔ local tool). SSE (Server-Sent Events): cho remote servers. Khong dung REST vi can bidirectional communication (server co the push notifications).",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Ban muon Claude ket noi voi Slack, Google Calendar, va PostgreSQL. Moi tool can adapter rieng. Neu chuyen sang GPT, phai viet lai het. Co cach nao build 1 lan dung moi noi?"
          options={[
            "Khong — moi LLM co cach goi tool khac nhau",
            "MCP (Model Context Protocol): chuan hoa giao thuc, moi tool build 1 MCP server, moi LLM client deu ket noi duoc",
            "Dung REST API la du",
          ]}
          correct={1}
          explanation="MCP la 'USB cho AI'! Truoc day: N LLMs x M tools = N*M integrations. Voi MCP: N + M. Moi tool build 1 MCP server (chuan), moi AI app (Claude, Cursor) la MCP client → ket noi bat ky server nao. Build once, use everywhere!"
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Click vao <strong className="text-foreground">tool</strong>{" "}
          de xem cach MCP ket noi LLM voi cac dich vu ben ngoai.
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
                Moi tool = 1 MCP Server | AI app ket noi bat ky server nao qua MCP
              </text>
              <text x={300} y={180} textAnchor="middle" fill="#64748b" fontSize={8}>
                Build 1 lan, dung cho Claude, GPT, Gemini, Cursor, ... — giong USB cho AI
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            Truoc MCP: moi LLM x moi tool = integration rieng. 5 LLMs x 10 tools = 50 integrations.
            Voi MCP: 5 LLMs + 10 tools = <strong>15 implementations</strong>{" "}(5 clients + 10 servers).
            Giong cach USB chuan hoa ket noi thiet bi — <strong>build once, connect everywhere</strong>!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Ban build MCP server cho PostgreSQL database noi bo cong ty. Ai co the dung server nay?"
          options={[
            "Chi Claude Desktop (vi Anthropic tao MCP)",
            "Bat ky MCP client nao: Claude Desktop, Cursor, Windsurf, hoac app tu build — vi MCP la open standard",
            "Chi cac app cua Anthropic",
          ]}
          correct={1}
          explanation="MCP la open standard (MIT license)! Bat ky ai cung co the build client hoac server. Da co: Claude Desktop, Cursor, Windsurf, Continue, Sourcegraph Cody lam MCP clients. 1000+ community MCP servers tren GitHub. Ecosystem dang phat trien rat nhanh."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>Model Context Protocol (MCP)</strong>{" "}
            la giao thuc chuan hoa de ket noi LLM voi tools va data sources — 'USB cho AI'.
          </p>
          <p><strong>3 primitives chinh:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Tools:</strong>{" "}Functions ma LLM co the goi (query DB, send Slack, create file)</li>
            <li><strong>Resources:</strong>{" "}Data ma LLM co the doc (files, database records, API responses)</li>
            <li><strong>Prompts:</strong>{" "}Template prompts co tham so (reusable workflows)</li>
          </ul>

          <Callout variant="tip" title="MCP vs Function Calling">
            Function calling: LLM-specific (OpenAI format khac Anthropic format). MCP: chuan hoa cho TAT CA LLMs. Function calling la cach LLM goi tool. MCP la cach TOOLS expose chuc nang cho bat ky LLM nao.
          </Callout>

          <p><strong>Architecture:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>MCP Client:</strong>{" "}AI app (Claude Desktop, Cursor) — initiate connections</li>
            <li><strong>MCP Server:</strong>{" "}Wrap tool/data — expose tools, resources, prompts</li>
            <li><strong>Transport:</strong>{" "}stdio (local) hoac SSE (remote). JSON-RPC 2.0</li>
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
            description="Chay SQL query tren PostgreSQL",
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

# Chay server — bat ky MCP client nao deu ket noi duoc
# Claude Desktop, Cursor, Windsurf, custom app...
if __name__ == "__main__":
    import mcp
    mcp.run(server, transport="stdio")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "MCP chuan hoa ket noi LLM voi tools — 'USB cho AI'. Build 1 lan, dung moi noi.",
          "3 primitives: Tools (functions), Resources (data), Prompts (templates).",
          "Client (AI app) ↔ Server (tool wrapper) qua JSON-RPC 2.0. Stdio (local) hoac SSE (remote).",
          "Open standard (MIT): 1000+ community servers, nhieu clients (Claude, Cursor, Windsurf).",
          "Giam tu N x M integrations xuong N + M — giong USB chuan hoa thiet bi.",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
