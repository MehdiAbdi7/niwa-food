interface HistoryBreadcrumbProps {
  year: number | null;
  month: number | null;
  day: number | null;
  onNavigate: (level: "root" | "year" | "month") => void;
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function HistoryBreadcrumb({ year, month, day, onNavigate }: HistoryBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button
        onClick={() => onNavigate("root")}
        className={`font-semibold ${year === null ? "text-foreground" : "text-foreground/75 hover:text-primary"}`}
      >
        Années
      </button>

      {year !== null && (
        <>
          <span className="text-foreground/30">/</span>
          <button
            onClick={() => onNavigate("year")}
            className={`font-semibold ${month === null ? "text-foreground" : "text-foreground/75 hover:text-primary"}`}
          >
            {year}
          </button>
        </>
      )}

      {month !== null && (
        <>
          <span className="text-foreground/30">/</span>
          <button
            onClick={() => onNavigate("month")}
            className={`font-semibold ${day === null ? "text-foreground" : "text-foreground/75 hover:text-primary"}`}
          >
            {MONTH_NAMES[month - 1]}
          </button>
        </>
      )}

      {day !== null && (
        <>
          <span className="text-foreground/30">/</span>
          <span className="font-semibold text-foreground">{day}</span>
        </>
      )}
    </div>
  );
}

export { MONTH_NAMES };
