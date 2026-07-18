import prisma from '@/lib/prisma';
import { OrganizationsClient } from './organizations-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let canCreateOrg = true;
  let ownedOrgIds: string[] = [];

  if (userId) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          select: { organizationId: true },
        },
      },
    });

    if (memberships.length > 0) {
      const hasOwnerRole = memberships.some((m) => m.role === ProjectRole.OWNER);
      canCreateOrg = hasOwnerRole;

      ownedOrgIds = memberships
        .filter((m) => m.role === ProjectRole.OWNER)
        .map((m) => m.project.organizationId);
    }
  }

  return (
    <OrganizationsClient
      initialOrganizations={organizations}
      canCreateOrg={canCreateOrg}
      ownedOrgIds={ownedOrgIds}
    />
  );
}
