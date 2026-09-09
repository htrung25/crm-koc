// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/vi.json';
import {
  CreatorProfileContent,
  KocDetailModal,
} from './components/koc-detail-modal';
import { creatorDetailSchema } from './creator-types';
import { formatCreatorMetric, safeProfileUrl } from './creator-format';
import { fetchCreator } from './services/creator.service';

const id = 'a4d71f34-4a5b-4f58-a8da-b702fb0a6b18';
const otherId = 'b4d71f34-4a5b-4f58-a8da-b702fb0a6b18';
const account = {
  id,
  name: 'Creator A',
  email: 'creator@example.test',
  phone: null,
  status: 2,
  createdAt: '2026-09-01T00:00:00Z',
};
const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
function wrapper(queryClient = client()) {
  return function TestProviders({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        NextIntlClientProvider,
        { locale: 'vi', messages, timeZone: 'UTC' },
        children
      )
    );
  };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Creator data contract', () => {
  it('accepts the current account-only response without inventing metrics', () => {
    const parsed = creatorDetailSchema.parse({
      ...account,
      accessToken: 'must-not-expose',
    });
    expect(parsed.statistics).toBeUndefined();
    expect(parsed).not.toHaveProperty('accessToken');
  });
  it('keeps missing values different from zero and preserves bigint money', () => {
    expect(formatCreatorMetric(null, 'vi')).toBeNull();
    expect(formatCreatorMetric('0', 'vi')).toBe('0');
    expect(formatCreatorMetric('9007199254740993', 'en')).toBe(
      '9,007,199,254,740,993'
    );
    expect(safeProfileUrl('javascript:alert(1)')).toBeUndefined();
  });
  it('requests the selected ID and history page, rejects a different Creator', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...account, id: otherId }), {
        status: 200,
      })
    );
    vi.stubGlobal('fetch', fetch);
    await expect(fetchCreator(id, 2)).rejects.toMatchObject({ status: 502 });
    expect(fetch.mock.calls[0][0]).toBe(
      `/api/admin/creators/${id}?historyPage=2&historyLimit=10`
    );
  });
});

describe('Creator profile read-only UI', () => {
  it('shows all requested sections for the current API without fake values or editing', () => {
    render(
      createElement(CreatorProfileContent, {
        creator: account,
        onHistoryPage: vi.fn(),
      }),
      { wrapper: wrapper() }
    );
    expect(screen.getByText('Creator A')).toBeTruthy();
    for (const title of [
      'Thông tin hồ sơ',
      'Chỉ số nền tảng',
      'Đánh giá từ thương hiệu',
      'Lịch sử chiến dịch',
    ])
      expect(
        screen.getAllByRole('heading', { name: title }).length
      ).toBeGreaterThan(0);
    expect(screen.getAllByText('Chưa có dữ liệu').length).toBeGreaterThan(3);
    expect(screen.queryByRole('button', { name: /sửa|xóa|thêm/i })).toBeNull();
  });
  it('renders platform metrics, completed revenue, brand review and campaign history', () => {
    const creator = creatorDetailSchema.parse({
      ...account,
      platforms: [
        {
          id: 'social-1',
          platform: 'tiktok',
          followerCount: '0',
          averageViews: '1200',
          totalLikes: null,
          engagementRate: '4.25',
        },
      ],
      statistics: {
        completedCampaigns: 2,
        totalRevenue: '9007199254740993',
        currency: 'VND',
      },
      brandReviews: {
        total: 1,
        averageRating: 4.5,
        data: [
          {
            id: 'review-1',
            brandName: 'Brand Red',
            rating: 4.5,
            comment: 'Nội dung chất lượng',
            createdAt: account.createdAt,
          },
        ],
      },
      campaignHistory: {
        data: [
          {
            id: 'collab-1',
            campaignId: 'campaign-1',
            campaignName: 'Chiến dịch mùa thu',
            brandName: 'Brand Red',
            revenue: '5000000',
            status: 4,
            startedAt: account.createdAt,
            completedAt: account.createdAt,
          },
        ],
        total: 11,
        page: 1,
        limit: 10,
        totalPages: 2,
      },
    });
    const onHistoryPage = vi.fn();
    render(createElement(CreatorProfileContent, { creator, onHistoryPage }), {
      wrapper: wrapper(),
    });
    const metrics = screen.getByRole('table', { name: 'Chỉ số nền tảng' });
    expect(within(metrics).getByText('0')).toBeTruthy();
    expect(within(metrics).getByText('4,25%')).toBeTruthy();
    expect(screen.getByText('9.007.199.254.740.993 VND')).toBeTruthy();
    expect(screen.getByText('Nội dung chất lượng')).toBeTruthy();
    expect(
      screen
        .getByRole('table', { name: 'Lịch sử chiến dịch' })
        .querySelectorAll('thead th')
    ).toHaveLength(5);
    screen.getByRole('button', { name: 'Trang sau' }).click();
    expect(onHistoryPage).toHaveBeenCalledWith(2);
  });
  it('does not display the previous Creator while the next ID is loading', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(account), { status: 200 })
      )
      .mockImplementationOnce(() => new Promise(() => {}));
    vi.stubGlobal('fetch', fetch);
    const view = render(
      createElement(KocDetailModal, {
        key: id,
        creatorId: id,
        onClose: vi.fn(),
      }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(screen.getByText('Creator A')).toBeTruthy());
    view.rerender(
      createElement(KocDetailModal, {
        key: otherId,
        creatorId: otherId,
        onClose: vi.fn(),
      })
    );
    expect(screen.queryByText('Creator A')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Đang tải');
  });
});
