import { describe, expect, it } from "vitest";

import {
  CAVEAT_DEFINITIONS,
  GLOBAL_CAVEAT_KEYS,
  formatCaveatHint,
  getCaveatKeysForColumn,
  getCaveatsForColumn,
  getGlobalCaveats,
} from "./caveats";

describe("CAVEAT_DEFINITIONS", () => {
  it("every key maps to a definition with matching key field", () => {
    for (const [key, def] of Object.entries(CAVEAT_DEFINITIONS)) {
      expect(def.key).toBe(key);
      expect(def.title).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.guidance).toBeTruthy();
    }
  });
});

describe("getCaveatKeysForColumn - pattern matching", () => {
  it("detects binned_or_collapsed for bmi", () => {
    const keys = getCaveatKeysForColumn("bmi");
    expect(keys).toContain("binned_or_collapsed");
  });

  it("detects computed_column for straightness", () => {
    const keys = getCaveatKeysForColumn("straightness");
    expect(keys).toContain("computed_column");
    expect(keys).toContain("binned_or_collapsed");
  });

  it("detects combined_or_merged for childhood_adversity", () => {
    const keys = getCaveatKeysForColumn("childhood_adversity");
    expect(keys).toContain("combined_or_merged");
  });

  it("detects computed_column for Total-prefixed columns", () => {
    const keys = getCaveatKeysForColumn("TotalMentalIllness");
    expect(keys).toContain("combined_or_merged");
    expect(keys).toContain("computed_column");
  });

  it("detects computed_column for opennessvariable", () => {
    const keys = getCaveatKeysForColumn("opennessvariable");
    expect(keys).toContain("computed_column");
  });

  it("detects opaque_composite for whowears", () => {
    const keys = getCaveatKeysForColumn("whowears");
    expect(keys).toContain("opaque_composite");
  });

  it("detects negated_scale for exact and question-text vanilla columns", () => {
    const directKeys = getCaveatKeysForColumn("cunnilingus");
    expect(directKeys).toContain("negated_scale");

    const questionKeys = getCaveatKeysForColumn('"I find blowjobs:" (yuc275j)');
    expect(questionKeys).toContain("negated_scale");
  });

  it("deduplicates keys", () => {
    const keys = getCaveatKeysForColumn("TotalMentalIllness");
    const uniqueKeys = [...new Set(keys)];
    expect(keys).toEqual(uniqueKeys);
  });
});

describe("getCaveatsForColumn", () => {
  it("returns full definition objects", () => {
    const caveats = getCaveatsForColumn("politics");
    expect(caveats.length).toBeGreaterThan(0);
    for (const c of caveats) {
      expect(c.key).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.guidance).toBeTruthy();
    }
  });

  it("includes global caveats for any column", () => {
    const caveats = getCaveatsForColumn("random_column");
    const keys = caveats.map((c) => c.key);
    expect(keys).toContain("gated_missingness");
    expect(keys).toContain("late_added_questions");
  });
});

describe("getGlobalCaveats", () => {
  it("returns definitions for all global caveat keys", () => {
    const globals = getGlobalCaveats();
    expect(globals).toHaveLength(GLOBAL_CAVEAT_KEYS.length);
    for (const def of globals) {
      expect(GLOBAL_CAVEAT_KEYS).toContain(def.key);
    }
  });
});

describe("formatCaveatHint", () => {
  it("returns comma-separated titles for column with caveats", () => {
    const hint = formatCaveatHint("politics");
    expect(hint).toContain("Binned or Collapsed");
    expect(hint).toContain("Gated Missingness");
    expect(hint).toContain("Late-Added Questions");
  });

  it("includes global caveats for unknown columns", () => {
    const hint = formatCaveatHint("totally_unknown");
    expect(hint).toContain("Gated Missingness");
    expect(hint).toContain("Late-Added Questions");
  });

  it("includes computed for straightness", () => {
    const hint = formatCaveatHint("straightness");
    expect(hint).toContain("Computed");
  });
});
