"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "structured-outputs",
  title: "Structured Outputs",
  titleVi: "Đầu ra có cấu trúc",
  description:
    "Kỹ thuật đảm bảo LLM sinh ra JSON, XML hoặc schema cố định thay vì văn bản tự do.",
  category: "emerging",
  tags: ["json-mode", "schema", "constrained-decoding"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "prompt-engineering", "guardrails"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// Types for the schema enforcer visualization
// ---------------------------------------------------------------------------

type FieldType = "string" | "integer" | "number" | "boolean";

interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  description: string;
}

interface ParsedToken {
  field: string;
  value: string;
  type: FieldType;
  status: "ok" | "coerced" | "missing" | "extra";
  note?: string;
}

interface ParseResult {
  tokens: ParsedToken[];
  leadingNoise: string;
  trailingNoise: string;
  success: boolean;
  rawLength: number;
}

interface FailurePattern {
  id: string;
  title: string;
  snippet: string;
  why: string;
  fix: string;
}

interface RawExample {
  label: string;
  value: string;
  hint: string;
}

// ---------------------------------------------------------------------------
// Schema definition (kept stable so the viz is predictable)
// ---------------------------------------------------------------------------

const TARGET_SCHEMA: SchemaField[] = [
  {
    name: "name",
    type: "string",
    required: true,
    description: "Tên sản phẩm, giữ nguyên chữ hoa/thường của input",
  },
  {
    name: "price",
    type: "integer",
    required: true,
    description: "Giá bán bằng VND, chỉ chấp nhận số nguyên",
  },
  {
    name: "category",
    type: "string",
    required: true,
    description: "Danh mục (food | drink | other)",
  },
  {
    name: "in_stock",
    type: "boolean",
    required: true,
    description: "Còn hàng hay hết, bắt buộc là true hoặc false",
  },
];

const RAW_EXAMPLES: RawExample[] = [
  {
    label: "Có text thừa trước JSON",
    value:
      'Đây là thông tin sản phẩm bạn yêu cầu:\n{"name": "Phở bò", "price": 65000, "category": "food", "in_stock": true}',
    hint: "LLM thân thiện thêm câu mào đầu — khiến JSON.parse() văng lỗi ngay token đầu tiên.",
  },
  {
    label: "Price là chuỗi kèm đơn vị",
    value:
      '{"name": "Cà phê sữa", "price": "35.000đ", "category": "drink", "in_stock": true}',
    hint: "Schema yêu cầu integer nhưng LLM trả về string có 'đ'. Code downstream sẽ +/−/× sai.",
  },
  {
    label: "Thiếu field required",
    value: '{"name": "Bánh mì", "price": 25000, "category": "food"}',
    hint: "in_stock bị bỏ sót. Nếu code mặc định null thì dashboard hiển thị 'chưa rõ' — khách hàng confused.",
  },
  {
    label: "Field thừa ngoài schema",
    value:
      '{"name": "Trà đào", "price": 45000, "category": "drink", "in_stock": true, "rating": 4.8, "notes": "best seller"}',
    hint: "LLM sáng tạo thêm rating, notes. Strict mode sẽ reject — free-form sẽ đẩy dữ liệu lạ vào DB.",
  },
  {
    label: "Boolean là chữ",
    value:
      '{"name": "Trà sữa trân châu", "price": 40000, "category": "drink", "in_stock": "còn hàng"}',
    hint: "in_stock phải là true/false. 'còn hàng' sẽ coerce sai → if (in_stock) luôn true (string truthy).",
  },
  {
    label: "Markdown fence bao quanh",
    value:
      '```json\n{"name": "Sinh tố bơ", "price": 40000, "category": "drink", "in_stock": true}\n```',
    hint: "Code fence là sát thủ của JSON.parse(). Strict mode không sinh fence — đây là output free-form điển hình.",
  },
  {
    label: "JSON đúng 100%",
    value:
      '{"name": "Bánh cuốn", "price": 35000, "category": "food", "in_stock": true}',
    hint: "Baseline: output clean không noise, đủ field, đúng type. Đây là cái strict mode ép LLM phải đạt.",
  },
];

