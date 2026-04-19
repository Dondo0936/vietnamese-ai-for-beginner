"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  ToggleCompare,
  Callout,
  ProgressSteps,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "context-window-in-long-documents",
  title: "Context Window in Long Documents",
  titleVi: "Cửa sổ Ngữ cảnh trong Tài liệu Dài",
  description:
    "Claude và Gemini xử lý PDF hàng trăm trang: cửa sổ ngữ cảnh 100K+ token thay đổi cách làm việc với tài liệu",
  category: "llm-concepts",
  tags: ["context-window", "long-documents", "application"],
  difficulty: "advanced",
  relatedSlugs: ["context-window"],
  vizType: "interactive",
  applicationOf: "context-window",
  featuredApp: {
    name: "Claude / Gemini",
    productFeature: "Long Document Processing (100K+ tokens)",
    company: "Anthropic / Google",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Context windows — Claude API Docs",
      publisher: "Anthropic",
      url: "https://platform.claude.com/docs/en/build-with-claude/context-windows",
      date: "2025-01",
      kind: "documentation",
    },
    {
      title: "Anthropic's Claude Sonnet 4 Model Gets a 1M Token Context Window",
      publisher: "The New Stack",
      url: "https://thenewstack.io/anthropics-claude-sonnet-4-model-gets-a-1m-token-context-window/",
      date: "2025-06",
      kind: "news",
    },
    {
      title:
        "Claude's 1 Million Context Window: What Changed and When It's Worth Using",
      publisher: "Karo Zieminski (Substack)",
      url: "https://karozieminski.substack.com/p/claude-1-million-context-window-guide-2026",
      date: "2026-01",
      kind: "documentation",
    },
    {
      title:
        "Claude Opus 4.6 Context Window, Long Projects, Large Files, and 1M-Token Workflows",
      publisher: "DataStudios",
      url: "https://www.datastudios.org/post/claude-opus-4-6-context-window-long-projects-large-files-and-1m-token-workflows-what-anthropic-s",
      date: "2026-03",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

// ─────────────────────────────────────────────────────────────────
// DATA — Dòng thời gian mở rộng context window 2022 → 2026
// ─────────────────────────────────────────────────────────────────
type TimelinePoint = {
  year: string;
  model: string;
  tokens: number; // để scale thanh log
  label: string;
  pages: string;
  color: string;
};

const TIMELINE: TimelinePoint[] = [
  {
    year: "2022",
    model: "GPT-3.5 bản đầu",
    tokens: 4_000,
    label: "4K",
    pages: "≈ 6 trang A4",
    color: "#EF4444",
  },
  {
    year: "2023",
    model: "GPT-4 bản 32K",
    tokens: 32_000,
    label: "32K",
    pages: "≈ 50 trang",
    color: "#F97316",
  },
  {
    year: "2024",
    model: "Claude 3.5 Sonnet",
    tokens: 200_000,
    label: "200K",
    pages: "≈ 310 trang",
    color: "#8B5CF6",
  },
  {
    year: "2025",
    model: "Gemini 1.5 Pro · Claude Sonnet 4",
    tokens: 1_000_000,
    label: "1M",
    pages: "≈ 1.500 trang",
    color: "#3B82F6",
  },
  {
    year: "2026",
    model: "Gemini 1.5 Pro (bản 2M)",
    tokens: 2_000_000,
    label: "2M",
    pages: "≈ 3.100 trang",
    color: "#0EA5E9",
  },
];

// Dòng số đếm động — được animate khi người dùng cuộn tới
type Counter = {
  target: number;
  unit: string;
  label: string;
  hint: string;
};

const COUNTERS: Counter[] = [
  {
    target: 1_000_000,
    unit: "token",
    label: "context của Claude Sonnet 4 (bản 1M)",
    hint: "≈ 1.500 trang A4 hoặc 750.000 từ tiếng Anh",
  },
  {
    target: 90,
    unit: "%",
    label: "độ chính xác truy xuất trong tài liệu dài",
    hint: "Anthropic công bố cho Opus 4.6 trên toàn cửa sổ 1M token",
  },
  {
    target: 250,
    unit: "lần",
    label: "chênh lệch so với GPT-3.5 chỉ sau 3 năm",
    hint: "Từ 4.000 token (2022) lên 1.000.000 token (2025)",
  },
  {
    target: 60,
    unit: "tiếng",
    label: "video có thể đưa trực tiếp cho Gemini 1.5 Pro",
    hint: "Hoặc 11 giờ audio, 30.000 dòng code — cùng một cửa sổ",
  },
];

// Simple counter that animates from 0 → target on mount
function AnimatedNumber({
  target,
  unit,
  duration = 1.6,
}: {
  target: number;
  unit: string;
  duration?: number;
}) {
  const [val, setVal] = useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf: number;
    function step(now: number) {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return (
    <span className="font-mono">
      {val.toLocaleString("vi-VN")}
      <span className="ml-1 text-base font-semibold text-muted">{unit}</span>
    </span>
  );
}

export default function ContextWindowInLongDocuments() {
  // Tính log scale cho timeline bar để thang đo không bị 2M nuốt chửng các mốc nhỏ
  const timelineBars = useMemo(() => {
    const maxLog = Math.log10(TIMELINE[TIMELINE.length - 1].tokens);
    return TIMELINE.map((t) => ({
      ...t,
      widthPct: Math.max(10, (Math.log10(t.tokens) / maxLog) * 100),
    }));
  }, []);

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Cửa sổ Ngữ cảnh">
      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO — Dòng thời gian mở rộng context                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <ApplicationHero
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <p>
          Năm 2023, Anthropic ra mắt Claude 2 với cửa sổ ngữ cảnh 100.000 token —
          gấp 25 lần so với GPT-3.5. Lần đầu tiên, bạn có thể tải lên một bản hợp
          đồng 200 trang hoặc một cuốn sách dày và hỏi AI bất kỳ câu hỏi nào về
          nội dung, mà AI đọc được toàn bộ trong một lần.
        </p>
        <p>
          Google Gemini 1.5 Pro nâng cửa sổ lên 1 triệu token. Anthropic sau đó
          cũng mở rộng Claude Sonnet 4 và Opus 4.6 lên 1 triệu token, với độ chính
          xác truy xuất đạt <strong>90% trên toàn bộ cửa sổ</strong>. Đây là bước
          nhảy biến AI từ trợ lý hỏi-đáp thành công cụ phân tích tài liệu cho dân
          văn phòng.
        </p>

        <div className="not-prose mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Cuộc chạy đua context window 2022 → 2026
            </h3>
            <span className="text-[11px] text-tertiary">thang đo log · 4K → 2M</span>
          </div>

          <div className="space-y-3">
            {timelineBars.map((p, i) => (
              <div key={p.year} className="flex items-center gap-3">
                <div className="w-12 shrink-0 text-xs font-semibold text-muted">
                  {p.year}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground">{p.model}</span>
                    <span className="font-mono text-tertiary">
                      {p.label} token · {p.pages}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: p.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.widthPct}%` }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.65, delay: i * 0.12, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-muted leading-relaxed">
            <strong className="text-foreground">Ý nghĩa thực tế:</strong> năm 2022
            AI chỉ đọc được một email dài. Ba năm sau, cùng một mô hình có thể đọc
            hết cuốn &quot;Chiến tranh và Hòa bình&quot; (hơn 1.200 trang) trong
            một lần.
          </div>
        </div>
      </ApplicationHero>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PROBLEM — So sánh cũ vs mới                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <ApplicationProblem topicSlug="context-window-in-long-documents">
        <p>
          Cửa sổ ngữ cảnh (context window) là giới hạn số lượng token — đơn vị
          chữ nhỏ nhất, mỗi từ tiếng Anh khoảng 1,3 token — mà mô hình có thể
          &quot;nhìn thấy&quot; cùng lúc. Quan trọng: con số này <strong>bao gồm
          cả câu hỏi, tài liệu bạn gửi lẫn câu trả lời của AI</strong>.
        </p>
        <p>
          GPT-3.5 năm 2022 chỉ có cửa sổ 4.096 token — tương đương khoảng 6 trang
          A4. Khi bạn là nhân viên văn phòng cần AI phân tích một hợp đồng 80
          trang, một báo cáo tài chính quý hay một email chuỗi dài, mô hình đơn
          giản không đủ &quot;bàn làm việc&quot; để đọc hết.
        </p>

        <div className="not-prose my-5">
          <ToggleCompare
            labelA="Thời GPT-3.5 (4K token)"
            labelB="Thời Claude / Gemini (1M token)"
            description="Cùng một công việc thật: tóm tắt báo cáo tài chính 500 trang."
            childA={
              <div className="space-y-3 text-sm leading-relaxed">
                <div className="rounded-lg border border-red-300/60 bg-red-50 dark:bg-red-950/30 p-3">
                  <strong className="text-red-700 dark:text-red-300">
                    Cách làm bắt buộc:
                  </strong>{" "}
                  chia 500 trang thành 10 phần, gửi từng phần riêng lẻ, nhận 10
                  bản tóm tắt nhỏ, rồi tự gộp thành một bản tóm tắt cuối.
                </div>
                <ul className="list-disc pl-5 space-y-1 text-foreground">
                  <li>Ít nhất <strong>10 prompt riêng</strong> cho cùng một file</li>
                  <li>Mỗi phần AI không biết phần khác nói gì → dễ mâu thuẫn</li>
                  <li>Bạn phải tự làm &quot;biên tập viên&quot; gộp kết quả</li>
                  <li>Mất 60–90 phút; dễ bỏ sót khi phần hay nằm ở giữa file</li>
                </ul>
              </div>
            }
            childB={
              <div className="space-y-3 text-sm leading-relaxed">
                <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <strong className="text-emerald-700 dark:text-emerald-300">
                    Cách làm mới:
                  </strong>{" "}
                  kéo toàn bộ PDF 500 trang vào một prompt duy nhất với Claude
                  hoặc Gemini. Đặt câu hỏi trực tiếp: &quot;Tóm tắt, so sánh biên
                  lợi nhuận theo quý, nêu 3 rủi ro lớn nhất&quot;.
                </div>
                <ul className="list-disc pl-5 space-y-1 text-foreground">
                  <li><strong>1 prompt duy nhất</strong>, AI đọc cả 500 trang</li>
                  <li>AI hiểu mạch liên kết giữa các chương — không mâu thuẫn</li>
                  <li>Bạn chỉ cần đọc và xác nhận bản tóm tắt cuối</li>
                  <li>Mất 3–8 phút; có thể hỏi tiếp tự nhiên dựa trên cùng bối cảnh</li>
                </ul>
              </div>
            }
          />
        </div>

        <p>
          Trước năm 2023, thói quen &quot;cắt tài liệu thành mảnh vừa ăn&quot; là
          kỹ năng bắt buộc khi làm việc với AI. Hàng triệu nhân viên văn phòng,
          luật sư, kế toán, nhân viên chăm sóc khách hàng đều rơi vào quy trình
          này mỗi ngày — tốn thời gian và dễ mất ý.
        </p>
      </ApplicationProblem>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MECHANISM — 4 Beats                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <ApplicationMechanism
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <Beat step={1}>
          <div className="not-prose mb-3">
            <ProgressSteps
              current={1}
              total={4}
              labels={[
                "Claude 2: mở đường",
                "Gemini: nhảy 10×",
                "Claude 1M: cố định giá",
                "90% chính xác",
              ]}
            />
          </div>
          <p>
            <strong>Claude 2 mở đường với 100K token (2023).</strong> Anthropic ra
            mắt mô hình thương mại đầu tiên có cửa sổ 100.000 token — khoảng
            75.000 từ, tương đương một cuốn tiểu thuyết ngắn hoặc một bản hợp đồng
            dày. Lần đầu tiên người dùng có thể tải toàn bộ tài liệu pháp lý hay
            báo cáo nghiên cứu và đặt câu hỏi xuyên suốt mà không cần cắt nhỏ.
          </p>
          <div className="not-prose mt-3 rounded-lg border border-border bg-surface/60 p-3 text-xs text-muted leading-relaxed">
            Trước đó, GPT-4 bản phổ thông chỉ có 8K token, bản 32K phải đăng ký
            riêng. Bước nhảy lên 100K là một trật tự độ lớn — lần đầu &quot;AI
            đọc tài liệu&quot; trở thành thao tác ai cũng dùng được.
          </div>
        </Beat>

        <Beat step={2}>
          <div className="not-prose mb-3">
            <ProgressSteps
              current={2}
              total={4}
              labels={[
                "Claude 2: mở đường",
                "Gemini: nhảy 10×",
                "Claude 1M: cố định giá",
                "90% chính xác",
              ]}
            />
          </div>
          <p>
            <strong>Gemini 1.5 Pro nâng lên 1 triệu token (2024–2025).</strong>{" "}
            Google công bố Gemini 1.5 Pro hỗ trợ cửa sổ 1 triệu token (bản
            nghiên cứu thử nghiệm tới 2 triệu), cho phép phân tích:
          </p>
          <div className="not-prose mt-3 grid gap-2 sm:grid-cols-2 text-xs">
            {[
              { icon: "1.500", unit: "trang A4", tail: "tài liệu hay sách" },
              { icon: "11", unit: "giờ", tail: "audio ghi âm cuộc họp" },
              { icon: "60", unit: "phút", tail: "video có lời thoại" },
              { icon: "30.000", unit: "dòng", tail: "mã nguồn phần mềm" },
            ].map((x) => (
              <div
                key={x.tail}
                className="rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="text-lg font-bold text-accent">
                  {x.icon}
                  <span className="ml-1 text-xs text-muted">{x.unit}</span>
                </div>
                <div className="text-tertiary mt-0.5">{x.tail}</div>
              </div>
            ))}
          </div>
          <p className="mt-3">
            trong <strong>cùng một cửa sổ</strong>. Không còn phải chọn giữa âm
            thanh, văn bản hay mã nguồn — AI đọc chung tất cả.
          </p>
        </Beat>

        <Beat step={3}>
          <div className="not-prose mb-3">
            <ProgressSteps
              current={3}
              total={4}
              labels={[
                "Claude 2: mở đường",
                "Gemini: nhảy 10×",
                "Claude 1M: cố định giá",
                "90% chính xác",
              ]}
            />
          </div>
          <p>
            <strong>Claude Sonnet 4 / Opus 4.6 mở rộng 1 triệu token với giá cố
            định (2025–2026).</strong> Anthropic mở rộng dòng Claude lên 1 triệu
            token, với một điểm khác biệt quan trọng cho doanh nghiệp: giá mỗi
            token <em>không tăng</em> khi cửa sổ lớn hơn — token thứ 900.000 có
            giá bằng token thứ 100.
          </p>
          <div className="not-prose mt-3">
            <ToggleCompare
              labelA="Cũ: giá tăng theo độ dài"
              labelB="Mới: giá cố định mỗi token"
              description="Cùng một tác vụ: phân tích 800 trang báo cáo (≈ 560K token)."
              childA={
                <div className="text-sm leading-relaxed">
                  Nhiều nhà cung cấp trước đây tính phí &quot;long context&quot;
                  cao hơn 2–4 lần. Một tác vụ 500K token có thể mất{" "}
                  <strong>vài USD mỗi lần chạy</strong> — không đủ rẻ để dùng
                  hằng ngày.
                </div>
              }
              childB={
                <div className="text-sm leading-relaxed">
                  Với giá cố định, 500K token có giá bằng 500K token bình thường.
                  Phòng pháp chế, kế toán, nhân sự có thể <strong>đưa AI đọc
                  tài liệu dài như một quy trình hằng ngày</strong>, không phải
                  sự kiện đặc biệt.
                </div>
              }
            />
          </div>
        </Beat>

        <Beat step={4}>
          <div className="not-prose mb-3">
            <ProgressSteps
              current={4}
              total={4}
              labels={[
                "Claude 2: mở đường",
                "Gemini: nhảy 10×",
                "Claude 1M: cố định giá",
                "90% chính xác",
              ]}
            />
          </div>
          <p>
            <strong>Độ chính xác truy xuất đạt 90%.</strong> Anthropic báo cáo
            Claude Opus 4.6 đạt độ chính xác truy xuất — khả năng tìm đúng thông
            tin cụ thể trong tài liệu rất dài — ở mức 90% trên toàn bộ cửa sổ 1
            triệu token, giảm đáng kể vấn đề &quot;mất thông tin ở phần
            giữa&quot; mà nhiều mô hình trước đây gặp phải.
          </p>
          <div className="not-prose mt-3 rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">
              So sánh độ chính xác khi tìm lại thông tin trong tài liệu dài
            </div>
            <div className="space-y-2">
              {[
                { name: "Claude 2 (2023)", pct: 72, color: "#F59E0B" },
                { name: "GPT-4 Turbo 128K (2024)", pct: 78, color: "#A78BFA" },
                { name: "Gemini 1.5 Pro 1M", pct: 87, color: "#3B82F6" },
                { name: "Claude Opus 4.6 (2026)", pct: 90, color: "#10B981" },
              ].map((r, i) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{r.name}</span>
                    <span className="font-mono font-semibold text-foreground">
                      {r.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: r.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.pct}%` }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-muted leading-relaxed">
              Số càng cao, AI càng ít bỏ sót thông tin. Ngưỡng 90% là mức mà một
              chuyên gia văn phòng có thể dựa vào — nhưng vẫn nên kiểm tra lại
              các con số quan trọng trước khi gửi sếp.
            </div>
          </div>
        </Beat>
      </ApplicationMechanism>

      {/* ────────────────────────────────────────────────────────── */}
      {/* METRICS — Số đếm động                                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="context-window-in-long-documents"
      >
        <Metric
          value="1 triệu token context window — tương đương khoảng 750.000 từ hoặc 1.500 trang"
          sourceRef={2}
        />
        <Metric
          value="90% độ chính xác truy xuất trên toàn bộ cửa sổ 1 triệu token"
          sourceRef={4}
        />
        <Metric
          value="Gấp 250 lần so với GPT-3.5 (4.096 token) chỉ trong 3 năm"
          sourceRef={3}
        />
      </ApplicationMetrics>

      {/* Bảng số đếm trực quan bổ sung — không thay thế ApplicationMetrics */}
      <section className="not-prose mb-12">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Những con số đáng nhớ
            </h3>
            <span className="text-[11px] text-tertiary">(cuộn vào để chạy)</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {COUNTERS.map((c, i) => (
              <motion.div
                key={c.label}
                className="rounded-xl border border-border bg-background/40 p-4"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div className="text-3xl font-bold text-accent">
                  <AnimatedNumber target={c.target} unit={c.unit} />
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {c.label}
                </div>
                <div className="mt-0.5 text-xs text-tertiary leading-relaxed">
                  {c.hint}
                </div>
              </motion.div>
            ))}
          </div>

          <Callout variant="tip" title="Mẹo dùng cho người Việt">
            <p>
              Cửa sổ 1M token &quot;hiệu quả&quot; cho tiếng Việt thường bằng
              khoảng <strong>60–70%</strong> con số quảng cáo, vì tiếng Việt tốn
              thêm token cho dấu. Với Claude 1M, bạn có thể yên tâm thả{" "}
              <strong>1.000–1.200 trang tiếng Việt</strong> vào mà không lo tràn.
            </p>
          </Callout>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* COUNTERFACTUAL — Nếu không có 1M context                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <ApplicationCounterfactual
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <p>
          Nếu cửa sổ ngữ cảnh vẫn bị giới hạn ở vài nghìn token, AI sẽ mãi là
          công cụ trả lời những câu hỏi ngắn. Không ai dám tin tưởng giao cho AI
          một hợp đồng, một báo cáo tài chính hay một vụ án pháp lý — vì nó chưa
          từng đọc hết. Người dùng sẽ tiếp tục cắt tài liệu thành những mảnh
          vụn, tự mình đóng vai biên tập viên.
        </p>

        <div className="not-prose my-5">
          <ToggleCompare
            labelA="Không có 1M context"
            labelB="Có 1M context"
            description="Một ngày làm việc điển hình của trưởng phòng pháp chế."
            childA={
              <div className="space-y-3 text-sm leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Nhận hợp đồng 120 trang — <strong>dành 2 giờ</strong> chia
                    nhỏ, hỏi AI từng phần
                  </li>
                  <li>
                    Báo cáo tuân thủ 80 trang — không đủ giờ đọc kỹ, chỉ lướt
                    qua mục lục
                  </li>
                  <li>
                    Sổ tay nhân sự 300 trang — &quot;thôi kệ, khi nào cần tra
                    cứu thì mở tay&quot;
                  </li>
                  <li>
                    Các cuộc họp ghi âm → không bao giờ được chuyển thành ghi
                    chú có ích
                  </li>
                </ul>
                <p className="text-muted">
                  Kết quả: nhiều quyết định được đưa ra mà người ra quyết định
                  <strong> không thực sự đọc</strong> tài liệu gốc.
                </p>
              </div>
            }
            childB={
              <div className="space-y-3 text-sm leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Hợp đồng 120 trang — <strong>6 phút</strong>: AI liệt kê 5
                    điều khoản bất thường, bạn tập trung đọc đúng chỗ
                  </li>
                  <li>
                    Báo cáo tuân thủ 80 trang — hỏi tự do: &quot;còn vướng gì so
                    với Nghị định 13?&quot; trong cùng một phiên
                  </li>
                  <li>
                    Sổ tay nhân sự 300 trang — trả lời câu hỏi nhân viên tức
                    thời thay vì mở đi mở lại tay
                  </li>
                  <li>
                    Audio họp 2 giờ — đưa thẳng cho Gemini, có ngay biên bản +
                    việc cần làm
                  </li>
                </ul>
                <p className="text-muted">
                  Kết quả: người ra quyết định thật sự{" "}
                  <strong>hiểu sâu tài liệu</strong> trước khi ký.
                </p>
              </div>
            }
          />
        </div>

        <p>
          Cửa sổ ngữ cảnh 1 triệu token đã biến AI từ một trợ lý hỏi-đáp thành
          đối tác phân tích tài liệu, với khả năng đọc và hiểu lượng thông tin
          tương đương một chuyên gia nghiên cứu mất nhiều ngày. Trong ba năm,
          công việc &quot;đọc tài liệu dài&quot; đã chuyển từ mấy giờ đồng hồ
          xuống vài phút — và điều đó thay đổi nghề của rất nhiều người Việt
          Nam làm việc với tài liệu hằng ngày.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
