/**
 * Icon inline SVG cho khu vực admin.
 *
 * Cố tình không dùng icon font / thư viện tải bất đồng bộ: icon nằm thẳng
 * trong markup nên không bao giờ có khoảnh khắc ô trống lúc tải trang.
 */

type IconProps = {
  className?: string;
};

const base = "h-[18px] w-[18px]";

function Svg({
  className = base,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 20v-1.6a4 4 0 0 0-4-4H6.4a4 4 0 0 0-4 4V20" />
      <circle cx="9.2" cy="7.2" r="3.2" />
      <path d="M21.6 20v-1.6a4 4 0 0 0-3-3.87" />
      <path d="M15.6 4.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" />
      <path d="M14 10h4a2 2 0 0 1 2 2v9" />
      <path d="M2 21h20" />
      <path d="M7.5 8h3M7.5 12h3M7.5 16h3M17 14h.01M17 17.5h.01" />
    </Svg>
  );
}

export function IconMegaphone(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 11 15-6.5v15L3 13z" />
      <path d="M3 11H2.5a1.5 1.5 0 0 0 0 3H3z" />
      <path d="M7.5 14.5V19a1.5 1.5 0 0 0 3 0v-3.7" />
      <path d="M21 9.5v5" />
    </Svg>
  );
}

export function IconFileCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m9 15 2 2 3.5-3.5" />
    </Svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="3" width="8" height="4" rx="1.4" />
      <path d="M16 5h1.6A1.4 1.4 0 0 1 19 6.4v13.2a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 19.6V6.4A1.4 1.4 0 0 1 6.4 5H8" />
      <path d="M8.5 12h7M8.5 16h4.5" />
    </Svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21h18" />
      <rect x="5" y="12" width="3.6" height="6" rx="1.2" />
      <rect x="10.2" y="8" width="3.6" height="10" rx="1.2" />
      <rect x="15.4" y="4.5" width="3.6" height="13.5" rx="1.2" />
    </Svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-2.72 1.13V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 3 15.1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.46V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.72 1.13l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9v0a1.6 1.6 0 0 0 1.46 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Svg>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.37c-.55.2-.9.74-.9 1.33v.4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2.4" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.4 7.4-2.4 7.4h16.8S18 14.6 18 8.6" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 7.5V6.4A1.4 1.4 0 0 0 18.6 5H5.4A1.4 1.4 0 0 0 4 6.4v11.2A1.4 1.4 0 0 0 5.4 19h13.2a1.4 1.4 0 0 0 1.4-1.4V16.5" />
      <path d="M21 9.5h-5a2.5 2.5 0 0 0 0 5h5z" />
    </Svg>
  );
}

export function IconTrendUp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5" />
      <path d="M15.5 5.5H21v5.5" />
    </Svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.4" />
    </Svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 4h2.6A2.4 2.4 0 0 1 20 6.4v11.2a2.4 2.4 0 0 1-2.4 2.4H15" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h9" />
    </Svg>
  );
}

/** Mũi tên nhỏ trong pill biến động — hướng phụ thuộc dấu của delta. */
export function IconDelta({
  up,
  className = "h-3 w-3",
}: IconProps & { up: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {up ? (
        <>
          <path d="M6 9.5V2.5" />
          <path d="M3 5.5 6 2.5l3 3" />
        </>
      ) : (
        <>
          <path d="M6 2.5v7" />
          <path d="M3 6.5 6 9.5l3-3" />
        </>
      )}
    </svg>
  );
}

export const NAV_ICONS = {
  dashboard: IconDashboard,
  users: IconUsers,
  building: IconBuilding,
  megaphone: IconMegaphone,
  fileCheck: IconFileCheck,
  clipboardList: IconClipboard,
  barChart: IconChart,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;
