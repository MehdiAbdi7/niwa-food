interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent-green" : "bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${
            checked ? "translate-x-0" : "-translate-x-5"
          }`}
        />
      </button>
      {label && (
        <span className="text-sm font-semibold text-foreground">{label}</span>
      )}
    </label>
  );
}
