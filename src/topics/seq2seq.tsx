"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "seq2seq",
  title: "Sequence-to-Sequence",
  titleVi: "Seq2Seq - Chuỗi sang chuỗi",
  description:
    "Kiến trúc mã hóa-giải mã chuyển đổi chuỗi đầu vào thành chuỗi đầu ra, nền tảng cho dịch máy và tóm tắt văn bản.",
  category: "nlp",
  tags: ["nlp", "architecture", "translation"],
  difficulty: "intermediate",
  relatedSlugs: ["rnn", "lstm", "attention-mechanism"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const INPUT_TOKENS = ["Tôi", "yêu", "Việt", "Nam"];
const OUTPUT_TOKENS = ["I", "love", "Vietnam", "<EOS>"];

const QUIZ: QuizQuestion[] = [
  {
    question: "Nút thắt cổ chai (bottleneck) của Seq2Seq là gì?",
    options: [
      "Encoder quá chậm",
      "Toàn bộ câu đầu vào bị nén vào MỘT vector cố định — câu dài sẽ mất thông tin",
      "Decoder không thể sinh token",
      "Seq2Seq chỉ dùng cho tiếng Anh",
    ],
    correct: 1,
    explanation:
      "Context vector có kích thước cố định, nhưng câu đầu vào có độ dài bất kỳ. Như nhét 1000 trang sách vào 1 trang giấy — chắc chắn mất thông tin!",
  },
  {
    question: "Seq2Seq sinh output theo cách nào?",
    options: [
      "Sinh tất cả từ cùng lúc",
      "Sinh từng từ một (autoregressive) — từ trước là input cho từ sau",
      "Chọn ngẫu nhiên từ trong từ vựng",
      "Copy trực tiếp từ input",
    ],
    correct: 1,
    explanation:
      "Decoder sinh từng token một: output tại bước t trở thành input cho bước t+1. 'I' → 'love' → 'Vietnam' → '<EOS>'.",
  },
  {
    question: "Cơ chế nào được phát triển để giải quyết bottleneck của Seq2Seq?",
    options: [
      "Dùng encoder lớn hơn",
      "Attention — cho decoder nhìn trực tiếp vào TẤT CẢ trạng thái encoder",
      "Tăng kích thước context vector",
      "Dùng nhiều context vector",
    ],
    correct: 1,
    explanation:
      "Attention cho phép decoder 'nhìn lại' mọi vị trí trong câu nguồn khi sinh mỗi từ, thay vì chỉ dựa vào 1 context vector. Giải quyết triệt để bottleneck!",
  },
  {
    type: "fill-blank",
    question: "Seq2Seq gồm hai phần chính: {blank} nén chuỗi đầu vào thành context vector, và {blank} sinh chuỗi đầu ra theo kiểu autoregressive từ context đó.",
    blanks: [
      { answer: "encoder", accept: ["Encoder", "bộ mã hóa", "mã hóa"] },
      { answer: "decoder", accept: ["Decoder", "bộ giải mã", "giải mã"] },
    ],
    explanation: "Encoder đọc toàn bộ chuỗi nguồn (ví dụ tiếng Việt) và nén thành một context vector. Decoder nhận context này rồi sinh từng token đầu ra (ví dụ tiếng Anh), mỗi token trước là input cho token sau.",
  },
];

/* ── Main Component ── */
export default function Seq2SeqTopic() {
  const [step, setStep] = useState(0);
  const maxStep = INPUT_TOKENS.length + OUTPUT_TOKENS.length;

  const encodingDone = step >= INPUT_TOKENS.length;
  const decodingStep = encodingDone ? step - INPUT_TOKENS.length : -1;

  const onNext = useCallback(() => setStep((s) => Math.min(s + 1, maxStep)), [maxStep]);
  const onPrev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const onReset = useCallback(() => setStep(0), []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Bạn là phiên dịch viên. Nghe câu "Tôi yêu Việt Nam" xong, bạn dịch sang tiếng Anh. Bạn phải nghe HẾT câu trước rồi mới dịch, hay dịch từng từ ngay lập tức?`}
          options={["Dịch từng từ ngay khi nghe", "Nghe hết câu rồi mới bắt đầu dịch", "Dịch ngược từ cuối"]}
          correct={1}
          explanation={`Bạn phải nghe hết "Tôi yêu Việt Nam" (MÃ HÓA toàn bộ ý nghĩa) rồi mới bắt đầu dịch "I love Vietnam" (GIẢI MÃ từng từ). Seq2Seq hoạt động đúng như phiên dịch viên: Encoder nghe → nén thành "ý nghĩa" → Decoder dịch!`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Hãy bấm {'"Tiếp"'} để xem Seq2Seq dịch {'"Tôi yêu Việt Nam"'} sang tiếng Anh — từng bước một!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Controls */}
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={onPrev}
                className="rounded-lg px-4 py-2 text-sm font-semibold bg-card border border-border text-muted hover:text-foreground transition-colors">
                Lùi
              </button>
              <button type="button" onClick={onNext}
                className="rounded-lg px-4 py-2 text-sm font-semibold bg-accent text-white transition-colors hover:opacity-90">
                Tiếp
              </button>
              <button type="button" onClick={onReset}
                className="rounded-lg px-4 py-2 text-sm font-semibold bg-card border border-border text-muted hover:text-foreground transition-colors">
                Đặt lại
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-1 justify-center">
              {Array.from({ length: maxStep + 1 }).map((_, i) => (
                <div key={i} className={`h-1.5 w-4 rounded-full transition-colors ${
                  i <= step ? (i < INPUT_TOKENS.length ? "bg-blue-500" : "bg-green-500") : "bg-surface"
                }`} />
              ))}
            </div>

            {/* Encoder */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide text-center">
                Encoder (Bộ mã hóa)
              </p>
              <div className="flex gap-2 justify-center">
                {INPUT_TOKENS.map((token, i) => {
                  const active = step > i;
                  const current = step === i + 1;
                  return (
                    <div key={`enc-${i}`} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      active ? "bg-blue-500 text-white" : current ? "bg-blue-500/50 text-blue-200 ring-2 ring-blue-300" : "bg-card border border-border text-muted"
                    }`}>
                      {token}
                      {active && (
                        <span className="block text-[9px] opacity-70">h{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Context Vector */}
            <div className="flex justify-center">
              <div className={`rounded-full w-16 h-16 flex items-center justify-center transition-all ${
                encodingDone ? "bg-purple-500 text-white scale-110" : "bg-surface border border-border text-muted"
              }`}>
                <div className="text-center">
                  <p className="text-[10px] font-bold">Context</p>
                  <p className="text-[9px]">Vector</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className={`w-0.5 h-4 transition-colors ${encodingDone ? "bg-purple-500" : "bg-surface"}`} />
            </div>

            {/* Decoder */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide text-center">
                Decoder (Bộ giải mã)
              </p>
              <div className="flex gap-2 justify-center">
                {OUTPUT_TOKENS.map((token, i) => {
                  const active = decodingStep > i;
                  const current = decodingStep === i;
                  return (
                    <div key={`dec-${i}`} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      active ? "bg-green-500 text-white" : current ? "bg-green-500/50 text-green-200 ring-2 ring-green-300" : "bg-card border border-border text-muted"
                    }`}>
                      {active || current ? token : "?"}
                      {active && (
                        <span className="block text-[9px] opacity-70">s{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step description */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-foreground">
                {step === 0 && "Bấm 'Tiếp' để bắt đầu mã hóa câu tiếng Việt."}
                {step > 0 && !encodingDone && (
                  <>Encoder đang đọc: <strong className="text-blue-500">{INPUT_TOKENS[step - 1]}</strong> → nén vào hidden state h{step}</>
                )}
                {encodingDone && decodingStep === 0 && "Encoder đã nén toàn bộ câu vào Context Vector! Decoder bắt đầu giải mã..."}
                {decodingStep > 0 && decodingStep < OUTPUT_TOKENS.length && (
                  <>Decoder sinh: <strong className="text-green-500">{OUTPUT_TOKENS[decodingStep]}</strong> (dựa trên context + các từ đã sinh)</>
                )}
                {step === maxStep && (
                  <span className="text-green-500 font-bold">Hoàn tất! Tôi yêu Việt Nam → I love Vietnam</span>
                )}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Seq2Seq</strong>{" "}
            = Encoder (mã hóa input → context vector) + Decoder (giải mã context → output). Giống phiên dịch viên: nghe hết → nhớ ý chính → dịch từng từ!
          </p>
          <p className="text-sm text-muted mt-1">
            Nhưng có vấn đề: context vector có kích thước cố định. Câu dài 100 từ bị nén vào cùng kích thước với câu 5 từ — như nhét cả quyển sách vào 1 tờ giấy nhớ!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`Seq2Seq dịch câu 5 từ tốt, nhưng câu 50 từ lại kém. Tại sao?`}
          options={[
            "Decoder quá chậm",
            "Context vector có kích thước CỐ ĐỊNH — câu dài bị mất thông tin (bottleneck)",
            "Encoder không đọc được câu dài",
          ]}
          correct={1}
          explanation="Context vector = 1 vector cố định phải chứa ý nghĩa toàn bộ câu. Câu càng dài, thông tin bị nén càng nhiều → mất mát. Attention sẽ giải quyết vấn đề này!"
        />
      </LessonSection>

      {/* ── Step 5: Bottleneck illustration ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Vấn đề Bottleneck">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
              <p className="text-xs font-semibold text-green-500 uppercase">Câu ngắn (5 từ)</p>
              <div className="flex gap-1 flex-wrap">
                {["Tôi", "yêu", "Việt", "Nam", "."].map((w, i) => (
                  <span key={i} className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">{w}</span>
                ))}
              </div>
              <div className="flex justify-center">
                <span className="text-muted">↓</span>
              </div>
              <div className="rounded-full bg-purple-500/20 border border-purple-500 w-10 h-10 mx-auto flex items-center justify-center">
                <span className="text-[8px] text-purple-400 font-bold">256d</span>
              </div>
              <p className="text-xs text-green-500 text-center">Vector đủ chỗ chứa!</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
              <p className="text-xs font-semibold text-red-500 uppercase">Câu dài (50 từ)</p>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">từ</span>
                ))}
                <span className="text-xs text-muted">...+38 từ nữa</span>
              </div>
              <div className="flex justify-center">
                <span className="text-muted">↓</span>
              </div>
              <div className="rounded-full bg-purple-500/20 border border-purple-500 w-10 h-10 mx-auto flex items-center justify-center">
                <span className="text-[8px] text-purple-400 font-bold">256d</span>
              </div>
              <p className="text-xs text-red-500 text-center">Cùng kích thước → mất thông tin!</p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Sequence-to-Sequence</strong>{" "}
            (Sutskever et al., Google 2014) gồm Encoder nén input và Decoder sinh output, thường dùng{" "}
            <TopicLink slug="rnn">RNN</TopicLink>{" "}hoặc{" "}
            <TopicLink slug="lstm">LSTM</TopicLink>{" "}làm khối cơ sở, và sau đó được tăng cường bằng{" "}
            <TopicLink slug="attention-mechanism">attention</TopicLink>{" "}để khắc phục bottleneck.
          </p>

          <Callout variant="insight" title="Kiến trúc Seq2Seq">
            <div className="space-y-3">
              <p className="font-medium">Encoder: nén input thành context vector c</p>
              <LaTeX block>{`h_t = f(h_{t-1}, x_t), \\quad c = h_T`}</LaTeX>
              <p className="font-medium">Decoder: sinh output từng token một</p>
              <LaTeX block>{`s_t = g(s_{t-1}, y_{t-1}, c)`}</LaTeX>
              <LaTeX block>{`P(y_t | y_{<t}, x) = \\text{softmax}(W_o \\cdot s_t)`}</LaTeX>
            </div>
          </Callout>

          <Callout variant="info" title="Ứng dụng thực tế">
            <div className="space-y-2">
              <p>
                <strong>Google Translate (phiên bản cũ):</strong>{" "}
                Dịch tiếng Việt → tiếng Anh dùng Seq2Seq + Attention.
              </p>
              <p>
                <strong>Tóm tắt văn bản:</strong>{" "}
                Input = bài báo dài, Output = tóm tắt ngắn.
              </p>
              <p>
                <strong>Chatbot:</strong>{" "}
                Input = câu hỏi, Output = câu trả lời.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="seq2seq_concept.py">
{`import torch
import torch.nn as nn

class Encoder(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.rnn = nn.LSTM(embed_dim, hidden_dim, batch_first=True)

    def forward(self, x):
        # x: [batch, seq_len] → "Tôi yêu Việt Nam"
        embedded = self.embedding(x)
        outputs, (hidden, cell) = self.rnn(embedded)
        return hidden, cell  # Context vector!

class Decoder(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.rnn = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x, hidden, cell):
        # x: token trước đó → "I", "love", ...
        embedded = self.embedding(x.unsqueeze(1))
        output, (hidden, cell) = self.rnn(embedded, (hidden, cell))
        prediction = self.fc(output.squeeze(1))
        return prediction, hidden, cell  # Từ tiếp theo`}
          </CodeBlock>

          <Callout variant="tip" title="Từ Seq2Seq đến Transformer">
            <p>
              Seq2Seq dùng RNN/LSTM → chậm (xử lý tuần tự). Thêm Attention → tốt hơn nhưng vẫn chậm. Transformer (2017) thay RNN bằng Self-Attention → xử lý song song, nhanh hơn → nền tảng cho BERT, GPT!
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Seq2Seq"
          points={[
            "Seq2Seq = Encoder (nén input → context vector) + Decoder (giải mã → output).",
            "Decoder sinh từng token một (autoregressive): output t-1 → input t.",
            "Bottleneck: context vector cố định không đủ chứa thông tin câu dài.",
            "Attention giải quyết bottleneck bằng cách cho decoder nhìn mọi vị trí encoder.",
            "Ứng dụng: dịch máy, tóm tắt, chatbot — tiền thân của kiến trúc Transformer.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
