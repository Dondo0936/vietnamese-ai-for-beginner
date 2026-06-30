"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 *  CROSS-VALIDATION IN KAGGLE. Application topic.
 *  ─────────────────────────────────────────────────────────────────────────
 *  Rewrite for the student path. Visualisation-first, no code, no LaTeX.
 *  Core story: "Trust Your CV". Public leaderboard lies; local CV doesn't.
 *  Rank 1485 can leap to #1 if they believed their CV over public score.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  TrendingDown,
  Medal,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  InlineChallenge,
  Callout,
  StepReveal,
  CollapsibleDetail,
} from "@/components/interactive";

import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  METADATA
 * ═══════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "cross-validation-in-kaggle",
  title: "Cross-Validation in Kaggle Competitions",
  titleVi: "CV trong Kaggle: tin local CV, đừng tin public LB",
  description:
    "Public leaderboard có thể đánh lừa. Một đội xếp hạng 1.485 nhảy lên hạng 1 private chỉ vì họ tin vào CV của mình, không chạy theo public LB.",
  category: "classic-ml",
  tags: ["evaluation", "competition", "leaderboard", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["cross-validation"],
  vizType: "interactive",
  applicationOf: "cross-validation",
  featuredApp: {
    name: "Kaggle",
    productFeature: "Leaderboard & Competitions",
    company: "Kaggle Inc. (Google)",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "The Ladder: A Reliable Leaderboard for Machine Learning Competitions",
      publisher: "Blum & Hardt, ICML 2015",
      url: "https://proceedings.mlr.press/v37/blum15.html",
      date: "2015-07",
      kind: "paper",
    },
    {
      title: "How to (Not) Overfit to a Public Leaderboard: A Postmortem",
      publisher: "Greg Park",
      url: "https://gregpark.io/blog/Kaggle-Decoding-Brain-Signals/",
      date: "2020-01",
      kind: "engineering-blog",
    },
    {
      title: "Winning Solutions and Tips. The Kaggle Book",
      publisher: "Konrad Banachewicz & Luca Massaron, Packt",
      url: "https://www.kaggle.com/discussion/351571",
      date: "2022-06",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function CrossValidationInKaggle() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Kiểm định chéo">
      <ApplicationHero
        parentTitleVi="Kiểm định chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <p>
          Bạn nộp bài Kaggle, F5 trang leaderboard, thấy thứ hạng nhảy. Cảm
          giác như chấm điểm trực tiếp vào kết quả thật. Bảng đó được gọi là{" "}
          <strong>public leaderboard</strong>: bảng xếp hạng công khai, cập
          nhật sau mỗi lần submission. Vấn đề là nó chỉ được tính trên khoảng{" "}
          <strong>1/3 dữ liệu test</strong>. Hai phần ba còn lại bị giấu kín
          tới cuối giải.
        </p>
        <p>
          Khi cuộc thi kết thúc, ban tổ chức công bố{" "}
          <strong>private leaderboard</strong>, tức bảng xếp hạng chính thức
          chấm trên 2/3 dữ liệu còn lại. Thứ hạng xáo trộn rất mạnh: có trường
          hợp đội hạng 1.485 public nhảy lên hạng 1 private. Vì vậy các
          Grandmaster có một câu nằm lòng: <em>&ldquo;Trust Your CV&rdquo;</em>.
          Tin vào cross-validation chạy trên máy của mình, không chạy theo bảng
          xếp hạng công khai.
        </p>

        {/* HOOK. Before/after leaderboard drift */}
        <div className="not-prose mt-5">
          <LeaderboardShockCard />
        </div>
      </ApplicationHero>

      <ApplicationProblem topicSlug="cross-validation-in-kaggle">
        <p>
          Public leaderboard tạo cám dỗ rất mạnh. Mỗi lần submission, bạn nhận
          phản hồi gần như tức thì. Thứ hạng tăng thì bạn giữ thay đổi vừa
          làm, thứ hạng giảm thì bỏ đi. Lặp lại 50, 100 lần.{" "}
          <strong>Blum &amp; Hardt (ICML 2015)</strong> chứng minh hành vi này
          tương đương với overfit trên tập test. Cái bị overfit ở đây không
          chỉ là weights của model mà còn là <em>quyết định của bạn</em> về
          việc giữ hay bỏ mỗi thay đổi.
        </p>
        <p>
          Câu hỏi cốt lõi đặt ra: làm sao đánh giá <em>đáng tin cậy</em> hiệu
          suất của model khi public leaderboard có thể đánh lừa? Câu trả lời là{" "}
          <strong>cross-validation chạy trên máy của bạn</strong>. Bạn chia
          tập train thành nhiều fold, xoay vòng kiểm định, rồi trung bình K
          điểm lại. Kết quả CV chính là &ldquo;bảng xếp hạng cá nhân&rdquo;
          của mỗi đội. Nó đáng tin hơn public LB vì đã trung bình qua nhiều
          cách chia, không phụ thuộc vào một phần test cố định.
        </p>

        <div className="not-prose mt-5">
          <PublicVsPrivateChart />
        </div>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Kiểm định chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <Beat step={1}>
          <p>
            <strong>CV chạy trên máy là nguồn tin đáng tin cậy nhất.</strong>{" "}
            Trước khi submission, thí sinh chia tập train thành K phần (thường
            K = 5 hoặc 10). Với mỗi fold, train trên K-1 phần và test trên
            phần còn lại. Trung bình K điểm là &ldquo;CV score&rdquo;. Các
            Grandmaster tin CV score hơn cả public LB vì nó đã trung bình qua
            nhiều cách chia, không phụ thuộc vào may rủi của một lát cắt duy
            nhất.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>So sánh CV score và public LB.</strong> Nếu hai chỉ số đi
            cùng chiều, bạn yên tâm. Nếu CV tăng mà public giảm (hoặc ngược
            lại), đèn đỏ bật: có thể public LB đang nhìn vào một góc nhỏ
            không đại diện, hoặc model đang overfit theo public. Quy tắc vàng
            là <em>ưu tiên CV</em>.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>&ldquo;Trust Your CV&rdquo;: phép thử thời khắc.</strong>{" "}
            Trong cuộc thi &ldquo;Decoding Brain Signals&rdquo;, một đội xếp
            hạng 1.485 trên public leaderboard, gần đáy bảng. Nhưng CV score
            của họ vẫn cao. Họ chọn submission dựa trên CV thay vì public LB.
            Khi private được công bố, họ ở <strong>hạng 1</strong>. 1.484 đội
            phía trên đã overfit public LB và tụt hạng thảm hại.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Hai bài submission cuối quyết định thắng thua.</strong>{" "}
            Kaggle chỉ cho phép mỗi đội chọn <strong>2 submission</strong> để
            chấm trên private. Chiến lược tối ưu là chọn một bài có CV score
            cao nhất (bảo thủ, đánh chắc) và một bài cân bằng giữa CV và public
            (rủi ro vừa phải). Đây là lúc cross-validation thực sự quyết định
            ai về đích trước.
          </p>
        </Beat>

        {/* DEEPEN. SliderGroup for fold count */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-accent" />
            Tăng số fold làm ước lượng ổn định hơn
          </h3>
          <FoldStabilityDemo />
        </div>

        {/* DEEPEN. StepReveal stratified folds */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Stratified CV giữ tỷ lệ lớp cân bằng giữa các fold
          </h3>
          <StepReveal
            labels={[
              "Tình huống: dataset mất cân bằng",
              "K-Fold thường: nguy hiểm",
              "Stratified K-Fold: an toàn",
              "So sánh kết quả",
            ]}
          >
            {[
              <ImbalanceIntro key="i1" />,
              <VanillaKFoldImbalance key="i2" />,
              <StratifiedKFoldSafe key="i3" />,
              <div
                key="i4"
                className="rounded-xl border border-border bg-surface/60 p-4 space-y-3"
              >
                <h4 className="text-sm font-bold text-foreground">
                  Vì sao stratified là mặc định cho bài toán phân loại
                </h4>
                <ul className="list-disc list-inside text-sm text-foreground/85 space-y-1">
                  <li>
                    K-Fold thường: tỷ lệ lớp trong mỗi fold là ngẫu nhiên, nên
                    có thể có fold thiếu hoàn toàn lớp hiếm.
                  </li>
                  <li>
                    Stratified K-Fold: mỗi fold giữ đúng tỷ lệ lớp như toàn bộ
                    dataset, nhờ vậy mọi fold đều mang tính đại diện.
                  </li>
                  <li>
                    Chi phí ngang K-Fold thường. Scikit-learn có sẵn{" "}
                    <code>StratifiedKFold</code>. Lý do duy nhất không dùng là
                    không biết tới nó.
                  </li>
                </ul>
              </div>,
            ]}
          </StepReveal>
        </div>

        {/* DEEPEN, drift chart public → private scatter */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Public và private không có quan hệ 1:1
          </h3>
          <DriftScatter />
        </div>

        {/* CHALLENGE */}
        <div className="not-prose mt-6">
          <InlineChallenge
            question="Bạn đang thi Kaggle. CV score tăng từ 0.82 lên 0.85 sau thay đổi X. Cùng lúc, public LB giảm từ 0.88 xuống 0.86. Bạn nên làm gì?"
            options={[
              "Bỏ thay đổi X ngay vì public LB nói vậy",
              "Giữ thay đổi X. CV score đáng tin hơn public LB, và public LB chỉ dùng 1/3 dữ liệu test",
              "Chờ xem thay đổi tiếp theo",
              "Thử nộp thêm 20 submissions khác",
            ]}
            correct={1}
            explanation="Đây là tình huống kinh điển “Trust Your CV”. CV score được trung bình qua K lần chia, nên ít phụ thuộc vào may rủi hơn. Public LB chỉ thấy 1/3 dữ liệu test nên dễ dao động. Nếu CV tăng mà public giảm, nhiều khả năng public LB đang nhìn vào một góc đặc biệt. Khi private công bố, thay đổi X thường thắng. Dĩ nhiên, điều kiện là CV pipeline phải sạch, không có leakage."
          />
        </div>

        <div className="not-prose mt-6">
          <InlineChallenge
            question="Trong 3 tuần cuối cuộc thi, bạn nộp 50 submissions mỗi ngày để tune theo public LB. Public LB score tăng đều, nhưng CV score chỉ tăng 0.002. Nhận định nào đúng?"
            options={[
              "Bạn đang làm tốt vì cả hai đều tăng",
              "Nguy hiểm. Bạn đang overfit public LB (mỗi submission là một lần tune trên test). Khi private công bố, khả năng cao bạn tụt hạng.",
              "CV score không quan trọng, tập trung public LB",
              "Nên nộp thêm 100 submissions mỗi ngày",
            ]}
            correct={1}
            explanation="Nộp nhiều lần và điều chỉnh dựa vào public LB là một dạng overfitting gián tiếp lên test set (Blum và Hardt 2015 đã chứng minh). CV score chỉ tăng 0.002 nghĩa là cải tiến thật sự rất nhỏ. Public LB tăng nhanh là do bạn tình cờ hợp với 1/3 dữ liệu public. Khi private mở, 2/3 dữ liệu còn lại sẽ lộ ra sự thật. Giải pháp: giới hạn số submission, tin CV, và dành 2 submission cuối cho bài có CV score cao nhất."
          />
        </div>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="cross-validation-in-kaggle"
      >
        <Metric
          value="Public leaderboard dùng ~1/3 test data, private dùng ~2/3"
          sourceRef={3}
        />
        <Metric
          value="Xáo trộn cực đoan: hạng 1.485 trên public nhảy lên hạng 1 private"
          sourceRef={2}
        />
        <Metric
          value="Blum và Hardt (2015): nộp bài nhiều lần tương đương overfit trên test set"
          sourceRef={1}
        />
        <Metric
          value="Mỗi đội chỉ được chọn 2 submission cuối cho private leaderboard"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Kiểm định chéo"
        topicSlug="cross-validation-in-kaggle"
      >
        <p>
          Không có cross-validation, thí sinh sẽ hoàn toàn phụ thuộc vào public
          leaderboard. Đó là một nguồn phản hồi chỉ đại diện cho 1/3 test data
          và rất dễ bị overfit. Kết quả là hàng loạt đội leo top 10 public rồi
          rơi tự do khi private được công bố. Câu chuyện này lặp đi lặp lại
          trong gần như mọi cuộc thi Kaggle.
        </p>
        <p>
          Cross-validation cho mỗi thí sinh một bảng xếp hạng cá nhân đáng tin
          cậy hơn cả leaderboard chính thức. Vì vậy{" "}
          <strong>&ldquo;Trust Your CV&rdquo;</strong> trở thành bài học đầu
          tiên mọi Kaggle Grandmaster truyền lại cho người mới. Đây cũng là
          nguyên tắc áp dụng được cho mọi dự án ML thật, không chỉ riêng đấu
          trường Kaggle.
        </p>

        <div className="not-prose mt-5">
          <CollapsibleDetail title="Ngoài Kaggle: bài học cho dự án ML thật">
            <p className="text-sm leading-relaxed">
              Public leaderboard trong dự án thật là bất cứ chỉ số nào bạn đo
              và tinh chỉnh nhiều lần. Chẳng hạn test accuracy khi tuning
              hyperparameter, chỉ số demo cho sếp, hoặc metric trên tập
              hold-out bạn đã nhìn quá nhiều. Mỗi lần bạn điều chỉnh dựa trên
              cùng tập đó là một lần overfit nhẹ vào nó.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Giải pháp là{" "}
              <strong>tune bằng validation set (hoặc CV)</strong>. Giữ test
              set tuyệt đối ngoài quy trình tuning, và chỉ mở test một lần
              cuối khi báo cáo kết quả.
            </p>
          </CollapsibleDetail>
        </div>

        <Callout variant="insight" title="Ba quy tắc vàng khi dùng cross-validation">
          <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
            <li>
              Luôn đặt preprocessing (scaler, encoder) bên trong pipeline của
              mỗi fold. Không fit trên toàn bộ dữ liệu trước khi chạy CV.
            </li>
            <li>
              Báo cáo kèm <strong>mean ± std</strong>. Std thấp nghĩa là kết
              quả ổn định. Std cao nghĩa là có fold đặc biệt, cần tìm nguyên
              nhân.
            </li>
            <li>
              Với phân loại mất cân bằng, dùng{" "}
              <strong>Stratified K-Fold</strong>. Với dữ liệu thời gian, dùng{" "}
              <strong>Time Series Split</strong>. Với dữ liệu có nhóm tự
              nhiên, dùng <strong>Group K-Fold</strong>.
            </li>
          </ol>
        </Callout>

        <div className="not-prose mt-5 rounded-2xl border border-border bg-surface/40 p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Medal size={16} className="text-accent" />
            Chiến lược 2 submission cuối của Grandmaster
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-3 space-y-1">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                <CheckCircle2 size={12} aria-hidden="true" />
                Submission 1: an toàn
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bài có <strong>CV score cao nhất</strong>. Đây là cách đánh
                chắc, vì kết quả CV được trung bình qua K lần chia nên ít may
                rủi nhất. Nếu model tốt thật, nó sẽ ổn trên private.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 space-y-1">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                <AlertTriangle size={12} aria-hidden="true" />
                Submission 2: cân bằng
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bài cân bằng giữa CV score và public LB. Đây là mức rủi ro
                vừa phải. Nếu public LB thật sự có tín hiệu (không phải toàn
                noise), bài này sẽ thắng.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted italic leading-relaxed">
            Tuyệt đối không chọn cả 2 bài dựa hoàn toàn vào public LB. Khi đó
            bạn đang cược hết vào một nguồn tin đã được chứng minh là không
            đáng tin.
          </p>
        </div>

        <Callout variant="tip" title="Vài gợi ý bổ sung cho thí sinh Việt Nam">
          <ul className="list-disc list-inside space-y-1 text-sm mt-1">
            <li>
              Nếu mới bắt đầu, đặt mục tiêu nhỏ là vào top 25%. Mốc này đã đòi
              hỏi CV được tổ chức tốt.
            </li>
            <li>
              Ghi chép mọi thử nghiệm. Tool như Weights &amp; Biases miễn phí
              cho public project. Khi có 50 thử nghiệm, bạn cần biết cái nào
              tốt hơn cái nào.
            </li>
            <li>
              Tham gia cộng đồng (Kaggle VN trên Facebook, Discord) và đọc
              kernel của winner sau mỗi cuộc thi. Đó là cách học nhanh nhất về
              CV.
            </li>
          </ul>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOCAL HELPERS. Visual components
 * ═══════════════════════════════════════════════════════════════════════════ */

function LeaderboardShockCard() {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Trophy size={16} className="text-accent" />
        Cuộc thi &ldquo;Decoding Brain Signals&rdquo;: câu chuyện kinh điển
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <p className="text-xs text-muted font-semibold">Public LB (trong cuộc thi)</p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Một đội (gọi là <strong>Đội X</strong>) xếp hạng{" "}
            <strong className="text-red-500">1.485 / ~1.700</strong>, tức gần
            cuối bảng. Nhiều người nghĩ họ thua chắc.
          </p>
          <div className="flex items-center gap-1 text-xs text-red-500">
            <TrendingDown size={12} /> 1.485
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <p className="text-xs text-muted font-semibold">Private LB (sau cuộc thi)</p>
          <AnimatePresence mode="wait">
            {reveal ? (
              <motion.div
                key="shown"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-1"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Khi private leaderboard công bố, Đội X ở hạng{" "}
                  <strong className="text-green-600 text-lg">#1</strong>. Họ đã
                  tin vào CV thay vì public LB.
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Medal size={12} /> Hạng 1, thắng giải
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="hidden"
                type="button"
                onClick={() => setReveal(true)}
                className="w-full rounded-lg border-2 border-dashed border-border bg-surface px-3 py-4 text-sm font-medium text-muted hover:text-foreground hover:border-accent transition-colors"
              >
                Bấm để xem kết quả private →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-xs text-muted italic leading-relaxed">
        Đây là câu chuyện thật từ cuộc thi Kaggle 2015–2016. Đội X chọn model
        dựa trên CV score cao thay vì public LB. Trong khi đó 1.484 đội phía
        trên đã overfit public LB và tụt hạng thảm hại khi private công bố.
      </p>
    </div>
  );
}

function PublicVsPrivateChart() {
  // Synthetic: 12 teams. Public vs private scores with a shuffle pattern.
  const data = useMemo(
    () => [
      { team: "A", public: 0.892, private: 0.871 },
      { team: "B", public: 0.889, private: 0.852 },
      { team: "C", public: 0.886, private: 0.841 },
      { team: "D", public: 0.884, private: 0.874 },
      { team: "E", public: 0.881, private: 0.836 },
      { team: "F", public: 0.877, private: 0.829 },
      { team: "G", public: 0.870, private: 0.882 },
      { team: "H", public: 0.863, private: 0.879 },
      { team: "I", public: 0.855, private: 0.881 },
      { team: "J", public: 0.848, private: 0.873 },
      { team: "K", public: 0.841, private: 0.885 },
      { team: "L", public: 0.834, private: 0.888 },
    ],
    [],
  );

  const maxScore = 0.9;
  const minScore = 0.82;
  const range = maxScore - minScore;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        Public và private xáo trộn thứ hạng cực lớn
      </p>

      <svg
        viewBox="0 0 520 280"
        className="w-full max-w-2xl mx-auto"
        role="img"
        aria-label="So sánh public và private leaderboard cho 12 đội"
      >
        {/* Axis labels */}
        <text x={100} y={18} fontSize={11} fill="#3b82f6" fontWeight={700}>
          Public LB (leo top rồi sụp)
        </text>
        <text x={360} y={18} fontSize={11} fill="#22c55e" fontWeight={700}>
          Private LB (sự thật)
        </text>

        {/* Rows */}
        {data.map((d, i) => {
          const y = 40 + i * 18;
          const publicW = ((d.public - minScore) / range) * 140;
          const privateW = ((d.private - minScore) / range) * 140;
          const rankJump = i > 5 && d.private > d.public; // moved up

          return (
            <g key={d.team}>
              <text
                x={10}
                y={y + 4}
                fontSize={11}
                fill="currentColor"
                className="text-muted"
                fontWeight={600}
              >
                Đội {d.team}
              </text>
              {/* Public bar */}
              <rect
                x={60}
                y={y - 5}
                width={publicW}
                height={10}
                rx={2}
                fill="#3b82f6"
                opacity={0.75}
              />
              <text x={60 + publicW + 4} y={y + 3} fontSize={11} fill="#3b82f6">
                {d.public.toFixed(3)}
              </text>
              {/* Private bar */}
              <rect
                x={320}
                y={y - 5}
                width={privateW}
                height={10}
                rx={2}
                fill="#22c55e"
                opacity={0.75}
              />
              <text
                x={320 + privateW + 4}
                y={y + 3}
                fontSize={11}
                fill="#22c55e"
              >
                {d.private.toFixed(3)}
              </text>
              {rankJump && (
                <text
                  x={470}
                  y={y + 3}
                  fontSize={11}
                  fill="#22c55e"
                  fontWeight={700}
                >
                  ↑ lên hạng
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-muted leading-relaxed italic">
        Đội A-F có public score cao nhất nhưng private score thấp, đó là dấu
        hiệu họ overfit public LB. Trong khi đó đội G-L khiêm tốn ở public
        nhưng mạnh ở private vì họ tin vào CV. Đây là lý do công thức vàng{" "}
        <strong>Trust Your CV</strong> tồn tại.
      </p>
    </div>
  );
}

function FoldStabilityDemo() {
  const [folds, setFolds] = useState(5);

  // Variance of estimator decreases roughly as 1/K (idealised)
  const variance = useMemo(() => {
    const base = 0.09;
    return base / Math.sqrt(folds);
  }, [folds]);

  const scores = useMemo(() => {
    // Generate folds deterministic "per-fold" scores around 0.86 with variance
    const arr: number[] = [];
    const seed = folds;
    for (let i = 0; i < folds; i++) {
      const wobble = Math.sin((i + 1) * seed * 0.73) * variance;
      arr.push(Math.max(0.7, Math.min(0.95, 0.86 + wobble)));
    }
    return arr;
  }, [folds, variance]);

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(
    scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length,
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Số fold: <span className="font-bold text-accent">{folds}</span>
        </label>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            std < 0.01
              ? "bg-green-500 text-white"
              : std < 0.02
                ? "bg-amber-500 text-white"
                : "bg-red-500 text-white"
          }`}
        >
          std = ±{(std * 100).toFixed(2)}%
        </span>
      </div>

      <input
        type="range"
        min={3}
        max={10}
        step={1}
        value={folds}
        onChange={(e) => setFolds(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
      />

      <div className="flex items-end gap-1 h-24">
        {scores.map((s, i) => {
          const heightPct = ((s - 0.7) / 0.25) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] font-semibold tabular-nums text-foreground">
                {(s * 100).toFixed(1)}%
              </span>
              <motion.div
                className="w-full rounded-t-md bg-accent"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(6, heightPct)}%` }}
                transition={{ duration: 0.3 }}
              />
              <span className="text-[9px] text-muted">F{i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs text-muted">Trung bình qua {folds} fold</p>
        <p className="text-2xl font-bold tabular-nums text-green-600">
          {(mean * 100).toFixed(1)}% ± {(std * 100).toFixed(2)}%
        </p>
      </div>

      <p className="text-xs text-muted italic leading-relaxed">
        Kéo slider để thấy: số fold tăng làm độ lệch chuẩn giảm, nhờ vậy ước
        lượng ổn định hơn. Đổi lại, chi phí tính toán tăng tuyến tính. Điểm
        cân bằng trong thực tế nằm ở K = 5 hoặc 10.
      </p>
    </div>
  );
}

function ImbalanceIntro() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
      <p className="text-sm font-bold text-foreground">
        Dataset mất cân bằng: 95% âm, 5% dương
      </p>
      <p className="text-sm text-foreground/85 leading-relaxed">
        Bạn thi Kaggle về phát hiện gian lận thẻ tín dụng. Trong 10.000 giao
        dịch chỉ có 500 là gian lận (5%). Chia ngẫu nhiên thành 5 fold, theo
        lý thuyết mỗi fold có 100 giao dịch gian lận. Nhưng{" "}
        <em>thực tế</em> có thể lệch rất mạnh: fold này 60, fold kia 140.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-6 rounded bg-green-500" style={{ width: "95%" }} />
        <div className="h-6 rounded bg-red-500" style={{ width: "5%", minWidth: "12px" }} />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted">
        <span>95% âm (không gian lận)</span>
        <span>&middot; 5% dương (gian lận)</span>
      </div>
    </div>
  );
}

function VanillaKFoldImbalance() {
  // 5 folds, random distribution of 5% class
  const folds = [
    { fold: 1, negCount: 1920, posCount: 80, note: "Thiếu rõ" },
    { fold: 2, negCount: 1895, posCount: 105, note: "Hơi thiếu" },
    { fold: 3, negCount: 1865, posCount: 135, note: "Hơi thừa" },
    { fold: 4, negCount: 1930, posCount: 70, note: "Thiếu mạnh" },
    { fold: 5, negCount: 1890, posCount: 110, note: "Gần đều" },
  ];

  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-red-500" />
        <h4 className="text-sm font-bold text-foreground">K-Fold thường: phân bố lệch</h4>
      </div>
      <div className="space-y-2">
        {folds.map((f) => {
          const pct = (f.posCount / (f.negCount + f.posCount)) * 100;
          return (
            <div key={f.fold} className="flex items-center gap-3">
              <span className="w-8 text-xs font-semibold text-foreground">F{f.fold}</span>
              <div className="flex-1 flex">
                <div
                  className="h-4 bg-green-500 rounded-l"
                  style={{ width: `${100 - pct}%` }}
                />
                <div
                  className="h-4 bg-red-500 rounded-r"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-20 text-[10px] text-muted tabular-nums">
                {pct.toFixed(1)}% gian lận
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">
        Fold 4 chỉ có 3.5% gian lận, nên model học trên fold này sẽ thấy lớp
        dương hiếm hơn so với thực tế. Độ phủ (recall) trên fold này cũng
        không còn đại diện được cho toàn bộ dataset.
      </p>
    </div>
  );
}

function StratifiedKFoldSafe() {
  const folds = [
    { fold: 1, pct: 5.0 },
    { fold: 2, pct: 5.0 },
    { fold: 3, pct: 5.0 },
    { fold: 4, pct: 5.0 },
    { fold: 5, pct: 5.0 },
  ];

  return (
    <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-green-600" />
        <h4 className="text-sm font-bold text-foreground">
          Stratified K-Fold: tỷ lệ lớp đồng đều
        </h4>
      </div>
      <div className="space-y-2">
        {folds.map((f) => (
          <div key={f.fold} className="flex items-center gap-3">
            <span className="w-8 text-xs font-semibold text-foreground">F{f.fold}</span>
            <div className="flex-1 flex">
              <div
                className="h-4 bg-green-500 rounded-l"
                style={{ width: `${100 - f.pct}%` }}
              />
              <div
                className="h-4 bg-red-500 rounded-r"
                style={{ width: `${f.pct}%` }}
              />
            </div>
            <span className="w-20 text-[10px] text-muted tabular-nums">
              {f.pct.toFixed(1)}% gian lận
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">
        Stratified đảm bảo mỗi fold có đúng tỷ lệ 5%. Nhờ vậy mọi fold đều
        đại diện cho toàn bộ dataset. Đánh giá ổn định, độ phủ đáng tin,
        không còn fold &ldquo;may&rdquo; hay &ldquo;xui&rdquo;.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DriftScatter. Illustrate non-1:1 relation between public and private.
   ───────────────────────────────────────────────────────────────────────── */
function DriftScatter() {
  // Synthetic 40 teams, noisy public-private correlation
  const teams = useMemo(() => {
    const rng = (n: number) => {
      const x = Math.sin(n * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    const arr: Array<{ id: number; pub: number; priv: number; trust: boolean }> = [];
    for (let i = 0; i < 40; i++) {
      const pub = 0.78 + rng(i * 3 + 1) * 0.15;
      // teams that trusted CV: private ≈ pub + positive noise
      // teams that overfit public: private = pub - (0.02 .. 0.08)
      const trust = rng(i * 7 + 11) > 0.5;
      const drift = trust
        ? (rng(i * 13 + 17) - 0.2) * 0.04
        : -(rng(i * 17 + 23) * 0.06 + 0.02);
      arr.push({ id: i, pub, priv: pub + drift, trust });
    }
    return arr;
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold text-foreground">
        40 đội tham dự, chấm cả public và private
      </p>

      <svg
        viewBox="0 0 460 320"
        className="w-full max-w-2xl mx-auto rounded-md border border-border bg-background"
        role="img"
        aria-label="Biểu đồ tán xạ public vs private score"
      >
        {/* Axes */}
        <line x1={50} y1={280} x2={440} y2={280} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <line x1={50} y1={30} x2={50} y2={280} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <text x={245} y={305} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          Public LB score →
        </text>
        <text x={25} y={155} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle" transform="rotate(-90 25 155)">
          Private LB score →
        </text>

        {/* Diagonal reference (y = x) */}
        <line
          x1={50}
          y1={280}
          x2={440}
          y2={30}
          stroke="#94a3b8"
          strokeWidth={0.8}
          strokeDasharray="4,3"
          opacity={0.6}
        />
        <text x={400} y={50} fontSize={11} fill="var(--text-secondary)">y = x</text>

        {/* Points */}
        {teams.map((t) => {
          const x = 50 + ((t.pub - 0.77) / 0.18) * 390;
          const y = 280 - ((t.priv - 0.75) / 0.2) * 250;
          return (
            <g key={t.id}>
              <circle
                cx={x}
                cy={y}
                r={5}
                fill={t.trust ? "#22c55e" : "#ef4444"}
                opacity={0.75}
                stroke="#fff"
                strokeWidth={0.8}
              />
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(300, 40)">
          <circle cx={0} cy={0} r={5} fill="#22c55e" opacity={0.8} />
          <text x={10} y={3} fontSize={11} fill="#22c55e">Tin CV, giữ vị trí</text>
          <circle cx={0} cy={16} r={5} fill="#ef4444" opacity={0.8} />
          <text x={10} y={19} fontSize={11} fill="#ef4444">Overfit public, tụt</text>
        </g>
      </svg>

      <p className="text-xs text-muted leading-relaxed italic">
        Các đội tin vào CV (xanh) chủ yếu nằm trên hoặc quanh đường y = x.
        Trong khi đó các đội chạy theo public LB (đỏ) nằm dưới đường y = x,
        nghĩa là public score cao hơn private score và họ bị tụt hạng khi
        private mở.
      </p>
    </div>
  );
}
