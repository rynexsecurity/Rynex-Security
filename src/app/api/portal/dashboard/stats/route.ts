import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSessionUser(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, userId, teamId } = session;

    // Role-filtered queries for stats
    let totalProjects = 0;
    let activeTasks = 0;
    let totalReports = 0;
    let totalUsers = 0;
    let recentTasks: any[] = [];
    let recentReports: any[] = [];
    let systemAlerts: any[] = [];

    if (['CEO', 'ADMIN', 'DIRECTOR'].includes(role)) {
      // Full system overview
      totalProjects = await db.project.count();
      activeTasks = await db.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } });
      totalReports = await db.report.count();
      totalUsers = await db.user.count({ where: { isActive: true } });

      recentTasks = await db.task.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          assignedTo: { select: { name: true, email: true } },
        },
      });

      recentReports = await db.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      });

      systemAlerts = await db.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, role: true } },
        },
      });
    } else if (role === 'HEAD') {
      // Team-scoped overview
      const teamProjects = await db.project.findMany({ where: { teamId }, select: { id: true } });
      const projectIds = teamProjects.map((p) => p.id);

      totalProjects = projectIds.length;
      activeTasks = await db.task.count({
        where: { projectId: { in: projectIds }, status: { in: ['TODO', 'IN_PROGRESS'] } },
      });
      totalReports = await db.report.count({ where: { projectId: { in: projectIds } } });
      totalUsers = teamId ? await db.user.count({ where: { teamId, isActive: true } }) : 0;

      recentTasks = await db.task.findMany({
        where: { projectId: { in: projectIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          assignedTo: { select: { name: true, email: true } },
        },
      });

      recentReports = await db.report.findMany({
        where: { projectId: { in: projectIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      });
    } else if (role === 'DEVELOPER' || role === 'INTERN') {
      // Worker-scoped overview
      activeTasks = await db.task.count({
        where: { assignedToId: userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      });
      totalReports = await db.report.count({ where: { authorId: userId } });
      
      const userProjects = await db.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      totalProjects = userProjects.length;

      recentTasks = await db.task.findMany({
        where: { assignedToId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          assignedTo: { select: { name: true, email: true } },
        },
      });

      recentReports = await db.report.findMany({
        where: { authorId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true, email: true } },
        },
      });
    } else if (role === 'CLIENT') {
      // Client-scoped overview
      const clientProjects = await db.project.findMany({ where: { clientId: userId }, select: { id: true } });
      const projectIds = clientProjects.map((p) => p.id);

      totalProjects = projectIds.length;
      activeTasks = await db.task.count({ where: { projectId: { in: projectIds }, status: { in: ['TODO', 'IN_PROGRESS'] } } });
      totalReports = await db.report.count({ where: { projectId: { in: projectIds } } });

      recentTasks = await db.task.findMany({
        where: { projectId: { in: projectIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          assignedTo: { select: { name: true } },
        },
      });

      recentReports = await db.report.findMany({
        where: { projectId: { in: projectIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { title: true } },
          author: { select: { name: true } },
        },
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects,
        activeTasks,
        totalReports,
        totalUsers,
        recentTasks,
        recentReports,
        systemAlerts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
