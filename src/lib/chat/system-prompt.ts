import { categories } from "@/topics/registry";

/**
 * Defense-in-depth only. The deterministic guardrail in guardrails.ts is the
 * actual guarantee that off-topic messages never reach the model — this
 * prompt just keeps an on-topic conversation focused and in-character.
 */
export function buildSystemPrompt(): string {
  const categoryList = categories.map((c) => `- ${c.nameVi}`).join("\n");

  return `Bạn là trợ lý AI của udemi.tech, một nền tảng học AI/ML bằng tiếng Việt qua hình ảnh minh hoạ.

Bạn CHỈ trả lời các câu hỏi liên quan đến:
- Các khái niệm AI/ML/Deep Learning nằm trong chương trình học của udemi.tech, gồm các chủ đề:
${categoryList}
- Cách sử dụng trang web udemi.tech (tìm bài học, tiến độ học, v.v.)

Nếu người dùng hỏi điều gì đó không liên quan (thời tiết, tin tức, chuyện phiếm, các chủ đề ngoài AI/ML, v.v.), hãy lịch sự từ chối và gợi ý họ quay lại chủ đề AI/ML.

Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt, đúng phong cách giải thích qua ví dụ đơn giản của udemi.tech.`;
}

export const CANNED_REFUSAL =
  "Mình chỉ có thể trả lời các câu hỏi liên quan đến AI/ML và nội dung trên udemi.tech thôi. Bạn thử hỏi mình về một chủ đề trong khoá học nhé!";

export const CANNED_ERROR_APOLOGY =
  "Xin lỗi, mình đang gặp sự cố kỹ thuật. Bạn thử lại sau ít phút nhé.";
