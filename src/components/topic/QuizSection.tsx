"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizSectionProps {
  questions: QuizQuestion[];
}

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
    if (index === q.correct) {
      setScore((s) => s + 1);
    }
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

        {/* Question */}
        <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
          {q.question}
        </p>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
            let cls = "quiz-option rounded-lg border border-border px-4 py-3 text-sm text-left w-full transition-all";
            if (answered) {
              cls += " quiz-disabled cursor-default";
              if (i === q.correct) cls += " quiz-correct";
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
                    answered && i === q.correct ? "bg-green-500 text-white"
                    : answered && i === selected ? "bg-red-500 text-white"
                    : "bg-surface text-muted"
                  }`}>
                    {answered && i === q.correct ? <CheckCircle2 size={14} /> :
                     answered && i === selected ? <XCircle size={14} /> :
                     String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation + Next */}
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
      </div>
    </section>
  );
}
