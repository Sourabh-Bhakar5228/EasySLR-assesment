import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProjectsClient } from './projects-client';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch only projects the user is a member of (Server-side authorization)
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
      members: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch all organizations for project selection
  const organizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  // Check if they are a reviewer in all their projects (cannot create projects)
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
  });

  const canCreateProject = memberships.length === 0 || memberships.some((m) => m.role === 'OWNER');

  return (
    <ProjectsClient
      initialProjects={projects as any}
      organizations={organizations}
      canCreateProject={canCreateProject}
    />
  );
}
