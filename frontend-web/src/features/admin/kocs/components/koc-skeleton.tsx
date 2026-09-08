export function KocSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-xl bg-white/60" />
          <div className="h-4 w-64 rounded-lg bg-white/40" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-2xl bg-white/60" />
          <div className="h-10 w-32 rounded-2xl bg-white/60" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full bg-white/60" />
        <div className="h-8 w-28 rounded-full bg-white/40" />
        <div className="h-8 w-24 rounded-full bg-white/40" />
        <div className="h-8 w-24 rounded-full bg-white/40" />
      </div>

      {/* Search Toolbar Skeleton */}
      <div className="glass h-24 rounded-[26px] p-5" />

      {/* Table Skeleton */}
      <div className="glass rounded-[26px] p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-[#2D3B42]/5 pb-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/60" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-white/60" />
                <div className="h-3 w-20 rounded bg-white/40" />
              </div>
            </div>
            <div className="h-5 w-32 rounded bg-white/50" />
            <div className="h-5 w-24 rounded bg-white/50" />
            <div className="h-5 w-16 rounded bg-white/50" />
            <div className="h-5 w-20 rounded-full bg-white/60" />
            <div className="h-8 w-20 rounded bg-white/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
