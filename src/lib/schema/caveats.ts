export type CaveatKey =
  | "binned_or_collapsed"
  | "combined_or_merged"
  | "computed_column"
  | "gated_missingness"
  | "late_added_questions";

export interface CaveatDefinition {
  key: CaveatKey;
  title: string;
  description: string;
  guidance: string;
}

export const CAVEAT_DEFINITIONS: Record<CaveatKey, CaveatDefinition> = {
  binned_or_collapsed: {
    key: "binned_or_collapsed",
    title: "Binned or Collapsed",
    description:
      "This value was collapsed from a finer-grained original survey scale during data cleaning.",
    guidance:
      "Interpret as broad buckets, not the full original response distribution.",
  },
  combined_or_merged: {
    key: "combined_or_merged",
    title: "Combined or Merged",
    description:
      "This column combines multiple source questions or categories into one derived field.",
    guidance:
      "Use caution when comparing to the original GT survey wording.",
  },
  computed_column: {
    key: "computed_column",
    title: "Computed",
    description:
      "This value is algorithmically computed (average/total/derived score), not a direct survey answer.",
    guidance:
      "Treat as a modelled score rather than a literal response option.",
  },
  gated_missingness: {
    key: "gated_missingness",
    title: "Gated Missingness",
    description:
      "Many questions are shown only after prerequisite answers. Missing values may be structural, not random.",
    guidance:
      "When domain-appropriate, consider NA as implicit zero or not-applicable rather than unknown.",
  },
  late_added_questions: {
    key: "late_added_questions",
    title: "Late-Added Questions",
    description:
      "Some questions were added later in survey history, which can create cohort-related missingness.",
    guidance:
      "Compare missingness rates before assuming behavioral differences.",
  },
};

export const GLOBAL_CAVEAT_KEYS: CaveatKey[] = ["gated_missingness", "late_added_questions"];

const COLUMN_CAVEAT_PATTERNS: Array<{ pattern: RegExp; keys: CaveatKey[] }> = [
  { pattern: /^politics$/i, keys: ["binned_or_collapsed"] },
  { pattern: /^bmi$/i, keys: ["binned_or_collapsed"] },
  { pattern: /^straightness$/i, keys: ["binned_or_collapsed", "computed_column"] },
  { pattern: /^sexcount$/i, keys: ["binned_or_collapsed"] },
  {
    pattern: /How "sexually liberated" was your upbringing\? \(fs700v2\)/i,
    keys: ["binned_or_collapsed"],
  },
  { pattern: /^childhood_adversity$/i, keys: ["combined_or_merged"] },
  { pattern: /^childhood_gender_tolerance$/i, keys: ["combined_or_merged"] },
  { pattern: /^TotalMentalIllness$/i, keys: ["combined_or_merged"] },
  {
    pattern: /preferred relationship style.*\(4jib23m\)/i,
    keys: ["combined_or_merged"],
  },
  {
    pattern:
      /(opennessvariable|consciensiousnessvariable|extroversionvariable|neuroticismvariable|agreeablenessvariable|powerlessnessvariable|totalfetishcategory|bondageaverage)/i,
    keys: ["computed_column"],
  },
  {
    pattern: /^Total[A-Za-z0-9_]+/,
    keys: ["computed_column"],
  },
];

function dedupe(keys: CaveatKey[]): CaveatKey[] {
  return [...new Set(keys)];
}

export function getCaveatKeysForColumn(columnName: string): CaveatKey[] {
  const specific = COLUMN_CAVEAT_PATTERNS.flatMap((entry) =>
    entry.pattern.test(columnName) ? entry.keys : [],
  );

  return dedupe([...specific, ...GLOBAL_CAVEAT_KEYS]);
}

export function getCaveatsForColumn(columnName: string): CaveatDefinition[] {
  return getCaveatKeysForColumn(columnName).map((key) => CAVEAT_DEFINITIONS[key]);
}

export function getGlobalCaveats(): CaveatDefinition[] {
  return GLOBAL_CAVEAT_KEYS.map((key) => CAVEAT_DEFINITIONS[key]);
}

export function formatCaveatHint(columnName: string): string {
  const keys = getCaveatKeysForColumn(columnName);
  if (keys.length === 0) {
    return "No caveats.";
  }

  return keys.map((key) => CAVEAT_DEFINITIONS[key].title).join(", ");
}
