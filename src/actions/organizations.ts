'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireOrgOwner, requireOwnerPrivilegeToCreate } from '@/lib/rbac';

export async function createOrganization(name: string) {
  await requireOwnerPrivilegeToCreate();

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Organization name is required');
  }

  // Check unique name
  const existing = await prisma.organization.findUnique({
    where: { name: cleanName },
  });
  if (existing) {
    throw new Error('An organization with this name already exists');
  }

  try {
    const org = await prisma.organization.create({
      data: { name: cleanName },
    });
    revalidatePath('/dashboard/organizations');
    revalidatePath('/dashboard');
    return { success: true, org };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create organization');
  }
}

export async function updateOrganization(id: string, name: string) {
  await requireOrgOwner(id);

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Organization name is required');
  }

  // Check unique name on other organizations
  const existing = await prisma.organization.findFirst({
    where: {
      name: cleanName,
      NOT: { id },
    },
  });
  if (existing) {
    throw new Error('An organization with this name already exists');
  }

  try {
    const org = await prisma.organization.update({
      where: { id },
      data: { name: cleanName },
    });
    revalidatePath('/dashboard/organizations');
    revalidatePath('/dashboard');
    return { success: true, org };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update organization');
  }
}

export async function deleteOrganization(id: string) {
  await requireOrgOwner(id);

  try {
    await prisma.organization.delete({
      where: { id },
    });
    revalidatePath('/dashboard/organizations');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete organization');
  }
}
