"use client";

import { API_ROUTES } from "@/constants/routes";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api/browser-client";
import type { LoginResult, UserRole } from "@/features/auth/types";

export type LoginStep = "credentials" | "otp";

export function useLogin(expectedRole?: UserRole) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "device_mismatch") {
        return "Phiên đăng nhập đã bị huỷ do phát hiện thay đổi thiết bị bất thường. Vui lòng đăng nhập lại.";
      }
    }
    return "";
  });
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
        API_ROUTES.auth.login,
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
          API_ROUTES.auth.verifyOtp,
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
        API_ROUTES.auth.resendOtp,
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
