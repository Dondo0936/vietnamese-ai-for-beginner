"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

interface MCQQuestion {
  type?: "mcq";
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface FillBlankQuestion {
  type: "fill-blank";
  question: string;
  blanks: { answer: string; accept?: string[] }[];
  explanation?: string;
}

interface CodeQuestion {
  type: "code";
  question: string;
  codeTemplate: string;
  language: string;
  blanks: { answer: string; accept?: string[] }[];
  explanation?: string;
}

export type QuizQuestion = MCQQuestion | FillBlankQuestion | CodeQuestion;

interface QuizSectionProps {
  questions: QuizQuestion[];
}

/* ── Fill-in-the-blank sub-component ── */
function FillBlankQuiz({
  q,
  onAnswer,
}: {
  q: FillBlankQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(q.blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const r = q.blanks.map((blank, i) => {
      const input = values[i].trim().toLowerCase();
      const accepted = [blank.answer, ...(blank.accept || [])].map((a) =>
        a.toLowerCase()
      );
      return accepted.includes(input);
    });
    setResults(r);
    setChecked(true);
    onAnswer(r.every(Boolean));
  }

  const parts = q.question.split(/\{blank\}/g);
  let blankIdx = 0;

  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground leading-relaxed flex flex-wrap items-center gap-1">
        {parts.map((part, i) => {
          const currentBlankIdx = blankIdx;
          const hasBlankAfter = i < parts.length - 1;
          if (hasBlankAfter) blankIdx++;
          return (
            <span key={i} className="contents">
              <span>{part}</span>
              {hasBlankAfter && (
                <input
                  type="text"
                  value={values[currentBlankIdx]}
                  onChange={(e) => {
                    const next = [...values];
                    next[currentBlankIdx] = e.target.value;
                    setValues(next);
                  }}
                  disabled={checked}
                  className={`inline-block w-28 rounded-md border px-2 py-1 text-sm font-mono text-center transition-colors ${
                    checked
                      ? results[currentBlankIdx]
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-border bg-surface text-foreground focus:border-accent focus:outline-none"
                  }`}
                  placeholder="..."
                />
              )}
            </span>
          );
        })}
      </div>

      {checked && !results.every(Boolean) && (
        <div className="rounded-lg bg-surface p-3 text-xs text-muted">
          <span className="font-medium text-foreground">Đáp án: </span>
          {q.blanks.map((b, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <code className="rounded bg-accent/10 px-1 py-0.5 text-accent">
                {b.answer}
              </code>
            </span>
          ))}
        </div>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={check}
          disabled={values.some((v) => v.trim() === "")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          Kiểm tra
        </button>
      ) : (
        q.explanation && (
          <div className="rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
            {q.explanation}
          </div>
        )
      )}
    </div>
  );
}

/* ── Code completion sub-component ── */
function CodeQuiz({
  q,
  onAnswer,
}: {
  q: CodeQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(q.blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const r = q.blanks.map((blank, i) => {
      const input = values[i].trim().toLowerCase();
      const accepted = [blank.answer, ...(blank.accept || [])].map((a) =>
        a.toLowerCase()
      );
      return accepted.includes(input);
    });
    setResults(r);
    setChecked(true);
    onAnswer(r.every(Boolean));
  }

  const codeParts = q.codeTemplate.split(/___/g);
  let codeBlankIdx = 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground leading-relaxed">{q.question}</p>

      <div className="rounded-xl border border-border bg-[#1e1e2e] p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-[#cdd6f4] whitespace-pre-wrap leading-relaxed">
          {codeParts.map((part, i) => {
            const currentIdx = codeBlankIdx;
            const hasBlankAfter = i < codeParts.length - 1;
            if (hasBlankAfter) codeBlankIdx++;
            return (
              <span key={i}>
                <span>{part}</span>
                {hasBlankAfter && (
                  <input
                    type="text"
                    value={values[currentIdx]}
                    onChange={(e) => {
                      const next = [...values];
                      next[currentIdx] = e.target.value;
                      setValues(next);
                    }}
                    disabled={checked}
                    className={`inline-block w-24 rounded border px-1.5 py-0.5 text-sm font-mono text-center ${
                      checked
                        ? results[currentIdx]
                          ? "border-green-500 bg-green-900/30 text-green-400"
                          : "border-red-500 bg-red-900/30 text-red-400"
                        : "border-[#585b70] bg-[#313244] text-[#cdd6f4] focus:border-accent focus:outline-none"
                    }`}
                    placeholder="___"
                  />
                )}
              </span>
            );
          })}
        </pre>
      </div>

      {checked && !results.every(Boolean) && (
        <div className="rounded-lg bg-surface p-3 text-xs text-muted">
          <span className="font-medium text-foreground">Đáp án: </span>
          {q.blanks.map((b, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <code className="rounded bg-accent/10 px-1 py-0.5 text-accent">
                {b.answer}
              </code>
            </span>
          ))}
        </div>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={check}
          disabled={values.some((v) => v.trim() === "")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          Kiểm tra
        </button>
      ) : (
        q.explanation && (
          <div className="rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
            {q.explanation}
          </div>
        )
      )}
    </div>
  );
}

/* ── Main QuizSection ── */
export default function QuizSection({ questions }: QuizSectionProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[current];

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    const mcq = q as MCQQuestion;
    if (index === mcq.correct) {
      setScore((s) => s + 1);
    }
  }

  function handleNonMcqAnswer(correct: boolean) {
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  }

  function reset() {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <section className="my-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy size={20} className="text-accent" />
          Kết quả
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-4xl font-bold text-accent mb-2">{pct}%</div>
          <p className="text-muted mb-1">
            {score}/{questions.length} câu đúng
          </p>
          <p className="text-sm text-muted mb-6">
            {pct >= 80 ? "Xuất sắc! Bạn nắm vững chủ đề này." :
             pct >= 50 ? "Khá tốt! Hãy xem lại những phần chưa chắc." :
             "Hãy đọc lại bài và thử lại nhé!"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            <RotateCcw size={14} />
            Làm lại
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="my-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <CheckCircle2 size={20} className="text-accent" />
        Kiểm tra hiểu biết
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted">
            Câu {current + 1}/{questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < current ? "bg-accent" : i === current ? "bg-accent/50" : "bg-surface"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question content — dispatched by type */}
        {q.type === "fill-blank" ? (
          <FillBlankQuiz q={q} onAnswer={handleNonMcqAnswer} />
        ) : q.type === "code" ? (
          <CodeQuiz q={q} onAnswer={handleNonMcqAnswer} />
        ) : (
          <>
            {/* MCQ — original rendering */}
            <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
              {q.question}
            </p>

            <div className="space-y-2 mb-4">
              {(q as MCQQuestion).options.map((opt, i) => {
                const mcq = q as MCQQuestion;
                let cls = "quiz-option rounded-lg border border-border px-4 py-3 text-sm text-left w-full transition-all";
                if (answered) {
                  cls += " quiz-disabled cursor-default";
                  if (i === mcq.correct) cls += " quiz-correct";
                  else if (i === selected) cls += " quiz-wrong";
                } else {
                  cls += " cursor-pointer hover:border-accent";
                }
                if (i === selected && !answered) cls += " quiz-selected border-accent bg-accent-light";

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={cls}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        answered && i === mcq.correct ? "bg-green-500 text-white"
                        : answered && i === selected ? "bg-red-500 text-white"
                        : "bg-surface text-muted"
                      }`}>
                        {answered && i === mcq.correct ? <CheckCircle2 size={14} /> :
                         answered && i === selected ? <XCircle size={14} /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MCQ Explanation + Next */}
            {answered && (
              <div className="space-y-3">
                {q.explanation && (
                  <div className="rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
                    {q.explanation}
                  </div>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                >
                  {current < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Next button for fill-blank and code types */}
        {answered && (q.type === "fill-blank" || q.type === "code") && (
          <div className="mt-3">
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              {current < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
