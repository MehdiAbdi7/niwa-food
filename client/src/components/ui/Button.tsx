import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: string; // classe iconify, ex: "icon-[mdi--plus]"
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-accent-slate",
  secondary:
    "bg-surface-2 text-foreground border border-border-subtle hover:border-primary",
  ghost: "bg-transparent text-foreground hover:bg-surface-2",
  danger: "bg-accent-bordeaux text-on-primary hover:opacity-90",
};

// Hauteurs alignées sur la zone tactile minimale (44px) pour md/lg — l'app
// est utilisée sur tablette posée à plat en cuisine, pas seulement au clavier.
const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-xl font-bold transition-all duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="icon-[mdi--loading] animate-spin text-lg" />
      ) : (
        icon && <span className={`${icon} text-lg`} />
      )}
      {children}
    </button>
  );
}
