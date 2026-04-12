"use client";

import { useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  TopicLink,
  StepReveal,
  BuildUp,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "jupyter-colab-workflow",
  title: "Jupyter & Google Colab Workflow",
  titleVi: "Quy trình làm việc với Jupyter và Google Colab",
  description:
    "Hướng dẫn thực hành — cách chạy thí nghiệm ML đầu tiên trên Jupyter Notebook và Google Colab.",
  category: "foundations",
  tags: ["jupyter", "colab", "notebook", "tools", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["python-for-ml", "data-preprocessing", "end-to-end-ml-project"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function JupyterColabWorkflowTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Ưu điểm lớn nhất của Google Colab so với Jupyter Notebook chạy trên máy tính cá nhân là gì?",
        options: [
          "Colab hỗ trợ nhiều ngôn ngữ lập trình hơn",
          "Colab cung cấp GPU/TPU miễn phí, không cần cài đặt phần mềm",
          "Colab có giao diện đẹp hơn Jupyter",
          "Colab chạy code nhanh hơn Jupyter trong mọi trường hợp",
        ],
        correct: 1,
        explanation:
          "Google Colab cung cấp GPU và TPU miễn phí, chạy hoàn toàn trên trình duyệt — không cần cài Python, thư viện, hay driver GPU. Đây là lý do Colab lý tưởng cho người mới bắt đầu ML.",
      },
      {
        type: "fill-blank",
        question:
          "Để chạy một cell trong Google Colab hoặc Jupyter Notebook, nhấn {blank}.",
        blanks: [{ answer: "Shift+Enter", accept: ["shift+enter", "shift enter"] }],
        explanation:
          "Shift+Enter chạy cell hiện tại và chuyển xuống cell tiếp theo. Ctrl+Enter chạy cell hiện tại nhưng không di chuyển con trỏ.",
      },
      {
        question: "Cell loại Markdown trong Jupyter/Colab dùng để làm gì?",
        options: [
          "Chạy code Python và hiển thị kết quả",
          "Kết nối đến cơ sở dữ liệu bên ngoài",
          "Viết văn bản, tiêu đề, công thức toán — giải thích code cho người đọc",
          "Lưu trữ dữ liệu dạng bảng như Excel",
        ],
        correct: 2,
        explanation:
          "Cell Markdown dùng để viết tài liệu: tiêu đề (#), danh sách (-), in đậm (**text**), công thức LaTeX ($formula$). Notebook tốt xen kẽ cell code và cell Markdown để giải thích từng bước.",
      },
      {
        question:
          "Trước khi chia sẻ notebook với người khác, thực hành tốt nhất là gì?",
        options: [
          "Xóa tất cả output để file nhỏ hơn",
          "Chạy 'Restart & Run All' để đảm bảo notebook chạy đúng từ đầu đến cuối",
          "Chuyển tất cả cell Markdown thành cell Code",
          "Đổi tên tất cả biến thành tên ngắn hơn",
        ],
        correct: 1,
        explanation:
          "Restart & Run All đảm bảo notebook không phụ thuộc vào thứ tự chạy ngẫu nhiên — một lỗi rất phổ biến. Nếu notebook chạy thành công từ đầu đến cuối sau khi restart, người khác mới có thể tái hiện kết quả.",
      },
    ],
    []
  );

  return (
    <>
      {/* ===== BƯỚC 1: HOOK / DỰ ĐOÁN ===== */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn thử train model ML đầu tiên. Bạn cần gì?"
          options={[
            "Cài đặt Python, Anaconda, CUDA, driver GPU — mất vài giờ",
            "Mở Google Colab trên trình duyệt — miễn phí, không cần cài gì",
            "Mua máy tính mạnh với GPU RTX 4090",
          ]}
          correct={1}
          explanation="Google Colab cho phép bạn chạy code Python với GPU miễn phí ngay trên trình duyệt. Không cần cài đặt gì, không cần phần cứng mạnh — đây là công cụ học ML tốt nhất cho người mới."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Jupyter Notebook và Google Colab là hai môi trường phổ biến nhất để làm
            thí nghiệm ML. Hãy xem cách chúng hoạt động từng bước.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== BƯỚC 2: QUY TRÌNH COLAB (BUILDUP) ===== */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Quy trình Colab">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Toàn bộ quy trình làm việc với Google Colab chỉ gồm 5 bước đơn giản.
          Nhấn <strong>Thêm</strong>{" "}
          để xem từng bước xuất hiện:
        </p>
        <BuildUp
          labels={[
            "Bước 1 — Truy cập",
            "Bước 2 — Tạo notebook",
            "Bước 3 — Viết và chạy code",
            "Bước 4 — Xem kết quả",
            "Bước 5 — Lưu tự động",
          ]}
          addLabel="Bước tiếp theo"
        >
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Mở colab.research.google.com
            </p>
            <p className="text-muted">
              Truy cập bằng tài khoản Google — miễn phí, chạy ngay trên trình duyệt,
              không cần cài đặt bất cứ thứ gì.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Tạo notebook mới
            </p>
            <p className="text-muted">
              Nhấn <strong>File → New notebook</strong> (hoặc{" "}
              <strong>+ New notebook</strong> trên trang chủ). Notebook là một file
              <strong> .ipynb</strong> lưu trên Google Drive của bạn.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Viết code trong cell → Shift+Enter để chạy
            </p>
            <p className="text-muted">
              Mỗi ô (cell) chứa một đoạn code. Nhấn{" "}
              <strong>Shift+Enter</strong> để chạy cell và nhảy xuống cell tiếp theo.
              Dùng <strong>Ctrl+Enter</strong> để chạy mà không di chuyển.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Kết quả hiện ngay dưới cell
            </p>
            <p className="text-muted">
              Output — số, bảng, biểu đồ — xuất hiện trực tiếp bên dưới cell vừa chạy.
              Bạn thấy kết quả ngay lập tức mà không cần tải lại trang.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Lưu tự động trên Google Drive
            </p>
            <p className="text-muted">
              Colab tự động lưu notebook vào Google Drive. Bạn cũng có thể nhấn
              <strong> Ctrl+S</strong> để lưu thủ công, hoặc tải xuống dạng{" "}
              <strong>.ipynb</strong> / <strong>.py</strong>.
            </p>
          </div>
        </BuildUp>
      </LessonSection>

      {/* ===== BƯỚC 3: THÍ NGHIỆM ML ĐẦU TIÊN (STEPREVEAL) ===== */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thí nghiệm đầu tiên">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Cùng chạy thí nghiệm ML đầu tiên từng cell một — đúng như bạn sẽ làm trên Colab:
        </p>
        <StepReveal
          labels={[
            "Cell 1 — Import thư viện",
            "Cell 2 — Tạo dữ liệu",
            "Cell 3 — Phân tích cơ bản",
            "Cell 4 — Vẽ biểu đồ",
            "Cell 5 — Đọc kết quả",
          ]}
        >
          <div className="space-y-2">
            <CodeBlock language="python" title="Cell 1">
              {`import numpy as np`}
            </CodeBlock>
            <p className="text-xs text-muted px-1">
              Import NumPy — thư viện tính toán số học nền tảng của ML. Chạy cell này
              một lần, tất cả cell sau trong notebook đều dùng được.
            </p>
          </div>
          <div className="space-y-2">
            <CodeBlock language="python" title="Cell 2">
              {`data = np.array([1, 2, 3, 4, 5])`}
            </CodeBlock>
            <p className="text-xs text-muted px-1">
              Tạo một mảng NumPy — đây là dạng dữ liệu phổ biến nhất trong ML.
              Trong thực tế, bạn sẽ load dữ liệu từ file CSV hoặc dataset có sẵn.
            </p>
          </div>
          <div className="space-y-2">
            <CodeBlock language="python" title="Cell 3">
              {`print(data.mean(), data.std())
# Output: 3.0  1.4142135623730951`}
            </CodeBlock>
            <p className="text-xs text-muted px-1">
              Phân tích thống kê cơ bản: trung bình và độ lệch chuẩn.
              Đây là bước đầu tiên trong{" "}
              <strong>Exploratory Data Analysis (EDA)</strong> — hiểu dữ liệu
              trước khi train model.
            </p>
          </div>
          <div className="space-y-2">
            <CodeBlock language="python" title="Cell 4">
              {`import matplotlib.pyplot as plt

plt.figure(figsize=(8, 4))
plt.plot(data, marker='o', color='steelblue', linewidth=2)
plt.title('Dữ liệu mẫu')
plt.xlabel('Chỉ số')
plt.ylabel('Giá trị')
plt.grid(True, alpha=0.3)
plt.show()`}
            </CodeBlock>
            <p className="text-xs text-muted px-1">
              Matplotlib vẽ biểu đồ trực tiếp trong notebook — không cần mở cửa sổ
              riêng. Visualization là kỹ năng thiết yếu để kiểm tra dữ liệu và kết quả
              model.
            </p>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm space-y-1">
              <p className="font-semibold text-foreground">Đọc kết quả</p>
              <ul className="text-muted list-disc list-inside space-y-1">
                <li>
                  <strong>Mean = 3.0</strong>: giá trị trung bình của dãy 1→5 là 3 — đúng như kỳ vọng
                </li>
                <li>
                  <strong>Std ≈ 1.41</strong>: độ phân tán vừa phải, dữ liệu không quá rải
                </li>
                <li>
                  Biểu đồ cho thấy xu hướng tuyến tính — model Linear Regression sẽ phù hợp
                </li>
              </ul>
            </div>
            <Callout variant="tip" title="Mỗi cell là một thí nghiệm nhỏ">
              Tư duy đúng khi dùng notebook: mỗi cell giải quyết một câu hỏi cụ thể.
              Chạy, xem kết quả, điều chỉnh — lặp lại. Đây chính là vòng lặp thực nghiệm
              của data scientist.
            </Callout>
          </div>
        </StepReveal>
      </LessonSection>

      {/* ===== BƯỚC 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Jupyter Notebook lưu file với đuôi (extension) gì?"
          options={[
            ".py — file Python thông thường",
            ".ipynb — Interactive Python Notebook",
            ".nb — Notebook file",
            ".jnb — Jupyter Notebook",
          ]}
          correct={1}
          explanation=".ipynb là định dạng JSON lưu toàn bộ notebook: code, output, markdown, và metadata. Bạn có thể mở file .ipynb trên Colab, JupyterLab, hoặc VS Code."
        />
      </LessonSection>

      {/* ===== BƯỚC 5: GIẢI THÍCH SÂU ===== */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Jupyter Notebook</strong>{" "}
            và <strong>Google Colab</strong> đều là môi trường notebook tương tác,
            nhưng phục vụ các nhu cầu khác nhau:
          </p>

          <Callout variant="info" title="Jupyter vs Colab — khi nào dùng cái nào?">
            <div className="space-y-2 text-sm">
              <div>
                <strong>Jupyter Notebook / JupyterLab</strong>{" "}
                (chạy trên máy tính của bạn): phù hợp khi cần xử lý dữ liệu
                riêng tư, làm việc offline, hoặc dùng phần cứng riêng. Cần cài
                Python và các thư viện.
              </div>
              <div>
                <strong>Google Colab</strong>{" "}
                (chạy trên cloud của Google): phù hợp cho người mới, học tập,
                thí nghiệm nhanh. Miễn phí GPU/TPU, chia sẻ dễ dàng qua link,
                không cần cài đặt. Giới hạn: session hết sau vài giờ nếu không
                hoạt động.
              </div>
            </div>
          </Callout>

          <p>
            <strong>Hai loại cell chính:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Cell Code:</strong>{" "}
              chứa code Python (hoặc ngôn ngữ kernel khác). Chạy bằng Shift+Enter,
              output hiện ngay bên dưới. Có số thứ tự [1], [2]... cho biết thứ tự chạy.
            </li>
            <li>
              <strong>Cell Markdown:</strong>{" "}
              chứa văn bản định dạng: tiêu đề (<code>#</code>,{" "}
              <code>##</code>), in đậm (<code>**text**</code>), danh sách, công thức
              LaTeX (<code>$E=mc^2$</code>). Dùng để giải thích code và ghi chú.
            </li>
          </ul>

          <p>
            <strong>Phím tắt quan trọng:</strong>
          </p>
          <VisualizationSection>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">
                      Phím tắt
                    </th>
                    <th className="text-left py-2 font-semibold text-foreground">
                      Tác dụng
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground/80">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">Shift+Enter</td>
                    <td className="py-2">Chạy cell, chuyển xuống cell tiếp theo</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">Ctrl+Enter</td>
                    <td className="py-2">Chạy cell, giữ nguyên vị trí</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">Esc + A</td>
                    <td className="py-2">Thêm cell mới phía trên (Above)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">Esc + B</td>
                    <td className="py-2">Thêm cell mới phía dưới (Below)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">Esc + D + D</td>
                    <td className="py-2">Xóa cell đang chọn</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </VisualizationSection>

          <Callout variant="warning" title="Best practices trước khi chia sẻ notebook">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Một ý tưởng, một cell:</strong>{" "}
                đừng nhồi quá nhiều logic vào một cell — khó debug và khó đọc.
              </li>
              <li>
                <strong>Dùng cell Markdown làm tiêu đề:</strong>{" "}
                tổ chức notebook như một báo cáo, không phải script rời rạc.
              </li>
              <li>
                <strong>Restart {"&"} Run All trước khi chia sẻ:</strong>{" "}
                đảm bảo notebook chạy đúng từ đầu đến cuối, không phụ thuộc
                vào biến còn sót từ session cũ.
              </li>
            </ul>
          </Callout>

          <p>
            Để học sâu hơn về ngôn ngữ bạn dùng trong notebook, xem{" "}
            <TopicLink slug="python-for-ml">Python cho Machine Learning</TopicLink>.
            Khi đã quen với công cụ, bước tiếp theo là{" "}
            <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>{" "}
            — kỹ năng chiếm 80% thời gian của một dự án ML thực tế.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ===== BƯỚC 6: KHOẢNH KHẮC AHA + MINI SUMMARY ===== */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <AhaMoment>
          <strong>Notebook không chỉ là nơi viết code</strong>{" "}
          — đây là một <strong>tài liệu sống</strong> kết hợp code, kết quả,
          và giải thích trong cùng một file. Tư duy "mỗi cell là một thí nghiệm"
          giúp bạn làm khoa học dữ liệu có hệ thống và tái hiện được.
        </AhaMoment>

        <MiniSummary
          title="Jupyter & Colab — Điểm chốt"
          points={[
            "Google Colab = Jupyter trên cloud: GPU miễn phí, không cài đặt, chia sẻ qua link.",
            "Shift+Enter chạy cell và chuyển tiếp — phím tắt quan trọng nhất cần nhớ.",
            "File notebook có đuôi .ipynb — lưu code, output, và markdown trong cùng một file JSON.",
            "Hai loại cell: Code (chạy Python) và Markdown (viết tài liệu).",
            "Trước khi chia sẻ: Restart & Run All để đảm bảo notebook chạy đúng từ đầu đến cuối.",
          ]}
        />
      </LessonSection>

      {/* ===== BƯỚC 7: KIỂM TRA ===== */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
