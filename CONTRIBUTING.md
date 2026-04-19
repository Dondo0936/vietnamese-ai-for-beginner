# Đóng góp cho "AI cho mọi người"

## **DÀNH CHO AI AGENT**

**Nếu bạn là trợ lý lập trình AI (Claude, Cursor, Copilot…) đang giúp người dùng đóng góp một chủ đề, hãy đọc HẾT file này trước khi viết một dòng code.** Tài liệu này được viết để AI agent hiểu và tuân thủ đúng convention của project. Mọi mục đều rõ ràng và dễ parse. Đừng đoán — cứ theo spec.

---

## Bắt đầu nhanh

```bash
# 1. Fork repo trên GitHub, rồi clone fork về máy
git clone https://github.com/<your-username>/vietnamese-ai-for-beginner.git
cd vietnamese-ai-for-beginner

# 2. Cài dependency
pnpm install

# 3. Thiết lập biến môi trường
cp .env.local.example .env.local
# Điền Supabase credential (xem README.md)

# 4. Chạy dev server
pnpm dev
# Mở http://localhost:3000

# 5. Tạo file topic từ template
cp src/topics/_template.tsx src/topics/your-slug.tsx
```

---

## Nguyên tắc vàng

**Người học tự khám phá trước khi được "dạy".**

Mỗi bài học phải dẫn người học tự suy luận về khái niệm trước khi ta giải thích. Đưa ra một câu đố, cho họ tương tác, để họ đưa ra giả thuyết — rồi xác nhận hoặc sửa. Giải thích đến SAU khoảnh khắc "à ra thế", không phải trước. Một bài giảng thụ động không tính là topic.

### Cách sai (giải thích rồi mới show):

```tsx
{/* KHÔNG LÀM NHƯ THẾ NÀY */}
<ExplanationSection>
  <p>Softmax biến đổi vector thành xác suất bằng cách lấy e^x rồi chia cho tổng.</p>
</ExplanationSection>
<VisualizationSection>
  {/* Biểu đồ tĩnh */}
</VisualizationSection>
```

### Cách đúng (thách thức → khám phá → giải thích):

```tsx
{/* LÀM NHƯ THẾ NÀY */}
<PredictionGate
  question="Cho 3 giá trị [2, 1, 0.1], nếu muốn biến thành xác suất (tổng = 1), bạn nghĩ giá trị lớn nhất sẽ chiếm bao nhiêu %?"
  options={["33%", "59%", "71%", "90%"]}
  correct={2}
  explanation="Softmax cho giá trị 2 chiếm ~71% — nó khuếch đại sự khác biệt, không chỉ chia đều!"
>
  {/* Visualization tương tác chỉ hiện ra SAU khi người dùng dự đoán */}
  <SoftmaxVisualization />
</PredictionGate>
```

---

## Cấu trúc file topic

### Vị trí file

`src/topics/[slug].tsx` — mỗi chủ đề là một file. Tên file dùng kebab-case, trùng với `slug`.

### Export bắt buộc

Mỗi file topic phải export đúng hai thứ:

#### 1. Named export: `metadata: TopicMeta`

```ts
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: string;           // kebab-case, trùng tên file (vd: "softmax-function")
  title: string;          // tiêu đề tiếng Anh (vd: "Softmax Function")
  titleVi: string;        // tiêu đề tiếng Việt (vd: "Hàm Softmax")
  description: string;    // mô tả tiếng Việt, 1–2 câu
  category: string;       // một trong 14 category slug (xem registry.ts)
  tags: string[];         // tag liên quan để hỗ trợ tìm kiếm
  difficulty: Difficulty; // "beginner" | "intermediate" | "advanced"
  relatedSlugs: string[]; // slug các chủ đề liên quan
  vizType: VizType;       // "interactive" | "static" (ưu tiên "interactive")
  icon?: string;          // tùy chọn — tên icon lucide
};
```

#### 2. Default export: React component

