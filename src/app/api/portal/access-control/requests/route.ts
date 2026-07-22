import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/portal/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'CEO'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requests = await db.loginRequest.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ requests });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'CEO'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { requestId, action, adminNote } = await req.json();
  if (!requestId || !['APPROVE', 'DENY'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const loginRequest = await db.loginRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!loginRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (loginRequest.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is already resolved' }, { status: 400 });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'DENIED';

  // Update the login request
  await db.loginRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      adminNote: adminNote || null,
      resolvedAt: new Date(),
      resolvedById: session.userId,
    },
  });

  // If approved, update the user's allowedIp
  if (action === 'APPROVE') {
    await db.user.update({
      where: { id: loginRequest.userId },
      data: { allowedIp: loginRequest.requestedIp },
    });

    // Notify the user
    await db.notification.create({
      data: {
        userId: loginRequest.userId,
        title: 'Login IP Approved',
        body: `Your login from IP ${loginRequest.requestedIp} has been approved by an administrator. You may now sign in.`,
        link: '/portal/login',
      },
    });
  } else {
    // Notify user of denial
    await db.notification.create({
      data: {
        userId: loginRequest.userId,
        title: 'Login IP Request Denied',
        body: `Your login attempt from IP ${loginRequest.requestedIp} was denied by an administrator.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        link: '/portal/login',
      },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.userId,
      action: `LOGIN_REQUEST_${newStatus}`,
      entityType: 'LoginRequest',
      entityId: requestId,
      details: `${action} login request for ${loginRequest.user.name} (${loginRequest.user.email}) from IP ${loginRequest.requestedIp}${adminNote ? `. Note: ${adminNote}` : ''}`,
    },
  });

  return NextResponse.json({ success: true, status: newStatus });
}
