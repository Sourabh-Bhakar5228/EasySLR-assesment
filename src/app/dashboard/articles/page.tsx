import prisma from '@/lib/prisma';
import { FileText, Database } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReviewTable from '@/components/articles/ReviewTable';
import { ArticleStatus, Priority } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    year?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function ArticlesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Resolve Next.js 15 searchParams Promise
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || 'ALL';
  const priority = resolvedParams.priority || 'ALL';
  const projectId = resolvedParams.projectId || 'ALL';
  const year = resolvedParams.year || 'ALL';
  const sortBy = resolvedParams.sortBy || 'createdAt';
  const sortOrder = resolvedParams.sortOrder === 'asc' ? 'asc' : 'desc';

  let paginatedArticles: any[] = [];
  let totalCount = 0;
  let dbError = false;

  // Build Prisma Where Clause
  const whereClause: any = {
    project: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  };

  // Keyword search checks Title, PMID, Authors, DOI
  if (search.trim() !== '') {
    const cleanSearch = search.trim();
    whereClause.OR = [
      { title: { contains: cleanSearch, mode: 'insensitive' } },
      { pmid: { contains: cleanSearch, mode: 'insensitive' } },
      { authors: { contains: cleanSearch, mode: 'insensitive' } },
      { doi: { contains: cleanSearch, mode: 'insensitive' } },
    ];
  }

  // Exact Status Filter
  if (status !== 'ALL') {
    whereClause.status = status as ArticleStatus;
  }

  // Exact Priority Filter
  if (priority !== 'ALL') {
    whereClause.priority = priority as Priority;
  }

  // Exact Project Filter
  if (projectId !== 'ALL') {
    whereClause.projectId = projectId;
  }

  // Exact Year Filter
  if (year !== 'ALL') {
    whereClause.publicationYear = parseInt(year, 10);
  }

  // Determine Prisma sorting order
  let orderByClause: any = {};
  if (sortBy === 'year') {
    orderByClause = { publicationYear: sortOrder };
  } else if (sortBy === 'title') {
    orderByClause = { title: sortOrder };
  } else {
    orderByClause = { createdAt: sortOrder };
  }

  try {
    // Parallel fetch matching articles page and total matching count
    const [articlesRes, countRes] = await Promise.all([
      prisma.article.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          project: {
            select: {
              name: true,
              members: {
                where: { userId: session.user.id },
                select: { role: true },
              },
            },
          },
        },
      }),
      prisma.article.count({
        where: whereClause,
      }),
    ]);

    paginatedArticles = articlesRes;
    totalCount = countRes;
  } catch (error) {
    console.error('Error fetching articles server-side:', error);
    dbError = true;
  }

  // Fetch full list of user projects for filters dropdown
  const userProjects = await prisma.project.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    select: {
      id: true,
      name: true,
      organization: {
        select: { name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch unique years of all user articles for filters dropdown
  const articlesWithYears = await prisma.article.findMany({
    where: {
      project: {
        members: {
          some: { userId: session.user.id },
        },
      },
      publicationYear: { not: null },
    },
    select: {
      publicationYear: true,
    },
    distinct: ['publicationYear'],
  });

  const distinctYears = articlesWithYears
    .map((a) => a.publicationYear)
    .filter((y): y is number => y !== null)
    .sort((a, b) => b - a);

  // Check if user is OWNER in at least one project for the Import button check
  const ownedMemberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id, role: 'OWNER' },
    select: { id: true },
  });
  const isOwnerOfAnyProject = ownedMemberships.length > 0;

  // Format current filters to pass down to initial client-side form controls
  const currentFilters = {
    page,
    search,
    status,
    priority,
    projectId,
    year,
    sortBy,
    sortOrder,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Article Review Workspace</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Conduct literature screening. Search, filter, change status and priority, write notes, or run bulk operations.
          </p>
        </div>

        {isOwnerOfAnyProject && (
          <Link href="/dashboard/import">
            <Button size="sm" className="font-semibold gap-2">
              <Database className="h-4 w-4" />
              Import More Articles
            </Button>
          </Link>
        )}
      </div>

      {dbError && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
          Error connecting to the database. Please ensure PostgreSQL is running and migrations are applied.
        </div>
      )}

      {paginatedArticles.length === 0 &&
      search === '' &&
      status === 'ALL' &&
      priority === 'ALL' &&
      projectId === 'ALL' &&
      year === 'ALL' ? (
        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No articles imported"
              description="Import your first Excel file to start systematic reviews."
              className="py-12"
            />
            {isOwnerOfAnyProject && (
              <div className="text-center mt-4">
                <Link href="/dashboard/import">
                  <Button className="font-semibold">Import Articles</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <ReviewTable
          initialArticles={paginatedArticles}
          totalCount={totalCount}
          userProjects={userProjects.map((p) => ({ id: p.id, name: `${p.name} (${p.organization.name})` }))}
          years={distinctYears}
          currentFilters={currentFilters}
        />
      )}
    </div>
  );
}