```tsx
export default function YourTopicNameTopic() {
  return (
    <>
      {/* Nội dung bài học dùng các primitive */}
    </>
  );
}
```

### Đăng ký topic

Thêm metadata vào mảng `topicList` trong `src/topics/registry.ts`, đặt đúng mục category tương ứng.

### Bố cục 8 bước (khuyến nghị)

Áp dụng cho mọi chủ đề. Không cần mỗi bước một section riêng — một số bước có thể gộp — nhưng *thứ tự* phải giữ nguyên.

| Bước | Tên | Mục đích | Primitive thường dùng |
|------|------|---------|-------------------|
| 1 | **HOOK** | Ẩn dụ thực tế Việt Nam định hình khái niệm | `AnalogyCard` |
| 2 | **DISCOVER** | Người dùng dự đoán trước khi xem gì | `PredictionGate` |
| 3 | **REVEAL** | Hình minh hoạ tương tác thể hiện khái niệm | SVG thủ công + `SliderGroup` / `CanvasPlayground` |
| 4 | **DEEPEN** | Bóc tách cơ chế từng bước | `StepReveal` hoặc `BuildUp` |
| 5 | **CHALLENGE** | Kiểm tra giữa bài — người học áp dụng điều vừa học | `InlineChallenge` |
| 6 | **EXPLAIN** | Giải thích chính thức (giờ mới được dùng toán/code!) | `ExplanationSection` + `CodeBlock` |
| 7 | **CONNECT** | Liên kết sang các khái niệm liên quan | `MiniSummary` + `Callout` |
| 8 | **QUIZ** | Đánh giá cuối bài | `QuizSection` (2+ câu) |

---

## Primitive có sẵn

Import từ barrel `@/components/interactive` hoặc từng file riêng ở `@/components/interactive/[Name]`.

```tsx
import { PredictionGate, SliderGroup, AhaMoment } from "@/components/interactive";
```

Các wrapper cấp topic nằm ở `@/components/topic/`:

```tsx
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
```

### Nhóm khám phá

| Tên | Import | Mô tả |
|------|--------|-------------|
| `PredictionGate` | `@/components/interactive/PredictionGate` | Người dùng chọn một dự đoán; children bên trong chỉ hiện khi đã trả lời. Props: `question: string`, `options: string[]`, `correct: number`, `explanation: string`, `children?: ReactNode`. |
| `StepReveal` | `@/components/interactive/StepReveal` | Hiển thị tiến tiến từng bước kèm nút "Tiếp tục". Props: `children: ReactNode[]`, `labels?: string[]`. |
| `BuildUp` | `@/components/interactive/BuildUp` | Tích luỹ từng mảnh ghép để xây khái niệm. Props: `children: ReactNode[]`, `labels?: string[]`, `addLabel?: string`. |

### Nhóm thao tác

| Tên | Import | Mô tả |
|------|--------|-------------|
| `SliderGroup` | `@/components/interactive/SliderGroup` | Một/nhiều slider điều khiển visualization qua render-prop. Props: `sliders: SliderConfig[]`, `visualization: (values: Record<string, number>) => ReactNode`, `title?: string`. Mỗi `SliderConfig`: `{ key, label, min, max, step?, defaultValue, unit? }`. |
| `ToggleCompare` | `@/components/interactive/ToggleCompare` | Toggle A/B so sánh hai trạng thái. Props: `labelA: string`, `labelB: string`, `childA: ReactNode`, `childB: ReactNode`, `description?: string`. |
| `DragDrop` | `@/components/interactive/DragDrop` | Kéo item vào các vùng phân loại. Props: `items: DragItem[]`, `zones: DropZone[]`, `instruction?: string`, `onComplete?: (correct: boolean) => void`. Mỗi `DragItem`: `{ id, label }`. Mỗi `DropZone`: `{ id, label, accepts: string[] }`. |
| `Reorderable` | `@/components/interactive/Reorderable` | Kéo-thả để sắp xếp lại danh sách, có check đúng/sai. Props: `items: string[]`, `correctOrder: number[]`, `instruction?: string`. |
| `MatrixEditor` | `@/components/interactive/MatrixEditor` | Ma trận số có thể chỉnh trực tiếp, kèm visualization động. Props: `initialData: number[][]`, `rowLabels?: string[]`, `colLabels?: string[]`, `min?: number`, `max?: number`, `step?: number`, `visualization?: (data: number[][]) => ReactNode`, `onChange?: (data: number[][]) => void`. |
| `CanvasPlayground` | `@/components/interactive/CanvasPlayground` | Click để đặt điểm trên canvas SVG. Props: `width?: number`, `height?: number`, `showGrid?: boolean`, `points: Point[]`, `onAddPoint?: (point: Point) => void`, `onReset?: () => void`, `overlay?: (width: number, height: number) => ReactNode`, `instruction?: string`, `nextColor?: string`, `nextLabel?: string`. Mỗi `Point`: `{ x, y, label?, color? }`. |

