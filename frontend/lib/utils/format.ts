export function formatFollowers(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}K`;
  }
  return count.toString();
}

export function formatCurrency(amountInMillions: number, locale: "vi" | "en" = "vi"): string {
  if (amountInMillions >= 1000) {
    const billion = amountInMillions / 1000;
    return locale === "vi" ? `${billion.toFixed(1)} tỷ ₫` : `$${billion.toFixed(1)}B`;
  }
  return locale === "vi" ? `${amountInMillions.toLocaleString()} tr ₫` : `$${amountInMillions}M`;
}
