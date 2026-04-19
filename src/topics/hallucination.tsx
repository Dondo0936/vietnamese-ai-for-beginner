"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Brain,
  Wand2,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  ToggleCompare,
  DragDrop,
  MatchPairs,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "hallucination",
  title: "AI Hallucination",
  titleVi: "Ảo giác của AI",
  description:
    "Hiện tượng AI tạo ra thông tin nghe rất hợp lý nhưng thực tế sai hoặc bịa đặt — và cách nhận biết, phòng tránh khi làm việc.",
  category: "llm-concepts",
  tags: ["hallucination", "reliability", "safety", "llm"],
  difficulty: "beginner",
  relatedSlugs: [
    "rag",
    "chain-of-thought",
    "temperature",
    "prompt-engineering",
  ],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU — Đoạn văn AI sinh có lẫn ảo giác để người học "soi"
 * Mỗi câu có trường `halluc` (true = bịa / sai sự thật).
 * ──────────────────────────────────────────────────────────────*/
interface Span {
  text: string;
  halluc: boolean;
  why?: string;
}

interface Paragraph {
  topic: string;
  spans: Span[];
}

const PARAGRAPHS: Paragraph[] = [
  {
    topic: "Tiểu sử ngắn về Chủ tịch Hồ Chí Minh",
    spans: [
      { text: "Chủ tịch Hồ Chí Minh sinh ngày 19/5/1890 tại làng Hoàng Trù, Nghệ An.", halluc: false },
      {
        text: " Năm 1911, Người rời cảng Nhà Rồng trên con tàu Amiral Latouche-Tréville với tên gọi Văn Ba.",
        halluc: false,
      },
      {
        text: " Trong thời gian ở Paris, Người đã gặp trực tiếp Tổng thống Pháp Raymond Poincaré vào năm 1919 để trình Bản yêu sách của nhân dân An Nam.",
        halluc: true,
        why: "Bản yêu sách 1919 được gửi qua đường công văn tới Hội nghị Versailles — KHÔNG có cuộc gặp trực tiếp nào với Tổng thống Poincaré. AI bịa thêm chi tiết để câu văn nghe chắc nịch.",
      },
      {
        text: " Người về nước năm 1941, lãnh đạo Cách mạng tháng Tám và đọc Tuyên ngôn Độc lập ngày 2/9/1945 tại quảng trường Ba Đình.",
        halluc: false,
      },
    ],
  },
  {
    topic: "Kinh tế Việt Nam năm 2024 (AI trả lời câu hỏi của nhà báo)",
    spans: [
      { text: "GDP Việt Nam năm 2024 đạt khoảng 476 tỷ đô-la Mỹ, tăng trưởng 7,09%.", halluc: false },
      {
        text: " Theo báo cáo chính thức của Tổng cục Thống kê công bố ngày 15/1/2025, xuất khẩu cả năm đạt 405 tỷ đô-la.",
        halluc: false,
      },
      {
        text: " Đáng chú ý, Quỹ Tiền tệ Quốc tế IMF đã trao giải Economy of the Year 2024 cho Việt Nam trong lễ công bố tại Washington.",
        halluc: true,
        why: "KHÔNG tồn tại giải thưởng nào tên 'Economy of the Year' của IMF. Đây là ảo giác điển hình — AI bịa tên giải, tên tổ chức, địa điểm để câu trả lời nghe ấn tượng.",
      },
      {
        text: " Ngành du lịch đón hơn 17,5 triệu lượt khách quốc tế, gần bằng mức trước đại dịch Covid-19.",
        halluc: false,
      },
    ],
  },
  {
    topic: "Thơ Nguyễn Du (AI trả lời câu hỏi của giáo viên Văn)",
    spans: [
      { text: "Truyện Kiều của Nguyễn Du gồm 3.254 câu thơ lục bát.", halluc: false },
      {
        text: " Tác phẩm được sáng tác dựa trên Kim Vân Kiều truyện của Thanh Tâm Tài Nhân, một tiểu thuyết Trung Quốc đời Minh.",
        halluc: false,
      },
      {
        text: ' Câu thơ mở đầu "Trăm năm trong cõi người ta, Chữ tài chữ mệnh khéo là ghét nhau" được Nguyễn Du viết lại nguyên văn từ bài Tỳ Bà Hành của Bạch Cư Dị.',
        halluc: true,
        why: "Bạch Cư Dị KHÔNG viết câu này. Đây là hai câu mở đầu do chính Nguyễn Du sáng tác. AI ghép hai tên tác giả nổi tiếng với nhau — ảo giác dạng 'trộn sự thật' rất khó phát hiện.",
      },
      {
        text: " Nguyễn Du qua đời năm 1820 tại Huế, thọ 54 tuổi.",
        halluc: false,
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────
 * COMPONENT — Người học click vào câu để đánh dấu "bịa"
 * ──────────────────────────────────────────────────────────────*/
function SpotTheHallucination() {
  const [paraIdx, setParaIdx] = useState(0);
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState(false);

  const para = PARAGRAPHS[paraIdx];

  function toggle(i: number) {
    if (revealed) return;
    setMarked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function switchPara(i: number) {
    setParaIdx(i);
    setMarked({});
    setRevealed(false);
  }

  const score = useMemo(() => {
    let correct = 0;
    para.spans.forEach((s, i) => {
      const user = !!marked[i];
      if (user === s.halluc) correct++;
    });
    return correct;
  }, [marked, para]);

  return (
    <div className="space-y-4">
      {/* Chọn đoạn văn */}
      <div className="flex flex-wrap gap-2">
        {PARAGRAPHS.map((p, i) => (
          <button
            key={i}
            onClick={() => switchPara(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              paraIdx === i
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-surface-hover"
            }`}
          >
            {p.topic}
          </button>
        ))}
      </div>

      <Callout variant="tip" title="Nhiệm vụ của bạn">
        Đọc đoạn AI viết dưới đây. Click vào những câu bạn nghi <strong>AI bịa</strong>.
        Sau đó bấm <em>Kiểm tra</em> để so với sự thật.
      </Callout>

      {/* Nội dung đoạn văn — click vào câu để đánh dấu */}
      <div className="rounded-xl border border-border bg-surface/40 p-5 text-sm leading-relaxed">
        {para.spans.map((s, i) => {
          const isMarked = !!marked[i];
          let cls =
            "cursor-pointer rounded-md px-1 py-0.5 transition-colors ";
          if (!revealed) {
            cls += isMarked
              ? "bg-red-100 text-red-800 underline decoration-red-400 dark:bg-red-900/30 dark:text-red-200"
              : "hover:bg-accent/10";
          } else {
            const correct = isMarked === s.halluc;
            if (s.halluc) {
              cls += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 font-medium";
            } else if (isMarked) {
              cls += "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
            } else if (correct) {
              cls += "bg-emerald-50 dark:bg-emerald-900/15";
            }
          }
          return (
            <span key={i} className={cls} onClick={() => toggle(i)}>
              {s.text}
            </span>
          );
        })}
      </div>

      {/* Hành động + kết quả */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          Đã đánh dấu: {Object.values(marked).filter(Boolean).length} câu
        </span>
        {revealed ? (
          <button
            onClick={() => {
              setMarked({});
              setRevealed(false);
            }}
            className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted hover:bg-surface"
          >
            Làm lại
          </button>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Kiểm tra
          </button>
        )}
      </div>

      {/* Giải thích sau khi kiểm tra */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="rounded-xl border border-accent/30 bg-accent-light p-4 text-sm">
              <span className="font-semibold">
                Bạn đã xác định đúng {score}/{para.spans.length} câu.
              </span>{" "}
              Những câu đỏ là AI bịa. Đọc vì sao bên dưới.
            </div>
            {para.spans
              .filter((s) => s.halluc)
              .map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-4 border-l-red-400 bg-red-50 p-3 text-xs text-foreground dark:bg-red-900/20"
                >
                  <div className="mb-1 font-semibold text-red-700 dark:text-red-300">
                    Câu bịa:
                  </div>
                  <div className="mb-2 italic">&ldquo;{s.text.trim()}&rdquo;</div>
                  <div className="text-muted">{s.why}</div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * COMPONENT — So sánh cùng câu hỏi ở T=0 và T=0.7
 * ──────────────────────────────────────────────────────────────*/
function TemperatureCompare() {
  return (
    <ToggleCompare
      labelA="T = 0 (thận trọng)"
      labelB="T = 0.7 (sáng tạo)"
      description='Cùng câu hỏi: "Nhà thơ Xuân Quỳnh sinh năm nào và mất năm nào?"'
      childA={
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} /> Đáp án ổn định
          </div>
          <p className="text-sm text-foreground">
            Nhà thơ Xuân Quỳnh sinh năm <strong>1942</strong> và mất năm{" "}
            <strong>1988</strong> trong một tai nạn giao thông cùng chồng là nhà
            viết kịch Lưu Quang Vũ.
          </p>
          <div className="mt-2 text-xs text-muted">
            Ở T=0, AI luôn chọn token có xác suất cao nhất — nếu kiến thức này
            có sẵn trong dữ liệu huấn luyện, nó sẽ trả lời nhất quán.
          </div>
        </div>
      }
      childB={
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
            <AlertTriangle size={14} /> Đáp án biến động mỗi lần hỏi
          </div>
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <span className="text-muted">Lần 1:</span> Xuân Quỳnh sinh năm{" "}
              <strong>1942</strong>, mất năm <strong>1988</strong>.
            </p>
            <p>
              <span className="text-muted">Lần 2:</span> Xuân Quỳnh sinh năm{" "}
              <strong className="underline decoration-red-500">1944</strong>,
              mất năm <strong>1988</strong> tại Hải Phòng.
            </p>
            <p>
              <span className="text-muted">Lần 3:</span> Xuân Quỳnh (1942-1988),
              là thành viên{" "}
              <strong className="underline decoration-red-500">
                Hội Nhà văn Việt Nam từ năm 1965
              </strong>
              .
            </p>
          </div>
          <div className="mt-2 text-xs text-muted">
            Ở T=0.7, AI được &ldquo;nới&rdquo; xác suất token — mỗi lần chạy lại
            có thể ra con số khác. Chi tiết phụ (năm vào Hội Nhà văn, nơi mất)
            bắt đầu bịa.
          </div>
        </div>
      }
    />
  );
}

/* ──────────────────────────────────────────────────────────────
 * QUIZ cuối bài
 * ──────────────────────────────────────────────────────────────*/
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Ảo giác của AI xảy ra vì lý do cốt lõi nào sau đây?",
    options: [
      "AI cố tình lừa dối người dùng để bán thêm gói trả phí.",
      "AI dự đoán từ tiếp theo có xác suất cao nhất, không có cơ chế kiểm tra sự thật.",
      "AI chỉ hoạt động tốt với tiếng Anh, sang tiếng Việt là bịa.",
      "Ảo giác chỉ xuất hiện khi người dùng đặt câu hỏi sai ngữ pháp.",
    ],
    correct: 1,
    explanation:
      "AI được huấn luyện để chọn chuỗi từ 'nghe trôi chảy nhất'. Nó không có một cơ sở dữ liệu sự thật để đối chiếu trong lúc sinh văn bản — nên câu trả lời tự tin không đồng nghĩa với chính xác.",
  },
  {
    question:
      "Bạn là nhà báo, đang viết bài về lịch sử một địa phương. Việc nào RỦI RO cao nhất khi dùng AI?",
    options: [
      "Nhờ AI gợi ý 5 tiêu đề hấp dẫn.",
      "Nhờ AI viết lại một đoạn cho ngắn gọn hơn.",
      "Nhờ AI cung cấp tên, năm sinh, trích dẫn của một nhân vật lịch sử mà bạn chưa từng đọc về.",
      "Nhờ AI kiểm tra chính tả.",
    ],
    correct: 2,
    explanation:
      "Số liệu cụ thể (tên người, năm, trích dẫn) là nơi ảo giác phát huy nguy hiểm nhất — văn bản nghe chắc nịch nhưng rất có thể bịa. Luôn đối chiếu với nguồn sơ cấp.",
  },
  {
    question:
      "Kỹ thuật nào giảm ảo giác HIỆU QUẢ nhất trong công việc thường ngày?",
    options: [
      "Tăng nhiệt độ (temperature) để AI sáng tạo hơn.",
      "Gắn tài liệu gốc vào prompt rồi yêu cầu AI chỉ trả lời dựa trên tài liệu đó (RAG).",
      "Hỏi cùng một câu hỏi thật nhiều lần rồi lấy câu trả lời phổ biến nhất.",
      "Dùng model nhỏ hơn để AI không biết quá nhiều thứ.",
      ],
    correct: 1,
    explanation:
      "RAG (Retrieval-Augmented Generation) neo câu trả lời vào tài liệu có thật. Tăng temperature thì ngược lại — làm ảo giác trầm trọng hơn. Hỏi nhiều lần ở T>0 chỉ tạo thêm biến thể bịa.",
  },
  {
    question:
      'Một luật sư hỏi ChatGPT: "Có án lệ nào về vụ việc tương tự ở Việt Nam không?" AI trả lời kèm tên vụ án, số hiệu và năm. Luật sư NÊN làm gì tiếp?',
    options: [
      "Tin ngay vì AI đã cho số hiệu rõ ràng — số hiệu nghĩa là có thật.",
      "Copy vào bản kiến nghị, vì tên tiếng Việt khó mà bịa nổi.",
      "Tra cứu số hiệu đó trên Cổng thông tin điện tử toà án hoặc cơ sở dữ liệu pháp lý — nếu không tìm thấy, coi như AI bịa.",
      "Hỏi lại AI 'Có chắc không?' — nếu AI nói 'Chắc', thì tin được.",
    ],
    correct: 2,
    explanation:
      "AI hoàn toàn có khả năng bịa cả số hiệu vụ án lẫn tên thẩm phán. Nghĩa vụ xác minh với nguồn sơ cấp thuộc về con người — xem thêm vụ Mata v. Avianca 2023.",
  },
  {
    question:
      "Câu nào mô tả ĐÚNG về mối quan hệ giữa độ tự tin của AI và độ chính xác?",
    options: [
      "AI càng trả lời dứt khoát thì càng chính xác.",
      "Độ tự tin bằng lời nói (tone) và độ chính xác sự thật là HAI chuyện khác nhau — AI được tối ưu để nghe mượt, không phải để đúng.",
      "AI chỉ sai khi nó mở đầu bằng 'Tôi không chắc…'",
      "Độ chính xác luôn tăng khi prompt dài hơn.",
    ],
    correct: 1,
    explanation:
      "Đây là điểm quan trọng nhất: 'nghe trơn tru' và 'đúng sự thật' là hai trục độc lập. Đừng lấy độ mượt của câu văn làm thước đo độ tin cậy.",
  },
  {
    question:
      "Trong 4 dạng ảo giác dưới đây, dạng nào khó phát hiện NHẤT?",
    options: [
      "Bịa toàn bộ — tên người, tên tổ chức, năm đều không tồn tại.",
      'Trộn sự thật: 80% đúng + 1 chi tiết lệch (sai 1 con số, sai 1 tác giả trong câu trích dẫn).',
      "Mâu thuẫn logic rõ ràng trong cùng một đoạn văn.",
      "AI trả lời bằng ngôn ngữ khác với ngôn ngữ câu hỏi.",
    ],
    correct: 1,
    explanation:
      "Ảo giác 'trộn sự thật' là loại nguy hiểm nhất. Khi phần lớn thông tin đúng, người đọc dễ tin phần sai — và đây là dạng phổ biến trong các câu trả lời có trích dẫn, số liệu.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * DEFAULT EXPORT
 * ──────────────────────────────────────────────────────────────*/
export default function HallucinationTopic() {
  return (
    <>
      {/* BƯỚC 1 — HOOK / DỰ ĐOÁN */}
      <PredictionGate
        question="Một AI khẳng định: 'Chủ tịch Hồ Chí Minh sinh năm 1890 tại Nghệ An. Năm 1919, Người đã gặp trực tiếp Tổng thống Pháp Raymond Poincaré tại Paris để trình Bản yêu sách của nhân dân An Nam.' Theo bạn, đoạn này là…"
        options={[
          "Tất cả đều đúng",
          "Có một chi tiết bị bịa thêm, phần còn lại đúng",
          "Tất cả đều bịa",
          "Không xác định được nếu chưa tra cứu",
        ]}
        correct={1}
        explanation='Năm sinh và nơi sinh đúng. Năm 1919 có Bản yêu sách thật — nhưng gửi qua đường công văn, KHÔNG có cuộc gặp trực tiếp với Tổng thống Poincaré. Đây là dạng ảo giác "trộn sự thật": 80% đúng + 1 chi tiết bịa thêm để câu văn nghe chắc nịch. Cực kỳ nguy hiểm vì khó phát hiện.'
      >
        <p className="mt-3 text-sm text-muted">
          Hôm nay bạn sẽ học cách nhận ra những chi tiết như vậy — đặc biệt quan
          trọng nếu công việc của bạn là{" "}
          <strong>nghiên cứu, viết báo, tra cứu pháp lý, soạn giáo án</strong>.
        </p>
      </PredictionGate>

      {/* BƯỚC 2 — ẨN DỤ THỰC TẾ */}
      <p className="mt-8">
        Hãy tưởng tượng AI giống như <strong>một cậu học trò rất tự tin</strong>.
        Được giáo viên hỏi bất kỳ câu gì, cậu thà trả lời trôi chảy một câu{" "}
        <em>nghe có vẻ đúng</em> còn hơn là thừa nhận &ldquo;em không biết&rdquo;.
        Giọng điệu luôn dứt khoát, diễn đạt mượt mà — nhưng thỉnh thoảng cậu
        bịa ra cả một cái tên, một con số, một câu trích dẫn không hề tồn tại.
      </p>
      <p>
        Hiện tượng đó được gọi là <strong>ảo giác</strong> (tiếng Anh:{" "}
        <em>hallucination</em>). Nó không phải là &ldquo;AI nói dối&rdquo; theo
        kiểu có ý đồ. AI đơn giản được thiết kế để chọn từ tiếp theo{" "}
        <strong>nghe trơn tru nhất</strong>, chứ không phải từ{" "}
        <strong>đúng sự thật nhất</strong>. Khi câu hỏi có vẻ đã có đáp án, AI
        sẽ cố viết một đáp án — ngay cả khi trong &ldquo;trí nhớ&rdquo; của nó
        không hề có thông tin đó.
      </p>
      <p>
        Với người dùng văn phòng — nhất là{" "}
        <strong>luật sư, nhà báo, giáo viên, giảng viên</strong> — đây là điều
        cần thuộc lòng trước khi giao việc cho AI.
      </p>

      {/* BƯỚC 3 — TRỰC QUAN HÓA TƯƠNG TÁC */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Soi ảo giác trong đoạn AI viết" step={1}>
          <p className="mb-3 text-sm text-muted">
            Dưới đây là những đoạn do AI sinh ra khi được hỏi câu hỏi thật từ
            công việc hàng ngày. Trông đoạn nào cũng trôi chảy — nhưng trong
            mỗi đoạn có chính xác <strong>một câu bị bịa</strong>. Thử soi xem
            bạn có tìm được không.
          </p>
          <SpotTheHallucination />
        </LessonSection>

        <LessonSection label="Nhiệt độ càng cao, ảo giác càng nhiều" step={2}>
          <p className="mb-3 text-sm text-muted">
            Khi dùng AI qua API hoặc trong công cụ chuyên dụng, bạn có thể điều
            chỉnh tham số <strong>temperature</strong> (nhiệt độ sinh văn bản).
            Nhiệt độ càng thấp, AI càng thận trọng. Nhiệt độ càng cao, AI càng
            &ldquo;sáng tạo&rdquo; — và cũng càng dễ bịa.
          </p>
          <TemperatureCompare />
          <Callout variant="tip" title="Mẹo thực hành">
            Với việc <strong>tra cứu sự thật</strong> (số liệu, tên người, án
            lệ, trích dẫn), hãy chọn temperature thấp (0 - 0.3). Với việc{" "}
            <strong>sáng tạo</strong> (viết slogan, brainstorm tên sản phẩm),
            có thể để cao hơn.
          </Callout>
        </LessonSection>

        <LessonSection label="Phân loại bốn dạng ảo giác phổ biến" step={3}>
          <p className="mb-3 text-sm text-muted">
            Không phải ảo giác nào cũng giống nhau. Kéo mỗi ví dụ vào đúng loại
            bên dưới để rèn phản xạ nhận diện.
          </p>
          <DragDrop
            instruction="Kéo mỗi câu nói của AI vào loại ảo giác tương ứng."
            items={[
              {
                id: "fact",
                label: "AI: 'Thủ đô Úc là Sydney.'",
              },
              {
                id: "date",
                label:
                  "AI: 'Chiến thắng Điện Biên Phủ diễn ra ngày 7 tháng 5 năm 1955.'",
              },
              {
                id: "cite",
                label:
                  "AI: 'Theo nghiên cứu của GS. Trần Văn Bình, ĐH Bách Khoa (2023)...'",
              },
              {
                id: "contra",
                label:
                  "AI: 'Bộ luật này có hiệu lực từ 2020. Vì chưa có hiệu lực nên...'",
              },
            ]}
            zones={[
              {
                id: "zone-fact",
                label: "Sự thật bịa đặt (Canberra, không phải Sydney)",
                accepts: ["fact"],
              },
              {
                id: "zone-date",
                label: "Sai ngày tháng (đúng: 7/5/1954)",
                accepts: ["date"],
              },
              {
                id: "zone-cite",
                label: "Trích dẫn bịa (người, nghiên cứu không tồn tại)",
                accepts: ["cite"],
              },
              {
                id: "zone-contra",
                label: "Mâu thuẫn logic trong cùng câu",
                accepts: ["contra"],
              },
            ]}
          />
        </LessonSection>
      </VisualizationSection>

      {/* BƯỚC 4 — KHOẢNH KHẮC AHA */}
      <AhaMoment>
        Điểm cần thuộc lòng: <strong>AI không biết rằng nó không biết</strong>.
        Nó được tối ưu để <em>nghe trôi chảy</em>, không phải để{" "}
        <em>đúng sự thật</em>. Vì vậy, một câu trả lời tự tin của AI{" "}
        <strong>KHÔNG</strong> phải là bằng chứng rằng câu đó chính xác.
      </AhaMoment>

      {/* BƯỚC 5 — THÁCH THỨC NHỎ */}
      <InlineChallenge
        question="Trong các việc sau, việc nào NGUY HIỂM NHẤT nếu bạn dùng AI mà không kiểm chứng?"
        options={[
          "Nhờ AI viết một slogan quảng cáo cho chiến dịch mới.",
          "Nhờ AI gợi ý đề mục cho một bài thuyết trình nội bộ.",
          "Nhờ AI tra một điều luật cụ thể với số hiệu văn bản và ngày ban hành.",
          "Nhờ AI tóm tắt đoạn email tiếng Anh sang tiếng Việt.",
        ]}
        correct={2}
        explanation="Tra cứu văn bản pháp luật là nơi ảo giác nguy hiểm nhất — AI có thể bịa cả số hiệu văn bản, tên luật, ngày ban hành. Slogan và đề mục thuyết trình thì sáng tạo tự do, sai cũng không chết ai. Tóm tắt đoạn văn có sẵn thì AI chủ yếu làm việc với input bạn đưa, rủi ro thấp hơn."
      />

      {/* BƯỚC 6 — GIẢI THÍCH SÂU */}
      <ExplanationSection topicSlug={metadata.slug}>
        <p>
          <strong>Ảo giác</strong> (hallucination) là hiện tượng AI tạo ra
          thông tin <em>nghe hợp lý nhưng sai sự thật hoặc bịa đặt</em>. Nó
          không phải lỗi phần mềm — nó là <strong>hệ quả tự nhiên</strong> của
          cách AI hoạt động.
        </p>

        {/* Vì sao lại xảy ra — sơ đồ 3 bước */}
        <div className="my-6 rounded-xl border border-border bg-surface/40 p-5">
          <h4 className="mb-4 text-sm font-semibold text-foreground">
            Vì sao ảo giác xảy ra — nhìn bên trong một câu trả lời AI
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Brain size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Bước 1
                </span>
              </div>
              <div className="mb-1 font-semibold text-foreground">
                So khớp pattern
              </div>
              <p className="text-xs text-muted">
                Khi bạn hỏi, AI không tra cứu trong một kho dữ liệu sự thật. Nó
                so khớp câu hỏi với <em>pattern ngôn ngữ</em> đã học từ hàng tỷ
                trang văn bản trên Internet.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Wand2 size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Bước 2
                </span>
              </div>
              <div className="mb-1 font-semibold text-foreground">
                Chọn từ &ldquo;nghe hợp lý&rdquo;
              </div>
              <p className="text-xs text-muted">
                AI chọn từng từ tiếp theo có xác suất cao nhất trong ngữ cảnh.
                Nếu không có thông tin đúng, nó vẫn phải chọn một từ — và chọn
                từ <em>gần đúng về mặt thống kê</em>.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Bước 3
                </span>
              </div>
              <div className="mb-1 font-semibold text-foreground">
                Xuất câu nghe chắc nịch
              </div>
              <p className="text-xs text-muted">
                Văn bản ra luôn có giọng điệu mạch lạc. AI không đánh dấu{" "}
                &ldquo;phần này tôi không chắc&rdquo; — trừ khi bạn yêu cầu rõ.
              </p>
            </div>
          </div>
        </div>

        {/* Bốn dạng ảo giác */}
        <p className="mt-6">
          <strong>Bốn dạng ảo giác bạn hay gặp nhất trong công việc:</strong>
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Callout variant="warning" title="Sự thật bịa đặt">
            AI đưa ra một thông tin sai trắng trợn: thủ đô Úc là Sydney, GDP
            năm 2024 là 600 tỷ đô, Phó Thủ tướng tên là X. Loại này dễ phát hiện
            nếu bạn có kiến thức nền — nhưng nguy hiểm với lĩnh vực mới.
          </Callout>
          <Callout variant="warning" title="Sai ngày/số liệu">
            Thường là lệch một chữ số hoặc lệch một năm. Điện Biên Phủ 1955 thay
            vì 1954. GDP 7,9% thay vì 7,09%. Dạng này cực kỳ khó thấy khi bạn
            lướt nhanh.
          </Callout>
          <Callout variant="warning" title="Trích dẫn bịa">
            &ldquo;Theo nghiên cứu của GS. X, ĐH Y (2023)…&rdquo; — nhưng GS. X
            không tồn tại, hoặc có tồn tại nhưng chưa từng công bố nghiên cứu
            đó. Đây là dạng đã khiến nhiều luật sư Mỹ bị phạt.
          </Callout>
          <Callout variant="warning" title="Mâu thuẫn logic">
            AI viết: &ldquo;Bộ luật có hiệu lực từ 2020&rdquo; rồi 2 câu sau
            lại viết &ldquo;vì chưa có hiệu lực nên…&rdquo;. Chính AI tự đá
            ngược lại AI.
          </Callout>
        </div>

        {/* 5 chiến lược giảm ảo giác */}
        <h4 className="mt-8 text-base font-semibold text-foreground">
          Năm chiến lược giảm ảo giác trong công việc
        </h4>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>Dán tài liệu gốc vào prompt (RAG thủ công).</strong> Thay vì
            hỏi &ldquo;Điều 5 Luật Đất đai nói gì?&rdquo;, hãy copy nguyên văn
            điều luật đó rồi hỏi &ldquo;Tóm tắt giúp điều này.&rdquo; AI khi đó
            có nguyên liệu thật để tổng hợp, thay vì bịa từ trí nhớ.{" "}
            <TopicLink slug="rag">Xem chi tiết về RAG</TopicLink>.
          </li>
          <li>
            <strong>Yêu cầu AI dẫn nguồn cụ thể — rồi tự tra nguồn đó.</strong>{" "}
            Ví dụ: &ldquo;Trả lời dựa trên luật hiện hành ở Việt Nam, kèm số
            hiệu văn bản và điều khoản.&rdquo; Sau đó, <em>luôn luôn</em> mở
            văn bản gốc để kiểm chứng.
          </li>
          <li>
            <strong>Cho phép AI nói &ldquo;tôi không biết&rdquo;.</strong> Thêm
            vào prompt câu: &ldquo;Nếu bạn không chắc, hãy trả lời &lsquo;Tôi
            không có thông tin chắc chắn&rsquo; thay vì đoán.&rdquo; Điều này
            giảm đáng kể ảo giác.
          </li>
          <li>
            <strong>Cross-check bằng một mô hình khác.</strong> Hỏi cùng câu
            hỏi với hai AI khác nhau (ví dụ ChatGPT và Gemini). Nếu đáp án
            lệch, cả hai đều đáng nghi — phải tra nguồn sơ cấp.
          </li>
          <li>
            <strong>Kiểm chứng mọi trích dẫn trên nguồn sơ cấp.</strong>{" "}
            Không bao giờ paste trích dẫn do AI sinh vào báo cáo/hợp đồng/bài
            viết mà chưa mở trang gốc xem tận mắt.
          </li>
        </ol>

        {/* High-stakes vs low-stakes */}
        <div className="my-6">
          <h4 className="mb-3 text-base font-semibold text-foreground">
            Khi nào ảo giác gây hậu quả, khi nào không?
          </h4>
          <ToggleCompare
            labelA="Việc rủi ro thấp"
            labelB="Việc rủi ro cao"
            childA={
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>
                    Viết slogan, gợi ý tên sản phẩm, brainstorm ý tưởng.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>
                    Tóm tắt email, đổi giọng văn của đoạn có sẵn.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>
                    Soạn outline cho bài thuyết trình (bạn tự điền nội dung).
                  </span>
                </div>
                <p className="pt-2 text-xs text-muted">
                  AI sai cũng không thành chuyện lớn. Bạn dùng AI như một
                  nguồn cảm hứng, không phải nguồn sự thật.
                </p>
              </div>
            }
            childB={
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span>
                    Tra cứu điều luật, án lệ, số hiệu văn bản pháp lý.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span>
                    Viết bài báo/bài nghiên cứu có trích dẫn cụ thể.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span>
                    Lập báo cáo số liệu, phân tích tài chính, chẩn đoán y tế.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span>
                    Soạn giáo án có năm sinh, niên đại, sự kiện lịch sử.
                  </span>
                </div>
                <p className="pt-2 text-xs text-muted">
                  Một con số sai, một tên sai là hỏng cả sản phẩm. Ở đây AI
                  chỉ được dùng với <strong>nguyên liệu gốc</strong> đi kèm.
                </p>
              </div>
            }
          />
        </div>

        {/* Nối cặp dấu hiệu → biện pháp */}
        <h4 className="mt-6 text-base font-semibold text-foreground">
          Nối dấu hiệu cảnh báo với biện pháp xử lý
        </h4>
        <MatchPairs
          instruction="Nối mỗi dấu hiệu ở Cột A với biện pháp phù hợp ở Cột B."
          pairs={[
            {
              left: "AI trích dẫn số hiệu vụ án / văn bản luật",
              right: "Tra số hiệu đó trên cổng thông tin chính thức",
            },
            {
              left: "AI viết 'theo nghiên cứu của GS. X năm Y'",
              right: "Tìm GS.X và bài nghiên cứu trên Google Scholar",
            },
            {
              left: "AI đưa số liệu thống kê cụ thể (GDP, dân số, tỷ lệ%)",
              right: "Đối chiếu với báo cáo Tổng cục Thống kê",
            },
            {
              left: "AI kể ngày sinh, năm mất, quê quán nhân vật",
              right: "Kiểm tra trên Wikipedia tiếng Việt/Anh + sách tiểu sử",
            },
          ]}
        />

        <Callout variant="insight" title="Quy tắc 3-không vàng cho dân văn phòng">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>Không</strong> dùng trực tiếp tên người, con số, trích
              dẫn do AI sinh mà chưa kiểm chứng.
            </li>
            <li>
              <strong>Không</strong> copy bài AI viết thành sản phẩm cuối nếu
              nội dung có yếu tố sự thật cần xác minh.
            </li>
            <li>
              <strong>Không</strong> coi câu trả lời tự tin là bằng chứng — AI
              luôn tự tin, kể cả khi sai.
            </li>
          </ol>
        </Callout>
      </ExplanationSection>

      {/* BƯỚC 7 — TÓM TẮT */}
      <MiniSummary
        title="Những điều cần nhớ về ảo giác của AI"
        points={[
          "Ảo giác không phải là 'AI nói dối' — AI được tối ưu để nghe trôi chảy, không phải để đúng sự thật.",
          "Bốn dạng thường gặp: sự thật bịa, sai ngày/số, trích dẫn bịa, mâu thuẫn logic. Dạng 'trộn sự thật' là khó phát hiện nhất.",
          "Nhiệt độ (temperature) càng cao, ảo giác càng nhiều. Với tra cứu sự thật, để T thấp.",
          "Giảm ảo giác bằng RAG (dán tài liệu gốc), cho phép AI nói 'không biết', cross-check, và luôn xác minh trích dẫn.",
          "Việc rủi ro cao (luật pháp, báo chí, giáo dục, y tế) bắt buộc phải kiểm chứng mọi con số và tên riêng do AI sinh ra.",
        ]}
      />

      {/* BƯỚC 8 — KIỂM TRA */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
