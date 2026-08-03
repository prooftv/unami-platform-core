import { Badge } from "../primitives/Badge";

// D-014: only default | secondary | destructive | outline are valid shadcn variants
const STATUS_VARIANTS = {
  active: "default",
  inactive: "secondary",
  pending: "secondary",
  error: "destructive",
  info: "outline",
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
