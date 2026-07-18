import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { hasPermission } from "@/lib/portal/permissions";
import { Role, ReportStatus } from "@prisma/client";
import { sendReportSubmittedEmail, sendReportStatusEmail } from "@/lib/portal/mailer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status") as ReportStatus | null;

    const statusFilter = status ? { status } : {};
    const projectFilter = projectId ? { projectId } : {};

    let reports;

    const include = {
      author: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    };

    if (["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      reports = await prisma.report.findMany({
        where: { ...statusFilter, ...projectFilter },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "HEAD") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { teamId: true },
      });
      // Head sees reports from projects in their team
      reports = await prisma.report.findMany({
        where: {
          project: { teamId: user?.teamId ?? "none" },
          ...statusFilter,
          ...projectFilter,
        },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "INTERN") {
      // Interns see their own reports only
      reports = await prisma.report.findMany({
        where: { authorId: session.userId, ...statusFilter, ...projectFilter },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "CLIENT") {
      // Clients see approved reports for their project
      reports = await prisma.report.findMany({
        where: {
          project: { clientId: session.userId },
          status: "APPROVED",
          ...projectFilter,
        },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[Reports API] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    if (!hasPermission(role, "submit_reports")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, fileUrl, type, projectId, status } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Report title is required." }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        title: title.trim(),
        content: content?.trim() ?? null,
        fileUrl: fileUrl ?? null,
        type: type ?? "GENERAL",
        status: status ?? "SUBMITTED",
        projectId: projectId || null,
        authorId: session.userId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Notify admins/CEO
    const notifyUsers = await prisma.user.findMany({
      where: { role: { in: ["CEO", "ADMIN"] }, isActive: true },
      select: { email: true },
    });

    const portalUrl = process.env.SITE_URL ?? "https://rynexsecurity.com";
    const reportUrl = `${portalUrl}/portal/reports/${report.id}`;

    const notifyEmails = notifyUsers.map((u) => u.email);
    if (notifyEmails.length > 0) {
      try {
        await sendReportSubmittedEmail({
          to: notifyEmails,
          submitterName: report.author.name,
          reportTitle: report.title,
          reportType: report.type,
          projectTitle: report.project?.title ?? "General",
          reportUrl,
        });
      } catch (emailErr) {
        console.error("[Reports API] Notification email failed:", emailErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "REPORT_SUBMITTED",
        entityType: "REPORT",
        entityId: report.id,
        details: `Submitted report: ${report.title}`,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[Reports API] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Used for batch approve/review actions
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    if (!hasPermission(role, "approve_reports")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status, reviewNote } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Report ID and status are required." }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        reviewedById: session.userId,
        reviewNote: reviewNote ?? null,
      },
      include: {
        author: { select: { email: true, name: true } },
        project: { select: { title: true } },
      },
    });

    // Notify author
    if (status === "APPROVED" || status === "REJECTED") {
      const portalUrl = process.env.SITE_URL ?? "https://rynexsecurity.com";
      try {
        await sendReportStatusEmail({
          to: report.author.email,
          authorName: report.author.name,
          reportTitle: report.title,
          status: status as "APPROVED" | "REJECTED",
          reviewNote: reviewNote,
          reportUrl: `${portalUrl}/portal/reports/${report.id}`,
        });
      } catch (emailErr) {
        console.error("[Reports API] Status email failed:", emailErr);
      }
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[Reports API] PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
