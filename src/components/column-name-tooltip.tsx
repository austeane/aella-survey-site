import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getColumnTooltip } from "@/lib/format-labels";

interface ColumnNameTooltipProps {
  column: { name: string; displayName?: string };
  children: ReactElement;
}

export function ColumnNameTooltip({ column, children }: ColumnNameTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{getColumnTooltip(column)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
