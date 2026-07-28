export function PlatformBadge({ name }: { name: string }) {
  const style =
    name === "TikTok"
      ? "bg-[#111] text-white"
      : name === "Instagram"
        ? "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white"
        : "bg-[#FF0000] text-white";

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[10.5px] font-bold ${style}`}
    >
      {name}
    </span>
  );
}
