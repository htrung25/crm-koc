import type { SocialPlatform } from '../types';

const PLATFORM_STYLES: Record<
  SocialPlatform,
  { bg: string; text: string; label: string }
> = {
  TikTok: {
    bg: 'bg-[#121212]',
    text: 'text-white',
    label: 'TikTok',
  },
  Instagram: {
    bg: 'bg-gradient-to-r from-[#D62976] via-[#E1306C] to-[#F77737]',
    text: 'text-white',
    label: 'Instagram',
  },
  YouTube: {
    bg: 'bg-[#FF0000]',
    text: 'text-white',
    label: 'YouTube',
  },
  Facebook: {
    bg: 'bg-[#1877F2]',
    text: 'text-white',
    label: 'Facebook',
  },
};

export function KocPlatformBadge({
  platform,
  count,
}: {
  platform: SocialPlatform;
  count: string;
}) {
  const conf = PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.TikTok;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold shadow-xs transition-transform hover:scale-105 ${conf.bg} ${conf.text}`}
    >
      <span>{conf.label}</span>
      <span className="opacity-95">{count}</span>
    </span>
  );
}
