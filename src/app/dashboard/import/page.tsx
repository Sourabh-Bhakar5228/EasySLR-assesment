import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ImportClient from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Restrict to project OWNERs only
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
  });
  const isOwner = memberships.length === 0 || memberships.some((m) => m.role === 'OWNER');

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">403</h1>
        <p className="text-lg font-semibold text-slate-650 dark:text-slate-400">Forbidden: Access Denied</p>
        <p className="text-sm text-slate-500 max-w-md">You do not have the required permissions (OWNER) to access the import workspace.</p>
      </div>
    );
  }

  // Fetch projects where user is an OWNER (Reviewers cannot import)
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
          role: 'OWNER'
        },
      },
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Map to simple shape for the client component
  const formattedProjects = projects.map(p => ({
    id: p.id,
    name: p.name,
    orgName: p.organization.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Import Articles</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Import new medical articles and citations from Excel (.xlsx) files using client-side parsing.
        </p>
      </div>

      <ImportClient projects={formattedProjects} />
    </div>
  );
}
