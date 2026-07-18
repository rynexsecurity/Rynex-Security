"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import StatusBadge, {
  statusVariantForProjectStatus,
  statusVariantForTaskStatus,
  statusVariantForReportStatus,
} from "@/components/portal/StatusBadge";
import Modal from "@/components/portal/Modal";
import { Role, ProjectStatus, MemberRole, TaskStatus, TaskPriority, ReportType } from "@prisma/client";

interface UserCompact {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface ProjectMember {
  id: string;
  memberRole: MemberRole;
  user: UserCompact;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignedTo: { id: string; name: string } | null;
}

interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: string;
  createdAt: string;
  author: { id: string; name: string };
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  progressPercent: number;
  startDate: string | null;
  deadline: string | null;
  client: UserCompact | null;
  team: { id: string; name: string; head: UserCompact | null } | null;
  members: ProjectMember[];
  tasks: Task[];
  reports: Report[];
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
}

const STATUS_OPTIONS: ProjectStatus[] = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "DELIVERED"];
const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const REPORT_TYPE_OPTIONS: ReportType[] = ["VAPT", "SOC", "GRC", "PROGRESS", "TASK_SUBMISSION", "GENERAL"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<CurrentUser | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit project status & progress state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "NOT_STARTED" as ProjectStatus,
    progressPercent: 0,
  });

  // Assign member state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserCompact[]>([]);
  const [memberForm, setFormMember] = useState({
    userId: "",
    memberRole: "WORKER" as MemberRole,
  });

  // Task creation state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
    assignedToId: "",
  });

  // Report creation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "",
    content: "",
    type: "GENERAL" as ReportType,
    fileUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/portal/auth/me");
    if (res.ok) {
      const data = await res.json();
      setSession({
        userId: data.user.id,
        name: data.user.name,
        role: data.user.role,
        email: data.user.email,
      });
    }
  }, []);

  const fetchProjectDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/projects/${id}`);
      if (!res.ok) {
        throw new Error("Project not found");
      }
      const data = await res.json();
      setProject(data.project);
      setEditForm({
        status: data.project.status,
        progressPercent: data.project.progressPercent,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/portal/users");
    if (res.ok) {
      const data = await res.json();
      setAllUsers(data.users);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchProjectDetail();
    fetchUsers();
  }, [fetchSession, fetchProjectDetail, fetchUsers]);

  const isManagement = session && ["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role);

  async function handleUpdateProject() {
    setSubmitting(true);
    const res = await fetch(`/api/portal/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editForm.status,
        progressPercent: Number(editForm.progressPercent),
      }),
    });
    if (res.ok) {
      setShowEditModal(false);
      fetchProjectDetail();
    }
    setSubmitting(false);
  }

  async function handleAddMember() {
    if (!memberForm.userId) return;
    setSubmitting(true);
    const res = await fetch(`/api/portal/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addMember: {
          userId: memberForm.userId,
          memberRole: memberForm.memberRole,
        },
      }),
    });
    if (res.ok) {
      setShowMemberModal(false);
      setFormMember({ userId: "", memberRole: "WORKER" });
      fetchProjectDetail();
    }
    setSubmitting(false);
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Are you sure you want to remove this member from the project?")) return;
    const res = await fetch(`/api/portal/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        removeMember: userId,
      }),
    });
    if (res.ok) {
      fetchProjectDetail();
    }
  }

  async function handleCreateTask() {
    if (!taskForm.title) return;
    setSubmitting(true);
    const res = await fetch("/api/portal/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...taskForm,
        projectId: id,
        dueDate: taskForm.dueDate || undefined,
        assignedToId: taskForm.assignedToId || undefined,
      }),
    });
    if (res.ok) {
      setShowTaskModal(false);
      setTaskForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });
      fetchProjectDetail();
    }
    setSubmitting(false);
  }

  async function handleCreateReport() {
    if (!reportForm.title) return;
    setSubmitting(true);
    const res = await fetch("/api/portal/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reportForm,
        projectId: id,
        fileUrl: reportForm.fileUrl || undefined,
      }),
    });
    if (res.ok) {
      setShowReportModal(false);
      setReportForm({ title: "", content: "", type: "GENERAL", fileUrl: "" });
      fetchProjectDetail();
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="portal-empty" style={{ minHeight: "100vh" }}>
        <div className="portal-spinner portal-spinner-lg" />
      </div>
    );
  }

  if (error || !project || !session) {
    return (
      <PortalShell userName="" userRole="INTERN" pageTitle="Project Details">
        <div className="portal-alert portal-alert-danger">
          <i className="fa fa-triangle-exclamation" />
          {error || "Project not found or unauthorized"}
        </div>
        <button className="btn btn-secondary" onClick={() => router.push("/portal/projects")}>
          Back to Projects
        </button>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle={project.title}
      pageSubtitle="Project Details &amp; Control Center"
    >
      {/* Back navigation */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/portal/projects")}>
          <i className="fa fa-arrow-left" /> Back to Projects
        </button>
      </div>

      {/* Main Grid */}
      <div className="portal-grid-3" style={{ gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Left Side: Overview, Tasks, Reports */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Project Details Card */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Project Overview</span>
              {isManagement && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
                  <i className="fa fa-pen" /> Edit Status
                </button>
              )}
            </div>
            <div className="portal-card-body">
              {project.description && (
                <p style={{ color: "var(--portal-text-secondary)", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                  {project.description}
                </p>
              )}

              <div className="portal-grid-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 12, color: "var(--portal-text-muted)", display: "block" }}>Status</span>
                  <StatusBadge
                    label={project.status.replace("_", " ")}
                    variant={statusVariantForProjectStatus(project.status)}
                    dot
                  />
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "var(--portal-text-muted)", display: "block" }}>Start Date</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(project.startDate)}</span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "var(--portal-text-muted)", display: "block" }}>Deadline</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(project.deadline)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "var(--portal-text-secondary)" }}>Completion Progress</span>
                  <span style={{ fontWeight: 600 }}>{project.progressPercent}%</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Tasks &amp; Milestones</span>
              {isManagement && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(true)}>
                  <i className="fa fa-plus" /> Add Task
                </button>
              )}
            </div>
            <div className="portal-table-wrapper">
              {project.tasks.length === 0 ? (
                <div className="portal-empty" style={{ padding: "30px 20px" }}>
                  <i className="fa fa-list-check" />
                  <p>No tasks created for this project yet.</p>
                </div>
              ) : (
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Assigned To</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map((task) => (
                      <tr key={task.id}>
                        <td style={{ fontWeight: 600 }}>{task.title}</td>
                        <td>
                          <StatusBadge
                            label={task.priority}
                            variant={
                              task.priority === "URGENT"
                                ? "danger"
                                : task.priority === "HIGH"
                                ? "warning"
                                : task.priority === "MEDIUM"
                                ? "info"
                                : "neutral"
                            }
                          />
                        </td>
                        <td style={{ color: "var(--portal-text-secondary)" }}>
                          {task.assignedTo?.name ?? "Unassigned"}
                        </td>
                        <td style={{ color: "var(--portal-text-secondary)" }}>{formatDate(task.dueDate)}</td>
                        <td>
                          <StatusBadge label={task.status} variant={statusVariantForTaskStatus(task.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Reports Card */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Reports &amp; Deliverables</span>
              {session.role !== "CLIENT" && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(true)}>
                  <i className="fa fa-upload" /> Submit Report
                </button>
              )}
            </div>
            <div className="portal-table-wrapper">
              {project.reports.length === 0 ? (
                <div className="portal-empty" style={{ padding: "30px 20px" }}>
                  <i className="fa fa-file-lines" />
                  <p>No reports submitted for this project yet.</p>
                </div>
              ) : (
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Author</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{report.title}</span>
                        </td>
                        <td>
                          <span className="portal-badge badge-info" style={{ fontSize: 11 }}>{report.type}</span>
                        </td>
                        <td style={{ color: "var(--portal-text-secondary)" }}>{report.author.name}</td>
                        <td style={{ color: "var(--portal-text-secondary)" }}>{formatDate(report.createdAt)}</td>
                        <td>
                          <StatusBadge label={report.status} variant={statusVariantForReportStatus(report.status)} dot />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Client & Team Management */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Client Info */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Client</span>
            </div>
            <div className="portal-card-body">
              {project.client ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div className="portal-avatar" style={{ background: "var(--portal-teal)" }}>
                      {project.client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{project.client.name}</div>
                      <div style={{ fontSize: 11, color: "var(--portal-text-secondary)" }}>{project.client.email}</div>
                    </div>
                  </div>
                  {session.role !== "CLIENT" && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => router.push(`/portal/messages?newThreadUser=${project.client?.id}`)}
                    >
                      <i className="fa fa-comment" /> Message Client
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ color: "var(--portal-text-muted)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                  No client assigned to this project
                </div>
              )}
            </div>
          </div>

          {/* Assigned Team & Workers */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Assigned Workers</span>
              {isManagement && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
                  <i className="fa fa-plus" /> Add
                </button>
              )}
            </div>
            <div className="portal-card-body">
              {/* Show Team Name */}
              {project.team && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Team</span>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{project.team.name}</div>
                </div>
              )}

              {/* Show Team Head */}
              {project.team?.head && (
                <div style={{ marginBottom: 16, borderBottom: "1px solid var(--portal-border-light)", paddingBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Team Head</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <div className="portal-avatar portal-avatar-sm" style={{ background: "var(--portal-navy)" }}>
                      {project.team.head.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{project.team.head.name}</div>
                      <div style={{ fontSize: 11, color: "var(--portal-text-secondary)" }}>{project.team.head.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* List Project Members */}
              <div>
                <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Project Members</span>
                {project.members.length === 0 ? (
                  <div style={{ color: "var(--portal-text-muted)", fontSize: 12, textAlign: "center", padding: "10px 0" }}>No direct project members.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {project.members.map((member) => (
                      <div key={member.id} style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="portal-avatar portal-avatar-sm" style={{ background: "var(--portal-teal)" }}>
                            {member.user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{member.user.name}</div>
                            <div style={{ fontSize: 10, color: "var(--portal-text-secondary)" }}>
                              {member.memberRole} · {member.user.role}
                            </div>
                          </div>
                        </div>
                        {isManagement && (
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            style={{ height: 26, width: 26 }}
                            onClick={() => handleRemoveMember(member.user.id)}
                            title="Remove Member"
                          >
                            <i className="fa fa-trash-can" style={{ fontSize: 11, color: "var(--status-danger)" }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project Status"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateProject} disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="edit-status" className="form-label">Project Status</label>
          <select
            id="edit-status"
            className="form-control"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="edit-progress" className="form-label">Progress Percentage ({editForm.progressPercent}%)</label>
          <input
            id="edit-progress"
            type="range"
            min="0"
            max="100"
            className="form-control"
            value={editForm.progressPercent}
            onChange={(e) => setEditForm({ ...editForm, progressPercent: Number(e.target.value) })}
          />
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Add Project Member"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddMember} disabled={submitting}>
              Add Member
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="select-member" className="form-label">Select User</label>
          <select
            id="select-member"
            className="form-control"
            value={memberForm.userId}
            onChange={(e) => setFormMember({ ...memberForm, userId: e.target.value })}
          >
            <option value="">Choose a team member…</option>
            {allUsers
              .filter((u) => u.role !== "CLIENT" && !project.members.some((m) => m.user.id === u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))
            }
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="member-role" className="form-label">Member Role</label>
          <select
            id="member-role"
            className="form-control"
            value={memberForm.memberRole}
            onChange={(e) => setFormMember({ ...memberForm, memberRole: e.target.value as MemberRole })}
          >
            <option value="WORKER">Worker</option>
            <option value="LEAD">Lead</option>
          </select>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Add Project Task"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateTask} disabled={submitting}>
              Create Task
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="task-title" className="form-label">Title <span className="required">*</span></label>
          <input
            id="task-title"
            type="text"
            className="form-control"
            placeholder="e.g. Set up SOC alerts"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-desc" className="form-label">Description</label>
          <textarea
            id="task-desc"
            className="form-control"
            placeholder="Describe the task details…"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />
        </div>

        <div className="portal-grid-2">
          <div className="form-group">
            <label htmlFor="task-priority" className="form-label">Priority</label>
            <select
              id="task-priority"
              className="form-control"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
            >
              {TASK_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-due-date" className="form-label">Due Date</label>
            <input
              id="task-due-date"
              type="date"
              className="form-control"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-assignee" className="form-label">Assignee</label>
          <select
            id="task-assignee"
            className="form-control"
            value={taskForm.assignedToId}
            onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Submit Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Submit Report / Deliverable"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateReport} disabled={submitting}>
              Submit Report
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="report-title" className="form-label">Report Title <span className="required">*</span></label>
          <input
            id="report-title"
            type="text"
            className="form-control"
            placeholder="e.g. SOC Integration Review"
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="report-type" className="form-label">Report Type</label>
          <select
            id="report-type"
            className="form-control"
            value={reportForm.type}
            onChange={(e) => setReportForm({ ...reportForm, type: e.target.value as ReportType })}
          >
            {REPORT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="report-content" className="form-label">Summary / Notes</label>
          <textarea
            id="report-content"
            className="form-control"
            placeholder="Notes or summary for reviewer…"
            value={reportForm.content}
            onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="report-file-url" className="form-label">File URL</label>
          <input
            id="report-file-url"
            type="url"
            className="form-control"
            placeholder="https://supabase-storage-url-or-drive..."
            value={reportForm.fileUrl}
            onChange={(e) => setReportForm({ ...reportForm, fileUrl: e.target.value })}
          />
        </div>
      </Modal>
    </PortalShell>
  );
}
