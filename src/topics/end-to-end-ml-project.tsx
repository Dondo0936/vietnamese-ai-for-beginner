"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Database,
  Search,
  Wrench,
  Brain,
  ClipboardCheck,
  Rocket,
  Activity,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  CircleDot,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  CollapsibleDetail,
  StepReveal,
  TopicLink,
  LessonSection,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "end-to-end-ml-project",
  title: "End-to-End ML Project",
  titleVi: "Dự án ML từ đầu đến cuối",
  description:
    "Dự án tổng kết (Capstone) — đi trọn vẹn một dự án ML: từ câu hỏi kinh doanh đến mô hình chạy thật, được theo dõi mỗi ngày.",
  category: "foundations",
  tags: ["project", "pipeline", "end-to-end", "capstone"],
  difficulty: "intermediate",
  relatedSlugs: [
    "data-preprocessing",
    "feature-engineering",
    "model-evaluation-selection",
    "python-for-ml",
  ],
  vizType: "interactive",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Bản đồ 8 giai đoạn — mỗi giai đoạn có: icon, màu, tóm tắt, đầu vào, đầu ra,
 *    một diagram nhỏ, một đoạn code ≤15 dòng, một "key insight" ngắn gọn.
 *    Người học bấm từng ô để mở rộng thành case study mini.
 * ─────────────────────────────────────────────────────────────────────────── */

type Stage = {
  id: number;
  key: string;
  name: string;
  icon: typeof Target;
  color: string;
  tagline: string;
  input: string;
  output: string;
  insight: string;
  codeTitle: string;
  code: string;
  codeExplain: string;
};

const STAGES: Stage[] = [
  {
    id: 1,
    key: "frame",
    name: "Xác định bài toán",
    icon: Target,
    color: "#f97316",
    tagline: "Biến câu hỏi kinh doanh mơ hồ thành bài toán ML rõ ràng.",
    input: "Câu hỏi sếp: “Làm sao giảm đơn hủy?”",
    output: "ML task: phân loại nhị phân + metric + baseline.",
    insight:
      "Nếu không chốt target và metric ngay bây giờ, mọi thứ phía sau sẽ đi chệch.",
    codeTitle: "Chốt target và metric bằng văn bản — chưa code",
    code: `# spec.yaml — bản cam kết với sếp trước khi code
target: don_bi_huy_trong_24h
ml_task: binary_classification
metric_chinh: pr_auc        # ưu tiên recall cho class positive
metric_phu: recall@precision=0.8
baseline: du_doan_luon_khong_huy   # ~92% accuracy vẫn 0 recall
quyet_dinh_trien_khai: recall >= 0.65 @ precision 0.80`,
    codeExplain:
      "Đây chưa phải code — là bản spec. Viết ra rõ ràng target, metric chính, baseline, và ngưỡng để ra quyết định. Nếu không có dòng này, sau 2 tháng sếp sẽ hỏi “kết quả thế nào?” và bạn không biết trả lời sao.",
  },
  {
    id: 2,
    key: "collect",
    name: "Thu thập dữ liệu",
    icon: Database,
    color: "#eab308",
    tagline: "Kéo dữ liệu từ nhiều nguồn, lưu snapshot để có thể lặp lại.",
    input: "Database đơn hàng + logs hành vi + CRM khách hàng.",
    output: "Dataset thô đã được lưu snapshot (có version).",
    insight:
      "Không lưu snapshot = 6 tháng sau không tái tạo được kết quả. Mỗi lần chạy phải được 'đóng dấu'.",
    codeTitle: "SQL kéo dữ liệu đơn hàng Shopee 90 ngày gần nhất",
    code: `SELECT
  o.order_id, o.user_id, o.shop_id,
  o.created_at, o.gmv_vnd,
  u.tenure_days, u.city, u.device,
  o.is_cancelled
FROM orders o
JOIN users u ON u.user_id = o.user_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND o.created_at <  CURRENT_DATE
  AND o.gmv_vnd > 0;`,
    codeExplain:
      "Câu SQL này kéo đơn hàng 90 ngày gần nhất kèm thông tin người dùng. Quan trọng: luôn có điều kiện thời gian, loại đơn 0 đồng (test đơn), và join thông tin người dùng ngay ở đây để đơn giản pipeline phía sau.",
  },
  {
    id: 3,
    key: "eda",
    name: "Khám phá & làm sạch",
    icon: Search,
    color: "#22c55e",
    tagline: "Nhìn dữ liệu trước khi cho máy học — phát hiện lỗi, outlier, pattern.",
    input: "Dataset thô, schema, domain knowledge.",
    output: "Bản ghi chú EDA + dữ liệu đã làm sạch.",
    insight:
      "Bỏ qua EDA là mua vé tàu vào ‘thế giới Garbage In, Garbage Out’.",
    codeTitle: "EDA 5 dòng: phân phối target và missing",
    code: `import pandas as pd
df = pd.read_parquet("shopee_orders_90d.parquet")

print(df.shape, "| tỉ lệ hủy:", df["is_cancelled"].mean().round(3))
print(df.isnull().mean().sort_values(ascending=False).head(10))
print(df.groupby("city")["is_cancelled"].mean().sort_values().tail(5))`,
    codeExplain:
      "Bốn dòng nhỏ nhưng trả lời ba câu hỏi lớn: (1) tỉ lệ hủy có cân bằng không? (2) cột nào hay thiếu? (3) thành phố nào tỉ lệ hủy cao bất thường? Nếu tỉ lệ hủy chỉ 3% thì accuracy không còn là metric đáng tin — phải dùng PR-AUC.",
  },
  {
    id: 4,
    key: "feature",
    name: "Tạo đặc trưng",
    icon: Wrench,
    color: "#06b6d4",
    tagline: "Biến dữ liệu thô thành tín hiệu hữu ích cho mô hình.",
    input: "Dữ liệu đã làm sạch + hiểu biết về nghiệp vụ.",
    output: "Bảng đặc trưng (features) dùng chung cho train và serve.",
    insight:
      "Feature tốt thường đánh bại mô hình phức tạp. Đây thường là đòn bẩy lớn nhất.",
    codeTitle: "Tạo 3 feature kinh điển cho bài toán đơn hủy",
    code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

num_cols = ["gmv_vnd", "tenure_days", "hour_of_day"]
cat_cols = ["city", "device", "payment_method"]

pre = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])`,
    codeExplain:
      "Dùng ColumnTransformer để gom mọi phép biến đổi vào một chỗ. Số thì scale (đưa về cùng thang đo), chữ thì one-hot (chuyển thành cột 0/1). Đóng gói trong Pipeline giúp bạn không bị data leakage ở bước đánh giá.",
  },
  {
    id: 5,
    key: "train",
    name: "Huấn luyện & kiểm định",
    icon: Brain,
    color: "#a855f7",
    tagline: "Chọn thuật toán phù hợp, cross-validation để ước lượng thật.",
    input: "Feature table + split train/val/test.",
    output: "Nhiều mô hình ứng viên + điểm CV có độ lệch.",
    insight:
      "Baseline đơn giản (logistic) trước — bất kỳ mô hình phức tạp nào cũng phải vượt qua nó.",
    codeTitle: "Pipeline + cross-validation với StratifiedKFold",
    code: `from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold

