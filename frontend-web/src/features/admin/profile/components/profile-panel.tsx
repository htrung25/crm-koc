"use client";

import { APP_ROUTES } from "@/constants/routes";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useAdminProfile } from "@/features/admin/profile/hooks/use-admin-profile";
import { PROFILE_LOAD_FAILED } from "@/features/admin/profile/services/profile.service";
import { ProfileForm } from "@/features/admin/profile/components/profile-form";
import { ProfileSkeleton } from "@/features/admin/profile/components/profile-skeleton";
import { useRouter } from "@/i18n/navigation";
import { ApiRequestError } from "@/lib/api/browser-client";

export function AdminProfilePanel() {
  const t = useTranslations("admin.profile");
  const router = useRouter();
  const profileQuery = useAdminProfile();

  const unauthorized =
    profileQuery.error instanceof ApiRequestError &&
    profileQuery.error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace(APP_ROUTES.admin.login);
  }, [router, unauthorized]);

  if (profileQuery.isPending) return <ProfileSkeleton />;

  if (profileQuery.error) {
    if (unauthorized) return <ProfileSkeleton />;

    return (
      <div className="glass rounded-[26px] p-8 text-center">
        <h2 className="text-lg font-extrabold text-[#2D3B42]">
          {t("loadError")}
        </h2>
        <p className="mt-2 text-sm font-semibold text-[#8A7768]">
          {profileQuery.error.message === PROFILE_LOAD_FAILED
            ? t("loadFailed")
            : profileQuery.error.message}
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="mt-5 rounded-xl bg-[#2D3B42] px-4 py-2.5 text-sm font-extrabold text-white"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <ProfileForm
      key={profileQuery.data.updatedAt}
      profile={profileQuery.data}
    />
  );
}