const FAILURE_PATTERNS: FailurePattern[] = [
  {
    id: "prefix-suffix",
    title: "Lời mào đầu / kết",
    snippet: '"Đây là JSON:\\n{...}"  hoặc  "{...}\\nChúc bạn thành công!"',
    why: "LLM được huấn luyện để lịch sự. Nó thêm câu xã giao khiến JSON không còn bắt đầu bằng `{` hoặc `[`.",
    fix: "Bật JSON mode hoặc strict schema. Backup: dùng regex tìm `{.*}` cuối cùng nhưng chỉ là tạm.",
  },
  {
    id: "markdown-fence",
    title: "Code fence ```json",
    snippet: "```json\\n{...}\\n```",
    why: "Copilot-style outputs hay bọc JSON trong code fence. Parser vanilla sẽ lỗi ngay ba backtick đầu.",
    fix: "Strict mode không bao giờ thêm fence. Nếu không có, strip ```json ... ``` trước khi parse.",
  },
  {
    id: "type-drift",
    title: "Ép kiểu lệch (string vs number)",
    snippet: '"price": "65.000đ"  thay vì  "price": 65000',
    why: "LLM follow 'tự nhiên' → thêm dấu chấm, đơn vị. Downstream toán học (+, compare) sẽ vỡ.",
    fix: "Schema khai báo integer. Constrained decoding từ chối token non-digit tại vị trí này.",
  },
  {
    id: "missing-required",
    title: "Thiếu field required",
    snippet: '{ "name": "X", "price": 1 }  →  thiếu category, in_stock',
    why: "Với temperature cao hoặc prompt dài, LLM bỏ sót field. Code mặc định null → UI broken.",
    fix: "Strict schema: grammar bắt buộc xuất hiện đủ keys trước khi đóng `}`.",
  },
  {
    id: "hallucinated-extra",
    title: "Thêm field ngoài schema",
    snippet: '{ ..., "confidence": 0.93, "notes": "best seller" }',
    why: "LLM 'nhiệt tình' đề xuất thêm. DB insert có additional_columns strict sẽ reject.",
    fix: "Schema với additionalProperties: false. Constrained decoder loại token mở key ngoài schema.",
  },
  {
    id: "trailing-comma",
    title: "Trailing comma / single quote",
    snippet: "{ 'name': 'Phở', }",
    why: "LLM học từ JS/Python — dấu phẩy cuối và nháy đơn là hợp lệ ở đó, không hợp lệ trong JSON.",
    fix: "Grammar JSON chuẩn loại trừ nháy đơn và trailing comma tự động.",
  },
  {
    id: "enum-drift",
    title: "Enum bị sáng tạo",
    snippet: '"category": "food-and-drink"  (schema chỉ có food | drink | other)',
    why: "Khi enum không chặt, LLM có thể tổ hợp giá trị mới. Downstream switch/case không có case này → undefined.",
    fix: "Dùng enum strict. Constrained decoder chỉ cho phép token trong tập enum đã compile sẵn.",
  },
  {
    id: "nested-collapse",
    title: "Nested object bị flatten",
    snippet: '"address.city": "Hà Nội"  thay vì  "address": { "city": "Hà Nội" }',
    why: "Với schema lồng nhiều lớp, LLM đôi khi flatten bằng dấu chấm — phá cấu trúc consumer expect.",
    fix: "Strict mode ép đúng structure. Nếu không dùng strict, validate với JSON schema validator trước khi consume.",
  },
];

// ---------------------------------------------------------------------------
// Parser helpers — deterministic, no external deps
// ---------------------------------------------------------------------------

function findJsonSlice(raw: string): {
  start: number;
  end: number;
  slice: string;
} {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return { start: -1, end: -1, slice: "" };
  }
  return {
    start: firstBrace,
    end: lastBrace,
    slice: raw.slice(firstBrace, lastBrace + 1),
  };
}

function safeParse(slice: string): Record<string, unknown> | null {
  try {
    const cleaned = slice
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // fall back to a forgiving parser for demo only
    const out: Record<string, unknown> = {};
    const pairRegex = /"([^"]+)"\s*:\s*("[^"]*"|true|false|-?\d+(?:\.\d+)?)/g;
    let match: RegExpExecArray | null;
    while ((match = pairRegex.exec(slice)) !== null) {
      const [, k, v] = match;
      if (v.startsWith('"')) out[k] = v.slice(1, -1);
      else if (v === "true") out[k] = true;
      else if (v === "false") out[k] = false;
      else out[k] = Number(v);
    }
    return Object.keys(out).length ? out : null;
  }
}

