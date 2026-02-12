import { describe, expect, it } from "vitest";

import { formatCaveatHint, getCaveatKeysForColumn } from "./caveats";

describe("getCaveatKeysForColumn", () => {
  it("includes specific caveats for known modified columns", () => {
    const keys = getCaveatKeysForColumn("politics");
    expect(keys).toContain("binned_or_collapsed");
    expect(keys).toContain("gated_missingness");
  });

  it("always includes global caveats", () => {
    const keys = getCaveatKeysForColumn("some_unknown_column");
    expect(keys).toContain("gated_missingness");
    expect(keys).toContain("late_added_questions");
  });
});

describe("formatCaveatHint", () => {
  it("returns human-readable titles", () => {
    expect(formatCaveatHint("sexcount")).toContain("Binned or Collapsed");
  });
});
