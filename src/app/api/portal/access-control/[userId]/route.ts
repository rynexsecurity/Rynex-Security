import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/portal/auth';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['ADMIN', 'CEO'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  const { allowedIp } = await req.json();

  // Validate IP format (basic)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-fA-F0-9:]+$/;
  if (allowedIp && !ipRegex.test(allowedIp.trim())) {
    return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { allowedIp: allowedIp ? allowedIp.trim() : null },
    select: { id: true, name: true, email: true, allowedIp: true },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.userId,
      action: 'UPDATE_USER_IP',
      entityType: 'User',
      entityId: userId,
      details: `Allowed IP set to: ${allowedIp ?? 'null (unrestricted)'}`,
    },
  });

  return NextResponse.json({ success: true, user: updated });
}
