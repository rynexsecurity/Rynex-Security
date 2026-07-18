"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import StatusBadge, { statusVariantForReportStatus } from "@/components/portal/StatusBadge";
import { Role } from "@prisma/client";

interface ReportDetail {
  id: string;
  title: string;
  content: string | null;
  fileUrl: string | null;
  type: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  author: { id: string; name: string; email: string; role: Role };
  reviewedBy: { id: string; name: string } | null;
  project: { id: string; title: string } | null;
}

interface CurrentUser {
  userId: string;
  name: string;
  role: Role;
  email: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<CurrentUser | null>(null);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
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

  const fetchReportDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/reports/${id}`);
      if (!res.ok) {
        throw new Error("Report not found or access forbidden");
      }
      const data = await res.json();
      setReport(data.report);
      if (data.report.reviewNote) {
        setReviewNote(data.report.reviewNote);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
    fetchReportDetail();
  }, [fetchSession, fetchReportDetail]);

  const handleReviewAction = async (status: "APPROVED" | "REJECTED") => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          reviewNote: reviewNote || undefined,
        }),
      });
      if (res.ok) {
        fetchReportDetail();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to save decision");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm("Are you sure you want to permanently delete this report?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portal/reports/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/portal/reports");
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete report");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-empty" style={{ minHeight: "100vh" }}>
        <div className="portal-spinner portal-spinner-lg" />
      </div>
    );
  }

  if (error || !report || !session) {
    return (
      <PortalShell userName="" userRole="INTERN" pageTitle="Report Details">
        <div className="portal-alert portal-alert-danger">
          <i className="fa fa-triangle-exclamation" />
          {error || "Report not found or unauthorized"}
        </div>
        <button className="btn btn-secondary" onClick={() => router.push("/portal/reports")}>
          Back to Reports
        </button>
      </PortalShell>
    );
  }

  const canReview = ["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(session.role);
  const isPendingReview = ["SUBMITTED", "REVIEWED"].includes(report.status);
  const canDelete =
    ["CEO", "ADMIN"].includes(session.role) ||
    (report.author.id === session.userId && report.status === "DRAFT");

  return (
    <PortalShell
      userName={session.name}
      userRole={session.role}
      pageTitle="Report Details"
      pageSubtitle={report.title}
    >
      {/* Navigation */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/portal/reports")}>
          <i className="fa fa-arrow-left" /> Back to Reports
        </button>
        {canDelete && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteReport} disabled={submitting}>
            <i className="fa fa-trash-can" /> Delete Report
          </button>
        )}
      </div>

      <div className="portal-grid-3" style={{ gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Left Side: Report content and review decision */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Info */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Document Content</span>
            </div>
            <div className="portal-card-body" style={{ minHeight: 250 }}>
              {report.content ? (
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--portal-text-primary)", fontSize: 14 }}>
                  {report.content}
                </div>
              ) : (
                <div style={{ color: "var(--portal-text-muted)", fontSize: 13, fontStyle: "italic", textAlign: "center", padding: "40px 0" }}>
                  No written content summary provided for this report.
                </div>
              )}

              {report.fileUrl && (
                <div style={{ marginTop: 24, padding: 16, background: "var(--portal-bg-secondary)", borderRadius: "var(--portal-radius)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="fa fa-file-pdf" style={{ fontSize: 24, color: "var(--status-danger)" }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Attachment File</div>
                      <div style={{ fontSize: 11, color: "var(--portal-text-secondary)" }}>Official PDF / SOC / VAPT Artifact</div>
                    </div>
                  </div>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <i className="fa fa-download" /> Download Document
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Review Decision Board */}
          {canReview && isPendingReview && (
            <div className="portal-card">
              <div className="portal-card-header">
                <span className="portal-card-title">Review Decision board</span>
              </div>
              <div className="portal-card-body">
                <div className="form-group">
                  <label htmlFor="reviewer-feedback" className="form-label">Reviewer Note / Feedback</label>
                  <textarea
                    id="reviewer-feedback"
                    className="form-control"
                    placeholder="Provide feedback on the report quality or reasons for rejection…"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    style={{ minHeight: 80 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => handleReviewAction("APPROVED")}
                    disabled={submitting}
                  >
                    <i className="fa fa-circle-check" /> Approve Report
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => handleReviewAction("REJECTED")}
                    disabled={submitting}
                  >
                    <i className="fa fa-circle-xmark" /> Reject Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Display if not pending */}
          {!isPendingReview && report.reviewNote && (
            <div className="portal-card">
              <div className="portal-card-header">
                <span className="portal-card-title">Reviewer Feedback</span>
              </div>
              <div className="portal-card-body" style={{ background: report.status === "APPROVED" ? "var(--status-success-bg)" : "var(--status-danger-bg)" }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: report.status === "APPROVED" ? "#15803D" : "#B91C1C", marginBottom: 6 }}>
                  Decision Reviewer Feedback Note
                </p>
                <p style={{ fontSize: 13, color: "var(--portal-text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {report.reviewNote}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Document Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Metadata */}
          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Document Meta</span>
            </div>
            <div className="portal-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Status</span>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge label={report.status} variant={statusVariantForReportStatus(report.status)} dot />
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Type</span>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{report.type} Document</div>
              </div>

              {report.project && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Project Link</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                    <a href={`/portal/projects/${report.project.id}`} style={{ color: "var(--portal-teal)" }}>
                      <i className="fa fa-folder-open" style={{ marginRight: 6 }} />
                      {report.project.title}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Author</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div className="portal-avatar portal-avatar-sm" style={{ background: "var(--portal-navy)" }}>
                    {report.author.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{report.author.name}</div>
                    <div style={{ fontSize: 10, color: "var(--portal-text-secondary)" }}>{report.author.role}</div>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Created On</span>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--portal-text-primary)", marginTop: 2 }}>
                  {formatDate(report.createdAt)}
                </div>
              </div>

              {report.reviewedBy && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--portal-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Reviewed By</span>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    {report.reviewedBy.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
