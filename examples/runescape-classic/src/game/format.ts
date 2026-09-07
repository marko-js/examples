/** Number formatting shared by the panels. */
export function formatCount(count: number): string {
  if (count < 100_000) return String(count);
  if (count < 10_000_000) return `${Math.floor(count / 1000)}K`;
  return `${Math.floor(count / 1_000_000)}M`;
}

export function formatXp(xp: number): string {
  return xp.toLocaleString("en-US");
}
