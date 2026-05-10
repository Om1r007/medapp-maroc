import { cn } from "@/lib/cn";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHero({ eyebrow, title, description, className, children }: PageHeroProps) {
  return (
    <section className={cn("py-16 sm:py-20 border-b border-neutral-200 bg-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight max-w-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