### Nhóm đánh giá

| Tên | Import | Mô tả |
|------|--------|-------------|
| `InlineChallenge` | `@/components/interactive/InlineChallenge` | Câu hỏi trắc nghiệm ngắn giữa bài. Props: `question: string`, `options: string[]`, `correct: number`, `explanation?: string`. |
| `MatchPairs` | `@/components/interactive/MatchPairs` | Click để ghép cột trái với cột phải. Props: `pairs: Pair[]`, `instruction?: string`. Mỗi `Pair`: `{ left, right }`. |
| `SortChallenge` | `@/components/interactive/SortChallenge` | Được re-export từ `Reorderable` — cùng component, cùng API. |
| `FillBlank` | `@/components/interactive/FillBlank` | Điền vào chỗ trống bằng dropdown trong một template string. Props: `template: string` (dùng placeholder `{id}`), `blanks: Blank[]`. Mỗi `Blank`: `{ id, options: string[], correct: number }`. |

### Nhóm phản hồi

| Tên | Import | Mô tả |
|------|--------|-------------|
| `AhaMoment` | `@/components/interactive/AhaMoment` | Ô insight "à ra thế" có hiệu ứng tia sáng. Props: `children: ReactNode`. |
| `ProgressSteps` | `@/components/interactive/ProgressSteps` | Thanh dot thể hiện tiến trình. Props: `current: number`, `total: number`, `labels?: string[]`. |
| `Callout` | `@/components/interactive/Callout` | Hộp highlight. Props: `variant?: "tip" \| "warning" \| "insight" \| "info"`, `title?: string`, `children: ReactNode`. |
| `MiniSummary` | `@/components/interactive/MiniSummary` | Card tóm tắt dạng bullet. Props: `title?: string` (mặc định: "Tóm tắt"), `points: string[]`. |

### Nhóm bố cục

| Tên | Import | Mô tả |
|------|--------|-------------|
| `SplitView` | `@/components/interactive/SplitView` | Bố cục 2 cột cạnh nhau (stack trên mobile). Props: `left: ReactNode`, `right: ReactNode`, `leftLabel?: string`, `rightLabel?: string`. |
| `TabView` | `@/components/interactive/TabView` | Tab chuyển nội dung. Props: `tabs: { label: string; content: ReactNode }[]`. |
| `CollapsibleDetail` | `@/components/interactive/CollapsibleDetail` | Chi tiết có thể thu gọn. Props: `title: string`, `children: ReactNode`, `defaultOpen?: boolean`. |
| `CodeBlock` | `@/components/interactive/CodeBlock` | Code có syntax highlight + nút copy. Props: `children: string` (code), `language?: string` (mặc định "python"), `title?: string`. |

### Primitive liên kết chéo

| Tên | Import | Mô tả |
|------|--------|-------------|
| `TopicLink` | `@/components/interactive/TopicLink` | Link inline tới một topic khác. Hiển thị dạng dotted-underline màu accent. Props: `slug: string` (phải tồn tại trong registry), `children: ReactNode` (text hiển thị). |

