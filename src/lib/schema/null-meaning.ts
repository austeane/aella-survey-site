import type { CaveatKey } from "./caveats";

export type NullMeaning = "GATED" | "LATE_ADDED" | "NOT_APPLICABLE" | "UNKNOWN";

const NOT_APPLICABLE_PATTERNS: RegExp[] = [
  /pregnan/i,
  /menstru/i,
  /period/i,
  /erection/i,
  /penis/i,
  /vagina/i,
  /prostate/i,
  /breastfeed/i,
  /bio ?male/i,
  /bio ?female/i,
  /cis ?male/i,
  /cis ?female/i,
];

export function inferNullMeaning(columnName: string, nullRatio: number, caveatKeys: CaveatKey[]): NullMeaning {
  if (caveatKeys.includes("late_added_questions")) {
    return "LATE_ADDED";
  }

  if (
    caveatKeys.includes("gated_missingness") &&
    nullRatio > 0.3
  ) {
    return "GATED";
  }

  if (nullRatio > 0.15 && NOT_APPLICABLE_PATTERNS.some((pattern) => pattern.test(columnName))) {
    return "NOT_APPLICABLE";
  }

  return "UNKNOWN";
}
