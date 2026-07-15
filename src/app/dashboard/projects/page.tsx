import prisma from '@/lib/prisma';
import { FolderKanban } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: any[] = [];
  let dbError = false;

  try {
    projects = await prisma.project.findMany({
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    dbError = true;
    projects = [
      {
        id: 'proj-1',
        name: 'COVID Review',
        description: 'Systematic review of COVID-19 transmission models and clinical outcomes.',
        organization: { name: 'EasySLR' },
        createdAt: new Date(),
      },
      {
        id: 'proj-2',
        name: 'Heart Disease Review',
        description: 'Review of machine learning algorithms for coronary heart disease forecasting.',
        organization: { name: 'EasySLR' },
        createdAt: new Date(),
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Select or manage active Systematic Literature Review projects.
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
            <FolderKanban className="h-5 w-5 text-primary-500" />
            Active Projects
          </CardTitle>
          <CardDescription className="text-xs">
            Review workspace panels allocated for your Systematic Reviews (SLRs).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((proj) => (
                <TableRow key={proj.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    {proj.name}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-350 text-sm max-w-xs truncate">
                    {proj.description || 'No description'}
                  </TableCell>
                  <TableCell className="text-slate-650 dark:text-slate-400 text-sm">
                    {proj.organization?.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-550">{proj.id}</TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(proj.createdAt).toLocaleDateString()}
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
