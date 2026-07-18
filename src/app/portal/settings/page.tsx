import { getSession } from "@/lib/portal/auth";
import { redirect } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import { Role } from "@prisma/client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/portal/login");

  const role = session.role as Role;

  if (!["CEO", "ADMIN"].includes(role)) {
    redirect("/portal/dashboard");
  }

  return (
    <PortalShell
      userName={session.name}
      userRole={role}
      pageTitle="Settings"
      pageSubtitle="Portal system configuration"
    >
      <div className="portal-page-header">
        <div className="portal-page-title">System Settings</div>
      </div>

      <div className="portal-grid-2">
        {/* Portal Info */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div className="portal-card-title">
              <i className="fa fa-circle-info" style={{ color: "var(--portal-teal)", marginRight: 8 }} />
              Portal Information
            </div>
          </div>
          <div className="portal-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Portal Version", value: "1.0.0" },
                { label: "Organization", value: "Rynex Security" },
                { label: "Environment", value: process.env.NODE_ENV ?? "production" },
                { label: "Session Duration", value: "8 hours" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--portal-border-light)", paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--portal-text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div className="portal-card-title">
              <i className="fa fa-envelope" style={{ color: "var(--portal-teal)", marginRight: 8 }} />
              Email Configuration
            </div>
          </div>
          <div className="portal-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Email Provider", value: "Mailtrap" },
                { label: "From Address", value: process.env.MAILTRAP_FROM_EMAIL ?? "no-reply@rynexsecurity.com" },
                { label: "Notifications", value: "Enabled" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--portal-border-light)", paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--portal-text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="portal-alert portal-alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
              <i className="fa fa-circle-info" />
              Email settings are configured via environment variables (.env.local).
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div className="portal-card-title">
              <i className="fa fa-database" style={{ color: "var(--portal-teal)", marginRight: 8 }} />
              Database
            </div>
          </div>
          <div className="portal-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Provider", value: "PostgreSQL via Supabase" },
                { label: "ORM", value: "Prisma" },
                { label: "Connection", value: "DATABASE_URL env var" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--portal-border-light)", paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--portal-text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div className="portal-card-title">
              <i className="fa fa-shield-halved" style={{ color: "var(--portal-teal)", marginRight: 8 }} />
              Security
            </div>
          </div>
          <div className="portal-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Auth Method", value: "JWT (HS256)" },
                { label: "Password Hashing", value: "bcrypt (12 rounds)" },
                { label: "Session Storage", value: "HTTP-only cookie" },
                { label: "Force Password Reset", value: "Enabled for new accounts" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--portal-border-light)", paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--portal-text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
