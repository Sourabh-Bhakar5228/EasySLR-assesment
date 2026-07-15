import prisma from '@/lib/prisma';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  let articles: any[] = [];
  let dbError = false;

  try {
    articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Articles</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Browse, review, and filter clinical articles imported into active scopes.
        </p>
      </div>

      {dbError && (
        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
          Notice: Database connection not yet active. Run DB migrations to activate.
        </div>
      )}

      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            Article Database
          </CardTitle>
          <CardDescription className="text-xs">
            Review status, PMIDs, priorities, and citations for screening literature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Articles Uploaded"
              description="Articles will appear here once imported. Excel importing is scheduled for Day 2."
              className="py-12"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PMID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((art) => (
                  <TableRow key={art.id}>
                    <TableCell className="font-mono text-xs text-slate-550">{art.pmid || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                      {art.title}
                    </TableCell>
                    <TableCell className="text-sm text-slate-650 dark:text-slate-400 truncate max-w-[150px]">
                      {art.authors || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350">
                        {art.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-650 dark:bg-primary-950/20 dark:text-primary-400">
                        {art.priority}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
