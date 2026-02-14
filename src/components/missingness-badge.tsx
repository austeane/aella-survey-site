import type { NullMeaning } from "@/lib/schema/null-meaning";
import { Badge } from "@/components/ui/badge";

interface MissingnessBadgeProps {
  meaning: NullMeaning | undefined;
}

const LABELS: Record<NullMeaning, string> = {
  GATED: "Not shown to everyone",
  LATE_ADDED: "Added mid-survey",
  NOT_APPLICABLE: "N/A",
  UNKNOWN: "Unknown",
};

export function MissingnessBadge({ meaning }: MissingnessBadgeProps) {
  const resolved = meaning ?? "UNKNOWN";
  if (resolved === "UNKNOWN") {
    return null;
  }

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
