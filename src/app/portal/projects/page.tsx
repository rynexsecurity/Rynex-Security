"use client";

import { useState, useEffect, useCallback } from "react";
import PortalShell from "@/components/portal/PortalShell";
import StatusBadge, { statusVariantForProjectStatus } from "@/components/portal/StatusBadge";
import Modal from "@/components/portal/Modal";
import Link from "next/link";
import { Role } from "@prisma/client";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  progressPercent: number;
  startDate: string | null;
  deadline: string | null;
  createdAt: string;
  client?: { id: string; name: string; email: string } | null;
  team?: { id: string; name: string } | null;
  _count: { tasks: number; reports: number };
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
  mustChangePassword: boolean;
}

const STATUS_OPTIONS = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "DELIVERED"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDeadlineColor(deadline: string | null): string {
  if (!deadline) return "var(--portal-text-muted)";
  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "var(--status-danger)";
  if (daysUntil <= 2) return "var(--status-warning)";
  return "var(--portal-text-muted)";
}

export default function ProjectsPage() {
  const [session, setSession] = useState<CurrentUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Teams and clients for form
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; email: string }[]>([]);

  // Create form state
  const [form, setForm] = useState({
    title: "", description: "", clientId: "", teamId: "",
    startDate: "", deadline: "", status: "NOT_STARTED",
  });

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/portal/auth/me");
    if (res.ok) {
      const data = await res.json();
      setSession({ userId: data.user.id, name: data.user.name, role: data.user.role, email: data.user.email, mustChangePassword: data.user.mustChangePassword });
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portal/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects);
    }
    setLoading(false);
  }, []);

  const fetchFormData = useCallback(async () => {
    const [teamsRes, usersRes] = await Promise.all([
      fetch("/api/portal/teams"),
      fetch("/api/portal/users"),
    ]);

    if (teamsRes.ok) {
      const data = await teamsRes.json();
      setTeams(data.teams?.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) ?? []);
    }

    if (usersRes.ok) {
      const data = await usersRes.json();
      setClients(
        (data.users ?? [])
          .filter((u: { role: string }) => u.role === "CLIENT")
          .map((u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email }))
      );
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchProjects();
    fetchFormData();
  }, [fetchSession, fetchProjects, fetchFormData]);

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreate = session && ["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    const res = await fetch("/api/portal/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientId: form.clientId || undefined,
        teamId: form.teamId || undefined,
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create project.");
      setCreateLoading(false);
      return;
    }

    setShowCreateModal(false);
    setForm({ title: "", description: "", clientId: "", teamId: "", startDate: "", deadline: "", status: "NOT_STARTED" });
    setCreateLoading(false);
    fetchProjects();
  }

  if (!session) return null;

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle="Projects"
      pageSubtitle={session.role === "CLIENT" ? "Your project details" : "All active projects"}
    >
      <div className="portal-page-header">
        <div>
          <div className="portal-page-title">Projects</div>
          <div className="portal-page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""}</div>
        </div>
        {canCreate && (
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fa fa-plus" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="portal-card" style={{ marginBottom: 20 }}>
        <div className="portal-card-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <i className="fa fa-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--portal-text-muted)", fontSize: 13 }} />
              <input type="text" className="form-control" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} id="project-search" />
            </div>
            <select id="project-status-filter" className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="portal-empty"><div className="portal-spinner portal-spinner-lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="portal-empty">
          <i className="fa fa-folder-open" />
          <p>No projects found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map((project) => (
            <div key={project.id} className="portal-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <Link
                    href={`/portal/projects/${project.id}`}
                    style={{ fontWeight: 700, fontSize: 15, color: "var(--portal-text-primary)", textDecoration: "none" }}
                  >
                    {project.title}
                  </Link>
                  {project.client && (
                    <div style={{ fontSize: 12, color: "var(--portal-text-muted)", marginTop: 2 }}>
                      Client: {project.client.name}
                    </div>
                  )}
                </div>
                <StatusBadge
                  label={project.status.replace("_", " ")}
                  variant={statusVariantForProjectStatus(project.status)}
                />
              </div>

              {project.description && (
                <p style={{ fontSize: 13, color: "var(--portal-text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                  {project.description.slice(0, 100)}{project.description.length > 100 ? "…" : ""}
                </p>
              )}

              {/* Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "var(--portal-text-secondary)" }}>Progress</span>
                  <span style={{ fontWeight: 600, color: "var(--portal-text-primary)" }}>
                    {project.progressPercent}%
                  </span>
                </div>
                <div className="progress-bar-wrapper">
                  <div
                    className={`progress-bar-fill ${project.progressPercent < 25 ? "danger" : project.progressPercent < 60 ? "warning" : ""}`}
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <div style={{ color: "var(--portal-text-muted)" }}>
                  <i className="fa fa-calendar" style={{ marginRight: 5 }} />
                  {formatDate(project.startDate)}
                </div>
                {project.deadline && (
                  <div style={{ color: getDeadlineColor(project.deadline), fontWeight: 500 }}>
                    <i className="fa fa-flag" style={{ marginRight: 5 }} />
                    {formatDate(project.deadline)}
                  </div>
                )}
              </div>

              <hr className="portal-divider" style={{ margin: "12px 0" }} />

              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--portal-text-muted)" }}>
                <span><i className="fa fa-file-lines" style={{ marginRight: 5 }} />{project._count.reports} reports</span>
                <span><i className="fa fa-list-check" style={{ marginRight: 5 }} />{project._count.tasks} tasks</span>
                {project.team && <span><i className="fa fa-people-group" style={{ marginRight: 5 }} />{project.team.name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateError(""); }}
        title="Create New Project"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button id="create-project-submit" className="btn btn-primary" onClick={handleCreate as unknown as React.MouseEventHandler} disabled={createLoading}>
              {createLoading ? <><span className="portal-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating…</> : <><i className="fa fa-plus" /> Create Project</>}
            </button>
          </>
        }
      >
        {createError && <div className="portal-alert portal-alert-danger"><i className="fa fa-circle-exclamation" />{createError}</div>}

        <div className="form-group">
          <label htmlFor="proj-title" className="form-label">Title <span className="required">*</span></label>
          <input id="proj-title" type="text" className="form-control" placeholder="Project name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-group">
          <label htmlFor="proj-desc" className="form-label">Description</label>
          <textarea id="proj-desc" className="form-control" placeholder="Brief project overview…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="portal-grid-2">
          {clients.length > 0 && (
            <div className="form-group">
              <label htmlFor="proj-client" className="form-label">Client</label>
              <select id="proj-client" className="form-control" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {teams.length > 0 && (
            <div className="form-group">
              <label htmlFor="proj-team" className="form-label">Team</label>
              <select id="proj-team" className="form-control" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                <option value="">No team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="portal-grid-2">
          <div className="form-group">
            <label htmlFor="proj-start" className="form-label">Start Date</label>
            <input id="proj-start" type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="proj-deadline" className="form-label">Deadline</label>
            <input id="proj-deadline" type="date" className="form-control" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="proj-status" className="form-label">Initial Status</label>
          <select id="proj-status" className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </Modal>
    </PortalShell>
  );
}
