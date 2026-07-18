"use client";

import { useState, useEffect, useCallback } from "react";
import PortalShell from "@/components/portal/PortalShell";
import StatusBadge, { statusVariantForReportStatus } from "@/components/portal/StatusBadge";
import Modal from "@/components/portal/Modal";
import Link from "next/link";
import { Role } from "@prisma/client";

interface Report {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  type: string;
  status: string;
  reviewNote?: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: string };
  reviewedBy?: { id: string; name: string } | null;
  project?: { id: string; title: string } | null;
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
  mustChangePassword: boolean;
}

const REPORT_TYPES = ["VAPT", "SOC", "GRC", "PROGRESS", "TASK_SUBMISSION", "GENERAL"];
const STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function ReportsPage() {
  const [session, setSession] = useState<CurrentUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNote, setReviewNote] = useState("");

  // Submit form
  const [form, setForm] = useState({ title: "", content: "", type: "GENERAL", projectId: "", fileUrl: "" });

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/portal/auth/me");
    if (res.ok) {
      const data = await res.json();
      setSession({ userId: data.user.id, name: data.user.name, role: data.user.role, email: data.user.email, mustChangePassword: data.user.mustChangePassword });
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portal/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports);
    }
    setLoading(false);
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/portal/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects.map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })));
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchReports();
    fetchProjects();
  }, [fetchSession, fetchReports, fetchProjects]);

  const canSubmit = session && ["CEO", "DEVELOPER", "HEAD", "INTERN"].includes(session.role);
  const canReview = session && ["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role);

  const filtered = reports.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);

    const res = await fetch("/api/portal/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: form.projectId || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to submit report.");
      setSubmitLoading(false);
      return;
    }

    setShowSubmitModal(false);
    setForm({ title: "", content: "", type: "GENERAL", projectId: "", fileUrl: "" });
    setSubmitLoading(false);
    fetchReports();
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReport) return;
    setReviewLoading(true);

    await fetch("/api/portal/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedReport.id, status: reviewStatus, reviewNote }),
    });

    setShowReviewModal(false);
    setSelectedReport(null);
    setReviewNote("");
    setReviewLoading(false);
    fetchReports();
  }

  if (!session) return null;

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle="Reports"
      pageSubtitle={session.role === "CLIENT" ? "Your project deliverables" : "All submitted reports"}
    >
      <div className="portal-page-header">
        <div>
          <div className="portal-page-title">Reports</div>
          <div className="portal-page-subtitle">{reports.length} report{reports.length !== 1 ? "s" : ""}</div>
        </div>
        {canSubmit && (
          <button id="submit-report-btn" className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>
            <i className="fa fa-upload" /> Submit Report
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="portal-card" style={{ marginBottom: 20 }}>
        <div className="portal-card-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <i className="fa fa-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--portal-text-muted)", fontSize: 13 }} />
              <input type="text" className="form-control" placeholder="Search reports…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} id="report-search" />
            </div>
            <select id="report-status-filter" className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select id="report-type-filter" className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
              <option value="ALL">All Types</option>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="portal-card">
        <div className="portal-table-wrapper">
          {loading ? (
            <div className="portal-empty"><div className="portal-spinner portal-spinner-lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="portal-empty">
              <i className="fa fa-file-lines" />
              <p>No reports found.</p>
            </div>
          ) : (
            <table className="portal-table" id="reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Project</th>
                  <th>Date</th>
                  {canReview && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{report.title}</div>
                      {report.fileUrl && (
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--portal-teal)" }}>
                          <i className="fa fa-download" style={{ marginRight: 4 }} />Download
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="portal-badge badge-info" style={{ fontSize: 11 }}>{report.type}</span>
                    </td>
                    <td>
                      <StatusBadge label={report.status} variant={statusVariantForReportStatus(report.status)} dot />
                    </td>
                    <td style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>{report.author.name}</td>
                    <td style={{ fontSize: 13, color: "var(--portal-text-secondary)" }}>
                      {report.project ? (
                        <Link href={`/portal/projects/${report.project.id}`}>{report.project.title}</Link>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--portal-text-muted)" }}>{formatDate(report.createdAt)}</td>
                    {canReview && (
                      <td>
                        {["SUBMITTED", "REVIEWED"].includes(report.status) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setSelectedReport(report); setShowReviewModal(true); }}
                            id={`review-report-${report.id}`}
                          >
                            <i className="fa fa-check" /> Review
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Submit Report Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Report"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
            <button id="submit-report-confirm" className="btn btn-primary" onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={submitLoading}>
              {submitLoading ? <><span className="portal-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting…</> : <><i className="fa fa-upload" /> Submit Report</>}
            </button>
          </>
        }
      >
        {submitError && <div className="portal-alert portal-alert-danger"><i className="fa fa-circle-exclamation" />{submitError}</div>}

        <div className="form-group">
          <label htmlFor="report-title" className="form-label">Report Title <span className="required">*</span></label>
          <input id="report-title" type="text" className="form-control" placeholder="e.g., VAPT Report — Client Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="portal-grid-2">
          <div className="form-group">
            <label htmlFor="report-type" className="form-label">Type</label>
            <select id="report-type" className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="report-project" className="form-label">Project</label>
            <select id="report-project" className="form-control" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">General (no project)</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="report-content" className="form-label">Summary / Notes</label>
          <textarea id="report-content" className="form-control" placeholder="Brief summary of findings or progress…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} style={{ minHeight: 100 }} />
        </div>

        <div className="form-group">
          <label htmlFor="report-file-url" className="form-label">File URL (optional)</label>
          <input id="report-file-url" type="url" className="form-control" placeholder="https://…" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
          <span className="form-hint">Link to Supabase Storage, Google Drive, or any accessible file URL.</span>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setSelectedReport(null); setReviewNote(""); }}
        title={`Review: ${selectedReport?.title ?? ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
            <button
              id="review-report-submit"
              className={`btn ${reviewStatus === "APPROVED" ? "btn-primary" : "btn-danger"}`}
              onClick={handleReview as unknown as React.MouseEventHandler}
              disabled={reviewLoading}
            >
              {reviewLoading ? <><span className="portal-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> :
                reviewStatus === "APPROVED" ? <><i className="fa fa-check" /> Approve</> : <><i className="fa fa-xmark" /> Reject</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Decision</label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className={`btn ${reviewStatus === "APPROVED" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setReviewStatus("APPROVED")}
              style={{ flex: 1, justifyContent: "center" }}
              id="review-approve-btn"
            >
              <i className="fa fa-circle-check" /> Approve
            </button>
            <button
              type="button"
              className={`btn ${reviewStatus === "REJECTED" ? "btn-danger" : "btn-secondary"}`}
              onClick={() => setReviewStatus("REJECTED")}
              style={{ flex: 1, justifyContent: "center" }}
              id="review-reject-btn"
            >
              <i className="fa fa-circle-xmark" /> Reject
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review-note" className="form-label">Reviewer Note (optional)</label>
          <textarea id="review-note" className="form-control" placeholder="Add feedback or reason for rejection…" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
        </div>
      </Modal>
    </PortalShell>
  );
}
