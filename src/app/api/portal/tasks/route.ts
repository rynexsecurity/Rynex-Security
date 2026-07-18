import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { hasPermission } from "@/lib/portal/permissions";
import { Role } from "@prisma/client";
import { sendTaskAssignedEmail } from "@/lib/portal/mailer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    let tasks;

    const include = {
      assignedTo: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    };

    const projectFilter = projectId ? { projectId } : {};

    if (["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      tasks = await prisma.task.findMany({
        where: projectFilter,
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "HEAD") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { teamId: true },
      });
      tasks = await prisma.task.findMany({
        where: {
          project: { teamId: user?.teamId ?? "none" },
          ...projectFilter,
        },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "INTERN") {
      tasks = await prisma.task.findMany({
        where: { assignedToId: session.userId, ...projectFilter },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[Tasks API] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    if (!["CEO", "ADMIN", "DEVELOPER", "HEAD"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, projectId, assignedToId, priority, dueDate } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        projectId: projectId || null,
        assignedToId: assignedToId || null,
        assignedById: session.userId,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "TODO",
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Notify assignee
    if (task.assignedTo) {
      const portalUrl = process.env.SITE_URL ?? "https://rynexsecurity.com";
      try {
        await sendTaskAssignedEmail({
          to: task.assignedTo.email,
          assigneeName: task.assignedTo.name,
          taskTitle: task.title,
          projectTitle: task.project?.title ?? "General",
          priority: task.priority,
          dueDate: task.dueDate?.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          }),
          portalUrl: `${portalUrl}/portal/tasks`,
        });
      } catch (emailErr) {
        console.error("[Tasks API] Assignment email failed:", emailErr);
      }
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[Tasks API] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, priority, title, description, dueDate, assignedToId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "DONE") updateData.completedAt = new Date();
    }
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[Tasks API] PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
