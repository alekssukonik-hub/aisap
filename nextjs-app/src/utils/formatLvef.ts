export function formatLvef(value: number | null): string {
  if (value === null) return "—";
  // Mock data uses integer percentages.
  return `${value.toFixed(0)}%`;
}

