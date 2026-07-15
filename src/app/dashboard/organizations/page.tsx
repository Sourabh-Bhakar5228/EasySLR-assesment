import prisma from '@/lib/prisma';
import { Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  let organizations: any[] = [];
  let dbError = false;

  try {
    organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    dbError = true;
    // Fallback static list for preview before migration runs
    organizations = [
      {
        id: 'fallback-org-id',
        name: 'EasySLR (Seeded Profile)',
        createdAt: new Date(),
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Organizations</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Manage your organizational settings, divisions, and collaborative scopes.
        </p>
      </div>

      {dbError && (
        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
          Notice: Database connection not yet active. Showing local model layout. Run DB migrations to activate.
        </div>
      )}

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    {org.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-550">{org.id}</TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
