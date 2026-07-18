import { getSession } from "@/lib/portal/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/portal/prisma";
import PortalShell from "@/components/portal/PortalShell";
import { Role } from "@prisma/client";

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getActionBadge(action: string) {
  if (action.includes("CREATED")) return { bg: "#F0FDF4", color: "#15803D" };
  if (action.includes("DELETED") || action.includes("DEACTIVATED")) return { bg: "#FEF2F2", color: "#B91C1C" };
  if (action.includes("LOGIN")) return { bg: "#EFF6FF", color: "#1D4ED8" };
  if (action.includes("UPDATED") || action.includes("CHANGED")) return { bg: "#FFFBEB", color: "#92400E" };
  return { bg: "#F8FAFC", color: "#718096" };
}

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session) redirect("/portal/login");

  const role = session.role as Role;

  if (!["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
    redirect("/portal/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <PortalShell
      userName={session.name}
      userRole={role}
      pageTitle="Audit Log"
      pageSubtitle="Complete activity history"
    >
      <div className="portal-page-header">
        <div>
          <div className="portal-page-title">Audit Log</div>
          <div className="portal-page-subtitle">Last {logs.length} actions</div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-table-wrapper">
          {logs.length === 0 ? (
            <div className="portal-empty">
              <i className="fa fa-scroll" />
              <p>No activity recorded yet.</p>
            </div>
          ) : (
            <table className="portal-table" id="audit-log-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id}>
                      <td>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "3px 10px",
                            borderRadius: 100,
                            fontSize: 11.5,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{log.user.name}</div>
                        <div style={{ fontSize: 11, color: "var(--portal-text-muted)" }}>{log.user.email}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--portal-text-secondary)" }}>
                        {log.entityType ?? "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--portal-text-secondary)", maxWidth: 200 }}>
                        {log.details ?? "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--portal-text-muted)", fontFamily: "var(--portal-font-mono)" }}>
                        {log.ipAddress ?? "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--portal-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
