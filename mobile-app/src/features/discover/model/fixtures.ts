export const categories = ['all', 'beauty', 'fashion', 'tech', 'home'] as const;
export type Category = (typeof categories)[number];
export type Campaign = {
  id: string;
  titleKey: string;
  brand: string;
  category: Category;
  commission: number;
  status: 'open' | 'soon';
  tone: 'peach' | 'sand';
};
export const campaigns: Campaign[] = [
  {
    id: 'skincare',
    titleKey: 'redsun.campaigns.skincare',
    brand: 'Lemonade Cosmetics',
    category: 'beauty',
    commission: 18,
    status: 'open',
    tone: 'peach',
  },
  {
    id: 'accessories',
    titleKey: 'redsun.campaigns.accessories',
    brand: 'Baseus Vietnam',
    category: 'tech',
    commission: 12,
    status: 'soon',
    tone: 'sand',
  },
];
export const creators = [
  {
    id: 'an',
    name: 'An Nhiên Beauty',
    initial: 'A',
    platform: 'TikTok · 850K Followers',
    gmv: 340000000,
    color: 'primary',
    category: 'beauty',
  },
  {
    id: 'minh',
    name: 'Minh Review Tech',
    initial: 'M',
    platform: 'YouTube · 420K Subs',
    gmv: 210000000,
    color: 'blue',
    category: 'tech',
  },
  {
    id: 'ha',
    name: 'Hà Linh Skincare',
    initial: 'H',
    platform: 'TikTok Live · Review',
    gmv: 1200000000,
    color: 'purple',
    category: 'beauty',
  },
] as const;
export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase()
    .trim();
}
