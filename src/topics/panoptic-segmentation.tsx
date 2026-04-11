"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "panoptic-segmentation",
  title: "Panoptic Segmentation",
  titleVi: "Phân đoạn toàn cảnh",
  description:
    "Kết hợp phân đoạn ngữ nghĩa và phân đoạn thể hiện, gán nhãn cho mọi pixel trong ảnh một cách toàn diện.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "unified"],
  difficulty: "advanced",
  relatedSlugs: ["semantic-segmentation", "instance-segmentation", "object-detection"],
  vizType: "static",
};

export default function PanopticSegmentationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn vẽ{" "}
          <strong>bản đồ chi tiết của một khu phố</strong>. Semantic
          segmentation tô màu: đường xám, vỉa hè nâu, công viên xanh — nhưng
          không phân biệt từng xe. Instance segmentation đánh số từng xe, từng
          người — nhưng bỏ qua đường, bầu trời.
        </p>
        <p>
          Panoptic Segmentation là <strong>bản đồ hoàn hảo</strong>: vừa tô màu
          đường, vỉa hè, bầu trời (stuff) vừa đánh số riêng từng xe, từng
          người (things). <strong>Mọi pixel đều có nhãn</strong> — không bỏ sót
          bất cứ điều gì!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 600 420" className="w-full max-w-2xl mx-auto">
            {/* Title */}
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              So sánh ba loại phân đoạn
            </text>

            {/* Semantic Segmentation */}
            <rect x="20" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="107" y="55" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
              Phân đoạn ngữ nghĩa
            </text>
            {/* Sky */}
            <rect x="25" y="60" width="165" height="35" fill="#60a5fa" opacity={0.5} />
            {/* Road */}
            <rect x="25" y="95" width="165" height="40" fill="#94a3b8" opacity={0.5} />
            {/* Trees */}
            <rect x="25" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
            {/* Cars (same color = not distinguished) */}
            <rect x="50" y="100" width="30" height="20" fill="#ef4444" opacity={0.6} />
            <rect x="110" y="100" width="30" height="20" fill="#ef4444" opacity={0.6} />
            <rect x="105" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
            <text x="107" y="172" textAnchor="middle" fill="#64748b" fontSize="8">
              Cùng màu = cùng lớp
            </text>

            {/* Instance Segmentation */}
            <rect x="213" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1.5" />
            <text x="300" y="55" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold">
              Phân đoạn thể hiện
            </text>
            {/* Only things are segmented */}
            <rect x="218" y="60" width="165" height="115" fill="#1e293b" opacity={0.3} />
            <rect x="243" y="100" width="30" height="20" fill="#3b82f6" opacity={0.7} />
            <text x="258" y="114" textAnchor="middle" fill="white" fontSize="7">Xe #1</text>
            <rect x="303" y="100" width="30" height="20" fill="#22c55e" opacity={0.7} />
            <text x="318" y="114" textAnchor="middle" fill="white" fontSize="7">Xe #2</text>
            {/* Person */}
            <rect x="350" y="85" width="18" height="35" fill="#f59e0b" opacity={0.7} />
            <text x="359" y="130" textAnchor="middle" fill="#f59e0b" fontSize="7">Ng. #1</text>
            <text x="300" y="172" textAnchor="middle" fill="#64748b" fontSize="8">
              Chỉ things, bỏ qua stuff
            </text>

            {/* Panoptic Segmentation */}
            <rect x="405" y="35" width="175" height="145" rx="8" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
            <text x="493" y="55" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
              Phân đoạn toàn cảnh
            </text>
            {/* Sky */}
            <rect x="410" y="60" width="165" height="35" fill="#60a5fa" opacity={0.5} />
            {/* Road */}
            <rect x="410" y="95" width="165" height="40" fill="#94a3b8" opacity={0.5} />
            {/* Trees */}
            <rect x="410" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
            <rect x="490" y="135" width="80" height="40" fill="#22c55e" opacity={0.5} />
            {/* Cars with unique colors */}
            <rect x="435" y="100" width="30" height="20" fill="#3b82f6" opacity={0.8} />
            <text x="450" y="114" textAnchor="middle" fill="white" fontSize="6">Xe #1</text>
            <rect x="500" y="100" width="30" height="20" fill="#ec4899" opacity={0.8} />
            <text x="515" y="114" textAnchor="middle" fill="white" fontSize="6">Xe #2</text>
            {/* Person */}
            <rect x="545" y="85" width="18" height="35" fill="#f59e0b" opacity={0.8} />
            <text x="554" y="130" textAnchor="middle" fill="#f59e0b" fontSize="6">Ng. #1</text>
            <text x="493" y="172" textAnchor="middle" fill="#64748b" fontSize="8">
              Tất cả pixel đều có nhãn
            </text>

            {/* Comparison table */}
            <text x="300" y="210" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Bảng so sánh
            </text>

            {/* Table headers */}
            <rect x="50" y="220" width="120" height="25" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="110" y="237" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Đặc điểm</text>
            <rect x="170" y="220" width="130" height="25" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="235" y="237" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">Semantic</text>
            <rect x="300" y="220" width="130" height="25" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="365" y="237" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold">Instance</text>
            <rect x="430" y="220" width="130" height="25" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="495" y="237" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">Panoptic</text>

            {/* Row 1: Stuff */}
            <rect x="50" y="245" width="120" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="110" y="260" textAnchor="middle" fill="#94a3b8" fontSize="9">Stuff (nền)</text>
            <rect x="170" y="245" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="235" y="260" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>
            <rect x="300" y="245" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="365" y="260" textAnchor="middle" fill="#ef4444" fontSize="10">&#10007;</text>
            <rect x="430" y="245" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="495" y="260" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>

            {/* Row 2: Things */}
            <rect x="50" y="267" width="120" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="110" y="282" textAnchor="middle" fill="#94a3b8" fontSize="9">Things (vật thể)</text>
            <rect x="170" y="267" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="235" y="282" textAnchor="middle" fill="#f59e0b" fontSize="9">Không phân biệt</text>
            <rect x="300" y="267" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="365" y="282" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>
            <rect x="430" y="267" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="495" y="282" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>

            {/* Row 3: Every pixel */}
            <rect x="50" y="289" width="120" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="110" y="304" textAnchor="middle" fill="#94a3b8" fontSize="9">Mọi pixel</text>
            <rect x="170" y="289" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="235" y="304" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>
            <rect x="300" y="289" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="365" y="304" textAnchor="middle" fill="#ef4444" fontSize="10">&#10007;</text>
            <rect x="430" y="289" width="130" height="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="495" y="304" textAnchor="middle" fill="#22c55e" fontSize="10">&#10003;</text>

            <text x="300" y="340" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Panoptic = Semantic + Instance (tốt nhất của cả hai!)
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Panoptic Segmentation</strong> (Kirillov et al., 2019) thống
          nhất semantic segmentation và instance segmentation thành một tác vụ
          duy nhất. Mỗi pixel được gán đúng một nhãn — hoặc thuộc stuff class
          hoặc thuộc một instance cụ thể.
        </p>
        <p>Hai loại danh mục:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Stuff (vùng nền):</strong> Các vùng không đếm được — bầu
            trời, đường, cỏ, nước. Chỉ cần gán nhãn lớp, không cần phân biệt
            thể hiện.
          </li>
          <li>
            <strong>Things (vật thể):</strong> Các đối tượng đếm được — người,
            xe, động vật. Cần phân biệt từng thể hiện riêng (người #1, xe #2).
          </li>
        </ol>
        <p>
          Kiến trúc hiện đại: <strong>Panoptic FPN</strong> kết hợp semantic
          head và instance head trên FPN backbone.{" "}
          <strong>Mask2Former</strong> sử dụng Transformer để xử lý cả stuff
          và things thống nhất. Chỉ số đánh giá:{" "}
          <strong>Panoptic Quality (PQ)</strong> = SQ (chất lượng phân đoạn)
          &times; RQ (chất lượng nhận dạng).
        </p>
      </ExplanationSection>
    </>
  );
}