#### TopicLink — Liên kết chéo giữa các bài học

Khi bài học đề cập đến một khái niệm đã có topic riêng, hãy dùng `TopicLink` để người học có thể quay lại ôn nếu chưa hiểu.

**Cách dùng:**

```tsx
import { TopicLink } from "@/components/interactive";

// Trong nội dung bài học:
<p>
  Khi gradient truyền qua nhiều lớp, nó có thể bị triệt tiêu — gọi là{" "}
  <TopicLink slug="vanishing-exploding-gradients">vanishing gradient</TopicLink>.
</p>
```

**Quy tắc:**
- Chỉ link lần đầu xuất hiện trong bài — không link lặp lại cùng thuật ngữ.
- `slug` phải tồn tại trong `registry.ts` — component sẽ cảnh báo trong dev mode nếu không tìm thấy.
- `children` là text hiển thị, có thể khác tên topic gốc.
- Ưu tiên link các khái niệm tiên quyết (prerequisite) hơn các khái niệm nâng cao.

### Wrapper cấp topic

| Tên | Import | Mô tả |
|------|--------|-------------|
| `AnalogyCard` | `@/components/topic/AnalogyCard` | Wrapper cho ẩn dụ thực tế Việt Nam. Props: `children: ReactNode`. |
| `VisualizationSection` | `@/components/topic/VisualizationSection` | Container cho hình minh hoạ tương tác/tĩnh. Props: `children: ReactNode`. |
| `ExplanationSection` | `@/components/topic/ExplanationSection` | Container cho phần giải thích chính thức. Props: `children: ReactNode`. |
| `QuizSection` | `@/components/topic/QuizSection` | Quiz cuối bài có chấm điểm. Props: `questions: QuizQuestion[]`. Hỗ trợ 3 loại câu hỏi — xem mục "Loại câu hỏi Quiz" bên dưới. |

### Các loại câu hỏi Quiz

`QuizSection` hỗ trợ 3 loại câu hỏi qua discriminated union. Có thể trộn tự do trong cùng một quiz.

#### Trắc nghiệm (MCQ — mặc định, tương thích ngược)

```tsx
{
  question: "Câu hỏi trắc nghiệm?",
  options: ["Đáp án A", "Đáp án B", "Đáp án C"],
  correct: 1,
  explanation: "Giải thích..."
}
```

Không cần field `type` — mặc định là MCQ. Mọi quiz hiện có vẫn hoạt động bình thường.

#### Điền vào chỗ trống (fill-blank)

```tsx
{
  type: "fill-blank",
  question: "Công thức MSE = {blank} trong đó n là {blank}",
  blanks: [
    { answer: "1/n * Σ(yi - ŷi)²", accept: ["(1/n)*sum(yi-yi_hat)^2"] },
    { answer: "số mẫu", accept: ["số sample", "number of samples"] }
  ],
  explanation: "MSE là trung bình bình phương sai số..."
}
```

Dùng `{blank}` làm placeholder trong câu hỏi. Mảng `accept` chứa đáp án tương đương. So khớp không phân biệt hoa thường.

#### Hoàn thành code

```tsx
{
  type: "code",
  question: "Hoàn thành hàm tính gradient descent:",
  codeTemplate: "def gradient_descent(x, lr):\n    grad = compute_grad(x)\n    return x - ___ * ___",
  language: "python",
  blanks: [
    { answer: "lr", accept: ["learning_rate"] },
    { answer: "grad", accept: ["gradient"] }
  ],
  explanation: "Cập nhật: x_new = x - learning_rate * gradient"
}
```

Dùng `___` làm placeholder trong code. Quy tắc so khớp giống fill-blank.

