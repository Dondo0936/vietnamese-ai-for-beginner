"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "train-val-test",
  title: "Train / Validation / Test Split",
  titleVi: "Chia dữ liệu — Học, Kiểm tra, Thi thật",
  description:
    "Phương pháp chia dữ liệu thành ba tập riêng biệt để huấn luyện, điều chỉnh và đánh giá mô hình một cách khách quan.",
  category: "foundations",
  tags: ["train", "validation", "test", "split"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

export default function TrainValTestTopic() {
  const [trainPct, setTrainPct] = useState(70);
  const [valPct, setValPct] = useState(15);
  const testPct = 100 - trainPct - valPct;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ôn thi đại học:
        </p>
        <p>
          <strong>Tập huấn luyện (Train):</strong> Bộ đề ôn tập — bạn học và luyện từ đây.
          <strong> Tập kiểm định (Validation):</strong> Đề thi thử — giúp bạn đánh giá và
          điều chỉnh phương pháp học. <strong>Tập kiểm tra (Test):</strong> Đề thi thật —
          đánh giá năng lực thực sự, chỉ làm <em>một lần duy nhất</em>.
        </p>
        <p>
          Nếu dùng đề thi thật để ôn, bạn sẽ &quot;thuộc bài&quot; nhưng thi bài mới
          lại trượt — giống mô hình bị <strong>overfitting</strong>!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted">Huấn luyện: {trainPct}%</label>
            <input
              type="range" min={50} max={85} step={5}
              value={trainPct}
              onChange={(e) => setTrainPct(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted">Kiểm định: {valPct}%</label>
            <input
              type="range" min={5} max={25} step={5}
              value={valPct}
              onChange={(e) => setValPct(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
            <rect x={20} y={20} width={560 * trainPct / 100} height={40} rx={6} fill="#3b82f6" />
            <rect x={20 + 560 * trainPct / 100} y={20} width={560 * valPct / 100} height={40} rx={0} fill="#f59e0b" />
            <rect x={20 + 560 * (trainPct + valPct) / 100} y={20} width={560 * testPct / 100} height={40} rx={6} fill="#ef4444" />

            <text x={20 + 560 * trainPct / 200} y={46} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              Train {trainPct}%
            </text>
            <text x={20 + 560 * (trainPct + valPct / 2) / 100} y={46} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
              Val {valPct}%
            </text>
            <text x={20 + 560 * (trainPct + valPct + testPct / 2) / 100} y={46} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
              Test {testPct}%
            </text>

            <text x={300} y={85} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Tỷ lệ phổ biến: 70/15/15 hoặc 80/10/10
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Chia dữ liệu</strong> là bước thiết yếu để đánh giá mô hình một cách
          khách quan. Ba tập dữ liệu phục vụ ba mục đích khác nhau:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Tập huấn luyện (Train):</strong> Mô hình học các mẫu và quy luật từ tập này. Chiếm 60-80% dữ liệu.</li>
          <li><strong>Tập kiểm định (Validation):</strong> Dùng để điều chỉnh siêu tham số và chọn mô hình tốt nhất. Chiếm 10-20%.</li>
          <li><strong>Tập kiểm tra (Test):</strong> Đánh giá lần cuối cùng trên dữ liệu chưa bao giờ thấy. Chiếm 10-20%. Chỉ dùng MỘT LẦN.</li>
        </ol>
        <p>
          Quy tắc vàng: <strong>tập test không bao giờ được dùng để điều chỉnh mô hình</strong>.
          Vi phạm quy tắc này dẫn đến đánh giá quá lạc quan — mô hình tốt trên test nhưng
          kém trong thực tế. Với dữ liệu ít, dùng <strong>cross-validation</strong> thay vì chia cố định.
        </p>
      </ExplanationSection>
    </>
  );
}
