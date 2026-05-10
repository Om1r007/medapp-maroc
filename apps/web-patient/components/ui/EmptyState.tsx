import { type LucideIcon, FileX } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = FileX, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <Icon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
