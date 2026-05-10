import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: string | number;
  trend?: string | null;
  trendPositive?: boolean;
  className?: string;
}

export function Stat({ label, value, trend, trendPositive, className }: StatProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
        {label}
      </p>
      <p className="text-3xl font-bold text-neutral-900 tracking-tight">
        {value}
      </p>
      {trend && (
        <p className="text-sm text-neutral-500">
          <span
            className={cn(
              "font-medium",
              trendPositive ? "text-success-700" : "text-error-700",
            )}
          >
            {trend}
          </span>
        </p>
      )}
    </div>
  );
}