model = Pipeline([("pre", pre),
                  ("clf", LogisticRegression(max_iter=1000))])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="average_precision")
print(f"PR-AUC = {scores.mean():.3f} ± {scores.std():.3f}")`,
    codeExplain:
      "StratifiedKFold giữ tỉ lệ class đều trong từng fold — quan trọng cho dữ liệu lệch. Metric ‘average_precision’ chính là PR-AUC. Con số ± cho bạn biết độ ổn định: nếu lệch ±0.1 nghĩa là mô hình chưa đáng tin.",
  },
  {
    id: 6,
    key: "evaluate",
    name: "Đánh giá & chọn mô hình",
    icon: ClipboardCheck,
    color: "#ec4899",
    tagline: "Không chỉ 1 số — confusion matrix, error slicing, business metric.",
    input: "Nhiều mô hình ứng viên.",
    output: "Một mô hình ‘champion’ + báo cáo lỗi chi tiết.",
    insight:
      "Đừng chỉ nhìn overall — slice theo vùng/thời gian để tìm điểm yếu.",
    codeTitle: "Đánh giá chi tiết trên test set ‘chưa từng thấy’",
    code: `from sklearn.metrics import (precision_recall_curve,
                              classification_report, confusion_matrix)

model.fit(X_train, y_train)
proba = model.predict_proba(X_test)[:, 1]
pred  = (proba >= 0.5).astype(int)

print(classification_report(y_test, pred, digits=3))
print(confusion_matrix(y_test, pred))
p, r, t = precision_recall_curve(y_test, proba)`,
    codeExplain:
      "Ba output: classification_report (precision/recall/F1 của từng class), confusion_matrix (để đếm FP và FN thật sự), và đường cong precision-recall (để chọn ngưỡng theo yêu cầu sếp). Đừng chỉ báo cáo accuracy — không ai quan tâm.",
  },
  {
    id: 7,
    key: "deploy",
    name: "Triển khai",
    icon: Rocket,
    color: "#3b82f6",
    tagline: "Đóng gói mô hình thành API + rollout từ từ để an toàn.",
    input: "Model đã huấn luyện + pipeline preprocessing.",
    output: "Endpoint HTTP có thể nhận request và trả về dự đoán.",
    insight:
      "Transform offline và online phải giống hệt nhau — đây là nguồn lỗi số 1 khi deploy.",
    codeTitle: "Lưu model và dựng endpoint FastAPI ngắn gọn",
    code: `import joblib
from fastapi import FastAPI
from pydantic import BaseModel

joblib.dump(model, "cancel_model.pkl")   # lưu cả Pipeline
clf = joblib.load("cancel_model.pkl")
app = FastAPI()

class OrderIn(BaseModel):
    gmv_vnd: float; tenure_days: int
    hour_of_day: int; city: str; device: str

@app.post("/predict")
def predict(o: OrderIn):
    return {"p": float(clf.predict_proba([o.dict()])[0, 1])}`,
    codeExplain:
      "joblib lưu nguyên Pipeline (gồm preprocessing + model) vào 1 file .pkl — quan trọng vì khi load lại, preprocessing tự chạy đúng. FastAPI dựng endpoint chỉ vài dòng. pydantic kiểm tra input để không bị lỗi schema. ⚠️ Chỉ joblib.load / pickle.load trên file do CHÍNH BẠN tạo hoặc nguồn đã xác minh — file .pkl lạ có thể chạy code tuỳ ý khi load, dùng picklescan hoặc convert sang safetensors trước.",
  },
  {
    id: 8,
    key: "monitor",
    name: "Giám sát & vòng lặp",
    icon: Activity,
    color: "#14b8a6",
    tagline: "Model không phải đích đến — là bắt đầu. Data drift, retrain.",
    input: "Logs request + feedback thực tế.",
    output: "Dashboard drift + lịch retrain + cảnh báo.",
    insight:
      "Model thầm lặng ‘thối rữa’ nếu không ai nhìn. Luôn có dashboard và alert.",
    codeTitle: "Đo data drift bằng PSI giữa train và production",
    code: `import numpy as np

def psi(expected, actual, bins=10):
    edges = np.histogram_bin_edges(expected, bins=bins)
    e, _ = np.histogram(expected, bins=edges)
    a, _ = np.histogram(actual, bins=edges)
    e = e / e.sum() + 1e-6
    a = a / a.sum() + 1e-6
    return float(np.sum((a - e) * np.log(a / e)))

