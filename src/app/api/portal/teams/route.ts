import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/portal/prisma";
import { getSession } from "@/lib/portal/auth";
import { hasPermission } from "@/lib/portal/permissions";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    if (!hasPermission(role, "manage_teams")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let teams;

    if (["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      teams = await prisma.team.findMany({
        include: {
          head: { select: { id: true, name: true, email: true, role: true } },
          members: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { projects: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "HEAD") {
      teams = await prisma.team.findMany({
        where: { headId: session.userId },
        include: {
          head: { select: { id: true, name: true, email: true, role: true } },
          members: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { projects: true, members: true } },
        },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("[Teams API] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.role as Role;

    if (!["CEO", "ADMIN", "DEVELOPER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, headId } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: { name: name.trim(), headId: headId || null },
      include: {
        head: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, projects: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "TEAM_CREATED",
        entityType: "TEAM",
        entityId: team.id,
        details: `Created team: ${team.name}`,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("[Teams API] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
