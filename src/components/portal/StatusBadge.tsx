type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "teal"
  | "ceo"
  | "admin"
  | "developer"
  | "head"
  | "intern"
  | "client";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
  info: "#3B82F6",
  neutral: "#94A3B8",
  teal: "#00BFA6",
  ceo: "#F6C90E",
  admin: "#EF4444",
  developer: "#EAB308",
  head: "#F97316",
  intern: "#22C55E",
  client: "#3B82F6",
};

export function statusVariantForProjectStatus(status: string): BadgeVariant {
  switch (status) {
    case "NOT_STARTED": return "neutral";
    case "IN_PROGRESS": return "info";
    case "ON_HOLD": return "warning";
    case "COMPLETED": return "success";
    case "DELIVERED": return "teal";
    default: return "neutral";
  }
}

export function statusVariantForReportStatus(status: string): BadgeVariant {
  switch (status) {
    case "DRAFT": return "neutral";
    case "SUBMITTED": return "info";
    case "REVIEWED": return "warning";
    case "APPROVED": return "success";
    case "REJECTED": return "danger";
    default: return "neutral";
  }
}

export function statusVariantForTaskStatus(status: string): BadgeVariant {
  switch (status) {
    case "TODO": return "neutral";
    case "IN_PROGRESS": return "info";
    case "DONE": return "success";
    default: return "neutral";
  }
}

export function statusVariantForPriority(priority: string): BadgeVariant {
  switch (priority) {
    case "LOW": return "neutral";
    case "MEDIUM": return "info";
    case "HIGH": return "warning";
    case "URGENT": return "danger";
    default: return "neutral";
  }
}

export function statusVariantForRole(role: string): BadgeVariant {
  return (role.toLowerCase() as BadgeVariant) ?? "neutral";
}

export default function StatusBadge({ label, variant, dot = false }: StatusBadgeProps) {
  return (
    <span className={`portal-badge badge-${variant}`}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: DOT_COLORS[variant],
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}