**Hướng dẫn theo lộ trình:**
- **Học sinh (toán):** dùng `fill-blank` cho công thức.
- **Học sinh (ML/mạng nơ-ron):** 5–7 câu kết hợp MCQ + fill-blank.
- **AI Engineer:** dùng `code` cho câu hỏi triển khai.
- **Nhân viên văn phòng:** MCQ với tình huống thực tế nơi công sở.

---

## Quy ước nội dung tiếng Việt

1. **Luôn dùng dấu tiếng Việt chuẩn.** Viết "Nền tảng mạng nơ-ron", không viết "Nen tang mang no-ron". Đây là yêu cầu cứng, không thoả hiệp.

2. **Viết ẩn dụ từ đời sống Việt Nam.** Tham chiếu tốt: chợ, phở, xe máy, Grab, Shopee, cà phê sữa đá, bưu điện, sổ liên lạc, lớp học, thi đại học. KHÔNG dùng tham chiếu văn hoá Mỹ (baseball, Thanksgiving, SAT…).

3. **Đối tượng mục tiêu: sinh viên năm nhất.** Giả định chưa học ML. Giả định có kiến thức toán phổ thông. Giải thích thuật ngữ khi lần đầu xuất hiện.

4. **Dùng "bạn" (ngôi 2 thân mật).** Không dùng "quý vị", "anh/chị", hay văn phong trang trọng. Giọng điệu thân thiện, động viên — như một gia sư đồng trang lứa.

5. **Thuật ngữ kỹ thuật — giữ tiếng Anh khi phổ biến, dịch khi rõ ràng:**
   - Giữ tiếng Anh: Transformer, CNN, RNN, LSTM, GAN, GPU, API, epoch, batch, loss.
   - Dịch: mạng nơ-ron (neural network), hàm mất mát (loss function), tốc độ học (learning rate), lan truyền ngược (backpropagation), quá khớp (overfitting).
   - Khi phân vân: dùng tiếng Việt kèm tiếng Anh trong ngoặc, ví dụ "hàm kích hoạt (activation function)".

6. **KHÔNG dùng "Tổng quan LLM" hay "Tổng quan về LLM".** Người Việt nói gọn "LLM" hoặc "mô hình AI".

7. **Mọi text người dùng thấy phải bằng tiếng Việt.** Gồm nhãn nút, heading, câu hỏi quiz, giải thích, callout. Code mẫu và ký hiệu toán học là ngoại lệ duy nhất.

---

## Quy tắc đặc biệt cho lộ trình Văn phòng

Lộ trình `office` (Nhân viên văn phòng) có đối tượng rất cụ thể: người không lập trình, không đọc công thức. Quy tắc khác các lộ trình còn lại:

- **KHÔNG import `CodeBlock`.** Không hiển thị code Python. Nếu cần minh hoạ "AI chạy code", dùng spinner "đang chạy…" rồi show ngay KẾT QUẢ (biểu đồ/số liệu), không show dòng code.
- **KHÔNG import `LaTeX`.** Không dùng công thức toán. Nếu cần nói về xác suất hoặc metric, dùng thanh màu, phần trăm, heatmap — không dùng ký hiệu.
- **50–70% JSX phải là primitive tương tác hoặc visual.** 30–50% mới là văn bản.
- **Link sang bài ứng dụng đặt ở CUỐI trang** (không ở đầu). Quy tắc này có trong `src/components/topic/TopicLayout.tsx`.
- Tối thiểu 4 widget tương tác không-baseline (ngoài `PredictionGate` / `InlineChallenge` / `QuizSection`).

---

## Template prompt cho chuyên gia chuyên ngành

Nếu bạn là chuyên gia chuyên ngành (ví dụ: giảng viên hiểu sâu Capsule Networks nhưng không code), hãy copy nguyên khối này vào trợ lý lập trình AI của bạn:

