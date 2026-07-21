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

    const { role } = session;

    if (role === 'INTERN' || role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teams = await db.team.findMany({
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSessionUser(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role: creatorRole, userId: creatorId } = session;

    // Permissions check
    if (creatorRole !== 'CEO' && creatorRole !== 'ADMIN' && creatorRole !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, department, headId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Verify if head exists and has appropriate role
    if (headId) {
      const headUser = await db.user.findUnique({ where: { id: headId } });
      if (!headUser) {
        return NextResponse.json({ error: 'Selected team head user not found' }, { status: 400 });
      }
      if (headUser.role !== 'HEAD' && headUser.role !== 'DEVELOPER' && headUser.role !== 'CEO' && headUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Selected user cannot be assigned as team head' }, { status: 400 });
      }
    }

    // Create Team
    const team = await db.team.create({
      data: {
        name,
        department: department || 'TECHNICAL',
        headId: headId || null,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: creatorId,
        action: 'CREATE_TEAM',
        entityType: 'Team',
        entityId: team.id,
        details: `Created team ${name} with headId ${headId || 'none'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team,
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating team' },
      { status: 500 }
    );
  }
}
