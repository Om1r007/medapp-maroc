import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ConsultationStatus } from "@medapp/shared-types";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-100 text-neutral-700",
        primary: "bg-primary-50 text-primary-700",
        success: "bg-success-50 text-success-700",
        warning: "bg-warning-50 text-warning-700",
        error: "bg-error-50 text-error-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

const STATUS_VARIANTS: Record<ConsultationStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  WAITING_PAYMENT: "warning",
  WAITING_PRE_CONSULT: "warning",
  IN_QUEUE: "primary",
  MATCHED: "primary",
  IN_PROGRESS: "success",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
  REFUNDED: "neutral",
};

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  WAITING_PAYMENT: "Attente paiement",
  WAITING_PRE_CONSULT: "Pré-consultation",
  IN_QUEUE: "En file d'attente",
  MATCHED: "Médecin assigné",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

function StatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge };
