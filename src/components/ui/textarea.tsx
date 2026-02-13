import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[0.8rem] leading-[1.4] text-[var(--ink)] font-['JetBrains_Mono',ui-monospace,monospace] placeholder:text-[var(--ink-faded)] focus-visible:outline-none focus-visible:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 rounded-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
