import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

// Select natif volontairement (pas de listbox custom) : sur tablette tactile,
// le picker natif de l'OS est plus fiable et plus rapide qu'un dropdown maison.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={`h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-9 text-foreground outline-none transition-colors ${
              error
                ? "border-accent-bordeaux focus:border-accent-bordeaux"
                : "border-border-subtle focus:border-primary"
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="icon-[mdi--chevron-down] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-foreground/75" />
        </div>
        {error && <p className="text-xs text-accent-bordeaux">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
