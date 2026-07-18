import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProjectRole } from '@prisma/client';

/**
 * 1. Require Authentication
 * Throws 401 if user is not logged in.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('401 Unauthenticated: Please log in.');
  }
  return session.user;
}

/**
 * 2. Require Project Membership (REVIEWER or OWNER)
 * Throws 403 if user is not a member of the project.
 * Throws 404 if project does not exist.
 */
export async function requireProjectMember(projectId: string) {
  const user = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new Error('404 Not Found: Project does not exist.');
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId,
      },
    },
  });

  if (!membership) {
    throw new Error('403 Forbidden: You do not have access to this project.');
  }

  return membership;
}

/**
 * 3. Require Project Ownership
 * Throws 403 if user is not an OWNER.
 */
export async function requireProjectOwner(projectId: string) {
  const membership = await requireProjectMember(projectId);

  if (membership.role !== ProjectRole.OWNER) {
    throw new Error('403 Forbidden: Only project OWNERs can perform this action.');
  }

  return membership;
}

/**
 * 4. Require Organization Ownership
 * Validates the user is an OWNER of at least one project within the given organization.
 */
export async function requireOrgOwner(organizationId: string) {
  const user = await requireAuth();

  const isOwner = await prisma.projectMember.findFirst({
    where: {
      userId: user.id,
      role: ProjectRole.OWNER,
      project: { organizationId },
    },
  });

  if (!isOwner) {
    throw new Error('403 Forbidden: Only organization project OWNERs can modify this organization.');
  }

  return isOwner;
}

/**
 * 5. Require Owner Privilege to Create Project / Org
 * Throws 403 if user is a member of any project but doesn't own at least one.
 */
export async function requireOwnerPrivilegeToCreate() {
  const user = await requireAuth();

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
  });

  if (memberships.length > 0) {
    const hasOwnerRole = memberships.some((m) => m.role === ProjectRole.OWNER);
    if (!hasOwnerRole) {
      throw new Error('403 Forbidden: Reviewers cannot create projects or organizations.');
    }
  }
}

