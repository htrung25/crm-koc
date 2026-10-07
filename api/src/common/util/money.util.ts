// "1234.5" → 123450n. Chuỗi đầu vào phải đã qua regex tiền (≤ 2 chữ số thập phân)
export function toCents(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

// 123450n → "1234.50", đúng định dạng numeric(15,2) Postgres trả về
export function fromCents(cents: bigint): string {
  const sign = cents < 0n ? '-' : '';
  const abs = cents < 0n ? -cents : cents;
  return `${sign}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}

//Phí theo phần trăm, làm tròn nửa lên tới xu. 2.5% → 250 phần vạn.
export function percentOf(cents: bigint, percent: number): bigint {
  const basisPoints = BigInt(Math.round(percent * 100));
  return (cents * basisPoints + 5000n) / 10000n;
}