```
Bạn đang đóng góp một chủ đề về [TÊN CHỦ ĐỀ] cho app "AI cho mọi người" — nền tảng giáo dục AI bằng tiếng Việt.

1. Đọc CONTRIBUTING.md để nắm convention project
2. Đọc docs/primitives.md để biết các component tương tác có sẵn
3. Copy src/topics/_template.tsx sang src/topics/[your-slug].tsx
4. Theo đúng bố cục 8 bước: HOOK → DISCOVER → REVEAL → DEEPEN → CHALLENGE → EXPLAIN → CONNECT → QUIZ
5. Viết toàn bộ bằng tiếng Việt có dấu chuẩn
6. Tạo hình minh hoạ SVG tương tác — người dùng thao tác, không chỉ xem
7. Thêm topic vào src/topics/registry.ts
8. Chạy pnpm build để kiểm tra

Nguyên tắc vàng: người học tự khám phá trước khi được "dạy".
```

---

## Checklist PR

Trước khi gửi PR, kiểm tra từng mục. AI agent PHẢI check toàn bộ 10 mục programmatically nếu có thể.

1. File topic tồn tại tại `src/topics/[slug].tsx`.
2. `metadata` là named export kiểu `TopicMeta` với đầy đủ field bắt buộc (`slug`, `title`, `titleVi`, `description`, `category`, `tags`, `difficulty`, `relatedSlugs`, `vizType`).
3. Đã thêm entry vào mảng `topicList` trong `src/topics/registry.ts`.
4. Ít nhất 1 `PredictionGate` hoặc tương tác khám phá khác (người dùng dự đoán trước khi được kể).
5. Ít nhất 1 hình minh hoạ tương tác tự viết (SVG có thao tác, không phải hình tĩnh).
6. Ít nhất 1 `InlineChallenge` ở giữa bài (không phải cuối).
7. `QuizSection` với 2+ câu ở cuối bài.
8. Mọi text người dùng thấy đều bằng tiếng Việt có dấu chuẩn (không dùng tiếng Việt không dấu).
9. `pnpm build` chạy pass, 0 lỗi.
10. Không có nội dung tiếng Anh hardcode ở text người dùng thấy (code mẫu và công thức toán được miễn).

---

## Anti-pattern (KHÔNG làm)

- **KHÔNG** tạo bài học thụ động (ẩn dụ → biểu đồ → tường chữ). Mọi topic phải có khám phá tương tác.
- **KHÔNG** dùng tham chiếu văn hoá Mỹ. Dùng tham chiếu Việt Nam: chợ, phở, xe máy, Grab, Shopee — không dùng baseball, Thanksgiving, SAT.
- **KHÔNG** bỏ qua quiz. Mọi topic kết thúc bằng `QuizSection` tối thiểu 2 câu.
- **KHÔNG** làm visualization tĩnh hoàn toàn. Mọi topic phải có ít nhất 1 element tương tác (slider, kéo, click…).
- **KHÔNG** viết tiếng Việt không dấu. "Mang no-ron" sai. "Mạng nơ-ron" đúng.
- **KHÔNG** thêm dependency ngoài mà chưa thảo luận trong GitHub issue.
- **KHÔNG** sửa topic có sẵn trong PR "topic mới". Mỗi PR một topic.

---

## Ví dụ: Topic tối giản hoàn chỉnh

Dưới đây là một topic ngắn nhưng đầy đủ, minh hoạ pattern bắt buộc. Dùng nó làm tham chiếu cấu trúc.