function coerceField(
  field: SchemaField,
  rawValue: unknown,
): { value: string; status: ParsedToken["status"]; note?: string } {
  if (rawValue === undefined) {
    return {
      value: "∅",
      status: "missing",
      note: "Không xuất hiện trong output",
    };
  }
  switch (field.type) {
    case "string": {
      if (typeof rawValue === "string") {
        return { value: `"${rawValue}"`, status: "ok" };
      }
      return {
        value: `"${String(rawValue)}"`,
        status: "coerced",
        note: `Đã ép ${typeof rawValue} → string`,
      };
    }
    case "integer": {
      if (typeof rawValue === "number" && Number.isInteger(rawValue)) {
        return { value: String(rawValue), status: "ok" };
      }
      if (typeof rawValue === "number") {
        return {
          value: String(Math.round(rawValue)),
          status: "coerced",
          note: "Làm tròn float thành integer",
        };
      }
      if (typeof rawValue === "string") {
        const digits = rawValue.replace(/[^0-9-]/g, "");
        const n = Number(digits);
        if (!Number.isNaN(n) && digits.length > 0) {
          return {
            value: String(n),
            status: "coerced",
            note: `"${rawValue}" → ${n}`,
          };
        }
      }
      return {
        value: String(rawValue),
        status: "coerced",
        note: "Không thể ép về integer",
      };
    }
    case "number": {
      if (typeof rawValue === "number") {
        return { value: String(rawValue), status: "ok" };
      }
      return {
        value: String(rawValue),
        status: "coerced",
        note: "Không phải số",
      };
    }
    case "boolean": {
      if (typeof rawValue === "boolean") {
        return { value: String(rawValue), status: "ok" };
      }
      if (typeof rawValue === "string") {
        const truthy = ["true", "còn", "có", "yes", "1", "in stock", "còn hàng"];
        const falsy = ["false", "hết", "không", "no", "0", "out of stock"];
        const low = rawValue.toLowerCase();
        if (truthy.some((t) => low.includes(t))) {
          return {
            value: "true",
            status: "coerced",
            note: `"${rawValue}" → true (heuristic)`,
          };
        }
        if (falsy.some((t) => low.includes(t))) {
          return {
            value: "false",
            status: "coerced",
            note: `"${rawValue}" → false (heuristic)`,
          };
        }
      }
      return {
        value: String(rawValue),
        status: "coerced",
        note: "Không ép được về boolean",
      };
    }
  }
}

function parseRaw(raw: string, schema: SchemaField[]): ParseResult {
  const { start, end, slice } = findJsonSlice(raw);
  const leadingNoise = start > 0 ? raw.slice(0, start) : "";
  const trailingNoise = end >= 0 && end < raw.length - 1 ? raw.slice(end + 1) : "";
  const parsed = slice ? safeParse(slice) : null;
  if (!parsed) {
    return {
      tokens: schema.map((f) => ({
        field: f.name,
        value: "∅",
        type: f.type,
        status: "missing",
        note: "Không parse được JSON",
      })),
      leadingNoise,
      trailingNoise,
      success: false,
      rawLength: raw.length,
    };
  }
  const tokens: ParsedToken[] = schema.map((f) => {
    const result = coerceField(f, parsed[f.name]);
    return {
      field: f.name,
      type: f.type,
      value: result.value,
      status: result.status,
      note: result.note,
    };
  });
  const extraKeys = Object.keys(parsed).filter(
    (k) => !schema.some((f) => f.name === k),
  );
  extraKeys.forEach((k) => {
    tokens.push({
      field: k,
      value: JSON.stringify(parsed[k]),
      type: "string",
      status: "extra",
      note: "Không có trong schema — strict mode sẽ reject",
    });
  });
  const success = tokens.every((t) => t.status === "ok");
  return { tokens, leadingNoise, trailingNoise, success, rawLength: raw.length };
}

// ---------------------------------------------------------------------------
// Visualization component
// ---------------------------------------------------------------------------

