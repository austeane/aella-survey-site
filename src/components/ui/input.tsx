import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-2 text-[0.8rem] leading-[1.4] text-[var(--ink)] font-['JetBrains_Mono',ui-monospace,monospace] placeholder:text-[var(--ink-faded)] focus-visible:outline-none focus-visible:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 rounded-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
