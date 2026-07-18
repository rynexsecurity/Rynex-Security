"use client";

import { useState, useEffect, useCallback } from "react";
import PortalShell from "@/components/portal/PortalShell";
import StatusBadge, { statusVariantForTaskStatus } from "@/components/portal/StatusBadge";
import Modal from "@/components/portal/Modal";
import { Role } from "@prisma/client";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignedTo?: { id: string; name: string; email: string } | null;
  assignedBy?: { id: string; name: string } | null;
  project?: { id: string; title: string } | null;
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
  mustChangePassword: boolean;
}

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE"];

const PRIORITY_BADGE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const [session, setSession] = useState<CurrentUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", projectId: "", assignedToId: "",
    priority: "MEDIUM", dueDate: "",
  });

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/portal/auth/me");
    if (res.ok) {
      const data = await res.json();
      setSession({ userId: data.user.id, name: data.user.name, role: data.user.role, email: data.user.email, mustChangePassword: data.user.mustChangePassword });
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portal/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
    fetchTasks();

    // Fetch users and projects for create form
    Promise.all([
      fetch("/api/portal/users").then((r) => r.json()),
      fetch("/api/portal/projects").then((r) => r.json()),
    ]).then(([uData, pData]) => {
      setUsers(uData.users ?? []);
      setProjects(pData.projects ?? []);
    });
  }, [fetchSession, fetchTasks]);

  const canCreate = session && ["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    const res = await fetch("/api/portal/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || undefined,
        assignedToId: form.assignedToId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create task.");
      setCreateLoading(false);
      return;
    }

    setShowCreateModal(false);
    setForm({ title: "", description: "", projectId: "", assignedToId: "", priority: "MEDIUM", dueDate: "" });
    setCreateLoading(false);
    fetchTasks();
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    await fetch("/api/portal/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
    fetchTasks();
  }

  if (!session) return null;

  // Kanban grouping
  const grouped = {
    TODO: filtered.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filtered.filter((t) => t.status === "IN_PROGRESS"),
    DONE: filtered.filter((t) => t.status === "DONE"),
  };

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle="Tasks"
      pageSubtitle={session.role === "INTERN" ? "Your assigned tasks" : "Team task board"}
    >
      <div className="portal-page-header">
        <div>
          <div className="portal-page-title">Tasks</div>
          <div className="portal-page-subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</div>
        </div>
        {canCreate && (
          <button id="create-task-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fa fa-plus" /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="portal-card" style={{ marginBottom: 20 }}>
        <div className="portal-card-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <i className="fa fa-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--portal-text-muted)", fontSize: 13 }} />
              <input type="text" className="form-control" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} id="task-search" />
            </div>
            <select id="task-status-filter" className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <select id="task-priority-filter" className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
              <option value="ALL">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="portal-empty"><div className="portal-spinner portal-spinner-lg" /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((col) => (
            <div key={col}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "2px solid var(--portal-border)",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: col === "TODO" ? "var(--portal-text-muted)" :
                    col === "IN_PROGRESS" ? "var(--status-info)" : "var(--status-success)",
                }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--portal-text-primary)" }}>
                  {col.replace("_", " ")}
                </span>
                <span style={{
                  marginLeft: "auto",
                  background: "var(--portal-bg-secondary)",
                  color: "var(--portal-text-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 10,
                }}>
                  {grouped[col].length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {grouped[col].length === 0 ? (
                  <div style={{
                    border: "2px dashed var(--portal-border)",
                    borderRadius: "var(--portal-radius)",
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "var(--portal-text-muted)",
                    fontSize: 13,
                  }}>
                    No tasks
                  </div>
                ) : (
                  grouped[col].map((task) => (
                    <div
                      key={task.id}
                      className="portal-card"
                      style={{ padding: 14, cursor: "default" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, flex: 1, marginRight: 8 }}>
                          {task.title}
                        </div>
                        <StatusBadge label={task.priority} variant={PRIORITY_BADGE[task.priority] ?? "neutral"} />
                      </div>

                      {task.description && (
                        <p style={{ fontSize: 12, color: "var(--portal-text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
                          {task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}
                        </p>
                      )}

                      <div style={{ fontSize: 11.5, color: "var(--portal-text-muted)", marginBottom: 10 }}>
                        {task.project && (
                          <div style={{ marginBottom: 3 }}>
                            <i className="fa fa-folder-open" style={{ marginRight: 5 }} />
                            {task.project.title}
                          </div>
                        )}
                        {task.assignedTo && (
                          <div style={{ marginBottom: 3 }}>
                            <i className="fa fa-user" style={{ marginRight: 5 }} />
                            {task.assignedTo.name}
                          </div>
                        )}
                        {task.dueDate && (
                          <div style={{ color: isOverdue(task.dueDate, task.status) ? "var(--status-danger)" : "inherit" }}>
                            <i className="fa fa-calendar" style={{ marginRight: 5 }} />
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate, task.status) && " (overdue)"}
                          </div>
                        )}
                      </div>

                      {/* Quick status change */}
                      {col !== "DONE" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {col === "TODO" && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11 }}
                              onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                              id={`task-start-${task.id}`}
                            >
                              <i className="fa fa-play" /> Start
                            </button>
                          )}
                          {col === "IN_PROGRESS" && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: 11 }}
                              onClick={() => handleStatusChange(task.id, "DONE")}
                              id={`task-done-${task.id}`}
                            >
                              <i className="fa fa-check" /> Mark Done
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateError(""); }}
        title="Create Task"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button id="create-task-submit" className="btn btn-primary" onClick={handleCreate as unknown as React.MouseEventHandler} disabled={createLoading}>
              {createLoading ? <><span className="portal-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating…</> : <><i className="fa fa-plus" /> Create Task</>}
            </button>
          </>
        }
      >
        {createError && <div className="portal-alert portal-alert-danger"><i className="fa fa-circle-exclamation" />{createError}</div>}

        <div className="form-group">
          <label htmlFor="task-title" className="form-label">Task Title <span className="required">*</span></label>
          <input id="task-title" type="text" className="form-control" placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="form-group">
          <label htmlFor="task-desc" className="form-label">Description</label>
          <textarea id="task-desc" className="form-control" placeholder="Additional details…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="portal-grid-2">
          <div className="form-group">
            <label htmlFor="task-priority" className="form-label">Priority</label>
            <select id="task-priority" className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="task-due" className="form-label">Due Date</label>
            <input id="task-due" type="date" className="form-control" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-assignee" className="form-label">Assign To</label>
          <select id="task-assignee" className="form-control" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
            <option value="">Unassigned</option>
            {users.filter((u) => ["DEVELOPER", "HEAD", "INTERN"].includes(u.role)).map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-project" className="form-label">Project</label>
          <select id="task-project" className="form-control" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </Modal>
    </PortalShell>
  );
}
