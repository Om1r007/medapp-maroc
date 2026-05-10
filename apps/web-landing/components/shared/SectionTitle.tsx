import { cn } from "@/lib/cn";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
}

export function SectionTitle({ eyebrow, title, description, center = false, className }: SectionTitleProps) {
  return (
    <div className={cn(center && "text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
