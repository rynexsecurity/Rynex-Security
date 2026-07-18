import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { Role, ProjectStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as ProjectStatus | null;

    let projects;

    const include = {
      client: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      _count: { select: { tasks: true, reports: true } },
    };

    const statusFilter = status ? { status } : {};

    if (["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      projects = await prisma.project.findMany({
        where: statusFilter,
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "HEAD") {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { teamId: true },
      });
      projects = await prisma.project.findMany({
        where: { teamId: user?.teamId ?? "none", ...statusFilter },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "INTERN") {
      // Interns see projects they are assigned to
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: session.userId } },
          ...statusFilter,
        },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "CLIENT") {
      // Clients see only their own project(s)
      projects = await prisma.project.findMany({
        where: { clientId: session.userId, ...statusFilter },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[Projects API] GET error:", error);
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

    const body = await req.json();
    const { title, description, clientId, teamId, startDate, deadline, status } = body;

    if (!title) {
      return NextResponse.json({ error: "Project title is required." }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        clientId: clientId || null,
        teamId: teamId || null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: status ?? "NOT_STARTED",
        progressPercent: 0,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        _count: { select: { tasks: true, reports: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "PROJECT_CREATED",
        entityType: "PROJECT",
        entityId: project.id,
        details: `Created project: ${project.title}`,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[Projects API] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
