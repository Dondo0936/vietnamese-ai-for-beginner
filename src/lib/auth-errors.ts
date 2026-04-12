interface SupabaseLikeError {
  message?: string;
}

export function mapAuthError(
  error: SupabaseLikeError | null | undefined
): string {
  if (!error || !error.message) return "Đã có lỗi. Vui lòng thử lại.";

  const msg = error.message.toLowerCase();

  if (msg.includes("already registered"))
    return "Email đã được đăng ký. Thử đăng nhập?";
  if (msg.includes("invalid login credentials"))
    return "Sai email hoặc mật khẩu.";
  if (msg.includes("password should be at least"))
    return "Mật khẩu tối thiểu 6 ký tự.";
  if (msg.includes("invalid email") || msg.includes("unable to validate email"))
    return "Email không hợp lệ.";
  if (msg.includes("rate limit"))
    return "Quá nhiều yêu cầu. Vui lòng đợi 60 giây.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Không có kết nối mạng.";
  if (msg.includes("otp") && msg.includes("expired"))
    return "Liên kết đã hết hạn. Vui lòng đăng ký lại.";

  return "Đã có lỗi. Vui lòng thử lại.";
}
