export const MIN_CELL_COUNT = 10;

export function shouldSuppressCell(count: number, threshold = MIN_CELL_COUNT): boolean {
  return count > 0 && count < threshold;
}

export function safePercentage(
  numerator: number,
  denominator: number,
  threshold = MIN_CELL_COUNT,
): number | null {
  if (denominator <= 0) return null;
  if (shouldSuppressCell(numerator, threshold)) return null;
  return (numerator / denominator) * 100;
}
