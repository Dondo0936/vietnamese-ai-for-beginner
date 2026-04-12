"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "recommendation-systems", title: "Recommendation Systems", titleVi: "Hệ thống gợi ý", description: "Hệ thống gợi ý sản phẩm, nội dung dựa trên lọc cộng tác, lọc nội dung và phương pháp lai", category: "applied-ai", tags: ["collaborative-filtering", "content-based", "personalization"], difficulty: "intermediate", relatedSlugs: ["embedding-model", "multi-armed-bandit", "k-means"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function RecommendationSystemsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Collaborative Filtering hoạt động thế nào?", options: ["Phân tích nội dung sản phẩm", "Tìm USER TƯƠNG TỰ bạn (thích cùng sản phẩm) → gợi ý sản phẩm họ thích mà bạn chưa dùng", "Dùng rule-based"], correct: 1, explanation: "CF: 'Người giống bạn thích gì?' Bạn và An đều thích Phở, Bún chả. An thích Bún bò Huế nhưng bạn chưa ăn → gợi ý Bún bò Huế cho bạn. Không cần hiểu nội dung sản phẩm — chỉ dựa trên pattern tương tác của users." },
    { question: "Cold start problem là gì và giải pháp?", options: ["Server khởi động chậm", "User/item MỚI không có lịch sử tương tác → CF không hoạt động. Giải pháp: content-based (dựa trên attributes), popularity-based, hoặc hỏi user preferences", "Model quá lớn"], correct: 1, explanation: "User mới: chưa rating gì → không biết tương tự ai. Item mới: chưa ai rating → không thể CF. Giải pháp: (1) Content-based: gợi ý dựa trên attributes (thể loại, giá), (2) Popularity: gợi ý sản phẩm hot, (3) Onboarding: hỏi 'bạn thích gì?'" },
    { question: "Tại sao Shopee dùng Hybrid (CF + Content + Deep Learning)?", options: ["Vì có nhiều data", "MỖI phương pháp có điểm yếu riêng. Hybrid kết hợp: CF cho personalization, Content cho cold start, DL học patterns phức tạp từ behavior", "Để marketing"], correct: 1, explanation: "CF mạnh ở personalization nhưng cold start. Content tốt cho cold start nhưng không capture subtle preferences. DL (Two-Tower, DSSM) học embedding từ nhiều signals (click, time, scroll). Hybrid kết hợp tất cả → tốt hơn bất kỳ phương pháp đơn lẻ nào." },
    {
      type: "fill-blank",
      question: "Hai phương pháp kinh điển của recommender system là {blank} filtering (tìm user tương tự) và {blank}-based filtering (dựa trên đặc trưng sản phẩm).",
      blanks: [
        { answer: "collaborative", accept: ["cộng tác", "hợp tác", "CF"] },
        { answer: "content", accept: ["nội dung", "content-based"] },
      ],
      explanation: "Collaborative filtering: 'Người giống bạn thích gì?' — dùng ma trận user-item. Content-based: 'Sản phẩm có đặc trưng giống sản phẩm bạn từng thích' — dùng attributes/embeddings. Hybrid kết hợp cả hai để giải quyết cold start và personalization.",
    },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Bạn mua tai nghe trên Shopee. Ngày hôm sau, Shopee gợi ý 10 sản phẩm mà bạn CHƯA TÌM nhưng đều thích. Shopee biết thế nào?" options={["Đoán ngẫu nhiên", "Hệ thống gợi ý: phân tích lịch sử mua/xem của BẠN + người TƯƠNG TỰ → dự đoán bạn thích gì", "Nhân viên Shopee chọn thủ công"]} correct={1} explanation="Recommendation System: (1) Tìm người tương tự bạn (mua cùng loại tai nghe), (2) Xem họ mua gì khác (case, sạc dự phòng), (3) Gợi ý cho bạn. Kết hợp với nội dung sản phẩm + deep learning → 10 gợi ý chính xác. Shopee, Netflix, YouTube đều dùng!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 130" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">3 phương pháp gợi ý</text>
            {[
              { name: "Collaborative Filtering", desc: "Người tương tự thích gì?", color: "#3b82f6" },
              { name: "Content-Based", desc: "Sản phẩm tương tự có gì?", color: "#22c55e" },
              { name: "Deep Learning Hybrid", desc: "Học patterns từ behavior", color: "#f59e0b" },
            ].map((m, i) => {
              const x = 15 + i * 195;
              return (<g key={i}><rect x={x} y={30} width={180} height={55} rx={8} fill={m.color} opacity={0.15} stroke={m.color} strokeWidth={1.5} /><text x={x + 90} y={52} textAnchor="middle" fill={m.color} fontSize={9} fontWeight="bold">{m.name}</text><text x={x + 90} y={72} textAnchor="middle" fill="#94a3b8" fontSize={8}>{m.desc}</text></g>);
            })}
            <text x={300} y={110} textAnchor="middle" fill="#94a3b8" fontSize={9}>Shopee, Netflix, YouTube dùng Hybrid: kết hợp tất cả</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>35% doanh thu Amazon đến từ recommendations. 80% nội dung Netflix xem là từ gợi ý. Hệ thống gợi ý là <strong>công cụ tăng trưởng mạnh nhất</strong>{" "}của e-commerce và streaming. Shopee Việt Nam cũng dùng tương tự: CF + Content + Deep Learning cho 50 triệu user.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="Shopee có 50M users, 100M items. Matrix user-item rating có bao nhiêu ô? Và bao nhiêu % là trống (sparse)?" options={["50M x 100M = 5 x 10^15 ô, nhưng 99.99%+ là trống vì mỗi user chỉ tương tác với vài trăm items", "5 triệu ô, 50% trống", "Không nhiều"]} correct={0} explanation="5 x 10^15 = 5000 tỷ ô! Nhưng mỗi user chỉ tương tác ~200-500 items → 99.99% ô trống. Đây là 'sparsity problem' — collaborative filtering khó khi matrix quá sparse. Giải pháp: matrix factorization (SVD) nén 50M x 100M xuống embeddings 50M x 128 + 100M x 128." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Recommendation Systems</strong>{" "}gợi ý sản phẩm/nội dung dựa trên lịch sử và sở thích — đằng sau 35% doanh thu Amazon và 80% content Netflix.</p>
        <p><strong>Matrix Factorization (CF):</strong></p>
        <LaTeX block>{"R \\approx U \\cdot V^T \\quad \\text{(user matrix } U \\in \\mathbb{R}^{m \\times k} \\text{, item matrix } V \\in \\mathbb{R}^{n \\times k} \\text{)}"}</LaTeX>
        <LaTeX block>{"\\hat{r}_{ui} = u_i^T \\cdot v_j + b_u + b_i + \\mu \\quad \\text{(dự đoán rating)}"}</LaTeX>
        <Callout variant="tip" title="Two-Tower Model">Deep Learning cho RecSys: 2 neural networks (user tower + item tower) tạo <TopicLink slug="embedding-model">embeddings</TopicLink>. Similarity = dot product — cùng nguyên lý với <TopicLink slug="semantic-search">semantic search</TopicLink>. Training: contrastive learning (positive pairs + negative sampling). Serving: ANN search (FAISS) cho real-time. Đây là kiến trúc của Shopee, YouTube, TikTok.</Callout>
        <CodeBlock language="python" title="Matrix Factorization với surprise">{`from surprise import SVD, Dataset, Reader
from surprise.model_selection import cross_validate

# Load data (user_id, item_id, rating)
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings_df, reader)

# Matrix Factorization (SVD)
model = SVD(n_factors=128, n_epochs=20, lr_all=0.005, reg_all=0.02)
results = cross_validate(model, data, cv=5, measures=["RMSE"])
print(f"RMSE: {results['test_rmse'].mean():.3f}")

# Dự đoán rating cho user 42, item 1234
model.fit(data.build_full_trainset())
pred = model.predict("user_42", "item_1234")
print(f"Predicted rating: {pred.est:.2f}")

# Top-N recommendations cho user 42
all_items = get_all_items()
predictions = [(item, model.predict("user_42", item).est)
               for item in all_items if item not in user_42_history]
top_10 = sorted(predictions, key=lambda x: x[1], reverse=True)[:10]`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["3 phương pháp: Collaborative Filtering (user tương tự), Content-Based (item tương tự), Deep Learning Hybrid.", "Matrix Factorization nén sparse user-item matrix xuống dense embeddings (128 dims).", "Cold start problem: user/item mới không có lịch sử → dùng content-based hoặc popularity.", "Two-Tower model (Shopee, YouTube): user tower + item tower → ANN search real-time.", "35% doanh thu Amazon, 80% content Netflix từ recommendations. Công cụ tăng trưởng #1."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
