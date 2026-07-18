import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  requireAuth, 
  requireProjectMember, 
  requireProjectOwner, 
  requireOrgOwner, 
  requireOwnerPrivilegeToCreate 
} from './rbac';
import { getServerSession } from 'next-auth';
import prisma from './prisma';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('./prisma', () => ({
  default: {
    project: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('rbac authorization guards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('requireAuth', () => {
    it('should return session user if logged in', async () => {
      const mockUser = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: mockUser });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
    });

    it('should throw 401 if not logged in', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      await expect(requireAuth()).rejects.toThrow('401 Unauthenticated');
    });
  });

  describe('requireProjectMember', () => {
    it('should throw 404 if project does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null); // project not found

      await expect(requireProjectMember('proj_1')).rejects.toThrow('404 Not Found');
    });

    it('should throw 403 if user is not a project member', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce({ id: 'proj_1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null); // no membership

      await expect(requireProjectMember('proj_1')).rejects.toThrow('403 Forbidden');
    });

    it('should return membership if user is project member', async () => {
      const mockMembership = { id: 'mem_1', userId: 'user_1', projectId: 'proj_1', role: 'REVIEWER' };
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce({ id: 'proj_1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const membership = await requireProjectMember('proj_1');
      expect(membership).toEqual(mockMembership);
    });
  });

  describe('requireProjectOwner', () => {
    it('should throw 403 if user is a member but not an OWNER', async () => {
      const mockMembership = { id: 'mem_1', userId: 'user_1', projectId: 'proj_1', role: 'REVIEWER' };
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce({ id: 'proj_1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      await expect(requireProjectOwner('proj_1')).rejects.toThrow('403 Forbidden: Only project OWNERs');
    });

    it('should return membership if user is OWNER', async () => {
      const mockMembership = { id: 'mem_1', userId: 'user_1', projectId: 'proj_1', role: 'OWNER' };
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce({ id: 'proj_1' } as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const membership = await requireProjectOwner('proj_1');
      expect(membership).toEqual(mockMembership);
    });
  });

  describe('requireOrgOwner', () => {
    it('should throw 403 if user does not own any project in the organization', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValueOnce(null);

      await expect(requireOrgOwner('org_1')).rejects.toThrow('403 Forbidden');
    });

    it('should return project member record if user owns a project in the organization', async () => {
      const mockOwnerRecord = { id: 'mem_1', userId: 'user_1', role: 'OWNER' };
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValueOnce(mockOwnerRecord as any);

      const result = await requireOrgOwner('org_1');
      expect(result).toEqual(mockOwnerRecord);
    });
  });

  describe('requireOwnerPrivilegeToCreate', () => {
    it('should throw 403 if user has memberships but none are OWNER role', async () => {
      const mockMemberships = [
        { id: 'mem_1', role: 'REVIEWER' },
        { id: 'mem_2', role: 'REVIEWER' },
      ];
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.projectMember.findMany).mockResolvedValueOnce(mockMemberships as any);

      await expect(requireOwnerPrivilegeToCreate()).rejects.toThrow('403 Forbidden: Reviewers cannot create');
    });

    it('should pass if user has no memberships at all', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.projectMember.findMany).mockResolvedValueOnce([]);

      await expect(requireOwnerPrivilegeToCreate()).resolves.toBeUndefined();
    });

    it('should pass if user owns at least one project', async () => {
      const mockMemberships = [
        { id: 'mem_1', role: 'REVIEWER' },
        { id: 'mem_2', role: 'OWNER' },
      ];
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user_1' } });
      vi.mocked(prisma.projectMember.findMany).mockResolvedValueOnce(mockMemberships as any);

      await expect(requireOwnerPrivilegeToCreate()).resolves.toBeUndefined();
    });
  });
});
