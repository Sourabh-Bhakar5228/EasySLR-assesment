'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ArticleStatus, Priority } from '@prisma/client';
import { requireProjectMember, requireProjectOwner } from '@/lib/rbac';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Update single article status
 */
export async function updateArticleStatus(articleId: string, status: ArticleStatus) {
  // Get article to find its projectId
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { projectId: true },
  });

  if (!article) {
    throw new Error('Article not found');
  }

  // Verify project authorization (OWNER or REVIEWER)
  await requireProjectMember(article.projectId);

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { status },
    });

    revalidatePath('/dashboard/articles');
    revalidatePath('/dashboard');
    return { success: true, article: updated };
  } catch (error: any) {
    console.error('Update status error:', error);
    throw new Error(error.message || 'Failed to update article status.');
  }
}

/**
 * Update single article priority
 */
export async function updateArticlePriority(articleId: string, priority: Priority) {
  // Get article to find its projectId
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { projectId: true },
  });

  if (!article) {
    throw new Error('Article not found');
  }

  // Verify project authorization (OWNER or REVIEWER)
  await requireProjectMember(article.projectId);

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { priority },
    });

    revalidatePath('/dashboard/articles');
    return { success: true, article: updated };
  } catch (error: any) {
    console.error('Update priority error:', error);
    throw new Error(error.message || 'Failed to update article priority.');
  }
}

/**
 * Update single article reviewer notes
 */
export async function updateArticleNotes(articleId: string, notes: string | null) {
  // Get article to find its projectId
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { projectId: true },
  });

  if (!article) {
    throw new Error('Article not found');
  }

  // Verify project authorization (OWNER or REVIEWER)
  await requireProjectMember(article.projectId);

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { notes: notes?.trim() || null },
    });

    revalidatePath('/dashboard/articles');
    return { success: true, article: updated };
  } catch (error: any) {
    console.error('Update notes error:', error);
    throw new Error(error.message || 'Failed to update article notes.');
  }
}

/**
 * Bulk update article status
 */
export async function bulkUpdateArticleStatus(
  articleIds: string[],
  status: ArticleStatus,
  projectId: string
) {
  // Verify project authorization (OWNER or REVIEWER for bulk status updates)
  await requireProjectMember(projectId);

  try {
    const result = await prisma.article.updateMany({
      where: {
        id: { in: articleIds },
        projectId, // Extra check to ensure target articles belong to the verified project
      },
      data: { status },
    });

    revalidatePath('/dashboard/articles');
    revalidatePath('/dashboard');
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error('Bulk update status error:', error);
    throw new Error(error.message || 'Failed to bulk update status.');
  }
}

/**
 * Bulk delete articles
 */
export async function bulkDeleteArticles(articleIds: string[], projectId: string) {
  // Verify project authorization (strictly OWNER for deletion)
  await requireProjectOwner(projectId);

  try {
    const result = await prisma.article.deleteMany({
      where: {
        id: { in: articleIds },
        projectId, // Ensure articles belong to the authorized project scope
      },
    });

    revalidatePath('/dashboard/articles');
    revalidatePath('/dashboard');
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error('Bulk delete articles error:', error);
    throw new Error(error.message || 'Failed to bulk delete articles.');
  }
}

/**
 * Export filtered or selected articles as CSV
 */
export async function exportArticlesCSV(params: {
  articleIds?: string[];
  search?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  year?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('401 Unauthenticated: Please log in.');
  }

  try {
    const where: any = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    };

    // If specific articles are selected, export only those
    if (params.articleIds && params.articleIds.length > 0) {
      where.id = { in: params.articleIds };
    } else {
      // Apply filters
      if (params.search?.trim()) {
        where.OR = [
          { title: { contains: params.search.trim(), mode: 'insensitive' } },
          { pmid: { contains: params.search.trim(), mode: 'insensitive' } },
          { authors: { contains: params.search.trim(), mode: 'insensitive' } },
          { doi: { contains: params.search.trim(), mode: 'insensitive' } },
        ];
      }

      if (params.status && params.status !== 'ALL') {
        where.status = params.status;
      }

      if (params.priority && params.priority !== 'ALL') {
        where.priority = params.priority;
      }

      if (params.projectId && params.projectId !== 'ALL') {
        where.projectId = params.projectId;
      }

      if (params.year && params.year !== 'ALL') {
        where.publicationYear = parseInt(params.year, 10);
      }
    }

    // Determine sorting
    const orderBy: any = {};
    if (params.sortBy === 'year') {
      orderBy.publicationYear = params.sortOrder || 'desc';
    } else if (params.sortBy === 'title') {
      orderBy.title = params.sortOrder || 'asc';
    } else {
      orderBy.createdAt = params.sortOrder || 'desc';
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy,
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    // Generate CSV content
    const headers = [
      'PMID',
      'Title',
      'Authors',
      'First Author',
      'Citation',
      'Journal',
      'Publication Year',
      'DOI',
      'PMCID',
      'NIHMS ID',
      'Status',
      'Priority',
      'Notes',
      'Project',
      'Imported Date',
    ];

    const csvRows = articles.map((a) => [
      a.pmid || '',
      a.title,
      a.authors || '',
      a.firstAuthor || '',
      a.citation || '',
      a.journal || '',
      a.publicationYear?.toString() || '',
      a.doi || '',
      a.pmcid || '',
      a.nihmsId || '',
      a.status,
      a.priority,
      a.notes || '',
      a.project.name,
      a.createdAt.toISOString(),
    ]);

    const escapeCsv = (val: string) => {
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    return { success: true, csvContent };
  } catch (error: any) {
    console.error('CSV export error:', error);
    throw new Error(error.message || 'Failed to export CSV.');
  }
}

