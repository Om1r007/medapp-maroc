import { cn } from "@/lib/cn";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-neutral-100 rounded-md", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}

export function ConsultationRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-3 h-8 w-1/3" />
        </div>
      ))}
    </div>
  );
}
