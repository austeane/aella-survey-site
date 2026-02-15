const Z_95 = 1.959963984540054;

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Wilson score 95% CI for a proportion */
export function wilsonCI(successes: number, n: number): ConfidenceInterval {
  if (!Number.isFinite(n) || n <= 0) {
    return { lower: 0, upper: 1 };
  }

  const p = clamp01(successes / n);
  const z2 = Z_95 ** 2;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = Z_95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  return {
    lower: clamp01((center - margin) / denom),
    upper: clamp01((center + margin) / denom),
  };
}

/**
 * Approximate 95% CI for median using asymptotic normal approximation.
 * We use sd / sqrt(n) with a wider multiplier to avoid false precision.
 */
export function medianCI(sd: number, n: number, median = 0): ConfidenceInterval {
  if (!Number.isFinite(n) || n <= 1 || !Number.isFinite(sd)) {
    return { lower: median, upper: median };
  }

  const se = (1.2533 * sd) / Math.sqrt(n);
  const margin = Z_95 * se;
  return {
    lower: median - margin,
    upper: median + margin,
  };
}

/** Reliability score: sigmoid mapping N to 0-1 */
export function reliabilityScore(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;

  const midpoint = 50;
  const steepness = 0.033;
  const raw = 1 / (1 + Math.exp(-steepness * (n - midpoint)));
  return Math.max(0, Math.min(1, raw));
}

export type ConfidenceLabel =
  | "high confidence"
  | "good"
  | "approximate"
  | "exploratory"
  | "too few";

/** Visual style derived from reliability */
export function getConfidenceStyle(n: number): {
  opacity: number;
  dashArray: string;
  ciMultiplier: number;
  label: ConfidenceLabel;
} {
  if (n < 20) {
    return {
      opacity: 0.3,
      dashArray: "2 4",
      ciMultiplier: 8,
      label: "too few",
    };
  }

  if (n < 40) {
    return {
      opacity: 0.45,
      dashArray: "4 4",
      ciMultiplier: 5,
      label: "exploratory",
    };
  }

  if (n < 80) {
    return {
      opacity: 0.62,
      dashArray: "6 3",
      ciMultiplier: 3,
      label: "approximate",
    };
  }

  if (n < 150) {
    return {
      opacity: 0.82,
      dashArray: "",
      ciMultiplier: 1.7,
      label: "good",
    };
  }

  return {
    opacity: 1,
    dashArray: "",
    ciMultiplier: 1,
    label: "high confidence",
  };
}

export function cohenD(
  meanA: number,
  sdA: number,
  nA: number,
  meanB: number,
  sdB: number,
  nB: number,
): number {
  if (nA < 2 || nB < 2) return 0;
  const pooledNumerator = (nA - 1) * sdA * sdA + (nB - 1) * sdB * sdB;
  const pooledDenominator = nA + nB - 2;
  if (pooledDenominator <= 0) return 0;

  const pooledVariance = pooledNumerator / pooledDenominator;
  if (!Number.isFinite(pooledVariance) || pooledVariance <= 0) return 0;

  const pooledSd = Math.sqrt(pooledVariance);
  return (meanA - meanB) / pooledSd;
}
