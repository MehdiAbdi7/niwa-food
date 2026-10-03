import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`h-11 rounded-xl border bg-surface px-3.5 text-foreground outline-none transition-colors placeholder:text-foreground/40 ${
            error
              ? "border-accent-bordeaux focus:border-accent-bordeaux"
              : "border-border-subtle focus:border-primary"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-accent-bordeaux">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
