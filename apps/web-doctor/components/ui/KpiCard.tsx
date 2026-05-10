import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface KpiCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: number;
  trendLabel?: string;
}

export function KpiCard({ label, value, subLabel, trend, trendLabel }: KpiCardProps) {
  const hasTrend = trend !== undefined;
  const positive = hasTrend && trend >= 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider leading-none">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-neutral-900 tracking-tight">{value}</p>
      {hasTrend ? (
        <div
          className={cn(
            "mt-1 flex items-center gap-0.5 text-xs font-medium",
            positive ? "text-success-700" : "text-error-700",
          )}
        >
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {positive ? "+" : ""}{trend.toFixed(1)} {trendLabel}
        </div>
      ) : subLabel ? (
        <p className="mt-1 text-xs text-neutral-400">{subLabel}</p>
      ) : null}
    </div>
  );
}
