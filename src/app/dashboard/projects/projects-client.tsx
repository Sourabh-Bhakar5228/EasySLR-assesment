'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { FolderKanban, Edit2, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FormInput } from '@/components/ui/form-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createProject,
  updateProject,
  deleteProject,
  getAllUsers,
  getProjectMembersList,
  addProjectMember,
  removeProjectMember
} from '@/actions/projects';
import { ProjectRole } from '@prisma/client';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().min(1, 'Please select an organization'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Organization {
  id: string;
  name: string;
}

interface ProjectMember {
  role: ProjectRole;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  organization: {
    name: string;
  };
  members: ProjectMember[];
}

interface ProjectsClientProps {
  initialProjects: Project[];
  organizations: Organization[];
  canCreateProject?: boolean;
}

export function ProjectsClient({
  initialProjects,
  organizations,
  canCreateProject = true,
}: ProjectsClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingProj, setEditingProj] = React.useState<Project | null>(null);
  const [deletingProj, setDeletingProj] = React.useState<Project | null>(null);
  const [isMutating, setIsMutating] = React.useState(false);

  const [managingMembersProj, setManagingMembersProj] = React.useState<Project | null>(null);
  const [allUsers, setAllUsers] = React.useState<{ id: string; email: string; name: string | null }[]>([]);
  const [currentMembers, setCurrentMembers] = React.useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = React.useState<string>('');
  const [selectedMemberRole, setSelectedMemberRole] = React.useState<ProjectRole>(ProjectRole.REVIEWER);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);

  React.useEffect(() => {
    async function loadMembersData() {
      if (!managingMembersProj) return;
      setIsLoadingMembers(true);
      try {
        const [usersRes, membersRes] = await Promise.all([
          getAllUsers(),
          getProjectMembersList(managingMembersProj.id)
        ]);
        setAllUsers(usersRes);
        setCurrentMembers(membersRes);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load member details.');
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadMembersData();
  }, [managingMembersProj]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMembersProj || !selectedUserEmail) return;
    setIsMutating(true);
    const toastId = toast.loading('Adding project member...');
    try {
      const res = await addProjectMember(managingMembersProj.id, selectedUserEmail, selectedMemberRole);
      if (res.success) {
        toast.success('Member added successfully!', { id: toastId });
        // Reload members
        const membersRes = await getProjectMembersList(managingMembersProj.id);
        setCurrentMembers(membersRes);
        setSelectedUserEmail('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member.', { id: toastId });
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!managingMembersProj) return;
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    setIsMutating(true);
    const toastId = toast.loading('Removing member...');
    try {
      const res = await removeProjectMember(managingMembersProj.id, userId);
      if (res.success) {
        toast.success('Member removed successfully!', { id: toastId });
        // Reload members
        const membersRes = await getProjectMembersList(managingMembersProj.id);
        setCurrentMembers(membersRes);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member.', { id: toastId });
    } finally {
      setIsMutating(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      organizationId: '',
    },
  });

  React.useEffect(() => {
    if (editingProj) {
      setValue('name', editingProj.name);
      setValue('description', editingProj.description || '');
      setValue('organizationId', editingProj.organizationId);
      setIsOpen(true);
    } else {
      setValue('name', '');
      setValue('description', '');
      setValue('organizationId', organizations[0]?.id || '');
    }
  }, [editingProj, setValue, organizations]);

  const handleClose = () => {
    setIsOpen(false);
    setEditingProj(null);
    reset();
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setIsMutating(true);
    try {
      if (editingProj) {
        await updateProject(editingProj.id, data.name, data.description, data.organizationId);
        toast.success('Project updated successfully!');
        handleClose();
        router.refresh();
      } else {
        await createProject(data.name, data.description, data.organizationId);
        toast.success('Project created! Now import articles.');
        handleClose();
        router.push('/dashboard/import');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProj) return;
    setIsMutating(true);
    try {
      await deleteProject(deletingProj.id);
      toast.success('Project deleted successfully!');
      setDeletingProj(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsMutating(false);
    }
  };

  const columns: Column<Project>[] = [
    {
      header: 'Project Name',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span>
          {row.description && (
            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Organization',
      accessor: (row) => (
        <span className="text-sm text-slate-650 dark:text-slate-400">{row.organization.name}</span>
      ),
    },
    {
      header: 'My Role',
      accessor: (row) => {
        const role = row.members[0]?.role || ProjectRole.REVIEWER;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              role === ProjectRole.OWNER
                ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
            }`}
          >
            {role}
          </span>
        );
      },
    },
    {
      header: 'Created At',
      accessor: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isOwner = row.members[0]?.role === ProjectRole.OWNER;
        if (!isOwner) return null;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-indigo-500 hover:text-indigo-650"
              onClick={() => setManagingMembersProj(row)}
            >
              <Users className="h-4.5 w-4.5" />
              <span className="sr-only">Manage Members</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setEditingProj(row)}
            >
              <Edit2 className="h-4 w-4 text-slate-500" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-650"
              onClick={() => setDeletingProj(row)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
      className: 'w-[100px] text-right',
    },
  ];

  const hasOrgs = organizations.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Select or manage active Systematic Literature Review projects.
          </p>
        </div>
        {canCreateProject && (
          <Button
            onClick={() => {
              if (!hasOrgs) {
                toast.error('Please create an organization first!');
                return;
              }
              setIsOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        )}
      </div>

      {!hasOrgs && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-amber-800 dark:text-amber-400">
            <strong>Action Required:</strong> You need an organization profile to host literature reviews. Please create an organization first.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/organizations')}
            className="self-start sm:self-auto border-amber-300 dark:border-amber-900/60 hover:bg-amber-100"
          >
            Create Organization
          </Button>
        </div>
      )}

      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary-500" />
            Active Projects
          </CardTitle>
          <CardDescription className="text-xs">
            Review workspace panels allocated for your Systematic Reviews (SLRs).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={initialProjects}
            emptyIcon={FolderKanban}
            emptyTitle="No Projects Found"
            emptyDescription="Create a literature review project and select an organization to get started."
          />
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={editingProj ? 'Edit Project' : 'Create Project'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            {...register('name')}
            label="Project Name"
            placeholder="e.g. COVID Review"
            error={errors.name?.message}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Provide a brief summary of the literature screening targets..."
              rows={3}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm placeholder:text-slate-405 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-700"
            />
            {errors.description?.message && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
              Organization
            </label>
            <select
              {...register('organizationId')}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.organizationId?.message && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.organizationId.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/85">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <SubmitButton size="sm" isLoading={isMutating}>
              {editingProj ? 'Save Changes' : 'Create'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProj}
        onClose={() => setDeletingProj(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProj?.name}"? All clinical articles and reviewer notes will be permanently deleted. This action cannot be undone.`}
        isLoading={isMutating}
      />

      {/* Manage Members Modal */}
      <Modal
        isOpen={!!managingMembersProj}
        onClose={() => setManagingMembersProj(null)}
        title={`Manage Members - ${managingMembersProj?.name}`}
      >
        <div className="space-y-6">
          {/* Current Members List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Members</h3>
            {isLoadingMembers ? (
              <div className="text-center py-4 text-xs text-slate-500">Loading members...</div>
            ) : currentMembers.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">No members found.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{m.user.name || 'User'}</p>
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        m.role === 'OWNER'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
                      }`}>
                        {m.role}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleRemoveMember(m.user.id)}
                        disabled={isMutating}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Member Form */}
          <form onSubmit={handleAddMember} className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assign New Member</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">Select User</label>
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                required
              >
                <option value="">-- Choose User --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email} {u.name ? `(${u.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-wider">Project Role</label>
              <select
                value={selectedMemberRole}
                onChange={(e) => setSelectedMemberRole(e.target.value as ProjectRole)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value={ProjectRole.REVIEWER}>REVIEWER (Literature Screening)</option>
                <option value={ProjectRole.OWNER}>OWNER (Full Admin Access)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManagingMembersProj(null)}
              >
                Close
              </Button>
              <SubmitButton size="sm" isLoading={isMutating}>
                Assign Member
              </SubmitButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
