export function IpWhitelistSkeleton() {
  return (
    <section className="space-y-4 animate-pulse">
      {/* Filters skeleton */}
      <div className="glass rounded-[26px] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 rounded-xl bg-[#2D3B42]/10" />
          <div className="h-10 w-44 rounded-xl bg-[#2D3B42]/10" />
          <div className="h-10 w-36 rounded-xl bg-[#2D3B42]/10" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="glass overflow-hidden rounded-[26px]">
        <div className="p-4 border-b border-[#2D3B42]/5">
          <div className="h-6 w-40 rounded bg-[#2D3B42]/10" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-10 w-36 rounded-lg bg-[#2D3B42]/10" />
              <div className="h-10 flex-1 rounded-lg bg-[#2D3B42]/5" />
              <div className="h-10 w-32 rounded-lg bg-[#2D3B42]/5" />
              <div className="h-10 w-24 rounded-lg bg-[#2D3B42]/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
