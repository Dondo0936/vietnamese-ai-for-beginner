"use client";

import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

export const metadata: TopicMeta = {
  slug: "context-window-in-long-documents",
  title: "Context Window in Long Documents",
  titleVi: "Cửa sổ Ngữ cảnh trong Tài liệu Dài",
  description:
    "Claude và Gemini xử lý PDF hàng trăm trang: cửa sổ ngữ cảnh 100K+ token thay đổi cách làm việc với tài liệu",
  category: "llm-concepts",
  tags: ["context-window", "long-documents", "application"],
  difficulty: "beginner",
  relatedSlugs: ["context-window"],
  vizType: "static",
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
      title:
        "Anthropic's Claude Sonnet 4 Model Gets a 1M Token Context Window",
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

export default function ContextWindowInLongDocuments() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Cửa sổ Ngữ cảnh"
    >
      <ApplicationHero
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <p>
          Năm 2023, Anthropic ra mắt Claude 2 với cửa sổ ngữ cảnh 100.000
          token &mdash; gấp 25 lần so với GPT-3.5. Lần đầu tiên, người dùng
          có thể tải lên một bản hợp đồng 200 trang hoặc một cuốn sách dày
          và hỏi AI bất kỳ câu hỏi nào về nội dung, mà AI đọc được toàn bộ.
        </p>
        <p>
          Google Gemini 1.5 Pro nâng cửa sổ lên 1 triệu token, và Anthropic
          sau đó mở rộng Claude lên 1 triệu token &mdash; với độ chính xác
          truy xuất đạt 90% trên toàn bộ cửa sổ. Đây là bước nhảy vọt biến
          AI từ trợ lý trả lời câu hỏi ngắn thành công cụ phân tích tài liệu
          chuyên sâu.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="context-window-in-long-documents">
        <p>
          Cửa sổ ngữ cảnh (context window) là giới hạn số lượng token (đơn vị
          văn bản nhỏ nhất &mdash; một từ tiếng Anh trung bình khoảng 1,3
          token) mà mô hình có thể &ldquo;nhìn thấy&rdquo; cùng lúc. Token
          bao gồm cả đầu vào (câu hỏi + tài liệu) và đầu ra (câu trả lời).
        </p>
        <p>
          GPT-3.5 chỉ có cửa sổ 4.096 token &mdash; tương đương khoảng 6
          trang giấy A4. Khi người dùng cần AI phân tích hợp đồng dài, báo cáo
          tài chính, hoặc cơ sở mã nguồn lớn, mô hình đơn giản là không đủ
          &ldquo;bộ nhớ&rdquo; để đọc toàn bộ.
        </p>
        <p>
          Người dùng buộc phải cắt tài liệu thành từng đoạn nhỏ, hỏi AI từng
          phần một, rồi tự tổng hợp &mdash; mất thời gian và dễ bỏ sót thông
          tin quan trọng.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <Beat step={1}>
          <p>
            <strong>Claude 2 mở đường với 100K token.</strong> Năm 2023,
            Anthropic ra mắt Claude 2 với cửa sổ 100.000 token, cho phép xử lý
            khoảng 75.000 từ &mdash; tương đương một cuốn tiểu thuyết ngắn.
            Người dùng lần đầu có thể tải lên toàn bộ tài liệu pháp lý hoặc
            báo cáo nghiên cứu và đặt câu hỏi xuyên suốt.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Gemini nâng lên 1 triệu token.</strong> Google Gemini 1.5
            Pro hỗ trợ cửa sổ 1 triệu token (thử nghiệm 2 triệu), cho phép
            phân tích hàng nghìn trang tài liệu, video dài hàng giờ, hoặc toàn
            bộ cơ sở mã nguồn trong một lần truy vấn.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Claude mở rộng lên 1 triệu token với giá cố
            định.</strong>{" "}
            Anthropic mở rộng Claude Opus và Sonnet lên 1 triệu token, với
            điểm khác biệt quan trọng: giá mỗi token không tăng khi cửa sổ
            lớn hơn. Token thứ 900.000 có giá bằng token thứ 100 &mdash; loại
            bỏ rào cản chi phí cho tài liệu dài.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Độ chính xác truy xuất đạt 90%.</strong> Anthropic báo cáo
            Claude Opus 4.6 đạt độ chính xác truy xuất (retrieval accuracy
            &mdash; khả năng tìm đúng thông tin trong tài liệu dài) 90% trên
            toàn bộ cửa sổ 1 triệu token, giải quyết vấn đề &ldquo;mất
            thông tin ở giữa&rdquo; (lost in the middle) mà nhiều mô hình
            khác gặp phải.
          </p>
        </Beat>
      </ApplicationMechanism>

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

      <ApplicationCounterfactual
        parentTitleVi="Cửa sổ Ngữ cảnh"
        topicSlug="context-window-in-long-documents"
      >
        <p>
          Nếu cửa sổ ngữ cảnh vẫn giới hạn ở vài nghìn token, AI sẽ mãi là
          công cụ trả lời câu hỏi ngắn &mdash; không thể phân tích hợp đồng,
          đánh giá báo cáo tài chính, hay hiểu toàn bộ cơ sở mã nguồn. Người
          dùng sẽ phải tiếp tục cắt tài liệu thành từng mảnh nhỏ.
        </p>
        <p>
          Cửa sổ ngữ cảnh 1 triệu token đã biến AI từ trợ lý hỏi-đáp thành
          đối tác phân tích tài liệu, có khả năng đọc và hiểu lượng thông tin
          tương đương một chuyên gia nghiên cứu đọc trong nhiều ngày.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
