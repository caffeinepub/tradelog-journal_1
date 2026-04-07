import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showPercent?: boolean;
  className?: string;
}

function getGradient(value: number) {
  if (value < 50) return "from-[#00ff41] to-[#00ff41]";
  if (value < 80) return "from-[#00ff41] via-yellow-400 to-yellow-400";
  return "from-[#00ff41] via-yellow-400 to-red-500";
}

export function ProgressBar({
  value,
  label,
  showPercent = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercent && (
            <span
              className={cn(
                "font-mono font-semibold",
                pct >= 80
                  ? "text-red-400"
                  : pct >= 50
                    ? "text-yellow-400"
                    : "text-[#00ff41]",
              )}
            >
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            getGradient(pct),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
