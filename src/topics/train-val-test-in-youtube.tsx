"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 *  TRAIN / VAL / TEST IN YOUTUBE — Ứng dụng thực tế
 *  ─────────────────────────────────────────────────────────────────────────
 *  Rewrite for the student path. Visualisation-first, no code, no LaTeX.
 *  Core story: YouTube does NOT split randomly. It splits by TIME because
 *  models must predict the future from the past. Then it A/B tests on live
 *  users because offline metrics deceive.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import {
  ToggleCompare,
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
  slug: "train-val-test-in-youtube",
  title: "Train / Val / Test in YouTube Recommendations",
  titleVi: "Tập train/val/test trong YouTube — chia theo thời gian",
  description:
    "YouTube dùng dữ liệu của 2 tỷ người dùng. Chia ngẫu nhiên sẽ gây leakage tương lai → quá khứ. Họ chia theo thời gian rồi A/B test trên người dùng thật.",
  category: "classic-ml",
  tags: ["data-split", "recommendation", "ab-testing", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["train-val-test"],
  vizType: "interactive",
  applicationOf: "train-val-test",
  featuredApp: {
    name: "YouTube",
    productFeature: "Recommendation System",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Deep Neural Networks for YouTube Recommendations",
      publisher: "Covington, Adams & Sargin, ACM RecSys 2016",
      url: "https://dl.acm.org/doi/10.1145/2959100.2959190",
      date: "2016-09",
      kind: "paper",
    },
    {
      title: "On YouTube's recommendation system",
      publisher: "YouTube Official Blog",
      url: "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      date: "2021-09",
      kind: "engineering-blog",
    },
    {
      title: "YouTube by the Numbers: Stats, Demographics & Fun Facts",
      publisher: "Quartz / Statista",
      url: "https://www.oberlo.com/blog/youtube-statistics",
      date: "2024-01",
      kind: "news",
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
export default function TrainValTestInYoutube() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Tập train, val, test"
    >
      <ApplicationHero
        parentTitleVi="Tập train, val, test"
        topicSlug="train-val-test-in-youtube"
      >
        <p>
          Bạn mở YouTube và trang chủ hiện ra danh sách video. Khoảng{" "}
          <strong>70% thời gian xem trên YouTube</strong> đến từ gợi ý của
          thuật toán. Hệ thống này phục vụ hơn <strong>2 tỷ người dùng</strong>,
          chọn lọc từ <strong>hơn 800 triệu video</strong>, xử lý hơn{" "}
          <strong>80 tỷ tín hiệu mỗi ngày</strong>.
        </p>
        <p>
          Nhưng mỗi mô hình gợi ý không được triển khai ngay sau khi huấn
          luyện. YouTube có một quy trình chia dữ liệu nghiêm ngặt &mdash;{" "}
          <strong>train, validation, test</strong> &mdash; rồi kết hợp với{" "}
          <strong>A/B testing</strong> (thử nghiệm so sánh trên người dùng
          thật) để đảm bảo mô hình mới thực sự cải thiện trải nghiệm, không
          chỉ cải thiện con số trên giấy.
        </p>

        {/* HOOK — Why random split fails */}
        <div className="not-prose mt-5">
          <RandomVsTimeHook />
        </div>
      </ApplicationHero>

      <ApplicationProblem topicSlug="train-val-test-in-youtube">
        <p>
          YouTube thu thập dữ liệu tương tác từ 2 tỷ người dùng: lượt xem,
          thời gian xem, nhấn like, chia sẻ, bình luận, bỏ qua. Tổng cộng hơn
          80 tỷ tín hiệu mỗi ngày. Thách thức không chỉ là mô hình chính xác
          trên dữ liệu quá khứ, mà là <strong>dự đoán đúng hành vi người
          dùng trong tương lai</strong> &mdash; vốn thay đổi liên tục: xu
          hướng mới, sự kiện thời sự, sáng tạo viên mới.
        </p>
        <p>
          Nếu chia dữ liệu <em>ngẫu nhiên</em> như cách &ldquo;sách giáo
          khoa&rdquo;, YouTube sẽ phạm lỗi chết người: <strong>thông tin về
          tương lai lọt vào tập train</strong>. Mô hình học trên dữ liệu đã
          &ldquo;nhìn thấy&rdquo; tương lai &rArr; offline metric đẹp &rArr;
          thực tế thảm hại. Lối đúng là chia theo <strong>thời gian</strong>:
          train = dữ liệu cũ, val = dữ liệu trung gian, test = dữ liệu mới
          nhất &mdash; cộng thêm A/B test trên người dùng thật.
        </p>

        <div className="not-prose mt-5">
          <TimelineVisualization />
        </div>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Tập train, val, test"
        topicSlug="train-val-test-in-youtube"
      >
        <Beat step={1}>
          <p>
            <strong>Tập huấn luyện: học từ lịch sử.</strong> YouTube dùng hàng
            tỷ sự kiện tương tác trong quá khứ để huấn luyện mạng nơ-ron sâu.
            Kiến trúc 2 giai đoạn (Covington et al., RecSys 2016): mạng ứng
            viên (candidate generation) chọn vài trăm video từ 800 triệu, rồi
            mạng xếp hạng (ranking) sắp xếp chúng. Dữ liệu được cân bằng cẩn
            thận theo người dùng: mỗi user đóng góp cùng số lượng ví dụ, tránh
            mô hình bị chi phối bởi nhóm xem nhiều.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Tập kiểm định: chia theo user (và theo thời gian).</strong>{" "}
            YouTube chia theo người dùng, không chia theo sự kiện ngẫu nhiên.
            Toàn bộ lịch sử của một user nằm <em>hoàn toàn</em> trong train
            hoặc <em>hoàn toàn</em> trong val &mdash; không chia đôi. Đồng
            thời, cắt theo thời gian: val là dữ liệu <em>gần đây nhất</em> so
            với train. Tập val dùng để chọn hyperparameter, so sánh kiến trúc,
            early stopping.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>A/B test trên người dùng thật: đề thi thật.</strong> Sau
            khi mô hình vượt qua đánh giá offline, YouTube chạy A/B test: chia
            người dùng thành nhóm control (mô hình cũ) và nhóm treatment (mô
            hình mới). So sánh chỉ số thực tế (watch time, lượt hài lòng, tỷ
            lệ dừng xem sớm). YouTube thực hiện <strong>hàng chục nghìn A/B
            test mỗi năm</strong>. Chỉ mô hình vượt qua A/B test mới được
            triển khai.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Quyết định từ chỉ số thực tế, không chỉ số offline.</strong>{" "}
            YouTube nhiều lần phát hiện: mô hình có offline metric cao hơn
            nhưng lại <em>giảm</em> watch time trong A/B test. Nguyên nhân
            thường là mô hình tối ưu cho click (nhấp chuột) thay vì sự hài
            lòng &mdash; người dùng click nhiều hơn nhưng thoát nhanh hơn. Chỉ
            A/B test mới phát hiện được sự khác biệt này. Đó là lý do A/B test
            được coi là &ldquo;test set thật&rdquo;.
          </p>
        </Beat>

        {/* DEEPEN — ToggleCompare: random split vs time-based split */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent" />
            Chia ngẫu nhiên vs chia theo thời gian — ảnh hưởng tới độ tin cậy
          </h3>
          <RandomVsTimeCompare />
        </div>

        {/* DEEPEN — StepReveal A/B test rollout flow */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Quy trình A/B test rollout của YouTube
          </h3>
          <StepReveal
            labels={[
              "1 — Offline evaluation",
              "2 — Shadow deployment",
              "3 — A/B test 1% người dùng",
              "4 — Mở rộng dần",
              "5 — Triển khai toàn cầu",
            ]}
          >
            {[
              <ABStage
                key="a1"
                stage="1"
                title="Offline evaluation"
                color="#3b82f6"
                desc="Đo mô hình mới trên val và test set đã chuẩn bị. Watch time prediction, recall@k, precision@k... Nếu không vượt baseline → dừng ngay, không tốn tài nguyên."
                visual="Val acc: 82.3% → 83.1% ✓ | NDCG@20: 0.42 → 0.44 ✓"
              />,
              <ABStage
                key="a2"
                stage="2"
                title="Shadow deployment"
                color="#f59e0b"
                desc="Chạy mô hình mới song song với mô hình cũ, nhưng KHÔNG hiển thị kết quả. Chỉ ghi log. Mục đích: đo độ ổn định infrastructure (latency, throughput), không phải chất lượng. Chạy vài ngày."
                visual="Mô hình mới: 42ms trung bình, p99 = 180ms ✓ Stable"
              />,
              <ABStage
                key="a3"
                stage="3"
                title="A/B test 1% người dùng"
                color="#22c55e"
                desc="Chọn ngẫu nhiên 1% user (hàng triệu người — đủ lớn để có ý nghĩa thống kê). Một nửa nhìn mô hình cũ (control), nửa kia nhìn mô hình mới (treatment). Đo watch time, satisfaction survey, churn rate."
                visual="Treatment: watch time +1.8% (p = 0.003 → có ý nghĩa)"
              />,
              <ABStage
                key="a4"
                stage="4"
                title="Mở rộng dần: 10% → 50%"
                color="#8b5cf6"
                desc="Nếu A/B test 1% thành công, tăng lên 10%, rồi 50%. Vẫn monitor các chỉ số phụ: có nhóm user nào bị ảnh hưởng tiêu cực không? Creator nào bị thiệt? Giữ quyền rollback ngay lập tức."
                visual="10%: +1.6% WT | 50%: +1.7% WT (ổn định, không cần rollback)"
              />,
              <ABStage
                key="a5"
                stage="5"
                title="Triển khai toàn cầu 100%"
                color="#ef4444"
                desc="Chuyển toàn bộ user sang mô hình mới. Bật monitoring dài hạn (30+ ngày) — xu hướng có thể thay đổi sau khi người dùng quen với hệ thống mới. Giữ mô hình cũ 'stand-by' phòng trường hợp cần rollback."
                visual="Production: 100% user. Monitor 30 ngày tiếp theo."
              />,
            ]}
          </StepReveal>
        </div>

        {/* DEEPEN — offline vs online metric divergence */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Offline metric vs trải nghiệm thật — không luôn đi cùng chiều
          </h3>
          <OfflineOnlineDivergence />
        </div>

        {/* CHALLENGE */}
        <div className="not-prose mt-6">
          <InlineChallenge
            question="Bạn phát triển một mô hình gợi ý video. Offline val accuracy tăng từ 82% → 85%. Bạn có nên triển khai ngay?"
            options={[
              "Có — offline val đã cho tín hiệu rõ ràng",
              "Không — cần A/B test trên người dùng thật. Offline metric có thể đánh lừa; mô hình tối ưu click có thể giảm watch time thật.",
              "Chỉ cần xem test accuracy là đủ",
              "Dùng luôn cho 100% user rồi đo sau",
            ]}
            correct={1}
            explanation="Bài học YouTube: offline metric và trải nghiệm thật không luôn đi cùng chiều. Mô hình tối ưu click-bait có thể 'đẹp' trên val nhưng giảm watch time thực. A/B test trên một phần nhỏ người dùng là cách duy nhất phát hiện điều này trước khi ảnh hưởng đến 2 tỷ người. Dùng rollout theo giai đoạn: 1% → 10% → 50% → 100%."
          />
        </div>

        <div className="not-prose mt-6">
          <InlineChallenge
            question="Bạn có 3 năm dữ liệu hành vi user (2022-2024). Chia thế nào cho đúng?"
            options={[
              "Shuffle tất cả rồi 70/15/15 ngẫu nhiên",
              "Chia theo thời gian: 2022 = train, 2023 = val, 2024 = test. Không shuffle.",
              "Chia theo user: 70% user → train, 15% → val, 15% → test",
              "Kết hợp: chia theo thời gian + theo user (train = user cũ × năm cũ, test = user mới × năm mới)",
            ]}
            correct={3}
            explanation="Đáp án tốt nhất cho YouTube-style: kết hợp cả hai. Chia theo thời gian để mô phỏng đúng production (tương lai là bí ẩn). Đồng thời chia theo user để đánh giá được khả năng tổng quát hoá tới user mới. Chỉ một trong hai chưa đủ: chia theo user không xử lý được drift thời gian; chia theo thời gian không đánh giá được user mới. YouTube paper 2016 mô tả đúng kiến trúc này."
          />
        </div>

        {/* DEEPEN — Two-stage architecture */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Kiến trúc 2 giai đoạn của YouTube &mdash; mỗi giai đoạn chia tập riêng
          </h3>
          <TwoStageArchitecture />
        </div>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="train-val-test-in-youtube"
      >
        <Metric
          value="Hơn 800 triệu video và 2 tỷ người dùng đăng nhập hàng tháng"
          sourceRef={3}
        />
        <Metric
          value="70% thời gian xem trên YouTube đến từ gợi ý thuật toán"
          sourceRef={2}
        />
        <Metric
          value="Hơn 80 tỷ tín hiệu hành vi được xử lý mỗi ngày"
          sourceRef={1}
        />
        <Metric
          value="Hàng chục nghìn A/B test mỗi năm — không mô hình nào triển khai mà không qua A/B"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Tập train, val, test"
        topicSlug="train-val-test-in-youtube"
      >
        <p>
          Không chia tập theo thời gian, YouTube sẽ &ldquo;nhìn thấy tương
          lai&rdquo; trong lúc huấn luyện &mdash; mô hình trông có vẻ chính
          xác trên val/test nhưng thảm hại khi gặp xu hướng mới mà nó chưa
          từng thấy. Không có A/B test, YouTube sẽ triển khai mô hình chỉ
          dựa trên offline metric &mdash; và nhiều thay đổi &ldquo;tốt trên
          giấy&rdquo; sẽ làm giảm trải nghiệm thực: click-bait được ưa chuộng,
          sáng tạo viên có chất lượng bị thiệt.
        </p>
        <p>
          Quy trình 3 bước (train trên quá khứ, val trên tập tách riêng đúng
          cách, A/B test trên người dùng thật) đảm bảo mỗi thay đổi thuật
          toán phải vượt qua cả đánh giá lý thuyết lẫn thử thách thực tế
          trước khi chạm đến 2 tỷ người dùng. <strong>Đây là áp dụng đúng của
          nguyên tắc test set: chỉ mở khi mọi quyết định đã chốt</strong>
          &mdash; ở đây, &ldquo;mở&rdquo; nghĩa là A/B test thật.
        </p>

        <div className="not-prose mt-5">
          <CollapsibleDetail title="Ngoài YouTube: bài học cho mọi hệ thống recommendation">
            <p className="text-sm leading-relaxed">
              Nguyên tắc &ldquo;chia theo thời gian&rdquo; áp dụng cho mọi hệ
              thống dự đoán tương lai: Spotify chọn nhạc, Netflix gợi ý phim,
              Shopee xếp hạng sản phẩm, Tiktok cá nhân hoá feed. Chia ngẫu
              nhiên sẽ cho phép mô hình &ldquo;biết trước&rdquo; xu hướng
              tương lai, tạo ra offline metric đẹp nhưng không có giá trị
              production.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Đồng thời, <strong>không có A/B test = không biết mô hình có
              thực sự tốt hơn</strong>. Mọi offline metric chỉ là ước lượng;
              phản hồi từ người dùng thật là sự thật cuối cùng.
            </p>
          </CollapsibleDetail>
        </div>

        <Callout variant="insight" title="3 nguyên tắc từ YouTube">
          <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
            <li>
              <strong>Chia theo thời gian</strong>: train cũ nhất, test mới
              nhất. Mô phỏng đúng tình huống production.
            </li>
            <li>
              <strong>Chia theo user</strong>: không để dữ liệu của cùng một
              user ở cả train và val/test (data leakage).
            </li>
            <li>
              <strong>A/B test là &ldquo;test set thật&rdquo;</strong>:
              offline metric chỉ là sàng lọc, không phải quyết định cuối cùng.
            </li>
          </ol>
        </Callout>

        <div className="not-prose mt-5 rounded-2xl border border-border bg-surface/40 p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users size={16} className="text-accent" />
            Áp dụng cho dự án Việt Nam: các bước bắt đầu
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/85 leading-relaxed">
            <li>
              <strong>Bước 1:</strong> Xác định &ldquo;mũi tên thời gian&rdquo;
              trong dữ liệu của bạn. Nếu có &mdash; dù là đơn hàng theo ngày,
              click theo giờ, lượt like theo tuần &mdash; <em>chia theo thời
              gian là bắt buộc</em>.
            </li>
            <li>
              <strong>Bước 2:</strong> Xác định nhóm tự nhiên (user, khách hàng,
              thiết bị, phiên). Nếu có, chia theo nhóm thay vì theo điểm dữ
              liệu riêng lẻ.
            </li>
            <li>
              <strong>Bước 3:</strong> Thiết lập một quy trình A/B test đơn
              giản. Ở startup nhỏ, A/B test có thể là &ldquo;tuần 1 dùng model
              A, tuần 2 dùng model B&rdquo; &mdash; vẫn tốt hơn offline metric
              một mình.
            </li>
            <li>
              <strong>Bước 4:</strong> Luôn có mô hình baseline cũ sẵn sàng
              &ldquo;rollback&rdquo;. Một A/B test có ý nghĩa khi bạn <em>có
              thể dừng nó</em> nếu phát hiện ảnh hưởng tiêu cực.
            </li>
          </ol>
          <p className="text-xs text-muted italic leading-relaxed">
            Không phải dự án nào cũng có quy mô YouTube, nhưng các nguyên tắc
            đều áp dụng được. Các startup e-commerce Việt Nam (Tiki, Shopee,
            Lazada VN) đều dùng quy trình tương tự, chỉ khác quy mô.
          </p>
        </div>

        <Callout variant="warning" title="Cảnh báo — những gì A/B test KHÔNG phát hiện được">
          <ul className="list-disc list-inside space-y-1 text-sm mt-1">
            <li>
              <strong>Tác động dài hạn</strong>: A/B test 2 tuần không thấy
              được user bỏ nền tảng sau 6 tháng vì chất lượng giảm.
            </li>
            <li>
              <strong>Ảnh hưởng đến creator</strong>: model mới có thể ưu tiên
              video ngắn, bỏ qua creator làm video dài có giá trị. Cần
              monitor riêng.
            </li>
            <li>
              <strong>Tác động xã hội</strong>: tối ưu engagement có thể dẫn
              tới nội dung cực đoan &mdash; chỉ số engagement đẹp nhưng hậu
              quả xã hội xấu.
            </li>
          </ul>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOCAL HELPERS — visual components
 * ═══════════════════════════════════════════════════════════════════════════ */

function RandomVsTimeHook() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Clock size={16} className="text-accent" />
        Cái bẫy: chia ngẫu nhiên dữ liệu có thứ tự thời gian
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-500 flex items-center gap-1">
            <XCircle size={14} /> Chia ngẫu nhiên
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Train có dữ liệu từ 2024, test có dữ liệu từ 2021. Mô hình
            &ldquo;biết trước&rdquo; xu hướng &mdash; offline metric cực đẹp,
            thực tế bị tụt thảm.
          </p>
        </div>
        <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> Chia theo thời gian
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Train: 2020-2022 (cũ). Val: 2023 (trung). Test: 2024 (mới). Mô
            phỏng đúng việc dự đoán tương lai từ quá khứ.
          </p>
        </div>
      </div>
    </div>
  );
}

function TimelineVisualization() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Clock size={16} className="text-accent" />
        Dữ liệu YouTube: vào liên tục theo thời gian
      </p>

      <svg viewBox="0 0 560 180" className="w-full max-w-2xl mx-auto" role="img" aria-label="Timeline chia dữ liệu YouTube theo thời gian">
        {/* Horizontal timeline axis */}
        <line x1={40} y1={130} x2={520} y2={130} stroke="currentColor" className="text-muted" strokeWidth={1.5} />
        <text x={280} y={160} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          Thời gian →
        </text>

        {/* Train block */}
        <rect x={40} y={40} width={260} height={70} rx={8} fill="#3b82f6" opacity={0.7} />
        <text x={170} y={75} fontSize={14} fill="#fff" textAnchor="middle" fontWeight={700}>
          TRAIN
        </text>
        <text x={170} y={92} fontSize={11} fill="#fff" textAnchor="middle">
          Jan 2023 → Sep 2024
        </text>
        <text x={170} y={106} fontSize={11} fill="#fff" textAnchor="middle" opacity={0.9}>
          Hàng tỷ tương tác lịch sử
        </text>

        {/* Val block */}
        <rect x={305} y={40} width={90} height={70} rx={8} fill="#f59e0b" opacity={0.75} />
        <text x={350} y={75} fontSize={12} fill="#fff" textAnchor="middle" fontWeight={700}>
          VAL
        </text>
        <text x={350} y={92} fontSize={11} fill="#fff" textAnchor="middle">
          Oct 2024
        </text>

        {/* Test block */}
        <rect x={400} y={40} width={90} height={70} rx={8} fill="#22c55e" opacity={0.75} />
        <text x={445} y={75} fontSize={12} fill="#fff" textAnchor="middle" fontWeight={700}>
          TEST
        </text>
        <text x={445} y={92} fontSize={11} fill="#fff" textAnchor="middle">
          Nov 2024
        </text>

        {/* Arrow showing direction */}
        <text x={280} y={28} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          Train trên quá khứ → đánh giá trên tương lai
        </text>

        {/* Tick marks */}
        {[170, 350, 445].map((x) => (
          <line key={x} x1={x} y1={125} x2={x} y2={135} stroke="currentColor" className="text-muted" strokeWidth={1} />
        ))}

        {/* Live users at the end */}
        <g>
          <rect x={498} y={40} width={22} height={70} rx={4} fill="#8b5cf6" opacity={0.7} />
          <text x={509} y={78} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={700} transform="rotate(-90 509 78)">
            A/B LIVE
          </text>
        </g>
        <text x={509} y={126} fontSize={11} fill="#8b5cf6" textAnchor="middle" fontWeight={700}>
          Real users
        </text>
      </svg>

      <p className="text-xs text-muted leading-relaxed italic">
        Ba tập dữ liệu offline + một tập &ldquo;test thật&rdquo; là A/B trên
        người dùng hiện tại. Chỉ mô hình vượt qua cả bốn mới được triển khai.
      </p>
    </div>
  );
}

function RandomVsTimeCompare() {
  return (
    <ToggleCompare
      labelA="Chia ngẫu nhiên (sai)"
      labelB="Chia theo thời gian (đúng)"
      description="Cùng dataset 12 tháng. Đổi cách chia để thấy hậu quả."
      childA={<SplitVisual mode="random" />}
      childB={<SplitVisual mode="time" />}
    />
  );
}

function SplitVisual({ mode }: { mode: "random" | "time" }) {
  // 12 month blocks
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        idx: i,
        label: `T${i + 1}`,
      })),
    [],
  );

  const assignments = useMemo(() => {
    if (mode === "random") {
      // shuffled (deterministic)
      const seed = [2, 1, 0, 2, 0, 1, 0, 1, 2, 0, 1, 0]; // 0=train 1=val 2=test
      return seed;
    }
    // time-based: first 8 train, next 2 val, last 2 test
    return months.map((_, i) => (i < 8 ? 0 : i < 10 ? 1 : 2));
  }, [mode, months]);

  const groupColors = ["#3b82f6", "#f59e0b", "#22c55e"];
  const groupNames = ["Train", "Val", "Test"];

  const isLeaky = mode === "random";

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        {isLeaky ? (
          <>
            <XCircle size={14} className="text-red-500" />
            <h5 className="text-sm font-bold text-red-500">Random split — leakage</h5>
          </>
        ) : (
          <>
            <CheckCircle2 size={14} className="text-green-600" />
            <h5 className="text-sm font-bold text-green-600">Time-based split — sạch</h5>
          </>
        )}
      </div>

      <div className="flex gap-1">
        {months.map((m, i) => {
          const g = assignments[i];
          const color = groupColors[g];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-10 rounded flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: color }}
              >
                {groupNames[g][0]}
              </div>
              <span className="text-[9px] text-muted">{m.label}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-background border border-border p-3">
        {isLeaky ? (
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
              <AlertTriangle size={12} aria-hidden="true" />
              Vấn đề:
            </p>
            <p className="text-xs text-foreground/85 leading-relaxed">
              T3 (tháng 3) nằm trong test, nhưng T5, T9 (tháng 5, 9 &mdash; tương
              lai so với T3) lại ở train. Mô hình &ldquo;biết trước&rdquo; xu
              hướng tương lai khi đoán T3. Kết quả offline đẹp, production thảm.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle2 size={12} aria-hidden="true" />
              Ưu điểm:
            </p>
            <p className="text-xs text-foreground/85 leading-relaxed">
              Train = T1-T8 (cũ), Val = T9-T10, Test = T11-T12 (mới nhất). Mô
              phỏng đúng production: dự đoán tương lai từ quá khứ. Không có
              leakage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ABStageProps {
  stage: string;
  title: string;
  color: string;
  desc: string;
  visual: string;
}

function ABStage({ stage, title, color, desc, visual }: ABStageProps) {
  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}0D` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {stage}
        </div>
        <h4 className="text-sm font-bold" style={{ color }}>
          {title}
        </h4>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{desc}</p>
      <div className="rounded-lg bg-background border border-border px-3 py-2">
        <p className="text-xs font-mono text-foreground/85">{visual}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TwoStageArchitecture — visualize YouTube's candidate + ranking pipeline
   ───────────────────────────────────────────────────────────────────────── */
function TwoStageArchitecture() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        YouTube không có <em>một</em> mô hình gợi ý. Họ có <strong>hai</strong>
        &mdash; mỗi cái có dữ liệu train/val/test riêng, được đánh giá theo
        metric riêng.
      </p>

      <svg
        viewBox="0 0 560 260"
        className="w-full max-w-2xl mx-auto rounded-md border border-border bg-background"
        role="img"
        aria-label="Kiến trúc 2 giai đoạn của YouTube recommendation"
      >
        {/* 800M videos block */}
        <rect x={20} y={30} width={110} height={60} rx={8} fill="#64748b" opacity={0.2} stroke="#64748b" strokeOpacity={0.5} />
        <text x={75} y={50} fontSize={11} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={700}>
          800 triệu video
        </text>
        <text x={75} y={65} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          Kho video khổng lồ
        </text>
        <text x={75} y={80} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          (không kịp xếp hết)
        </text>

        {/* Arrow */}
        <line x1={135} y1={60} x2={175} y2={60} stroke="currentColor" className="text-muted" strokeWidth={1.5} markerEnd="url(#arrow1)" />
        <defs>
          <marker id="arrow1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-muted" />
          </marker>
        </defs>

        {/* Stage 1: Candidate Generation */}
        <rect x={180} y={30} width={180} height={60} rx={8} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" strokeOpacity={0.6} />
        <text x={270} y={50} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={700}>
          Giai đoạn 1: Candidate
        </text>
        <text x={270} y={65} fontSize={11} fill="#3b82f6" textAnchor="middle">
          Mạng nơ-ron sâu, embedding
        </text>
        <text x={270} y={80} fontSize={11} fill="#3b82f6" textAnchor="middle">
          Chọn ~200 video ứng viên
        </text>

        {/* Arrow */}
        <line x1={365} y1={60} x2={405} y2={60} stroke="currentColor" className="text-muted" strokeWidth={1.5} markerEnd="url(#arrow1)" />

        {/* Stage 2: Ranking */}
        <rect x={410} y={30} width={140} height={60} rx={8} fill="#22c55e" opacity={0.15} stroke="#22c55e" strokeOpacity={0.6} />
        <text x={480} y={50} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={700}>
          Giai đoạn 2: Ranking
        </text>
        <text x={480} y={65} fontSize={11} fill="#22c55e" textAnchor="middle">
          Xếp hạng ~200 → top 20
        </text>
        <text x={480} y={80} fontSize={11} fill="#22c55e" textAnchor="middle">
          Điểm dự đoán watch time
        </text>

        {/* Data split details below each stage */}
        <g transform="translate(180, 110)">
          <text x={90} y={14} fontSize={11} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Dữ liệu Candidate
          </text>
          <rect x={0} y={20} width={180} height={18} rx={3} fill="#3b82f6" opacity={0.7} />
          <text x={90} y={33} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
            Train: tương tác &gt; 7 ngày trước
          </text>
          <rect x={0} y={42} width={90} height={18} rx={3} fill="#f59e0b" opacity={0.7} />
          <rect x={90} y={42} width={90} height={18} rx={3} fill="#22c55e" opacity={0.7} />
          <text x={45} y={55} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
            Val: tuần trước
          </text>
          <text x={135} y={55} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
            Test: 24h qua
          </text>
        </g>

        <g transform="translate(410, 110)">
          <text x={70} y={14} fontSize={11} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Dữ liệu Ranking
          </text>
          <rect x={0} y={20} width={140} height={18} rx={3} fill="#3b82f6" opacity={0.7} />
          <text x={70} y={33} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
            Train: click + watch time
          </text>
          <rect x={0} y={42} width={140} height={18} rx={3} fill="#22c55e" opacity={0.7} />
          <text x={70} y={55} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={600}>
            A/B: Final test thật
          </text>
        </g>

        {/* Metric side */}
        <g transform="translate(20, 180)">
          <text x={0} y={10} fontSize={11} fill="currentColor" className="text-foreground" fontWeight={600}>
            Metric đánh giá:
          </text>
          <text x={0} y={25} fontSize={11} fill="#3b82f6">
            • Candidate: Recall@200 (có bao nhiêu video hay lọt vào top 200?)
          </text>
          <text x={0} y={40} fontSize={11} fill="#22c55e">
            • Ranking: AUC weighted theo watch time, NDCG@20
          </text>
          <text x={0} y={55} fontSize={11} fill="#8b5cf6">
            • A/B: Watch time per user, satisfaction survey
          </text>
        </g>
      </svg>

      <p className="text-xs text-muted italic leading-relaxed">
        Mỗi giai đoạn có data split và metric riêng. Candidate cần recall cao
        (không bỏ sót video hay); ranking cần thứ tự đúng. A/B test đánh giá
        cả hai cộng lại trên người dùng thật. Đây là mô hình điển hình cho các
        hệ thống recommendation lớn (Netflix, Spotify, Tiktok).
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   OfflineOnlineDivergence — three scenarios showing metric divergence
   ───────────────────────────────────────────────────────────────────────── */
function OfflineOnlineDivergence() {
  const scenarios = [
    {
      title: "Click-bait model",
      offlineMetric: "CTR (click-through rate)",
      offlineValue: "+12%",
      onlineMetric: "Watch time",
      onlineValue: "-4%",
      onlineTone: "bad" as const,
      lesson:
        "Mô hình tối ưu CTR → chọn thumbnail gây tò mò nhưng nội dung không hợp → user bỏ xem sớm.",
    },
    {
      title: "Highly-relevant model",
      offlineMetric: "NDCG@20",
      offlineValue: "+2%",
      onlineMetric: "Watch time",
      onlineValue: "+6%",
      onlineTone: "good" as const,
      lesson:
        "Offline metric tăng nhẹ, nhưng user thích hơn rõ rệt — trải nghiệm thật mới nói lên tất cả.",
    },
    {
      title: "Diversity-boosting model",
      offlineMetric: "Accuracy",
      offlineValue: "-1%",
      onlineMetric: "Satisfaction survey",
      onlineValue: "+8%",
      onlineTone: "good" as const,
      lesson:
        "Accuracy giảm (model gợi ý đa dạng hơn, không phải 'an toàn nhất'), nhưng user hài lòng hơn dài hạn.",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Ba tình huống thật từ nghiên cứu YouTube &mdash; mỗi tình huống cho
        thấy vì sao A/B test là không thể thiếu.
      </p>

      <div className="space-y-3">
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface/40 p-4"
          >
            <p className="text-sm font-bold text-foreground mb-2">{s.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div className="rounded-md bg-background border border-border p-2">
                <p className="text-[10px] text-muted uppercase tracking-wide">
                  Offline ({s.offlineMetric})
                </p>
                <p className="text-lg font-bold text-blue-500 tabular-nums">
                  {s.offlineValue}
                </p>
              </div>
              <div className="rounded-md bg-background border border-border p-2">
                <p className="text-[10px] text-muted uppercase tracking-wide">
                  Online ({s.onlineMetric})
                </p>
                <p
                  className={`inline-flex items-center gap-1 text-lg font-bold tabular-nums ${
                    s.onlineTone === "good" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {s.onlineTone === "good" ? (
                    <CheckCircle2 size={14} aria-hidden="true" />
                  ) : (
                    <XCircle size={14} aria-hidden="true" />
                  )}
                  {s.onlineValue}
                </p>
              </div>
            </div>
            <p className="text-xs text-foreground/80 italic leading-relaxed">
              {s.lesson}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted italic leading-relaxed">
        Kết luận: mọi chỉ số offline chỉ là proxy. Quyết định cuối cùng luôn
        thuộc về A/B test trên người dùng thật &mdash; đây chính là
        &ldquo;đề thi thật&rdquo; của một hệ thống recommendation.
      </p>
    </div>
  );
}

