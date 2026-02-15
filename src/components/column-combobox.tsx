import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getColumnDisplayName, stripHashSuffix } from "@/lib/format-labels";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

interface ColumnOption {
  name: string;
  displayName?: string;
}

interface ColumnComboboxProps {
  columns: ColumnOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeNoneOption?: boolean;
  noneOptionLabel?: string;
  className?: string;
}

interface ResolvedOption {
  value: string;
  displayName: string;
  secondary: string | null;
}

export function ColumnCombobox({
  columns,
  value,
  onValueChange,
  placeholder = "Select a column",
  disabled = false,
  includeNoneOption = false,
  noneOptionLabel = "None",
  className,
}: ColumnComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const options = useMemo<ResolvedOption[]>(() => {
    const mapped = columns.map((column) => ({
      value: column.name,
      displayName: getColumnDisplayName(column),
      secondary: stripHashSuffix(column.name),
    }));

    if (!includeNoneOption) {
      return mapped;
    }

    return [{ value: "", displayName: noneOptionLabel, secondary: null }, ...mapped];
  }, [columns, includeNoneOption, noneOptionLabel]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) => {
      const secondary = option.secondary?.toLowerCase() ?? "";
      return option.displayName.toLowerCase().includes(term) || secondary.includes(term);
    });
  }, [options, query]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setHighlightedIndex((current) =>
      filteredOptions.length === 0 ? 0 : Math.max(0, Math.min(current, filteredOptions.length - 1)),
    );
  }, [filteredOptions]);

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  const pick = (nextValue: string) => {
    onValueChange(nextValue);
    closeMenu();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        className="flex min-h-9 w-full items-center justify-between border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-2 text-[0.8rem] font-['JetBrains_Mono',ui-monospace,monospace] leading-[1.4] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className={selectedOption ? "text-[var(--ink)]" : "text-[var(--ink-faded)]"}>
          {selectedOption ? selectedOption.displayName : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full border border-[var(--rule)] bg-[var(--paper)] p-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search columns..."
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex((current) =>
                  filteredOptions.length === 0 ? 0 : Math.min(current + 1, filteredOptions.length - 1),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((current) =>
                  filteredOptions.length === 0 ? 0 : Math.max(current - 1, 0),
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                const option = filteredOptions[highlightedIndex];
                if (option) {
                  pick(option.value);
                }
              } else if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
              }
            }}
          />

          <div className="mt-2 max-h-72 overflow-y-auto border border-[var(--rule-light)] bg-[var(--paper)]">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-[0.72rem] text-[var(--ink-faded)]">No matching columns</p>
            ) : (
              <div>
                {filteredOptions.map((option, index) => {
                  const active = index === highlightedIndex;
                  const selected = option.value === value;

                  return (
                    <button
                      key={`${option.value || "__none__"}-${index}`}
                      type="button"
                      className={cn(
                        "w-full border-b border-[var(--rule-light)] px-2 py-1.5 text-left last:border-b-0",
                        active ? "bg-[var(--paper-warm)]" : "bg-transparent",
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => pick(option.value)}
                    >
                      <p className="text-[0.8rem] font-['Source_Serif_4',Georgia,serif] text-[var(--ink)]">
                        {option.displayName}
                        {selected ? "  *" : ""}
                      </p>
                      {option.secondary ? (
                        <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[0.68rem] text-[var(--ink-faded)]">
                          {option.secondary}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
