export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "S/. 0.00";
  return `S/. ${(cents / 100).toFixed(2)}`;
}
