import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { Role } from "@prisma/client";
import { hasPermission } from "@/lib/portal/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
        project: { select: { id: true, title: true, clientId: true, teamId: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Role visibility logic
    if (role === "CLIENT") {
      // Clients can only see approved reports on their projects
      if (report.status !== "APPROVED" || report.project?.clientId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role === "INTERN") {
      // Interns can only see their own reports
      if (report.authorId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role === "HEAD") {
      // Head can see team reports
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { teamId: true },
      });
      if (report.project?.teamId !== user?.teamId && report.authorId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[Reports API] GET [id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Only author can edit report details, and only if status is DRAFT or SUBMITTED
    if (report.authorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden. Only the author can edit report details." }, { status: 403 });
    }

    if (report.status === "APPROVED") {
      return NextResponse.json({ error: "Approved reports cannot be edited." }, { status: 400 });
    }

    const { title, content, fileUrl, type } = await req.json();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content?.trim() ?? null;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl ?? null;
    if (type !== undefined) updateData.type = type;

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "REPORT_UPDATED",
        entityType: "REPORT",
        entityId: id,
        details: `Updated report: ${updatedReport.title}`,
      },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("[Reports API] PATCH [id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Admins/CEOs can delete any report, authors can delete if DRAFT
    const isAuthorAndDraft = report.authorId === session.userId && report.status === "DRAFT";
    const canDelete = ["CEO", "ADMIN"].includes(role) || isAuthorAndDraft;

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden. Cannot delete this report." }, { status: 403 });
    }

    await prisma.report.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "REPORT_DELETED",
        entityType: "REPORT",
        entityId: id,
        details: `Deleted report: ${report.title}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Reports API] DELETE [id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
