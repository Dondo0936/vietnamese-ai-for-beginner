import { describe, it, expect } from "vitest";
import { mapAuthError } from "./auth-errors";

describe("mapAuthError", () => {
  it("maps 'User already registered' to Vietnamese prompt to sign in", () => {
    expect(mapAuthError({ message: "User already registered" })).toBe(
      "Email đã được đăng ký. Thử đăng nhập?"
    );
  });

  it("maps 'Invalid login credentials' to Vietnamese error", () => {
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "Sai email hoặc mật khẩu."
    );
  });

  it("maps 'Password should be at least 6 characters' to Vietnamese", () => {
    expect(
      mapAuthError({ message: "Password should be at least 6 characters" })
    ).toBe("Mật khẩu tối thiểu 6 ký tự.");
  });

  it("maps rate limit errors to wait-60s message", () => {
    expect(mapAuthError({ message: "Email rate limit exceeded" })).toBe(
      "Quá nhiều yêu cầu. Vui lòng đợi 60 giây."
    );
  });

  it("returns generic message for unknown errors", () => {
    expect(mapAuthError({ message: "Some unknown error" })).toBe(
      "Đã có lỗi. Vui lòng thử lại."
    );
  });

  it("handles null/undefined gracefully", () => {
    expect(mapAuthError(null)).toBe("Đã có lỗi. Vui lòng thử lại.");
    expect(mapAuthError({ message: "" })).toBe("Đã có lỗi. Vui lòng thử lại.");
  });
});
