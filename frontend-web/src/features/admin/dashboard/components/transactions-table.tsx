import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import type { TransactionsData, TransactionStatus } from "@/features/admin/dashboard/types";

const STATUS_STYLE: Record<TransactionStatus, string> = {
  completed: "bg-emerald-500/12 text-emerald-700",
  processing: "bg-amber-500/14 text-amber-700",
  pending: "bg-rose-500/12 text-rose-600",
};

export async function TransactionsTable({ data }: { data: TransactionsData }) {
  const t = await getTranslations("admin.transactions");

  return (
    <section className="rounded-[26px] glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
            {data.title}
          </h2>
          <p className="text-xs font-medium text-[#8A7768]">{data.caption}</p>
        </div>

        <Link
          href={data.viewAllHref}
          className="text-xs font-extrabold text-[#EF4623] transition-opacity hover:opacity-70"
        >
          {t("viewAll")}
        </Link>
      </div>

      {/* Bảng cuộn ngang thay vì bóp cột khi màn hẹp */}
      <div className="-mx-2 mt-4 overflow-x-auto px-2">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A7768]">
              <th scope="col" className="pb-3 pr-3 font-bold">{data.subjectLabel}</th>
              <th scope="col" className="pb-3 pr-3 font-bold">{t("colCampaign")}</th>
              <th scope="col" className="pb-3 pr-3 font-bold">{t("colDate")}</th>
              <th scope="col" className="pb-3 pr-3 font-bold">{t("colStatus")}</th>
              <th scope="col" className="pb-3 text-right font-bold">{data.amountLabel}</th>
            </tr>
          </thead>

          <tbody>
            {data.items.map((tx) => {
              const statusClass = STATUS_STYLE[tx.status];

              return (
                <tr
                  key={tx.id}
                  className="border-t border-white/70 transition-colors hover:bg-white/40"
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#EF4623]/85 to-[#F49E4C]/85 text-[11px] font-extrabold text-white"
                      >
                        {tx.initials}
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-bold text-[#2D3B42]">
                          {tx.name}
                        </span>
                        <span className="block text-[11px] font-medium text-[#8A7768]">
                          {tx.email}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className="py-3 pr-3 text-sm font-semibold text-[#5C5049]">
                    {tx.campaign}
                  </td>

                  <td className="py-3 pr-3 font-mono text-xs font-medium text-[#5C5049] tnum">
                    {tx.date}
                  </td>

                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}
                    >
                      {t(`status.${tx.status}`)}
                    </span>
                  </td>

                  <td className="py-3 text-right font-mono text-sm font-bold text-[#2D3B42] tnum">
                    {tx.amount}₫
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
