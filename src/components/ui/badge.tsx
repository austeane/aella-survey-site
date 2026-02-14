import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.07em] font-['JetBrains_Mono',ui-monospace,monospace] rounded-none",
  {
    variants: {
      variant: {
        default: "border-[var(--rule)] text-[var(--ink-faded)] bg-[var(--paper)]",
        accent: "border-[var(--accent)] text-[var(--accent)] bg-[var(--paper)]",
        warm: "border-[#8f5a2b] text-[#8f5a2b] bg-[var(--paper)]",
        cool: "border-[#6b6259] text-[#6b6259] bg-[var(--paper)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
