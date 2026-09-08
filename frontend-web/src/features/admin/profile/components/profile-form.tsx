'use client';

import { APP_ROUTES } from '@/constants/routes';
import { useLocale, useTranslations } from 'next-intl';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';

import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import {
  IconCalendar,
  IconCamera,
  IconShield,
  IconUser,
} from '@/components/ui/icons';
import {
  useUpdateAdminProfile,
  useUploadAdminAvatar,
} from '@/features/admin/profile/hooks/use-admin-profile';
import type { AdminProfile } from '@/features/admin/profile/types';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/lib/api/browser-client';

const fieldClass =
  'mt-2 h-11 w-full rounded-xl bg-white/65 px-3.5 text-sm font-semibold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 transition-shadow placeholder:text-[#A89685] focus:ring-2 focus:ring-[#EF4623]/35 disabled:cursor-not-allowed disabled:opacity-60';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

function initials(name: string | null, locale: string) {
  const parts = (name ?? 'Admin').trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0]?.toLocaleUpperCase(locale))
    .join('');
}

function formatUpdatedAt(value: string, locale: string, fallback: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

export function ProfileForm({ profile }: { profile: AdminProfile }) {
  const t = useTranslations('admin.profile');
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name ?? '');
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [timezone, setTimezone] = useState(profile.timezone);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useUpdateAdminProfile({
    onMutate: () => {
      setMessage(null);
      setFormError(null);
    },
    onSuccess: (updated) => {
      setName(updated.name ?? '');
      setEmail(updated.email);
      setAvatarUrl(updated.avatarUrl ?? '');
      setTimezone(updated.timezone);
      setMessage(t('updated'));
      router.refresh();
    },
    onError: (failure) => {
      if (failure instanceof ApiRequestError && failure.status === 401) {
        router.replace(APP_ROUTES.admin.login);
        return;
      }
      setFormError(
        failure instanceof Error ? failure.message : t('updateFailed')
      );
    },
  });

  const uploadAvatarMutation = useUploadAdminAvatar({
    onMutate: () => {
      setMessage(null);
      setFormError(null);
    },
    onSuccess: (updated) => {
      setAvatarUrl(updated.avatarUrl ?? '');
      setMessage(t('avatarUploadSuccess'));
      router.refresh();
    },
    onError: (failure) => {
      if (failure instanceof ApiRequestError && failure.status === 401) {
        router.replace(APP_ROUTES.admin.login);
        return;
      }
      setFormError(
        failure instanceof Error ? failure.message : t('avatarUploadFailed')
      );
    },
  });

  const handleProcessFile = (file: File) => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setFormError(t('avatarTypeError'));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFormError(t('avatarSizeError'));
      return;
    }
    uploadAvatarMutation.mutate(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset file input để có thể chọn lại cùng một file nếu cần
    event.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const reset = () => {
    setName(profile.name ?? '');
    setEmail(profile.email);
    setAvatarUrl(profile.avatarUrl ?? '');
    setTimezone(profile.timezone);
    setMessage(null);
    setFormError(null);
  };

  const submit = () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length > 255) {
      setFormError(t('nameTooLong'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setFormError(t('invalidEmail'));
      return;
    }

    mutation.mutate({
      name: normalizedName || null,
      email: normalizedEmail,
      timezone,
    });
  };

  const dirty =
    name !== (profile.name ?? '') ||
    email !== profile.email ||
    timezone !== profile.timezone;

  return (
    <section className="grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="glass rounded-[26px] p-5 text-center sm:p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />

          <div
            className={`group relative mx-auto h-24 w-24 cursor-pointer rounded-[30px] transition-transform duration-200 hover:scale-[1.03] ${
              isDragging ? 'ring-4 ring-[#EF4623] scale-[1.05]' : ''
            }`}
            onClick={openFilePicker}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label={t('changeAvatar')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openFilePicker();
              }
            }}
          >
            {avatarUrl ? (
              <span
                role="img"
                aria-label={name || t('avatarAlt')}
                className="block h-24 w-24 rounded-[30px] bg-cover bg-center shadow-xl shadow-[#EF4623]/20 ring-4 ring-white/55"
                style={{
                  backgroundImage: `url("${avatarUrl.replaceAll('"', '%22')}")`,
                }}
              />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-[30px] bg-gradient-to-br from-[#EF4623] to-[#F49E4C] text-2xl font-extrabold text-white shadow-xl shadow-[#EF4623]/25">
                {initials(name, locale)}
              </span>
            )}

            {/* Hover / Uploading overlay */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center rounded-[30px] bg-black/50 text-white backdrop-blur-[2px] transition-opacity duration-200 ${
                uploadAvatarMutation.isPending
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {uploadAvatarMutation.isPending ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <IconCamera className="h-5 w-5 drop-shadow" />
                  <span className="mt-1 text-[10px] font-extrabold tracking-tight text-white drop-shadow">
                    {t('changeAvatar')}
                  </span>
                </>
              )}
            </div>

            <span
              aria-label={t('online')}
              className="absolute -bottom-1 -right-1 z-10 h-6 w-6 rounded-full border-4 border-[#FFF7F1] bg-emerald-500"
            />
          </div>

          <h2 className="mt-4 text-lg font-extrabold text-[#2D3B42]">
            {name.trim() || t('administrator')}
          </h2>
          <p className="mt-1 break-all text-xs font-semibold text-[#8A7768]">
            {email}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-[#EF4623]/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#D83B19]">
              Admin
            </span>
            <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
              {t('active')}
            </span>
          </div>

          {/* Hint */}
          <div className="mt-5 border-t border-[#2D3B42]/10 pt-3.5">
            <p className="text-center text-[10px] font-semibold leading-relaxed text-[#A89685]">
              {t('avatarHint')}
            </p>
          </div>
        </div>

        <div className="glass rounded-[26px] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
              <IconShield className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#2D3B42]">
                {t('accountInfo')}
              </h3>
              <p className="text-[11px] font-semibold text-[#8A7768]">
                {t('accountInfoHint')}
              </p>
            </div>
          </div>

          <dl className="mt-4 space-y-3 border-t border-[#2D3B42]/10 pt-4">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A7768]">
                Account ID
              </dt>
              <dd className="mt-1 break-all font-mono text-[10px] font-bold text-[#2D3B42]">
                {profile.accountId}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <dt className="font-semibold text-[#8A7768]">
                {t('lastUpdated')}
              </dt>
              <dd className="text-right font-extrabold text-[#2D3B42]">
                {formatUpdatedAt(profile.updatedAt, locale, t('unknown'))}
              </dd>
            </div>
          </dl>
        </div>
      </aside>

      <div className="space-y-4">
        <div className="glass rounded-[26px] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EF4623]/12 text-[#EF4623]">
              <IconUser className="h-[19px] w-[19px]" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
                {t('personalInfo')}
              </h2>
              <p className="text-xs font-semibold text-[#8A7768]">
                {t('personalInfoHint')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t('fullName')}
              <input
                value={name}
                maxLength={255}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-extrabold text-[#5C5049]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <div className="glass rounded-[26px] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2D3B42]/8 text-[#5C5049]">
              <IconCalendar className="h-[19px] w-[19px]" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
                {t('regionTime')}
              </h2>
              <p className="text-xs font-semibold text-[#8A7768]">
                {t('regionTimeHint')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t('timezone')}
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className={fieldClass}
              >
                <option value="Asia/Ho_Chi_Minh">
                  Asia/Ho_Chi_Minh (GMT+7)
                </option>
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </label>
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t('language')}
              <LocaleSwitcher className={fieldClass} />
            </label>
          </div>
        </div>

        {(formError || message) && (
          <div
            role="status"
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              formError
                ? 'bg-red-500/10 text-red-700'
                : 'bg-emerald-500/12 text-emerald-700'
            }`}
          >
            {formError ?? message}
          </div>
        )}

        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[26px] p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-extrabold text-[#2D3B42]">
              {t('updateProfile')}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#8A7768]">
              {t('updateHint')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!dirty || mutation.isPending}
              onClick={reset}
              className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#5C5049] hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('discard')}
            </button>
            <button
              type="button"
              disabled={!dirty || mutation.isPending}
              onClick={submit}
              className="rounded-xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {mutation.isPending ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
