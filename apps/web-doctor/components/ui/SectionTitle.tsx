import Link from "next/link";
import { ChevronRight } from "lucide-react";

type ActionHref = { label: string; href: string };
type ActionClick = { label: string; onClick: () => void };

interface SectionTitleProps {
  title: string;
  action?: ActionHref | ActionClick;
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {action && (
        "href" in action ? (
          <Link
            href={action.href}
            className="flex items-center gap-0.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            {action.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="flex items-center gap-0.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            {action.label}
            <ChevronRight className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  );
}
