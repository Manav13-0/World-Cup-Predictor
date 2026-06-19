// import * as React from "react";
// import { cn } from "@/lib/utils";

// export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
//   ({ className, children, ...props }, ref) => (
//     <select
//       suppressHydrationWarning
//       ref={ref}
//       className={cn(
//         "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm backdrop-blur-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-violet-400/50",
//         className
//       )}
//       {...props}
//     >
//       {children}
//     </select>
//   )
// );
// Select.displayName = "Select";



"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

interface OptionData {
  value: string;
  label: string;
}

function parseOptions(children: React.ReactNode): OptionData[] {
  const options: OptionData[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === "option") {
      const props = child.props as { value?: string; children?: React.ReactNode };
      options.push({
        value: String(props.value ?? ""),
        label: String(props.children ?? ""),
      });
    }
  });
  return options;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, value, defaultValue, name, onChange, disabled }, ref) => {
    const options = parseOptions(children);
    const initialValue = value ?? defaultValue ?? options[0]?.value ?? "";
    const [selected, setSelected] = React.useState(initialValue);
    const [open, setOpen] = React.useState(false);
    const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => { setMounted(true); }, []);

    // Sync controlled value
    React.useEffect(() => {
      if (value !== undefined) setSelected(value);
    }, [value]);

    // Position the portal dropdown under the trigger
    React.useEffect(() => {
      if (!open || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }, [open]);

    // Close on outside click
    React.useEffect(() => {
      if (!open) return;
      function handleClick(e: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      }
      const id = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
      return () => {
        clearTimeout(id);
        document.removeEventListener("mousedown", handleClick);
      };
    }, [open]);

    const selectedLabel = options.find((o) => o.value === selected)?.label ?? "";

    function handleSelect(val: string) {
      setSelected(val);
      setOpen(false);
      onChange?.(val);
    }

    const dropdown = (
      <div style={dropdownStyle} ref={containerRef}>
        <ul
          className={cn(
            "overflow-hidden rounded-xl border border-white/10",
            "bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl shadow-black/60",
            "max-h-60 overflow-y-auto py-1"
          )}
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-100",
                  "hover:bg-white/8 hover:text-white",
                  opt.value === selected
                    ? "bg-violet-500/15 text-violet-200"
                    : "text-white/80"
                )}
              >
                <span>{opt.label}</span>
                {opt.value === selected && (
                  <Check size={14} className="shrink-0 text-violet-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

    return (
      <div ref={ref} className={cn("relative w-full", className)}>
        <input type="hidden" name={name} value={selected} />

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-left backdrop-blur-xl transition-all duration-200",
            "hover:border-white/20 hover:bg-white/[0.08]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:border-violet-400/50",
            open && "border-violet-400/50 ring-2 ring-violet-400/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="truncate text-foreground">{selectedLabel}</span>
          <ChevronDown
            size={16}
            className={cn(
              "ml-2 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {mounted && open && createPortal(dropdown, document.body)}
      </div>
    );
  }
);
Select.displayName = "Select";