```tsx
"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
} from "@/components/interactive";
import type { TopicMeta } from "@/lib/types";

// ---- Metadata ----
export const metadata: TopicMeta = {
  slug: "softmax-function",
  title: "Softmax Function",
  titleVi: "Hàm Softmax",
  description: "Tìm hiểu cách hàm Softmax biến đổi vector số thực thành phân phối xác suất.",
  category: "neural-fundamentals",
  tags: ["softmax", "xác suất", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["activation-functions", "loss-functions", "logistic-regression"],
  vizType: "interactive",
};

// ---- Biểu đồ tương tác đơn giản ----
function SoftmaxChart({ values }: { values: number[] }) {
  const exps = values.map((v) => Math.exp(v));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  const maxProb = Math.max(...probs);
  const labels = ["A", "B", "C"];

  return (
    <svg viewBox="0 0 300 150" className="w-full max-w-sm mx-auto">
      {probs.map((p, i) => {
        const barH = p * 110;
        const x = 40 + i * 90;
        return (
          <g key={i}>
            <rect
              x={x}
              y={130 - barH}
              width={50}
              height={barH}
              rx={6}
              className={p === maxProb ? "fill-accent" : "fill-accent/30"}
            />
            <text x={x + 25} y={145} textAnchor="middle" className="fill-foreground text-xs">
              {labels[i]}
            </text>
            <text x={x + 25} y={125 - barH} textAnchor="middle" className="fill-foreground text-xs font-mono">
              {(p * 100).toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Component ----
export default function SoftmaxFunctionTopic() {
  const [inputA, setInputA] = useState(2);

  return (
    <>
      {/* HOOK */}
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ở quán trà sữa, cầm phiếu đánh giá 3 món:
          Trà sữa trân châu được 9 điểm, Matcha latte 6 điểm, Nước ép cam 2 điểm.
          Làm sao để biến 3 con số này thành "xác suất chọn" — sao cho tổng luôn bằng 100%?
        </p>
      </AnalogyCard>

      {/* DISCOVER */}
      <PredictionGate
        question="Cho 3 giá trị [2, 1, 0.1], nếu biến thành xác suất, giá trị lớn nhất (2) sẽ chiếm bao nhiêu %?"
        options={["33% (chia đều)", "50%", "~66% (gấp đôi giá trị nhỏ nhất)", "~71%"]}
        correct={3}
        explanation="Softmax cho giá trị 2 chiếm ~71% — nó dùng hàm mũ (e^x) nên khuếch đại khoảng cách giữa các giá trị, không chỉ chia tỷ lệ tuyến tính!"
      >
        <AhaMoment>
          <p>Softmax không chỉ chuẩn hoá — nó <strong>khuếch đại</strong> sự khác biệt nhờ hàm mũ!</p>
        </AhaMoment>
      </PredictionGate>

      {/* REVEAL */}
      <VisualizationSection>
        <p className="text-sm text-muted mb-3 text-center">
          Kéo thanh trượt để thay đổi giá trị A và xem xác suất thay đổi:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 justify-center">
            <label className="text-sm text-foreground">Giá trị A:</label>
            <input
              type="range"
              min={-2}
              max={5}
              step={0.1}
              value={inputA}
              onChange={(e) => setInputA(Number(e.target.value))}
              className="w-48 accent-accent"
            />
            <span className="font-mono text-sm text-accent w-10">{inputA.toFixed(1)}</span>
          </div>
          <SoftmaxChart values={[inputA, 1, 0.1]} />
        </div>
      </VisualizationSection>

      {/* CHALLENGE */}
      <InlineChallenge
        question="Nếu tất cả giá trị đầu vào bằng nhau [3, 3, 3], Softmax sẽ cho kết quả gì?"
        options={["[1, 0, 0]", "[0.33, 0.33, 0.33]", "[0.5, 0.25, 0.25]"]}
        correct={1}
        explanation="Khi tất cả bằng nhau, e^x cũng bằng nhau, nên xác suất chia đều — mỗi giá trị chiếm 33.3%."
      />

      {/* EXPLAIN */}
      <ExplanationSection>
        <h3>Công thức Softmax</h3>
        <p>
          Cho vector <strong>z</strong> có n phần tử, Softmax biến phần tử thứ i thành:
        </p>
        <p className="text-center font-mono my-2">
          softmax(z_i) = e^(z_i) / (e^(z_1) + e^(z_2) + ... + e^(z_n))
        </p>
        <Callout variant="tip" title="Tại sao dùng e^x?">
          Hàm mũ đảm bảo mọi giá trị luôn dương (kể cả khi đầu vào âm),
          và khuếch đại khoảng cách giữa các giá trị — giúp mô hình "tự tin" hơn vào lựa chọn cao nhất.
        </Callout>
      </ExplanationSection>

      {/* QUIZ */}
      <QuizSection
        questions={[
          {
            question: "Softmax đảm bảo tính chất nào cho đầu ra?",
            options: [
              "Tất cả giá trị nằm trong [-1, 1]",
              "Tất cả giá trị dương và tổng bằng 1",
              "Giá trị lớn nhất luôn bằng 1",
              "Tất cả giá trị bằng nhau",
            ],
            correct: 1,
            explanation: "Softmax biến mọi giá trị thành số dương và đảm bảo tổng = 1, tạo thành phân phối xác suất hợp lệ.",
          },
          {
            question: "Khi tăng một giá trị đầu vào rất lớn so với các giá trị khác, Softmax sẽ tiến gần đến?",
            options: [
              "Phân phối đều",
              "One-hot vector (1 ở vị trí lớn nhất, 0 ở còn lại)",
              "Tất cả bằng 0",
              "Giá trị vô cực",
            ],
            correct: 1,
            explanation: "Khi một giá trị áp đảo, e^x của nó lớn hơn rất nhiều so với phần còn lại — Softmax tiến gần đến one-hot vector.",
          },
        ] satisfies QuizQuestion[]}
      />
    </>
  );
}
```

