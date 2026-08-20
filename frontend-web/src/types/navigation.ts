/** Một mục điều hướng trong sidebar/topbar. Dùng chung cho mọi workspace. */
export type NavigationItem = {
  labelKey: string;
  href: string;
  disabled?: boolean;
  iconName?: string;
};
