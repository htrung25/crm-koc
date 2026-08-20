export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-[#1A1830]">
        {title}
      </h1>
      <p className="mt-[3px] text-sm font-medium text-[#9C99B0]">
        {description}
      </p>
    </div>
  );
}
