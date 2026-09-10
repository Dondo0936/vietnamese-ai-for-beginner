export type SkillOffer = {
  href: string;
  price: string;
  title: string;
  body: string;
  also?: { href: string; label: string };
};

export type LessonSkillBlock = {
  heading: string;
  intro: string;
  offers: SkillOffer[];
};

const GUMROAD = "https://thejackedvibecoder.gumroad.com/l";

export const SKILL_URLS = {
  vietnameseWriting: `${GUMROAD}/vietnamese-authentic-writing`,
  writingChecker: `${GUMROAD}/ai-writing-checker`,
  englishRewriter: `${GUMROAD}/humanize-ai-writing`,
  socialOps: `${GUMROAD}/social-ops`,
  videoQa: `${GUMROAD}/ai-video-qa`,
} as const;

const WRITING_BLOCK: LessonSkillBlock = {
  heading: "Chạy trên bản nháp của bạn",
  intro:
    "Bài học dừng ở cách dặn AI. Skill dưới đây rà bản đã viết xong, trước khi bạn gửi.",
  offers: [
    {
      href: SKILL_URLS.vietnameseWriting,
      price: "Miễn phí",
      title: "Vietnamese Authentic Writing",
      body: "Sửa tiếng Việt cho tự nhiên, không giống bản dịch từ tiếng Anh. Bỏ gạch ngang dài (em dash), ẩn dụ, và câu chốt kiểu slogan.",
    },
    {
      href: SKILL_URLS.writingChecker,
      price: "Miễn phí",
      title: "AI Writing Checker",
      body: "Rà gạch ngang dài và từ AI hay dùng trong tiếng Anh, như delve hay robust.",
      also: {
        href: SKILL_URLS.englishRewriter,
        label: "Muốn máy viết lại đúng giọng bạn: Authentic English Writing, $19.",
      },
    },
  ],
};

const SOCIAL_BLOCK: LessonSkillBlock = {
  heading: "Chạy đúng quy trình vừa học",
  intro:
    "Bài này là quy trình đăng một nội dung lên năm nền tảng, rồi đọc lại bản đã lưu. Skill đóng gói quy trình đó cho agent của bạn.",
  offers: [
    {
      href: SKILL_URLS.socialOps,
      price: "$9.99",
      title: "Multi-Channel Social Ops",
      body: "Bộ kỹ năng cho tác nhân AI (agent skill). Agent soạn bản riêng cho từng kênh, chạy thử, rồi dừng chờ bạn duyệt. Không tự đăng.",
    },
  ],
};

const VIDEO_BLOCK: LessonSkillBlock = {
  heading: "Kiểm video trước khi đăng",
  intro:
    "Bài này giải thích video sinh từ mô tả. Skill dưới đây dành cho video xuất từ code, như Remotion hay ffmpeg, không phải clip kiểu Sora.",
  offers: [
    {
      href: SKILL_URLS.videoQa,
      price: "$9.99",
      title: "AI Video QA",
      body: "Mười bảy lớp lỗi từ render thật. Chỉ cần ffmpeg và bash. File báo metadata đẹp vẫn có thể hỏng từng khung hình.",
    },
  ],
};

/** Lesson slug → Gumroad skill. Keep this list tight. Homepage stays ad-free. */
export const LESSON_SKILLS: Record<string, LessonSkillBlock> = {
  "ai-for-writing": WRITING_BLOCK,
  "prompt-engineering": WRITING_BLOCK,
  "prompt-engineering-in-writing-tools": WRITING_BLOCK,
  "ai-for-social-media": SOCIAL_BLOCK,
  "text-to-video": VIDEO_BLOCK,
};

export function getLessonSkill(slug: string): LessonSkillBlock | null {
  return LESSON_SKILLS[slug] ?? null;
}
