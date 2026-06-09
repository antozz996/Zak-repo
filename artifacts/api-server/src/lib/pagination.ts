export function parseLimit(value: string | undefined, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function parseOffset(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}
