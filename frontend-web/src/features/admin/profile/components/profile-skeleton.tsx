export function ProfileSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
      <div className="glass h-[390px] rounded-[26px]" />
      <div className="space-y-4">
        <div className="glass h-[310px] rounded-[26px]" />
        <div className="glass h-[220px] rounded-[26px]" />
      </div>
    </div>
  );
}

