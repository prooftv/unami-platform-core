import { Badge } from "../primitives/Badge";

const STATUS_VARIANTS = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
  error: "destructive",
  info: "info",
  draft: "outline",
} as const;

type Status = keyof typeof STATUS_VARIANTS;

type StatusBadgeProps = {
  status: Status;
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
