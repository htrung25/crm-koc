/** Preserve bigint counts and VND values instead of rounding through Number. */
export function formatCreatorMetric(
  value: string | number | null | undefined,
  locale: string
): string | null {
  if (value == null || value === '') return null;
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 });
  if (typeof value === 'string' && /^\d+$/.test(value))
    return formatter.format(BigInt(value));
  const number = Number(value);
  return Number.isFinite(number) ? formatter.format(number) : null;
}
export function safeProfileUrl(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
