'use server';

import prisma from '@/lib/prisma';
import { ProjectRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireProjectOwner, requireOwnerPrivilegeToCreate, requireOrgOwner } from '@/lib/rbac';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getUserRoleStatus() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { isOwner: false };
  }
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
  });
  const isOwner = memberships.length === 0 || memberships.some((m) => m.role === ProjectRole.OWNER);
  return { isOwner };
}

export async function createProject(name: string, description: string | undefined, organizationId: string) {
  const user = await requireAuth();
  await requireOwnerPrivilegeToCreate();

  // If organization already has projects, verify user is an OWNER of at least one project in this organization
  const projectCount = await prisma.project.count({
    where: { organizationId },
  });
  if (projectCount > 0) {
    await requireOrgOwner(organizationId);
  }

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Project name is required');
  }

  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  // Check composite unique constraints (name + organizationId)
  const existing = await prisma.project.findFirst({
    where: {
      name: cleanName,
      organizationId,
    },
  });
  if (existing) {
    throw new Error('A project with this name already exists in this organization');
  }

  try {
    // Prisma transaction: create project and assign user as OWNER
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name: cleanName,
          description: description?.trim() || null,
          organizationId,
        },
      });

      await tx.projectMember.create({
        data: {
          role: ProjectRole.OWNER,
          userId: user.id,
          projectId: proj.id,
        },
      });

      return proj;
    });

    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard');
    return { success: true, project };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create project');
  }
}

export async function updateProject(
  id: string,
  name: string,
  description: string | undefined,
  organizationId: string
) {
  await requireProjectOwner(id);

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Project name is required');
  }

  // Check unique constraints (name + organizationId) excluding this project
  const existing = await prisma.project.findFirst({
    where: {
      name: cleanName,
      organizationId,
      NOT: { id },
    },
  });
  if (existing) {
    throw new Error('A project with this name already exists in this organization');
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: cleanName,
        description: description?.trim() || null,
        organizationId,
      },
    });

    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard');
    return { success: true, project };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update project');
  }
}

export async function deleteProject(id: string) {
  await requireProjectOwner(id);

  try {
    await prisma.project.delete({
      where: { id },
    });

    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete project');
  }
}

export async function getAllUsers() {
  await requireAuth();
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: { email: 'asc' },
  });
}

export async function getProjectMembersList(projectId: string) {
  await requireProjectOwner(projectId); // Only OWNERs can manage project members
  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { role: 'asc' },
  });
}

export async function addProjectMember(projectId: string, email: string, role: ProjectRole) {
  await requireProjectOwner(projectId);

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Email is required.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!targetUser) {
    throw new Error('User not found with this email.');
  }

  // Check if already a member
  const existing = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: targetUser.id,
        projectId,
      },
    },
  });

  if (existing) {
    throw new Error('User is already a member of this project.');
  }

  try {
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
      },
    });

    revalidatePath('/dashboard/projects');
    return { success: true, member };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add member to the project.');
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireProjectOwner(projectId);

  // Check if target is the last owner of the project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });

  if (!membership) {
    throw new Error('Membership not found.');
  }

  if (membership.role === ProjectRole.OWNER) {
    const ownersCount = await prisma.projectMember.count({
      where: {
        projectId,
        role: ProjectRole.OWNER,
      },
    });
    if (ownersCount <= 1) {
      throw new Error('Cannot remove the last OWNER of the project.');
    }
  }

  try {
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove member from the project.');
  }
}
