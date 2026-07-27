const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const short = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export function formatWatts(value: number): string {
  if (!Number.isFinite(value)) return "0 W";
  const abs = Math.abs(value);
  if (abs >= 1e24) return `${short.format(value / 1e24)} YW`;
  if (abs >= 1e21) return `${short.format(value / 1e21)} ZW`;
  if (abs >= 1e18) return `${short.format(value / 1e18)} EW`;
  if (abs >= 1e15) return `${short.format(value / 1e15)} PW`;
  if (abs >= 1e12) return `${short.format(value / 1e12)} TW`;
  if (abs >= 1e9) return `${short.format(value / 1e9)} GW`;
  if (abs >= 1e6) return `${short.format(value / 1e6)} MW`;
  return `${whole.format(value)} W`;
}

export function formatMoney(value: number): string {
  return money.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number): string {
  return `${short.format((Number.isFinite(value) ? value : 0) * 100)}%`;
}

export function formatKsn(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e9 || magnitude < 1e-3) {
    return value.toExponential(3);
  }
  return short.format(value);
}

