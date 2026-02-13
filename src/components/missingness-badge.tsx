import type { NullMeaning } from "@/lib/schema/null-meaning";
import { Badge } from "@/components/ui/badge";

interface MissingnessBadgeProps {
  meaning: NullMeaning | undefined;
}

const LABELS: Record<NullMeaning, string> = {
  GATED: "Gated",
  LATE_ADDED: "Late Added",
  NOT_APPLICABLE: "N/A",
  UNKNOWN: "Unknown",
};

export function MissingnessBadge({ meaning }: MissingnessBadgeProps) {
  const resolved = meaning ?? "UNKNOWN";
  const variant =
    resolved === "GATED"
      ? "accent"
      : resolved === "LATE_ADDED"
        ? "warm"
        : resolved === "NOT_APPLICABLE"
          ? "cool"
          : "default";

  return <Badge variant={variant}>{LABELS[resolved]}</Badge>;
}
