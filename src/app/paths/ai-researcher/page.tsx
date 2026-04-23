"use client";

import { FlaskConical } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";
import { getPathStages } from "@/lib/paths";

const pathObjectives: PathObjectives = {
  audience:
    "Kỹ sư AI muốn đi sâu vào nghiên cứu, sinh viên thạc sĩ/tiến sĩ ngành AI/ML, hoặc bất kỳ ai muốn hiểu lý thuyết và xu hướng tiên tiến nhất.",
  prerequisites:
    "Nắm vững toán (đại số tuyến tính, xác suất, giải tích). Hiểu neural networks và backpropagation. Có kinh nghiệm huấn luyện mô hình deep learning. Đọc hiểu paper khoa học.",
  stageObjectives: [
    {
      stage: "Lý thuyết sâu",
      objectives: [
        "Hiểu sâu backpropagation dưới góc nhìn chain rule và autograd",
        "Phân tích nguồn gốc vanishing / exploding gradients và hệ quả với mạng rất sâu",
        "Lý thuyết regularization: L1/L2, dropout, early stopping và quan hệ với capacity + generalization",
      ],
    },
    {
      stage: "Kiến trúc tiên tiến",
      objectives: [
        "Hiểu Transformer và Flash Attention ở mức toán học",
        "Nắm kiến trúc generative: VAE, GAN, Diffusion Models, Autoencoder",
        "Hiểu Mixture of Experts và State Space Models",
        "Biết Vision Transformer, U-Net, NeRF",
      ],
    },
    {
      stage: "NLP & Multimodal",
      objectives: [
        "Hiểu lịch sử word embeddings: Word2Vec → GloVe → Transformer-based",
        "Nắm Seq2Seq, Attention Mechanism, và các metric đánh giá",
        "Hiểu kiến trúc multimodal: CLIP, VLM, Unified Multimodal",
        "Biết text-to-image, text-to-video, speech recognition, TTS",
      ],
    },
    {
      stage: "Huấn luyện & Alignment",
      objectives: [
        "Hiểu RLHF, DPO, GRPO cho alignment",
        "Nắm Constitutional AI và scaling laws",
        "Hiểu test-time compute và adversarial robustness",
        "Biết AI watermarking và deepfake detection",
      ],
    },
    {
      stage: "Học tăng cường",
      objectives: [
        "Hiểu Q-Learning và Deep Q-Network",
        "Nắm Policy Gradient và Actor-Critic",
        "Biết Multi-Armed Bandit và ứng dụng thực tế",
      ],
    },
    {
      stage: "Xu hướng mới",
      objectives: [
        "Hiểu reasoning models và world models",
        "Nắm kỹ thuật long-context và synthetic data",
        "Biết Small Language Models và AI for Science",
      ],
    },
  ],
  outcomes: [
    "Đọc và hiểu paper nghiên cứu AI/ML tiên tiến",
    "Hiểu sâu lý thuyết đằng sau các kiến trúc hiện đại",
    "Nắm vững alignment, scaling laws, và training optimization",
    "Có nền tảng reinforcement learning vững chắc",
    "Theo kịp các xu hướng mới nhất trong nghiên cứu AI",
  ],
  estimatedTime: [
    { stage: "Lý thuyết sâu", hours: 7 },
    { stage: "Kiến trúc tiên tiến", hours: 23 },
    { stage: "NLP & Multimodal", hours: 22 },
    { stage: "Huấn luyện & Alignment", hours: 18 },
    { stage: "Học tăng cường", hours: 10 },
    { stage: "Xu hướng mới", hours: 12 },
  ],
  nextPath: null,
};

export default function AIResearcherPathPage() {
  return (
    <LearningPathPage
      pathId="ai-researcher"
      nameVi="AI Researcher"
      descriptionVi="Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến"
      icon={FlaskConical}
      stages={getPathStages("ai-researcher")}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
      extras={{
        eyebrowVi: "Lộ trình cho người nghiên cứu",
        editor: {
          name: "Dondo",
          role: "Biên tập chính · udemi.tech",
          initials: "DD",
        },
        faq: [
          {
            q: "Cần nền toán đến đâu?",
            a: "Đại số tuyến tính vững + xác suất + giải tích ở mức đại học. Lộ trình không ôn lại toán. Nếu rỗng phần này, nên đi qua lộ trình Học sinh · Sinh viên trước.",
          },
          {
            q: "Lộ trình có dạy đọc paper không?",
            a: "Có. Chương cuối tập trung vào scaling laws, alignment, và cách đọc các paper mới nhất trên arXiv một cách hệ thống.",
          },
          {
            q: "Có phải theo thứ tự không?",
            a: "Hai chương đầu (Nền tảng lý thuyết + Kiến trúc) nên học tuần tự. Các chương sau có thể nhảy cóc theo hứng nghiên cứu.",
          },
          {
            q: "Làm sao đóng góp vào lộ trình?",
            a: "Repo mở trên GitHub. Mỗi bài có nút 'Đề xuất chỉnh sửa'. Pull request với trích dẫn paper được welcome.",
          },
        ],
      }}
    />
  );
}