function SchemaEnforcerViz() {
  const [rawInput, setRawInput] = useState<string>(RAW_EXAMPLES[0].value);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(true);

  const handleParse = useCallback(() => {
    setResult(parseRaw(rawInput, TARGET_SCHEMA));
  }, [rawInput]);

  const handleReset = useCallback(() => {
    setResult(null);
    setRawInput("");
  }, []);

  const statusColor = useCallback((status: ParsedToken["status"]): string => {
    switch (status) {
      case "ok":
        return "border-green-400/60 bg-green-500/10 text-green-700 dark:text-green-300";
      case "coerced":
        return "border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case "missing":
        return "border-red-400/60 bg-red-500/10 text-red-700 dark:text-red-300";
      case "extra":
        return "border-purple-400/60 bg-purple-500/10 text-purple-700 dark:text-purple-300";
    }
  }, []);

  const coercedCount = useMemo(() => {
    if (!result) return 0;
    return result.tokens.filter((t) => t.status === "coerced").length;
  }, [result]);

  const missingCount = useMemo(() => {
    if (!result) return 0;
    return result.tokens.filter((t) => t.status === "missing").length;
  }, [result]);

  const extraCount = useMemo(() => {
    if (!result) return 0;
    return result.tokens.filter((t) => t.status === "extra").length;
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Bộ thực thi JSON schema
          </h3>
          <p className="text-xs text-tertiary mt-1">
            Dán output thô của LLM và xem cách schema ràng buộc từng token.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Strict mode (constrained decoding)
        </label>
      </div>

      {/* Preset examples */}
      <div className="flex flex-wrap gap-2">
        {RAW_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setRawInput(ex.value);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-md border border-border bg-surface text-xs text-muted hover:text-foreground hover:border-accent/40 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw LLM output input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Raw LLM output
            </span>
            <span className="text-[10px] text-tertiary">
              {rawInput.length} ký tự
            </span>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              setResult(null);
            }}
            rows={10}
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-card p-3 font-mono text-xs text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder='Dán text LLM sinh ra ở đây, ví dụ: {"name": "Phở", ...}'
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={rawInput.trim().length === 0}
              className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Parse theo schema
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-md border border-border text-sm text-muted hover:text-foreground transition-colors"
            >
              Xoá
            </button>
          </div>
        </div>

        {/* Target schema */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Target JSON schema
          </span>
          <div className="rounded-lg border border-border bg-card p-3 font-mono text-[11px] text-foreground space-y-1">
            <div>{"{"}</div>
            <div className="pl-4">
              <span className="text-purple-500">&quot;type&quot;</span>:{" "}
              <span className="text-amber-500">&quot;object&quot;</span>,
            </div>
            <div className="pl-4">
              <span className="text-purple-500">
                &quot;additionalProperties&quot;
              </span>
              :{" "}
              <span className="text-blue-500">
                {strictMode ? "false" : "true"}
              </span>
              ,
            </div>
            <div className="pl-4">
              <span className="text-purple-500">&quot;required&quot;</span>: [
              {TARGET_SCHEMA.filter((f) => f.required).map((f, i, arr) => (
                <span key={f.name} className="text-green-500">
                  &quot;{f.name}&quot;
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
              ],
            </div>
            <div className="pl-4">
              <span className="text-purple-500">&quot;properties&quot;</span>: {"{"}
            </div>
            {TARGET_SCHEMA.map((f) => (
              <div key={f.name} className="pl-8">
                <span className="text-green-500">&quot;{f.name}&quot;</span>:{" "}
                {"{"} <span className="text-purple-500">type</span>:{" "}
                <span className="text-amber-500">&quot;{f.type}&quot;</span> {"}"}
              </div>
            ))}
            <div className="pl-4">{"}"}</div>
            <div>{"}"}</div>
          </div>
          <ul className="text-[11px] text-tertiary space-y-1">
            {TARGET_SCHEMA.map((f) => (
              <li key={f.name}>
                <span className="text-foreground font-medium">{f.name}</span> —{" "}
                {f.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Parse output */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              className={`px-2 py-1 rounded-md border ${
                result.success
                  ? "border-green-400/60 bg-green-500/10 text-green-700 dark:text-green-300"
                  : "border-red-400/60 bg-red-500/10 text-red-700 dark:text-red-300"
              }`}
            >
              {result.success ? "Parse OK" : "Parse có vấn đề"}
            </span>
            {result.leadingNoise.trim().length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                Thừa {result.leadingNoise.length} ký tự trước JSON
              </span>
            )}
            {result.trailingNoise.trim().length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                Thừa {result.trailingNoise.length} ký tự sau JSON
              </span>
            )}
            <span className="text-muted">
              {coercedCount} coerce · {missingCount} thiếu · {extraCount} thừa
            </span>
          </div>

          {/* Token → field animation */}
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              Token matched to schema fields
            </div>
            <div className="space-y-2">
              {result.tokens.map((tok, i) => (
                <motion.div
                  key={`${tok.field}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.2 }}
                  className={`flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-xs ${statusColor(
                    tok.status,
                  )}`}
                >
                  <span className="font-mono font-semibold min-w-[6rem]">
                    {tok.field}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    :: {tok.type}
                  </span>
                  <span className="font-mono flex-1 truncate">{tok.value}</span>
                  <span className="uppercase tracking-wider text-[10px] font-bold">
                    {tok.status}
                  </span>
                  {tok.note && (
                    <span className="w-full text-[10px] opacity-80">
                      {tok.note}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Strict vs loose verdict */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Nếu KHÔNG có schema
              </div>
              <p className="text-xs text-foreground">
                Output thô vào code → {result.leadingNoise.length > 0 ? "JSON.parse() throws" : "parse OK"}{" "}
                nhưng {coercedCount + missingCount + extraCount} field chưa chắc đúng type/cấu trúc.
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Với strict schema
              </div>
              <p className="text-xs text-foreground">
                {strictMode
                  ? "Constrained decoding CHẶN từng token lệch schema — output luôn match 100%."
                  : "Strict mode đang tắt — bật lên để thấy sự khác biệt."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Failure patterns reference */}
      <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Các kiểu fail phổ biến
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FAILURE_PATTERNS.map((p) => (
            <div
              key={p.id}
              className="rounded-md border border-border bg-surface p-3 space-y-1"
            >
              <div className="text-xs font-semibold text-foreground">
                {p.title}
              </div>
              <div className="font-mono text-[10px] text-amber-600 dark:text-amber-400 whitespace-pre-wrap">
                {p.snippet}
              </div>
              <div className="text-[11px] text-muted">
                <span className="font-semibold">Vì sao:</span> {p.why}
              </div>
              <div className="text-[11px] text-green-600 dark:text-green-400">
                <span className="font-semibold">Fix:</span> {p.fix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-border bg-card/40 p-3 text-[11px] text-muted flex flex-wrap items-center gap-3">
        <span className="font-semibold text-foreground">Chú thích:</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-green-400/60 bg-green-500/20" />
          OK — đúng schema
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-amber-400/60 bg-amber-500/20" />
          Coerced — ép kiểu được nhưng nguy hiểm
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-red-400/60 bg-red-500/20" />
          Missing — field bắt buộc bị thiếu
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-purple-400/60 bg-purple-500/20" />
          Extra — field không có trong schema
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz questions (8)
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question: "Constrained decoding đảm bảo JSON hợp lệ bằng cách nào?",
    options: [
      "Parse JSON sau khi sinh và retry nếu sai",
      "Tại MỖI BƯỚC sinh token, chỉ cho phép tokens tạo JSON hợp lệ (mask invalid tokens trước softmax)",
      "Dùng regex kiểm tra output",
    ],
    correct: 1,
    explanation:
      "Constrained decoding: tại mỗi step, grammar/schema xác định tokens hợp lệ tiếp theo. Mask các token không hợp lệ trước softmax cho 100% guarantee JSON valid. Không cần retry!",
  },
  {
    question: "Khi nào dùng structured outputs thay vì free-form text?",
    options: [
      "Luôn dùng structured outputs vì an toàn hơn",
      "Khi output cần được xử lý tự động bởi code (API response, database insert, UI rendering)",
      "Chỉ khi output là số",
    ],
    correct: 1,
    explanation:
      "Structured outputs cần thiết khi: (1) downstream code cần parse output (JSON cho API), (2) cần validate schema (required fields), (3) cần type safety (string vs number). Free-form tốt cho: creative writing, chat, giải thích.",
  },
  {
    question: "JSON schema strict mode trong API làm gì?",
    options: [
      "Kiểm tra JSON sau khi sinh",
      "Đảm bảo output LUÔN khớp CHÍNH XÁC với schema đã định nghĩa — mọi field, mọi type, không thừa không thiếu",
      "Chỉ hỗ trợ JSON đơn giản",
    ],
    correct: 1,
    explanation:
      "Strict mode: constrained decoding theo schema. Mọi field required sẽ có, mọi field type sẽ đúng, không có field ngoài schema. 100% compliance — không cần try-catch JSON parse.",
  },
  {
    question:
      "Output LLM: 'Đây là JSON:\\n{\"name\":\"A\"}'. Vì sao JSON.parse() ném lỗi?",
    options: [
      "Vì field 'name' sai",
      "Vì chuỗi bắt đầu bằng text 'Đây là JSON' — parser gặp ký tự không hợp lệ ngay vị trí 0",
      "Vì thiếu dấu ngoặc nhọn",
    ],
    correct: 1,
    explanation:
      "JSON.parse() yêu cầu input phải là JSON hợp lệ từ đầu đến cuối. Bất kỳ ký tự nào ngoài whitespace trước `{` đều khiến parser ném SyntaxError ở position 0.",
  },
  {
    question:
      "Schema khai báo price là integer nhưng LLM trả '35.000đ'. Strict mode làm gì?",
    options: [
      "Chấp nhận và ép thành 35000",
      "Không cho phép token chữ/ký hiệu xuất hiện ở vị trí price — chỉ digit được unmask",
      "Báo lỗi sau khi sinh xong",
    ],
    correct: 1,
    explanation:
      "Trong strict constrained decoding, tại vị trí value của price (integer) grammar chỉ cho phép các token digit (0-9) và dấu trừ. Token 'đ' có logit bị mask về -inf trước softmax nên không thể được chọn.",
  },
  {
    question: "additionalProperties: false trong JSON schema để làm gì?",
    options: [
      "Không cho phép field nào ngoài schema — loại bỏ hallucinated keys",
      "Bắt buộc tất cả field phải có giá trị",
      "Tắt JSON mode",
    ],
    correct: 0,
    explanation:
      "additionalProperties: false ngăn LLM 'sáng tạo' thêm field ngoài schema (ví dụ rating, notes). Constrained decoder sau khi đóng các required keys sẽ chỉ được phép sinh `}` — không mở key mới.",
  },
  {
    question: "Overhead của constrained decoding so với free-form?",
    options: [
      "Tăng latency 2-3x",
      "Thường dưới 5% do việc build grammar mask trước và cache theo state",
      "Không đo được",
    ],
    correct: 1,
    explanation:
      "Các engine hiện đại (Outlines, LM Format Enforcer, vLLM) tiền xử lý schema thành FSM/grammar và cache mask theo state hiện tại. Overhead thực tế thường < 5% throughput.",
  },
  {
    type: "fill-blank",
    question:
      "Để ép LLM trả về đúng cấu trúc, ta mô tả output bằng một {blank} (ví dụ sinh từ lớp {blank} trong Python) rồi bật strict mode trên API.",
    blanks: [
      { answer: "JSON schema", accept: ["JSON Schema", "schema", "json-schema"] },
      {
        answer: "Pydantic",
        accept: ["pydantic", "BaseModel", "pydantic BaseModel"],
      },
    ],
    explanation:
      "Flow chuẩn: định nghĩa lớp Pydantic BaseModel → gọi Model.model_json_schema() để lấy JSON schema → truyền schema này cho API với strict mode. LLM sẽ bị ràng buộc sinh output khớp chính xác schema.",
  },
];

// ---------------------------------------------------------------------------
// Topic component
// ---------------------------------------------------------------------------

export default function StructuredOutputsTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
        <PredictionGate
          question="Bạn yêu cầu LLM trả về danh sách sản phẩm JSON. 95% lần được JSON đúng, 5% lần LLM thêm 'Đây là danh sách...' trước JSON khiến code parse lỗi. Giải pháp?"
          options={[
            "Thêm 'chỉ trả về JSON' vào prompt — vẫn không 100%",
            "Dùng structured outputs (constrained decoding): đảm bảo 100% output là JSON hợp lệ theo schema",
            "Parse và retry khi lỗi",
          ]}
          correct={1}
          explanation="Prompt engineering chỉ giảm lỗi, không triệt để. Structured outputs dùng constrained decoding: tại mỗi bước sinh token, chỉ cho phép tokens tạo JSON hợp lệ. 100% guarantee — giống điền form (chỉ chấp nhận format đúng) thay vì viết thư tự do."
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={6} label="Khám phá">
        <VisualizationSection>
          <SchemaEnforcerViz />
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={6} label="Khoảnh khắc Aha">
        <AhaMoment>
          Structured outputs giống <strong>điền form</strong> thay vì{" "}
          <strong>viết thư</strong>. Form chỉ chấp nhận đúng format (tên, email,
          số điện thoại). Thư tự do có thể viết bất kỳ gì. LLM với constrained
          decoding = <strong>form thông minh</strong> — luôn cho output đúng
          schema, 100% parseable! Đây cũng chính là cơ chế dưới{" "}
          <TopicLink slug="function-calling">function calling</TopicLink>, và là
          cách đáng tin cậy hơn nhiều so với chỉ dựa vào{" "}
          <TopicLink slug="prompt-engineering">prompt engineering</TopicLink> để
          xin JSON.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={6} label="Thử thách">
        <InlineChallenge
          question="Bạn cần LLM extract thông tin từ CV: tên, email, kinh nghiệm (list), kỹ năng (list). Schema có 4 trường required. Không có structured outputs, 1000 CVs có bao nhiêu sẽ parse lỗi?"
          options={[
            "0 — LLM luôn trả về JSON đúng",
            "30-100 CVs (3-10%) sẽ có format lỗi: thiếu trường, sai type, text thừa",
            "Tất cả đều lỗi",
          ]}
          correct={1}
          explanation="Không có structured outputs: 3-10% failure rate là bình thường. Với 4 trường x 1000 CVs, có thể 50-100 records lỗi. Trong production: 5% failure = 50 customers nhận lỗi/ngày. Structured outputs: 0% failure."
        />

        <InlineChallenge
          question="Team bạn đang dùng 'parse → nếu lỗi thì retry' cho 1M requests/ngày, retry rate 7%. Chi phí thêm lớn nhất là gì?"
          options={[
            "Chi phí server frontend",
            "Gấp đôi token cost cho 70k requests + tăng latency p95 vì phải chờ roundtrip 2 lần",
            "Tốn nhân lực viết regex",
          ]}
          correct={1}
          explanation="Retry loop: mỗi request fail phải sinh lại toàn bộ output → 2x output tokens cho 7% requests = 7% × 2 = 14% cost tăng. Latency p95 xấu hẳn vì p95 users luôn rơi vào nhóm retry. Strict schema giải quyết gốc rễ."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={6} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Structured Outputs</strong> đảm bảo LLM sinh output theo
            schema cố định (JSON, XML) thay vì văn bản tự do — thiết yếu cho
            production systems.
          </p>
          <p>
            <strong>3 cấp độ đảm bảo:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Prompt-based:</strong> &quot;Trả về JSON&quot; — khoảng
              90-95% compliance. Không đủ cho production
            </li>
            <li>
              <strong>JSON mode:</strong> Đảm bảo valid JSON nhưng không đảm bảo
              schema. Khoảng 98%
            </li>
            <li>
              <strong>Schema-strict:</strong> Constrained decoding theo schema.
              100% compliance
            </li>
          </ul>

          <Callout variant="tip" title="Constrained Decoding hoạt động thế nào">
            Tại mỗi step sinh token: context-free grammar (JSON schema →
            grammar) xác định set tokens hợp lệ. Mask tokens không hợp lệ trước
            softmax. Overhead: dưới 5% latency. Tools: Outlines, LM Format
            Enforcer, vLLM built-in, Anthropic tool_use, OpenAI response_format.
          </Callout>

          <Callout variant="warning" title="Bẫy: schema quá rộng">
            Nếu schema cho phép cả string và number cho cùng một field (union
            type), LLM sẽ tận dụng để output cái dễ hơn — và downstream code vẫn
            phải branch. Luôn chọn ONE type nhỏ nhất đủ dùng.
          </Callout>

          <Callout variant="info" title="Khi nào KHÔNG cần strict mode">
            Free-form tốt hơn khi: (1) output cho người đọc (giải thích, chat),
            (2) độ sáng tạo quan trọng hơn format, (3) câu trả lời có thể dài
            tuỳ ý. Ép JSON ở đây sẽ giảm chất lượng văn phong.
          </Callout>

          <Callout variant="warning" title="Strict mode không thay được validation">
            Schema đảm bảo shape, không đảm bảo semantics. LLM vẫn có thể trả
            price = 1 (âm thầm sai) nếu model hallucinate. Luôn kèm rule
            business ở layer sau (price &gt; 0, category ∈ enum).
          </Callout>

          <LaTeX block>
            {
              "P(\\text{token}_t \\mid \\text{schema}, \\text{prefix}) \\propto \\mathbb{1}[\\text{token}_t \\in \\mathcal{V}_{\\text{valid}}] \\cdot \\exp(z_t)"
            }
          </LaTeX>

          <p className="text-xs text-muted">
            Ý nghĩa: với constrained decoding, xác suất token ngoài tập hợp lệ
            được đặt về 0 trước softmax. Những token hợp lệ được chuẩn hoá lại
            — phân phối vẫn &quot;mượt&quot; nhưng không bao giờ rời khỏi grammar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Cấp 1 · Prompt
              </div>
              <div className="text-xs text-foreground mt-1">
                &quot;Chỉ trả JSON, không giải thích&quot;
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                ~90-95% compliance
              </div>
              <div className="text-[10px] text-tertiary mt-1">
                Rẻ, dễ thử. Không đủ cho production.
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Cấp 2 · JSON mode
              </div>
              <div className="text-xs text-foreground mt-1">
                response_format: {'{'} type: &quot;json_object&quot; {'}'}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                ~98% (JSON valid, schema không)
              </div>
              <div className="text-[10px] text-tertiary mt-1">
                Đảm bảo parse được, không đảm bảo field đúng.
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Cấp 3 · Schema-strict
              </div>
              <div className="text-xs text-foreground mt-1">
                strict: true + JSON schema
              </div>
              <div className="text-[11px] text-green-600 dark:text-green-400 mt-1">
                100% match schema
              </div>
              <div className="text-[10px] text-tertiary mt-1">
                Constrained decoding — chuẩn cho production.
              </div>
            </div>
          </div>

          <TabView
            tabs={[
              {
                label: "Pydantic + Anthropic",
                content: (
                  <CodeBlock language="python" title="structured_outputs.py">
                    {`import anthropic
from pydantic import BaseModel, Field

client = anthropic.Anthropic()

class Product(BaseModel):
    name: str = Field(description="Tên sản phẩm")
    price: int = Field(description="Giá VND (integer)")
    category: str = Field(description="food | drink | other")
    in_stock: bool

class ProductList(BaseModel):
    products: list[Product]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": (
            "Extract sản phẩm từ menu: "
            "Phở bò 65.000đ, Cơm tấm 55.000đ (hết hàng), Bún chả 50.000đ"
        ),
    }],
    tools=[{
        "name": "output_products",
        "description": "Output danh sách sản phẩm",
        "input_schema": ProductList.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "output_products"},
)
# response.content[0].input là JSON đảm bảo match schema`}
                  </CodeBlock>
                ),
              },
              {
                label: "OpenAI strict",
                content: (
                  <CodeBlock language="python" title="openai_strict.py">
                    {`from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

class Product(BaseModel):
    name: str
    price: int
    category: str
    in_stock: bool

response = client.responses.parse(
    model="gpt-5",
    input="Extract: Phở bò 65.000đ, Cơm tấm (hết)",
    text_format=Product,  # SDK tự convert sang JSON schema strict
)

# response.output_parsed là Product object đã validate`}
                  </CodeBlock>
                ),
              },
              {
                label: "Outlines (OSS)",
                content: (
                  <CodeBlock language="python" title="outlines_local.py">
                    {`import outlines
from pydantic import BaseModel

class Product(BaseModel):
    name: str
    price: int
    category: str
    in_stock: bool

model = outlines.models.transformers("mistralai/Mistral-7B-v0.3")
generator = outlines.generate.json(model, Product)

result = generator("Phở bò 65.000đ còn hàng")
# Local model, 100% schema-valid, không cần API`}
                  </CodeBlock>
                ),
              },
            ]}
          />

          <CollapsibleDetail title="Deep dive: grammar → finite state machine">
            <p className="text-sm">
              Một JSON schema được compile thành context-free grammar, sau đó
              lazily chuyển sang pushdown automaton. Mỗi bước decode, engine
              biết state hiện tại (ví dụ: đang trong string value của key
              &quot;price&quot;, chờ integer đóng bằng dấu phẩy hoặc{" "}
              <code>&rbrace;</code>). Từ
              state này sinh ra một mask boolean có độ dài = vocab size. Mask
              được AND với logits trước softmax.
            </p>
            <p className="text-sm">
              Chi phí build mask cho mỗi state được cache. Với vocab 128K và
              grammar cỡ vài chục states, bộ nhớ cache không đáng kể so với
              KV-cache của transformer.
            </p>
            <p className="text-sm">
              Điểm quan trọng: mask được áp sau khi logits được tính — tức là
              model vẫn &quot;nghĩ&quot; tự nhiên, nhưng chỉ được chọn trong
              tập hợp lệ. Đây là vì sao chất lượng semantic gần như không đổi.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Schema versioning trong production">
            <p className="text-sm">
              Schema không phải bất biến: thêm field, bỏ field, thay type đều
              xảy ra. Nguyên tắc:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Thêm field optional:</strong> backward-compatible. Bump
                minor version.
              </li>
              <li>
                <strong>Bỏ field:</strong> bump major. Giữ 2 version song song
                cho đến khi consumer migrate xong.
              </li>
              <li>
                <strong>Đổi type:</strong> luôn major. Coi như bỏ + thêm.
              </li>
              <li>
                <strong>Thêm enum value:</strong> có thể coerce ngược nếu
                consumer có default branch.
              </li>
            </ul>
            <p className="text-sm">
              Thực tế nhiều team lưu schema trong repo Git và pin version vào
              prompt: &quot;use schema v3.1&quot;. Dễ rollback khi cần.
            </p>
          </CollapsibleDetail>

          <p className="mt-4">
            <strong>Khi schema trở nên phức tạp:</strong> nested objects, arrays
            of objects, enum với hàng chục giá trị — tất cả đều hỗ trợ. Nhưng
            càng phức tạp, mask càng lớn, và model cũng khó &quot;nhớ&quot;
            thứ tự. Mẹo thực tế: flatten schema khi có thể, dùng enum thay vì
            free string cho category-like fields.
          </p>

          <p>
            <strong>So sánh với function calling:</strong> cả hai cùng dùng một
            cơ chế schema-strict. Function calling chỉ là structured outputs
            với thêm ngữ cảnh &quot;đây là một tool cần gọi&quot;. Nếu chỉ cần
            extract data, dùng structured outputs trực tiếp gọn hơn. Nếu cần
            LLM chọn giữa nhiều action, function calling với tool_choice =
            auto là lựa chọn đúng.
          </p>

          <p>
            <strong>Đo lường compliance trong production:</strong> thêm metric
            &quot;schema_parse_failures_total&quot; vào observability stack.
            Với strict mode, con số này phải xấp xỉ 0 — nếu tăng đột biến là
            dấu hiệu API provider đang có vấn đề, không phải bug ở code bạn.
          </p>

          <div className="rounded-lg border border-border bg-surface p-4 mt-4 space-y-2">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Checklist trước khi ship extract-pipeline có LLM
            </div>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted">
              <li>
                Schema định nghĩa bằng Pydantic/Zod, commit vào repo với version.
              </li>
              <li>
                Bật strict mode / response_format schema ở layer client.
              </li>
              <li>
                additionalProperties: false để chặn hallucinated keys.
              </li>
              <li>
                Business validation layer sau LLM (price &gt; 0, enum membership).
              </li>
              <li>
                Metric schema_parse_failures_total = 0 là điều kiện deploy.
              </li>
              <li>
                Sample 1% output lưu raw để debug khi regress.
              </li>
            </ul>
          </div>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={6} label="Tổng kết">
        <MiniSummary
          points={[
            "Structured outputs đảm bảo LLM sinh JSON/schema cố định — thiết yếu cho production (0% parse error)",
            "3 cấp: Prompt (khoảng 95%), JSON mode (khoảng 98%), Schema-strict (100% constrained decoding)",
            "Constrained decoding: mask invalid tokens tại mỗi step trước softmax, dưới 5% overhead",
            "Dùng Pydantic BaseModel → model_json_schema() để tự generate schema từ class Python",
            "additionalProperties: false để chặn LLM hallucinated extra keys — strict hơn nữa",
            "Schema đảm bảo SHAPE, không đảm bảo SEMANTICS — vẫn cần business validation layer sau",
          ]}
        />
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