---

## Quy tắc ứng xử

Chúng tôi cam kết tạo môi trường chào đón và bao hàm mọi người. Vui lòng tôn trọng, xây dựng, và thân thiện trong mọi trao đổi. Hành vi quấy rối, phân biệt đối xử, hay thiếu tôn trọng sẽ không được chấp nhận.

Hãy tôn trọng, xây dựng, và thân thiện trong mọi trao đổi. Cảm ơn bạn!

---

## Thiết lập Supabase Dashboard (cho tính năng xác thực)

Tính năng đăng ký / đăng nhập cần cấu hình thủ công một lần trong Supabase dashboard. Nếu bạn đang setup dự án Supabase mới cho dev cục bộ, thực hiện các bước sau:

### 1. Bật xác nhận email
- Vào **Authentication → Providers → Email**.
- Bật **Confirm email**: ON.
- Bật **Secure email change**: ON.

### 2. Bật manual identity linking
- Vào **Authentication → General**.
- Bật **Allow manual linking**: ON.

Không bật thì `supabase.auth.linkIdentity()` (dùng cho nâng cấp anon → Google) sẽ lỗi.

### 3. Cấu hình Google provider
- Vào **Authentication → Providers → Google**.
- Bật **Enabled**: ON.
- Trong Google Cloud Console, tạo OAuth 2.0 Client ID (Web application):
  - **Authorized JavaScript origins**: `https://udemi.tech` (thêm `https://ai-edu-app.vercel.app` làm alias trong thời gian DNS propagate, và `http://localhost:3000` cho dev).
  - **Authorized redirect URIs**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`.
- Copy Google Client ID + Secret về Supabase dashboard.

### 4. Đặt redirect URL
- Vào **Authentication → URL Configuration**.
- **Site URL**: `https://udemi.tech` (dùng `http://localhost:3000` cho dev).
- Thêm vào **Redirect URLs** allow-list:
  - `https://udemi.tech/auth/callback`
  - `https://ai-edu-app.vercel.app/auth/callback` (alias — giữ link đăng nhập cũ chạy tiếp)
  - `http://localhost:3000/auth/callback`

### 5. Tuỳ biến email xác nhận (tuỳ chọn)
- Vào **Authentication → Email Templates → Confirm signup**.
- Đổi chủ đề thành: `Xác nhận đăng ký tài khoản AI cho mọi người`.
- Giữ token `{{ .ConfirmationURL }}` trong phần body — Supabase sẽ thay thế bằng link xác nhận thực.
