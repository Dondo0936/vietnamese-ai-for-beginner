"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "recommendation-systems", title: "Recommendation Systems", titleVi: "He thong goi y", description: "He thong goi y san pham, noi dung dua tren loc cong tac, loc noi dung va phuong phap lai", category: "applied-ai", tags: ["collaborative-filtering", "content-based", "personalization"], difficulty: "intermediate", relatedSlugs: ["embedding-model", "multi-armed-bandit", "k-means"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function RecommendationSystemsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Collaborative Filtering hoat dong the nao?", options: ["Phan tich noi dung san pham", "Tim USER TUONG TU ban (thich cung san pham) → goi y san pham ho thich ma ban chua dung", "Dung rule-based"], correct: 1, explanation: "CF: 'Nguoi giong ban thich gi?' Ban va An deu thich Pho, Bun cha. An thich Bun bo Hue nhung ban chua an → goi y Bun bo Hue cho ban. Khong can hieu noi dung san pham — chi dua tren pattern tuong tac cua users." },
    { question: "Cold start problem la gi va giai phap?", options: ["Server khoi dong cham", "User/item MOI khong co lich su tuong tac → CF khong hoat dong. Giai phap: content-based (dua tren attributes), popularity-based, hoac hoi user preferences", "Model qua lon"], correct: 1, explanation: "User moi: chua rating gi → khong biet tuong tu ai. Item moi: chua ai rating → khong the CF. Giai phap: (1) Content-based: goi y dua tren attributes (the loai, gia), (2) Popularity: goi y san pham hot, (3) Onboarding: hoi 'ban thich gi?'" },
    { question: "Tai sao Shopee dung Hybrid (CF + Content + Deep Learning)?", options: ["Vi co nhieu data", "MOI phuong phap co diem yeu rieng. Hybrid ket hop: CF cho personalization, Content cho cold start, DL hoc patterns phuc tap tu behavior", "De marketing"], correct: 1, explanation: "CF manh o personalization nhung cold start. Content tot cho cold start nhung khong capture subtle preferences. DL (Two-Tower, DSSM) hoc embedding tu nhieu signals (click, time, scroll). Hybrid ket hop tat ca → tot hon bat ky phuong phap don le nao." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Ban mua tai nghe tren Shopee. Ngay hom sau, Shopee goi y 10 san pham ma ban CHUA TIM nhung deu thich. Shopee biet the nao?" options={["Doan ngau nhien", "He thong goi y: phan tich lich su mua/xem cua BAN + nguoi TUONG TU → du doan ban thich gi", "Nhan vien Shopee chon thu cong"]} correct={1} explanation="Recommendation System: (1) Tim nguoi tuong tu ban (mua cung loai tai nghe), (2) Xem ho mua gi khac (case, sac du phong), (3) Goi y cho ban. Ket hop voi noi dung san pham + deep learning → 10 goi y chinh xac. Shopee, Netflix, YouTube deu dung!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 130" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">3 phuong phap goi y</text>
            {[
              { name: "Collaborative Filtering", desc: "Nguoi tuong tu thich gi?", color: "#3b82f6" },
              { name: "Content-Based", desc: "San pham tuong tu co gi?", color: "#22c55e" },
              { name: "Deep Learning Hybrid", desc: "Hoc patterns tu behavior", color: "#f59e0b" },
            ].map((m, i) => {
              const x = 15 + i * 195;
              return (<g key={i}><rect x={x} y={30} width={180} height={55} rx={8} fill={m.color} opacity={0.15} stroke={m.color} strokeWidth={1.5} /><text x={x + 90} y={52} textAnchor="middle" fill={m.color} fontSize={9} fontWeight="bold">{m.name}</text><text x={x + 90} y={72} textAnchor="middle" fill="#94a3b8" fontSize={8}>{m.desc}</text></g>);
            })}
            <text x={300} y={110} textAnchor="middle" fill="#94a3b8" fontSize={9}>Shopee, Netflix, YouTube dung Hybrid: ket hop tat ca</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>35% doanh thu Amazon den tu recommendations. 80% noi dung Netflix xem la tu goi y. He thong goi y la <strong>cong cu tang truong manh nhat</strong>{" "}cua e-commerce va streaming. Shopee Viet Nam cung dung tuong tu: CF + Content + Deep Learning cho 50 trieu user.</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Shopee co 50M users, 100M items. Matrix user-item rating co bao nhieu o? Va bao nhieu % la trong (sparse)?" options={["50M x 100M = 5 x 10^15 o, nhung 99.99%+ la trong vi moi user chi tuong tac voi vai tram items", "5 trieu o, 50% trong", "Khong nhieu"]} correct={0} explanation="5 x 10^15 = 5000 ty o! Nhung moi user chi tuong tac ~200-500 items → 99.99% o trong. Day la 'sparsity problem' — collaborative filtering kho khi matrix qua sparse. Giai phap: matrix factorization (SVD) nen 50M x 100M xuong embeddings 50M x 128 + 100M x 128." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Recommendation Systems</strong>{" "}goi y san pham/noi dung dua tren lich su va so thich — dang sau 35% doanh thu Amazon va 80% content Netflix.</p>
        <p><strong>Matrix Factorization (CF):</strong></p>
        <LaTeX block>{"R \\approx U \\cdot V^T \\quad \\text{(user matrix } U \\in \\mathbb{R}^{m \\times k} \\text{, item matrix } V \\in \\mathbb{R}^{n \\times k} \\text{)}"}</LaTeX>
        <LaTeX block>{"\\hat{r}_{ui} = u_i^T \\cdot v_j + b_u + b_i + \\mu \\quad \\text{(du doan rating)}"}</LaTeX>
        <Callout variant="tip" title="Two-Tower Model">Deep Learning cho RecSys: 2 neural networks (user tower + item tower) tao embeddings. Similarity = dot product. Training: contrastive learning (positive pairs + negative sampling). Serving: ANN search (FAISS) cho real-time. Day la kien truc cua Shopee, YouTube, TikTok.</Callout>
        <CodeBlock language="python" title="Matrix Factorization voi surprise">{`from surprise import SVD, Dataset, Reader
from surprise.model_selection import cross_validate

# Load data (user_id, item_id, rating)
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings_df, reader)

# Matrix Factorization (SVD)
model = SVD(n_factors=128, n_epochs=20, lr_all=0.005, reg_all=0.02)
results = cross_validate(model, data, cv=5, measures=["RMSE"])
print(f"RMSE: {results['test_rmse'].mean():.3f}")

# Du doan rating cho user 42, item 1234
model.fit(data.build_full_trainset())
pred = model.predict("user_42", "item_1234")
print(f"Predicted rating: {pred.est:.2f}")

# Top-N recommendations cho user 42
all_items = get_all_items()
predictions = [(item, model.predict("user_42", item).est)
               for item in all_items if item not in user_42_history]
top_10 = sorted(predictions, key=lambda x: x[1], reverse=True)[:10]`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["3 phuong phap: Collaborative Filtering (user tuong tu), Content-Based (item tuong tu), Deep Learning Hybrid.", "Matrix Factorization nen sparse user-item matrix xuong dense embeddings (128 dims).", "Cold start problem: user/item moi khong co lich su → dung content-based hoac popularity.", "Two-Tower model (Shopee, YouTube): user tower + item tower → ANN search real-time.", "35% doanh thu Amazon, 80% content Netflix tu recommendations. Cong cu tang truong #1."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
