import type { BrandItem } from "./types";
import { MOCK_KOCS } from "./kocs";

export const MOCK_BRANDS: BrandItem[] = [
  {
    id: 1,
    name: "Sunplay Vietnam",
    initials: "SV",
    bg: "from-[#FFB020] to-[#FF7A59]",
    category: "beauty",
    industryVi: "Mỹ phẩm & Chăm sóc da",
    industryEn: "Cosmetics & Skincare",
    campaignCount: 8,
    kocCount: 36,
    budget: "₫1.2B",
    status: "active",
    statusStyle: "violet",
    statusLabelVi: "Đang hợp tác",
    statusLabelEn: "Active Partner",
    campaigns: [
      {
        nameVi: "Môi xinh đón hè 2026",
        nameEn: "Summer Lips 2026",
        period: "01/05 - 30/06/2026",
        revenue: "₫450M",
        status: "active",
        statusStyle: "violet",
        statusLabelVi: "Đang chạy",
        statusLabelEn: "Running"
      },
      {
        nameVi: "Sunscreen Review Spree",
        nameEn: "Sunscreen Review Spree",
        period: "15/03 - 15/04/2026",
        revenue: "₫320M",
        status: "paused",
        statusStyle: "gray",
        statusLabelVi: "Đã kết thúc",
        statusLabelEn: "Completed"
      }
    ],
    kocList: [MOCK_KOCS[0], MOCK_KOCS[2]],
    avgEngage: "5.6%"
  },
  {
    id: 2,
    name: "Anker Tech",
    initials: "AT",
    bg: "from-[#6C4CF1] to-[#3BC9F5]",
    category: "tech",
    industryVi: "Phụ kiện & Đồ công nghệ",
    industryEn: "Tech Accessories",
    campaignCount: 5,
    kocCount: 22,
    budget: "₫850M",
    status: "active",
    statusStyle: "violet",
    statusLabelVi: "Đang hợp tác",
    statusLabelEn: "Active Partner",
    campaigns: [
      {
        nameVi: "Sạc nhanh GaN Prime 2026",
        nameEn: "Fast Charging GaN Prime",
        period: "10/04 - 10/05/2026",
        revenue: "₫280M",
        status: "active",
        statusStyle: "violet",
        statusLabelVi: "Đang chạy",
        statusLabelEn: "Running"
      }
    ],
    kocList: [MOCK_KOCS[1]],
    avgEngage: "4.2%"
  },
  {
    id: 3,
    name: "Coolmate Casual",
    initials: "CC",
    bg: "from-[#16D3B0] to-[#6C4CF1]",
    category: "fashion",
    industryVi: "Thời trang nam ứng dụng",
    industryEn: "Men's Apparel",
    campaignCount: 12,
    kocCount: 54,
    budget: "₫2.4B",
    status: "active",
    statusStyle: "violet",
    statusLabelVi: "Đang hợp tác",
    statusLabelEn: "Active Partner",
    campaigns: [
      {
        nameVi: "BST Hè Năng Động",
        nameEn: "Dynamic Summer Collection",
        period: "01/06 - 31/07/2026",
        revenue: "₫780M",
        status: "active",
        statusStyle: "violet",
        statusLabelVi: "Đang chạy",
        statusLabelEn: "Running"
      }
    ],
    kocList: [MOCK_KOCS[1], MOCK_KOCS[3]],
    avgEngage: "6.8%"
  }
];