print("PSI(gmv) =", psi(train_gmv, prod_gmv_last7d))`,
    codeExplain:
      "PSI (Population Stability Index) so sánh phân phối train và phân phối production gần đây. PSI < 0.1 yên tâm, 0.1–0.25 cần chú ý, > 0.25 là drift nặng — retrain. Hàm này ngắn và đủ dùng cho dashboard nội bộ.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Case study Shopee — walkthrough StepReveal qua 8 giai đoạn với số liệu thật.
 * ─────────────────────────────────────────────────────────────────────────── */

type ShopeeStep = {
  stageId: number;
  headline: string;
  narrative: string;
  numbers: { label: string; value: string; tone: "neutral" | "good" | "warn" | "bad" }[];
};

const SHOPEE_STEPS: ShopeeStep[] = [
  {
    stageId: 1,
    headline: "Sếp: ‘Đơn hủy tuần qua tăng 18%. Làm gì đó đi.’",
    narrative:
      "Bạn không nhảy vào code. Bạn hỏi lại: hủy ở đâu? hủy lúc nào? hủy vì lý do gì? Sau 2 buổi họp, các bên đồng ý: ưu tiên đơn hủy trong 24h đầu, do người mua tự hủy (không phải shop). Chốt metric PR-AUC vì dữ liệu hủy rất lệch (~8% positive).",
    numbers: [
      { label: "Tỉ lệ hủy", value: "8.1%", tone: "warn" },
      { label: "Baseline accuracy", value: "91.9%", tone: "bad" },
      { label: "Baseline recall", value: "0%", tone: "bad" },
      { label: "Metric chốt", value: "PR-AUC", tone: "good" },
    ],
  },
  {
    stageId: 2,
    headline: "Kéo dữ liệu 90 ngày — 12.3 triệu đơn hàng.",
    narrative:
      "Query từ warehouse. Join với bảng user (tenure, city), bảng shop (rating, category). Lưu snapshot dạng parquet có version theo ngày chạy: shopee_orders_2026_03_01.parquet. Nếu 3 tháng sau cần tái tạo, chỉ load đúng file này.",
    numbers: [
      { label: "Tổng đơn", value: "12.3M", tone: "neutral" },
      { label: "Dung lượng", value: "4.1 GB", tone: "neutral" },
      { label: "Số cột", value: "38", tone: "neutral" },
      { label: "Versioned", value: "Có", tone: "good" },
    ],
  },
  {
    stageId: 3,
    headline: "EDA ‘nhìn trước khi cho máy học’ — tìm ra 3 bất thường.",
    narrative:
      "Histogram GMV: lệch phải cực mạnh, nhiều đơn > 5 triệu là outlier. Missing: cột payment_method mất 4% ở mobile app phiên bản cũ. Theo giờ: tỉ lệ hủy tăng vọt sau 22h (người mua buồn ngủ đặt nhầm). Phát hiện này về sau trở thành feature quan trọng.",
    numbers: [
      { label: "Missing cao nhất", value: "4.1%", tone: "warn" },
      { label: "Outlier GMV", value: "2.3%", tone: "warn" },
      { label: "Hủy sau 22h", value: "19.4%", tone: "bad" },
      { label: "Feature mới tìm ra", value: "3", tone: "good" },
    ],
  },
  {
    stageId: 4,
    headline: "Tạo 24 feature — một nửa từ hiểu biết nghiệp vụ.",
    narrative:
      "Numeric: GMV, tenure_days, hour_of_day, avg_order_in_7d. Categorical: city, device, payment_method, shop_category. Time-based: is_late_night (22h–2h), day_of_week, is_weekend. Interaction: gmv / tenure_days (người mới chi nhiều → rủi ro). Feature về sau đều giữ được khi deploy vì pipeline đóng gói chung.",
    numbers: [
      { label: "Tổng feature", value: "24", tone: "neutral" },
      { label: "Numeric", value: "9", tone: "neutral" },
      { label: "Categorical", value: "7", tone: "neutral" },
      { label: "Time/interaction", value: "8", tone: "good" },
    ],
  },
  {
    stageId: 5,
    headline: "Train 4 mô hình ứng viên — baseline trước, fancy sau.",
    narrative:
      "Baseline: LogisticRegression PR-AUC = 0.412. Random Forest: 0.501. LightGBM mặc định: 0.573. LightGBM + tune: 0.612. Gap LightGBM vs Forest chủ yếu đến từ việc LightGBM xử lý categorical tốt hơn, không phải vì phức tạp hơn.",
    numbers: [
      { label: "Logistic PR-AUC", value: "0.412", tone: "neutral" },
      { label: "Random Forest", value: "0.501", tone: "neutral" },
      { label: "LightGBM default", value: "0.573", tone: "good" },
      { label: "LightGBM tuned", value: "0.612", tone: "good" },
    ],
  },
  {
    stageId: 6,
    headline: "Chọn LightGBM tuned. Slice error để tìm điểm yếu.",
    narrative:
      "Overall PR-AUC 0.612 nghe tốt. Nhưng slice theo thành phố: Hà Nội 0.68, TP.HCM 0.63, Đà Nẵng chỉ 0.47. Lý do: dữ liệu Đà Nẵng ít hơn 10 lần. Quyết định: deploy model chung cho tất cả, nhưng theo dõi riêng Đà Nẵng; lên kế hoạch thu thập thêm.",
    numbers: [
      { label: "Overall PR-AUC", value: "0.612", tone: "good" },
      { label: "Hà Nội", value: "0.68", tone: "good" },
      { label: "TP.HCM", value: "0.63", tone: "good" },
      { label: "Đà Nẵng", value: "0.47", tone: "bad" },
    ],
  },
  {
    stageId: 7,
    headline: "Đóng gói thành API + canary rollout 5% → 25% → 100%.",
    narrative:
      "Model + preprocessing gói chung thành Pipeline rồi lưu joblib. Dựng FastAPI, đóng Docker, deploy lên Kubernetes. Bật A/B test: 5% lưu lượng gọi model, 95% dùng rule cũ. Theo dõi 48h thấy p99 latency 38ms, không có lỗi serialize. Tăng lên 25% — ổn. Một tuần sau: 100%.",
    numbers: [
      { label: "p99 latency", value: "38 ms", tone: "good" },
      { label: "Error rate", value: "0.02%", tone: "good" },
      { label: "Recall @ P=0.8", value: "0.67", tone: "good" },
      { label: "ROI ước lượng", value: "+2.3%", tone: "good" },
    ],
  },
  {
    stageId: 8,
    headline: "Hai tuần sau: precision rớt. Drift lộ mặt.",
    narrative:
      "Dashboard báo: precision từ 0.80 rơi xuống 0.63 sau 14 ngày. PSI cột ‘device’ = 0.31 (drift nặng). Nguyên nhân: Shopee ra mắt app phiên bản mới, tỉ lệ user iOS tăng từ 32% → 49%. Retrain với dữ liệu 30 ngày gần nhất, deploy lại. Precision quay về 0.78. Bài học: không có monitoring, bạn sẽ mất tiền âm thầm.",
    numbers: [
      { label: "Precision tuần 1", value: "0.80", tone: "good" },
      { label: "Precision tuần 3", value: "0.63", tone: "bad" },
      { label: "PSI device", value: "0.31", tone: "bad" },
      { label: "Sau retrain", value: "0.78", tone: "good" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Checklist + pitfalls table.
 * ─────────────────────────────────────────────────────────────────────────── */

const CHECKLIST = [
  { stage: "Framing", item: "Có spec viết tay về target + metric + baseline." },
  { stage: "Data", item: "Snapshot dataset có version theo ngày/commit." },
  { stage: "EDA", item: "Notebook EDA với 5 phát hiện lớn nhất." },
  { stage: "Feature", item: "Pipeline đóng gói mọi phép biến đổi." },
  { stage: "Train", item: "Cross-validation có σ, không chỉ một lần split." },
  { stage: "Eval", item: "Slice error theo segment quan trọng." },
  { stage: "Deploy", item: "Canary rollout + rollback plan viết rõ." },
  { stage: "Monitor", item: "Dashboard drift + alert khi metric rớt >10%." },
];

const PITFALLS = [
  {
    name: "Data leakage",
    symptom: "Offline metric cao bất thường (PR-AUC > 0.95 cho bài khó).",
    cause: "Fit scaler/encoder trên toàn bộ data, target encoding không CV.",
    fix: "Luôn dùng Pipeline. Fit trên train, transform trên test.",
  },
  {
    name: "Train/serve skew",
    symptom: "Model tốt offline nhưng sai lệch khi deploy.",
    cause: "Transform pandas offline, SQL online → logic khác nhau.",
    fix: "Dùng chung 1 Pipeline cho cả train và serve (joblib save).",
  },
  {
    name: "Metric ảo",
    symptom: "Accuracy 99% nhưng không bắt được positive nào.",
    cause: "Dữ liệu lệch + chọn accuracy cho imbalanced classification.",
    fix: "Dùng PR-AUC, recall@precision, F1 của class minority.",
  },
  {
    name: "Không baseline",
    symptom: "Không biết LightGBM 0.82 AUC là tốt hay bình thường.",
    cause: "Nhảy thẳng vào mô hình phức tạp.",
    fix: "Luôn có LogisticRegression hoặc heuristic làm điểm so sánh.",
  },
  {
    name: "Deploy xong rồi quên",
    symptom: "Model ‘thối rữa’ âm thầm, sếp phát hiện sau 3 tháng.",
    cause: "Không monitor drift, không alert khi metric rớt.",
    fix: "Dashboard drift + cron retrain + Slack alert.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. Quiz (≥4 câu, tiếng Việt, có giải thích)
 * ─────────────────────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bước ĐẦU TIÊN của một dự án ML thực chiến là gì?",
    options: [
      "Chọn thuật toán phức tạp nhất phù hợp bài toán",
      "Huấn luyện mô hình nhanh với dữ liệu có sẵn để xem kết quả",
      "Biến câu hỏi kinh doanh thành bài toán ML rõ ràng: target, metric, baseline",
      "Thuê GPU để chuẩn bị cho training",
    ],
    correct: 2,
    explanation:
      "Problem framing đi trước mọi thứ. Nếu không chốt target và metric ngay, mọi lần chạy về sau đều là đoán mò. Một ngày framing tiết kiệm một tháng làm lại.",
  },
  {
    question:
      "Mô hình dự đoán đơn hủy đạt accuracy 92% nhưng recall chỉ 0%. Vấn đề nằm ở đâu?",
    options: [
      "Thuật toán quá yếu, cần chuyển sang deep learning",
      "Server bị lỗi khi tính metric",
      "Dữ liệu lệch (8% positive) + chọn sai metric — accuracy không đánh giá được class hiếm",
      "Chưa tuning đủ, cần GridSearch rộng hơn",
    ],
    correct: 2,
    explanation:
      "Với dữ liệu lệch, accuracy đánh lừa: mô hình chỉ cần đoán ‘không hủy’ cho mọi người là đã 92%. Phải dùng PR-AUC hoặc recall@precision để đánh giá đúng class hiếm.",
  },
  {
    question:
      "Mô hình đã deploy 14 ngày; precision rớt từ 0.80 xuống 0.63. Nguyên nhân KHẢ THI nhất?",
    options: [
      "Code deploy bị sai — rollback ngay lập tức",
      "Phân phối dữ liệu đầu vào ở production đã thay đổi so với lúc train (data drift)",
      "Server chậm, latency cao làm metric giảm",
      "Python version khác nhau giữa train và serve",
    ],
    correct: 1,
    explanation:
      "Đây là triệu chứng kinh điển của data drift hoặc concept drift. Giải pháp: chạy PSI/KS test so sánh phân phối, tìm cột drift nặng nhất, retrain với dữ liệu mới, rồi canary rollout lại.",
  },
  {
    question:
      "Tại sao phải đóng gói cả preprocessing và model vào một Pipeline rồi mới lưu joblib?",
    options: [
      "Để file .pkl nhỏ hơn",
      "Để tránh ‘train/serve skew’ — đảm bảo online nhận đầu vào qua cùng các phép biến đổi như offline",
      "Vì sklearn yêu cầu bắt buộc",
      "Để chạy nhanh hơn",
    ],
    correct: 1,
    explanation:
      "Nếu preprocessing offline dùng pandas nhưng online viết lại bằng SQL/Java, rất dễ lệch. Đóng chung Pipeline + joblib save giúp cả hai phía dùng đúng một logic.",
  },
  {
    question:
      "Trong dự án ML thực tế, phần trăm thời gian dành cho ‘training mô hình’ thường là bao nhiêu?",
    options: [
      "70-90% — vì model là linh hồn của dự án",
      "10-20% — phần lớn thời gian nằm ở data collection, EDA, feature engineering, deploy, monitor",
      "50% — chia đều với xử lý dữ liệu",
      "Không có quy tắc chung",
    ],
    correct: 1,
    explanation:
      "Các khảo sát nghề (Anaconda, Kaggle) đều chỉ ra: data work chiếm ~55%, training chỉ 10-15%. ‘Dữ liệu tốt + mô hình đơn giản’ thường thắng ‘dữ liệu tệ + mô hình phức tạp’.",
  },
  {
    type: "fill-blank",
    question:
      "Khi dữ liệu lệch, metric nên dùng là {blank} thay vì accuracy, còn khi chia cross-validation nên dùng {blank} để giữ tỉ lệ class.",
    blanks: [
      { answer: "pr-auc", accept: ["PR-AUC", "pr auc", "precision-recall", "average_precision"] },
      { answer: "stratifiedkfold", accept: ["StratifiedKFold", "stratified k-fold", "stratified kfold"] },
    ],
    explanation:
      "PR-AUC (average precision) tập trung vào class positive — phù hợp khi dữ liệu lệch. StratifiedKFold giữ tỉ lệ class đồng đều trong mọi fold, giúp điểm CV đáng tin.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * 5. Helper component — SVG flowchart overview of the 8 stages
 * ─────────────────────────────────────────────────────────────────────────── */

function StageFlowchart({
  activeId,
  onSelect,
}: {
  activeId: number;
  onSelect: (id: number) => void;
}) {
  const rowPositions = [
    { x: 40, y: 30 },
    { x: 160, y: 30 },
    { x: 280, y: 30 },
    { x: 400, y: 30 },
    { x: 400, y: 110 },
    { x: 280, y: 110 },
    { x: 160, y: 110 },
    { x: 40, y: 110 },
  ];

  return (
    <svg viewBox="0 0 500 170" className="w-full h-auto">
      {/* arrows */}
      {rowPositions.map((pos, i) => {
        if (i === rowPositions.length - 1) return null;
        const next = rowPositions[i + 1];
        const horizontal = pos.y === next.y;
        return (
          <line
            key={`arr-${i}`}
            x1={pos.x + (horizontal ? 40 : 0)}
            y1={pos.y + (horizontal ? 0 : 20)}
            x2={next.x - (horizontal ? 40 : 0)}
            y2={next.y - (horizontal ? 0 : 20)}
            stroke="var(--border)"
            strokeWidth={1.2}
            markerEnd="url(#arrow)"
            opacity={0.6}
          />
        );
      })}
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
      {/* Loop arrow from stage 8 back to stage 3 (EDA) */}
      <path
        d="M 40 130 Q -5 60 140 10"
        stroke="#14b8a6"
        strokeWidth={1.2}
        strokeDasharray="4,3"
        fill="none"
        opacity={0.5}
      />
      <text x={4} y={74} fontSize={11} fill="#14b8a6">
        retrain
      </text>
      {/* nodes */}
      {STAGES.map((s, i) => {
        const pos = rowPositions[i];
        const active = s.id === activeId;
        return (
          <g
            key={s.key}
            transform={`translate(${pos.x - 32}, ${pos.y - 16})`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(s.id)}
          >
            <rect
              width={64}
              height={32}
              rx={8}
              fill={active ? s.color : "var(--bg-card)"}
              stroke={s.color}
              strokeWidth={active ? 2 : 1}
              opacity={active ? 1 : 0.85}
            />
            <text
              x={32}
              y={14}
              textAnchor="middle"
              fontSize={7.5}
              fontWeight={700}
              fill={active ? "#fff" : s.color}
            >
              {s.id}. {s.name.split(" ")[0]}
            </text>
            <text
              x={32}
              y={24}
              textAnchor="middle"
              fontSize={6.5}
              fill={active ? "#fff" : "var(--text-muted)"}
            >
              {s.name.split(" ").slice(1).join(" ")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 6. Helper — colored "metric chip" for case study
 * ─────────────────────────────────────────────────────────────────────────── */

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: ShopeeStep["numbers"][number]["tone"];
}) {
  const palette: Record<typeof tone, { bg: string; color: string; border: string }> = {
    neutral: { bg: "#6366f120", color: "#6366f1", border: "#6366f160" },
    good: { bg: "#10b98120", color: "#059669", border: "#10b98160" },
    warn: { bg: "#f59e0b20", color: "#d97706", border: "#f59e0b60" },
    bad: { bg: "#ef444420", color: "#dc2626", border: "#ef444460" },
  };
  const c = palette[tone];
  return (
    <div
      className="rounded-lg border px-3 py-2 text-center"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div
        className="text-base font-bold tabular-nums"
        style={{ color: c.color }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted leading-tight">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 7. Main Topic Component
 * ─────────────────────────────────────────────────────────────────────────── */

export default function EndToEndMlProjectTopic() {
  const [activeStage, setActiveStage] = useState<number>(1);

  const stage = useMemo(
    () => STAGES.find((s) => s.id === activeStage) ?? STAGES[0],
    [activeStage],
  );

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         HOOK — đặt vấn đề, gợi mở bản đồ
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={1} totalSteps={8} label="Mở bài">
        <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 via-surface/60 to-accent/5 p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-accent/15 p-3">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground leading-tight">
                Bạn có kiến thức. Giờ là dự án thật.
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Từ <strong>câu hỏi kinh doanh</strong> → <strong>dữ liệu</strong> →{" "}
                <strong>mô hình</strong> → <strong>triển khai</strong> →{" "}
                <strong>theo dõi</strong>. Đây là bản đồ bạn cần trong đầu trước mọi
                dự án ML — không có nó, bạn sẽ đi lạc ngay ở tuần thứ hai.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Bài này đưa bạn đi qua 8 giai đoạn, kèm một case study Shopee
                thật — từ yêu cầu mơ hồ của sếp đến mô hình chạy production và
                tự phục hồi khi dữ liệu đổi.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         DISCOVER — PredictionGate
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={2} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Sếp giao dự án 2 tháng dự đoán đơn hủy Shopee. Bạn có dữ liệu 12 triệu đơn. Bước đi đầu tiên ĐÚNG nhất là gì?"
          options={[
            "Train LightGBM ngay — dữ liệu đã đủ, sáng mai báo cáo sếp",
            "Gặp stakeholder chốt target, metric, baseline, rồi làm EDA trước khi chạm mô hình",
            "Đọc paper SOTA để tìm thuật toán tốt nhất cho bài toán dự đoán hủy",
            "Thuê cloud GPU để xử lý song song 12 triệu đơn cho nhanh",
          ]}
          correct={1}
          explanation="Problem framing là bước đầu tiên và quan trọng nhất. ‘Hủy’ nghĩa là gì — user tự hủy hay shop hủy? Trong bao lâu? Metric nào phù hợp? Nếu không chốt bây giờ, 6 tuần sau bạn sẽ phải train lại từ đầu. Một ngày họp framing tiết kiệm một tháng làm lại."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bấm qua từng giai đoạn bên dưới để hiểu vì sao thứ tự 8 bước này
            là bắt buộc — và mỗi bước bỏ qua đều trả giá về sau.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         REVEAL — Interactive flowchart + mini case study per stage
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={3} totalSteps={8} label="Bản đồ 8 giai đoạn">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              Bấm vào từng hình chữ nhật để mở case study mini: đầu vào,
              đầu ra, đoạn code ngắn, và bài học chính. Đường nét đứt màu xanh
              ở dưới là <strong>vòng retrain</strong> — model không bao giờ
              là đích đến.
            </p>

            {/* Flowchart */}
            <div className="rounded-2xl border border-border bg-surface/50 p-5">
              <StageFlowchart activeId={activeStage} onSelect={setActiveStage} />
              <p className="mt-3 text-center text-[11px] text-muted italic">
                Bấm các ô để chọn giai đoạn · mũi tên xanh: vòng retrain từ
                monitoring về feature engineering
              </p>
            </div>

            {/* Stage chip row (mobile-friendly quick nav) */}
            <div className="grid grid-cols-4 gap-1.5">
              {STAGES.map((s) => {
                const Icon = s.icon;
                const active = s.id === activeStage;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveStage(s.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
                      active
                        ? "border-transparent shadow-md scale-[1.03]"
                        : "border-border bg-card hover:border-accent/40 opacity-80"
                    }`}
                    style={
                      active
                        ? { backgroundColor: s.color + "20", borderColor: s.color }
                        : undefined
                    }
                  >
                    <Icon
                      size={14}
                      style={{ color: active ? s.color : undefined }}
                      className={active ? "" : "text-muted"}
                    />
                    <span
                      className="text-[10px] font-semibold leading-tight"
                      style={{ color: active ? s.color : undefined }}
                    >
                      {s.id}. {s.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active stage detail panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border-2 p-5 space-y-4"
                style={{
                  borderColor: stage.color + "60",
                  backgroundColor: stage.color + "08",
                }}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start gap-3">
                  <div
                    className="shrink-0 rounded-xl p-3"
                    style={{ backgroundColor: stage.color + "22" }}
                  >
                    <stage.icon size={22} style={{ color: stage.color }} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: stage.color }}
                    >
                      Giai đoạn {stage.id} / 8
                    </p>
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: stage.color }}
                    >
                      {stage.name}
                    </h4>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {stage.tagline}
                    </p>
                  </div>
                </div>

                {/* Input → Output diagram */}
                <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] items-center">
                  <div className="rounded-lg border border-border bg-surface/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Đầu vào
                    </p>
                    <p className="mt-1 text-xs text-foreground/85 leading-relaxed">
                      {stage.input}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="hidden md:block mx-auto"
                    style={{ color: stage.color }}
                  />
                  <div
                    className="rounded-lg border p-3"
                    style={{
                      borderColor: stage.color + "60",
                      backgroundColor: stage.color + "14",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: stage.color }}
                    >
                      Đầu ra
                    </p>
                    <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                      {stage.output}
                    </p>
                  </div>
                </div>

                {/* Insight */}
                <div
                  className="flex gap-2 rounded-lg p-3"
                  style={{
                    backgroundColor: stage.color + "14",
                    border: `1px dashed ${stage.color}80`,
                  }}
                >
                  <CircleDot
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: stage.color }}
                  />
                  <p className="text-xs text-foreground/90 leading-relaxed italic">
                    {stage.insight}
                  </p>
                </div>

                {/* CodeBlock paired with explanation */}
                <div className="space-y-2">
                  <CodeBlock language="python" title={stage.codeTitle}>
                    {stage.code}
                  </CodeBlock>
                  <div className="rounded-lg border border-border bg-surface/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">
                      Đọc đoạn code trên bằng tiếng Việt
                    </p>
                    <p className="text-xs text-foreground/85 leading-relaxed">
                      {stage.codeExplain}
                    </p>
                  </div>
                </div>

                {/* Nav buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStage((s) => Math.max(s - 1, 1))
                    }
                    disabled={activeStage === 1}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-40"
                  >
                    ← Giai đoạn trước
                  </button>
                  <span className="text-[11px] text-muted tabular-nums">
                    {activeStage} / {STAGES.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStage((s) => Math.min(s + 1, STAGES.length))
                    }
                    disabled={activeStage === STAGES.length}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: stage.color }}
                  >
                    Giai đoạn sau →
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         DEEPEN — Case study Shopee walkthrough
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={4} totalSteps={8} label="Case study Shopee">
        <div className="mb-4 rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-orange-500/15 p-3">
              <ShoppingBag className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">
                Dự án thật: “Dự đoán đơn hàng bị hủy trên Shopee”
              </h3>
              <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                Đội data 1 engineer, 2 tháng, mục tiêu giảm rò rỉ doanh thu vì
                đơn hủy. Bạn sẽ thấy mọi số liệu, mọi quyết định, mọi cú vấp.
              </p>
            </div>
          </div>
        </div>

        <StepReveal
          labels={SHOPEE_STEPS.map(
            (s, i) =>
              `Giai đoạn ${s.stageId} — ${STAGES[s.stageId - 1].name} (${i + 1}/8)`,
          )}
        >
          {SHOPEE_STEPS.map((step) => {
            const parent = STAGES[step.stageId - 1];
            const Icon = parent.icon;
            return (
              <div
                key={step.stageId}
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  borderColor: parent.color + "50",
                  backgroundColor: parent.color + "08",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} style={{ color: parent.color }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: parent.color }}
                  >
                    Giai đoạn {step.stageId} · {parent.name}
                  </span>
                </div>
                <h4 className="text-base font-bold text-foreground leading-snug">
                  {step.headline}
                </h4>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {step.narrative}
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {step.numbers.map((n) => (
                    <MetricChip
                      key={n.label}
                      label={n.label}
                      value={n.value}
                      tone={n.tone}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </StepReveal>

        <AhaMoment>
          <p className="leading-relaxed">
            Thấy chưa — 8 giai đoạn không phải lý thuyết. Mỗi ô là một quyết
            định cụ thể, một con số, một tình huống. <strong>Giá trị</strong>{" "}
            không nằm ở mô hình LightGBM, mà nằm ở việc bạn có hiểu sếp, có
            chạy EDA, có slice error, có monitor drift hay không. Engineer ML
            giỏi = người biết đi hết vòng lặp này, không phải người biết nhiều
            thuật toán nhất.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         CHALLENGE — InlineChallenge về drift
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Mô hình đã deploy 2 tuần; accuracy rớt 2 điểm phần trăm, precision rớt 17 điểm. Đâu là nhóm nguyên nhân KHẢ THI nhất? (Chọn đáp án đầy đủ nhất.)"
          options={[
            "Chỉ do code deploy lỗi — kiểm tra git log và rollback",
            "Chỉ do server chậm — upgrade cluster và tăng replica",
            "Data drift (phân phối input đổi) + concept drift (quan hệ input-output đổi) + có thể kèm vấn đề hạ tầng (skew giữa offline và online)",
            "Không thể xác định — phải retrain liên tục mỗi ngày cho chắc",
          ]}
          correct={2}
          explanation="Đây là triệu chứng kinh điển của drift. Có ba nguồn: (1) data drift — phân phối feature đổi (ví dụ: app mới ra, tỉ lệ user iOS tăng). (2) concept drift — mối quan hệ X→y đổi (ví dụ: mùa sale làm user hay hủy đơn hơn). (3) train/serve skew — logic preprocessing online khác offline. Quy trình đúng: chạy PSI/KS để tìm cột drift, so sánh feature online vs offline, rồi quyết định retrain hay sửa pipeline."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn có 4 tuần để làm dự án dự đoán đơn hủy. Phân bổ thời gian nào HỢP LÝ nhất?"
            options={[
              "3 tuần training + 1 tuần deploy",
              "2 tuần training + 2 tuần hyperparameter tuning",
              "1 tuần framing/EDA, 1 tuần feature engineering, 3 ngày training, 3 ngày eval, còn lại deploy + monitor",
              "Hai tuần đầu đọc paper SOTA, hai tuần sau code",
            ]}
            correct={2}
            explanation="Khảo sát thực tế: data work chiếm ~55% effort, training chỉ 10-15%, còn lại là eval + deploy + monitor. Option C phản ánh đúng: dành nhiều thời gian cho framing, EDA, feature — đây là nơi sinh ra giá trị. Dành quá nhiều thời gian cho training là cái bẫy quen thuộc."
          />
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         EXPLAIN — Checklist, pitfalls, pipeline bones
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích & tham chiếu">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Dự án ML không phải chuỗi tuyến tính — nó là <strong>vòng lặp</strong>.
            Bạn có thể hình dung bằng một phép lặp đơn giản: mỗi lần monitoring
            phát hiện drift, bạn quay về feature engineering hoặc data
            collection, rồi đi lại từ đó đến deploy.
          </p>

          <LaTeX block>
            {"\\text{Framing} \\to \\text{Data} \\to \\text{EDA} \\to \\text{Features} \\to \\text{Train} \\to \\text{Eval} \\to \\text{Deploy} \\to \\text{Monitor} \\circlearrowleft"}
          </LaTeX>

          <p className="leading-relaxed">
            Vòng tròn ở cuối nhắc bạn: không có ‘xong’. Một mô hình sống trung
            bình 3–12 tháng trước khi cần retrain lớn. Nếu bạn chỉ làm đến
            Deploy rồi dừng, mô hình sẽ thầm lặng ‘thối rữa’.
          </p>

          <h4 className="mt-6 text-sm font-semibold text-foreground">
            Checklist trước khi báo cáo sếp ‘dự án xong’
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Tám dòng bên dưới là đủ — không cần dài hơn. Thiếu một dòng là
            một rủi ro mà bạn đang đẩy sang tương lai.
          </p>
          <div className="my-3 grid gap-2">
            {CHECKLIST.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface/60 p-3"
              >
                <span className="mt-0.5 shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {c.stage}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {c.item}
                </p>
              </div>
            ))}
          </div>

          <h4 className="mt-6 text-sm font-semibold text-foreground">
            Bảng ‘5 cú vấp kinh điển’ — đọc để đừng vấp lần nữa
          </h4>
          <div className="my-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    Cái bẫy
                  </th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    Triệu chứng
                  </th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    Nguyên nhân
                  </th>
                  <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    Cách tránh
                  </th>
                </tr>
              </thead>
              <tbody>
                {PITFALLS.map((p, i) => (
                  <tr
                    key={p.name}
                    className={i % 2 === 0 ? "bg-card" : "bg-surface/40"}
                  >
                    <td className="px-3 py-2 align-top text-xs font-semibold text-red-600 dark:text-red-400">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-foreground/85">
                      {p.symptom}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-foreground/80">
                      {p.cause}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-emerald-700 dark:text-emerald-400">
                      {p.fix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="mt-6 text-sm font-semibold text-foreground">
            Bộ xương ‘ML Pipeline’ — tối thiểu bạn cần biết viết
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Ba đoạn code dưới đây là mẫu xương sống. Mỗi đoạn dưới 15 dòng và
            đi kèm giải thích ngay dưới — bạn có thể copy-adapt cho dự án
            đầu tay của mình.
          </p>

          {/* Pipeline bones — Code 1 */}
          <div className="my-4 grid gap-3 md:grid-cols-[1fr_1fr] md:items-start">
            <CodeBlock
              language="python"
              title="1. sklearn Pipeline — tránh data leakage bằng thiết kế"
            >
              {`from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import GradientBoostingClassifier

pre = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])

pipe = Pipeline([
    ("pre", pre),
    ("clf", GradientBoostingClassifier(random_state=42)),
])`}
            </CodeBlock>
            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">
                Đọc code bằng tiếng Việt
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Toàn bộ bước biến đổi (scale số, one-hot cột chữ) và mô hình
                được gói chung vào một <code>Pipeline</code>. Khi bạn gọi
                <code> pipe.fit(X_train) </code>, nội bộ sẽ tự fit scaler chỉ
                trên train, transform rồi train model. Khi{" "}
                <code>pipe.predict(X_test)</code>, scaler dùng tham số đã fit —
                không bị data leakage. Đây là <strong>thói quen bắt buộc</strong>{" "}
                cho mọi dự án ML.
              </p>
            </div>
          </div>

          {/* Pipeline bones — Code 2 */}
          <div className="my-4 grid gap-3 md:grid-cols-[1fr_1fr] md:items-start">
            <CodeBlock
              language="python"
              title="2. joblib — lưu pipeline để deploy dùng lại hệt train"
            >
              {`import joblib

# Lưu sau khi fit xong trên tập train
pipe.fit(X_train, y_train)
joblib.dump(pipe, "model_v1.pkl")

# Sau này (kể cả trên server khác):
loaded = joblib.load("model_v1.pkl")
proba = loaded.predict_proba(X_new)[:, 1]`}
            </CodeBlock>
            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">
                Đọc code bằng tiếng Việt
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                <code>joblib.dump</code> lưu nguyên cả Pipeline (bao gồm
                preprocessing) chứ không chỉ model. Khi load lại,
                <code> predict_proba </code> tự động chạy đủ chuỗi: scale → one-hot → predict.
                Đây là cách <strong>duy nhất đáng tin</strong> để đảm bảo transform
                online giống hệt offline — tránh train/serve skew.
              </p>
              <p className="mt-2 inline-flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                <AlertTriangle size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  <strong>An toàn:</strong> chỉ <code>joblib.load</code> /{" "}
                  <code>pickle.load</code> trên file do chính bạn tạo hoặc nguồn đã
                  xác minh. File <code>.pkl</code> lạ có thể chạy code Python tuỳ ý
                  khi load (supply-chain attack trên HuggingFace / Kaggle là thật).
                  Dùng <code>picklescan</code> hoặc convert sang{" "}
                  <code>safetensors</code> trước.
                </span>
              </p>
            </div>
          </div>

          {/* Pipeline bones — Code 3 */}
          <div className="my-4 grid gap-3 md:grid-cols-[1fr_1fr] md:items-start">
            <CodeBlock
              language="python"
              title="3. FastAPI endpoint — wrap model thành HTTP service"
            >
              {`from fastapi import FastAPI
from pydantic import BaseModel
import joblib, pandas as pd

app = FastAPI()
model = joblib.load("model_v1.pkl")

class Order(BaseModel):
    gmv_vnd: float; hour_of_day: int
    city: str; device: str

@app.post("/predict")
def predict(o: Order):
    df = pd.DataFrame([o.dict()])
    return {"cancel_proba": float(model.predict_proba(df)[0, 1])}`}
            </CodeBlock>
            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">
                Đọc code bằng tiếng Việt
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                FastAPI dựng API chỉ vài dòng. <code>pydantic</code> kiểm tra
                input trước khi chạy — nếu thiếu trường hoặc sai kiểu, trả lỗi
                rõ ràng thay vì mô hình crash. <code>model.predict_proba</code>{" "}
                trả về xác suất; chia tiếp theo ngưỡng của sản phẩm (0.5 mặc
                định, hoặc điều chỉnh theo yêu cầu recall/precision).
              </p>
            </div>
          </div>

          <CollapsibleDetail title="Chi tiết — vì sao dùng xác suất mà không dùng nhãn trực tiếp?">
            <p className="text-sm text-muted leading-relaxed">
              Mỗi bài toán phân loại có một <strong>ngưỡng</strong> (threshold)
              chuyển xác suất thành nhãn 0/1. Ngưỡng mặc định là 0.5 — nhưng
              không phải lúc nào cũng tốt. Nếu muốn{" "}
              <strong>recall cao</strong> (không bỏ sót), hạ ngưỡng xuống 0.3;
              nếu muốn <strong>precision cao</strong> (ít báo động sai), nâng
              ngưỡng lên 0.7. Dùng <code>predict_proba</code> cho phép phía
              sản phẩm tự chọn ngưỡng theo mục tiêu kinh doanh, không cần
              retrain model.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết — công thức PSI và cách đọc">
            <p className="text-sm text-muted leading-relaxed">
              PSI (Population Stability Index) là một chỉ số so sánh hai phân
              phối. Công thức:
            </p>
            <LaTeX block>
              {"\\mathrm{PSI} = \\sum_{i=1}^{k} (a_i - e_i) \\, \\ln \\frac{a_i}{e_i}"}
            </LaTeX>
            <p className="text-sm text-muted leading-relaxed">
              Trong đó <code>e_i</code> là tỉ lệ của bin i ở phân phối train,{" "}
              <code>a_i</code> là tỉ lệ ở phân phối production gần đây. Đọc
              kết quả: PSI &lt; 0.1 — phân phối ổn định. 0.1 ≤ PSI &lt; 0.25 —
              có drift, cần theo dõi. PSI ≥ 0.25 — drift nặng, retrain ngay.
            </p>
          </CollapsibleDetail>

          <p className="mt-4 leading-relaxed">
            Các tài nguyên liên quan để đào sâu:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>{" "}
              — chi tiết về missing values, scaling, encoding.
            </li>
            <li>
              <TopicLink slug="feature-engineering">Feature engineering</TopicLink>{" "}
              — kỹ thuật tạo và chọn đặc trưng.
            </li>
            <li>
              <TopicLink slug="model-evaluation-selection">
                Đánh giá và chọn mô hình
              </TopicLink>{" "}
              — PR-AUC, cross-validation, chọn ngưỡng.
            </li>
            <li>
              <TopicLink slug="python-for-ml">Python cho ML</TopicLink> —
              pandas, sklearn, matplotlib nền tảng.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         CONNECT — bridge to AI Engineer path
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={7} totalSteps={8} label="Chốt lại & nối tiếp">
        <MiniSummary
          title="6 điều phải khắc cốt"
          points={[
            "Dự án ML là vòng lặp 8 giai đoạn — Framing → Data → EDA → Features → Train → Eval → Deploy → Monitor — không phải chuỗi tuyến tính.",
            "Bắt đầu ở Framing: chốt target, metric, baseline trước khi chạm dữ liệu. Thiếu bước này là đi lạc.",
            "Data work (EDA + Features) chiếm >50% thời gian — và thường là đòn bẩy lớn nhất cho chất lượng.",
            "Luôn đóng gói preprocessing + model vào một Pipeline, lưu joblib — tránh train/serve skew, tránh leakage.",
            "Đánh giá phải slice theo segment; accuracy một con số cho imbalanced là dối lòng.",
            "Deploy xong chưa xong — monitoring drift + retrain loop mới là đích đến thật sự.",
          ]}
        />

        <div className="mt-5">
          <Callout
            variant="tip"
            title="Bạn đã qua cổng Student. Đường tiếp theo: AI Engineer."
          >
            <p className="leading-relaxed">
              Bài này là <strong>capstone</strong> của hành trình Student — bạn
              đã có bản đồ, case study, và bộ xương code để triển khai. Nhưng
              một ML engineer chuyên nghiệp còn cần: feature store, CI/CD cho
              model, vector database, LLM-in-production, guardrails, và nhiều
              thứ MLOps khác. Nếu bạn muốn đi tiếp, chuyển sang{" "}
              <strong>lộ trình AI Engineer</strong> — nơi bạn sẽ học cách
              đóng gói mọi thứ thành hệ thống sản xuất cho nhóm hàng triệu
              người dùng.
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs">
              <ChevronRight size={14} />
              Gợi ý các chủ đề mở đầu:{" "}
              <TopicLink slug="feature-engineering">feature engineering</TopicLink>,{" "}
              <TopicLink slug="model-evaluation-selection">
                đánh giá mô hình
              </TopicLink>
              .
            </p>
          </Callout>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-amber-400/60 bg-amber-50/50 p-4 dark:bg-amber-900/15">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Ghi nhớ cuối:</strong> dự án ML đầu tay sẽ KHÔNG đẹp. Bạn
            sẽ sai metric, bị leakage ít nhất một lần, quên monitoring. Điều
            đó bình thường. Cái khiến bạn khác người là: lần thứ hai bạn sẽ
            không mắc cùng lỗi đó. Bản đồ 8 giai đoạn ở trên là la bàn — đem
            theo bên mình cho dự án đầu tiên, rồi bạn sẽ tự biết khi nào cần
            cập nhật.
          </p>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         QUIZ — 6 câu VN có giải thích
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <p className="mb-3 text-sm text-muted leading-relaxed">
          Sáu câu cuối để chốt toàn bộ bản đồ. Mỗi câu đều gắn với một giai
          đoạn trong pipeline — nếu làm sai, hãy đọc lại đúng giai đoạn đó.
        </p>
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
