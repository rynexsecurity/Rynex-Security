import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { Role } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        team: {
          select: {
            id: true, name: true,
            head: { select: { id: true, name: true, email: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        reports: {
          select: {
            id: true, title: true, type: true, status: true, createdAt: true,
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          select: {
            id: true, title: true, status: true, priority: true, dueDate: true,
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        messages: {
          select: {
            id: true, threadId: true, content: true, createdAt: true, isRead: true,
            sender: { select: { id: true, name: true, role: true } },
            receiver: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[Projects API] GET [id] error:", error);
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

    const role = session.role as Role;

    if (!["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, description, clientId, teamId, startDate, deadline,
      status, progressPercent, addMember, removeMember
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() ?? null;
    if (clientId !== undefined) updateData.clientId = clientId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) updateData.status = status;
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Handle member additions/removals
    if (addMember) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: id, userId: addMember.userId } },
        create: { projectId: id, userId: addMember.userId, memberRole: addMember.memberRole ?? "WORKER" },
        update: { memberRole: addMember.memberRole ?? "WORKER" },
      });
    }

    if (removeMember) {
      await prisma.projectMember.deleteMany({
        where: { projectId: id, userId: removeMember },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: id,
        details: `Updated project: ${project.title}`,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[Projects API] PATCH error:", error);
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

    if (!["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "PROJECT_DELETED",
        entityType: "PROJECT",
        entityId: id,
        details: "Project deleted",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Projects API] DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
