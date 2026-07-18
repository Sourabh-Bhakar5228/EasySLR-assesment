'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Building2, Edit2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FormInput } from '@/components/ui/form-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createOrganization, updateOrganization, deleteOrganization } from '@/actions/organizations';

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
});

type OrgFormValues = z.infer<typeof orgSchema>;

interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

interface OrganizationsClientProps {
  initialOrganizations: Organization[];
  canCreateOrg?: boolean;
  ownedOrgIds?: string[];
}

export function OrganizationsClient({
  initialOrganizations,
  canCreateOrg = true,
  ownedOrgIds = [],
}: OrganizationsClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingOrg, setEditingOrg] = React.useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = React.useState<Organization | null>(null);
  const [isMutating, setIsMutating] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
    },
  });

  React.useEffect(() => {
    if (editingOrg) {
      setValue('name', editingOrg.name);
      setIsOpen(true);
    } else {
      setValue('name', '');
    }
  }, [editingOrg, setValue]);

  const handleClose = () => {
    setIsOpen(false);
    setEditingOrg(null);
    reset();
  };

  const onSubmit = async (data: OrgFormValues) => {
    setIsMutating(true);
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, data.name);
        toast.success('Organization updated successfully!');
        handleClose();
        router.refresh();
      } else {
        await createOrganization(data.name);
        toast.success('Organization created! Now create a project.');
        handleClose();
        router.push('/dashboard/projects');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrg) return;
    setIsMutating(true);
    try {
      await deleteOrganization(deletingOrg.id);
      toast.success('Organization deleted successfully!');
      setDeletingOrg(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsMutating(false);
    }
  };

  const columns: Column<Organization>[] = [
    {
      header: 'Organization Name',
      accessor: (row) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span>
      ),
    },
    {
      header: 'ID',
      accessor: (row) => <span className="font-mono text-xs text-slate-500">{row.id}</span>,
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
        const canEditOrDelete = ownedOrgIds.includes(row.id);
        if (!canEditOrDelete) return null;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setEditingOrg(row)}
            >
              <Edit2 className="h-4 w-4 text-slate-500" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:hover:text-red-400"
              onClick={() => setDeletingOrg(row)}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Organizations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage your organizational settings, divisions, and collaborative scopes.
          </p>
        </div>
        {canCreateOrg && (
          <Button onClick={() => setIsOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        )}
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-500" />
            Registered Organizations
          </CardTitle>
          <CardDescription className="text-xs">
            A list of all organizations operating within this systematic literature review workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={initialOrganizations}
            emptyIcon={Building2}
            emptyTitle="No Organizations Found"
            emptyDescription="Create a new organization to start setting up literature review projects."
          />
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={editingOrg ? 'Edit Organization' : 'Create Organization'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            {...register('name')}
            label="Organization Name"
            placeholder="e.g. EasySLR"
            error={errors.name?.message}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/85">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <SubmitButton size="sm" isLoading={isMutating}>
              {editingOrg ? 'Save Changes' : 'Create'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingOrg}
        onClose={() => setDeletingOrg(null)}
        onConfirm={handleDelete}
        title="Delete Organization"
        description={`Are you sure you want to delete "${deletingOrg?.name}"? All associated projects and articles will be permanently deleted. This action cannot be undone.`}
        isLoading={isMutating}
      />
    </div>
  );
}
