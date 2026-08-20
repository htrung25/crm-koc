"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { postJson } from "@/lib/api/fetch-client";
import type { LoginResult, UserRole } from "./types";

export type LoginStep = "credentials" | "otp";

/**
 * Luồng đăng nhập chung cho mọi cổng.
 *
 * Backend bắt tài khoản admin qua thêm bước OTP: POST /login/admin chỉ trả
 * `requireOtp`, phải gọi tiếp /verify-otp mới có phiên. Brand/creator xong
 * ngay ở bước đầu.
 *
 * `expectedRole` chỉ có ở cổng admin (trang /admin truyền "ADMIN"): nó chọn
 * endpoint /login/admin và chặn tài khoản brand/creator tạo phiên ở đó.
 *
 * Cổng công khai KHÔNG truyền gì. Brand và creator dùng chung /login vì trước
 * khi xác thực thì chưa biết ai là ai — vai trò do backend trả về, client chỉ
 * dựa vào đó để điều hướng.
 */
export function useLogin(expectedRole?: UserRole) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goHome = (result: LoginResult) => {
    if (result.status === "authenticated") {
      router.replace(result.redirectTo);
      router.refresh();
    }
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const result = await postJson<LoginResult>(
        "/api/auth/login",
        { email, password, expectedRole },
        { skipRefresh: true },
      );

      if (result.status === "otp_required") {
        setStep("otp");
        setNotice(result.message);
      } else {
        goHome(result);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      goHome(
        await postJson<LoginResult>(
          "/api/auth/verify-otp",
          { email, otp, expectedRole },
          { skipRefresh: true },
        ),
      );
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const result = await postJson<{ message: string }>(
        "/api/auth/resend-otp",
        { email },
        { skipRefresh: true },
      );
      setNotice(result.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setOtp("");
    setError("");
    setNotice("");
  };

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    setOtp,
    error,
    notice,
    isSubmitting,
    submitCredentials,
    verifyOtp,
    resendOtp,
    backToCredentials,
  };
}
