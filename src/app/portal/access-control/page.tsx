import { getSession } from '@/lib/portal/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import AccessControlClient from './AccessControlClient';

export const metadata = {
  title: 'Access Control — Rynex Security Portal',
  description: 'Manage IP-based login access control for all users',
};

export default async function AccessControlPage() {
  const session = await getSession();
  if (!session) redirect('/portal/login');
  if (!['ADMIN', 'CEO'].includes(session.role)) {
    redirect('/portal/dashboard');
  }

  return (
    <AccessControlClient
      sessionName={session.name}
      sessionRole={session.role as Role}
    />
  );
}
