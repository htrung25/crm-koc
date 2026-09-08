export function AuditLogSkeleton() {
  return (
    <section className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 rounded-xl bg-[#2D3B42]/10" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-[#2D3B42]/5" />
      </div>

      {/* Filters skeleton */}
      <div className="glass rounded-[26px] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 flex-1 min-w-[200px] rounded-xl bg-[#2D3B42]/10" />
          <div className="h-10 w-36 rounded-xl bg-[#2D3B42]/10" />
          <div className="h-10 w-36 rounded-xl bg-[#2D3B42]/10" />
          <div className="h-10 w-24 rounded-xl bg-[#2D3B42]/10" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="glass overflow-hidden rounded-[26px]">
        <div className="p-4 border-b border-[#2D3B42]/5">
          <div className="h-6 w-32 rounded bg-[#2D3B42]/10" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-10 w-28 rounded-lg bg-[#2D3B42]/10" />
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
