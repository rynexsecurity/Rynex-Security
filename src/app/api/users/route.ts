import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { sendConfirmationEmail } from '@/lib/mailer';
import { buildPortalCredentialsEmail } from '@/lib/email-templates/portal-credentials';

// Helper to check if role has user creation rights
function canCreateRole(creatorRole: string): boolean {
  // Only ADMIN is permitted to create users
  return creatorRole === 'ADMIN';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSessionUser(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, teamId } = session;

    // Permissions check
    if (role === 'DEVELOPER' || role === 'INTERN' || role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let users;

    if (role === 'CEO' || role === 'ADMIN' || role === 'DIRECTOR') {
      // CEO, Admin, and Director see all users
      users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          teamId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          originalEmail: true,
          joiningDate: true,
          probationStart: true,
          probationEnd: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'HEAD') {
      // Head sees only team members
      if (!teamId) {
        users = [];
      } else {
        users = await db.user.findMany({
          where: { teamId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            teamId: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            originalEmail: true,
            joiningDate: true,
            probationStart: true,
            probationEnd: true,
          },
          orderBy: { name: 'asc' },
        });
      }
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching users' },
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

    // Only Admin can create users
    if (!canCreateRole(creatorRole)) {
      return NextResponse.json({ error: 'Only ADMIN accounts can create users' }, { status: 403 });
    }

    const { name, email, role: targetRole, department, password, teamId, originalEmail, joiningDate, probationStart, probationEnd } = await request.json();

    if (!name || !email || !targetRole || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      );
    }

    let finalTeamId = teamId;

    // Check if email already exists
    const emailLower = email.toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db.user.create({
      data: {
        name,
        email: emailLower,
        passwordHash,
        role: targetRole,
        department: department || 'TECHNICAL',
        teamId: finalTeamId || null,
        createdById: creatorId,
        mustChangePassword: true,
        isActive: true,
        originalEmail: originalEmail || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        probationStart: probationStart ? new Date(probationStart) : null,
        probationEnd: probationEnd ? new Date(probationEnd) : null,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: creatorId,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: newUser.id,
        details: `Created user ${name} (${emailLower}) with role ${targetRole}`,
      },
    });

    // Send email with credentials using existing Mailtrap config
    const emailTemplate = buildPortalCredentialsEmail(name, emailLower, password);
    try {
      await sendConfirmationEmail(originalEmail || emailLower, emailTemplate.subject, emailTemplate.html);
      
      // Update notification log
      await db.notification.create({
        data: {
          userId: newUser.id,
          title: 'Welcome to Rynex Portal',
          body: 'Your portal account has been created successfully.',
          emailSent: true,
        },
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
      // We still return success since user is created, but write notification fail
      await db.notification.create({
        data: {
          userId: newUser.id,
          title: 'Welcome to Rynex Portal',
          body: 'Your portal account was created, but notification email failed to send.',
          emailSent: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating user' },
      { status: 500 }
    );
  }
}
