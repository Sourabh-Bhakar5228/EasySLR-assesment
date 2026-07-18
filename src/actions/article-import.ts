'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ArticleStatus, Priority } from '@prisma/client';
import { requireProjectOwner } from '@/lib/rbac';

export interface ImportArticleData {
  pmid?: string | null;
  title: string;
  authors?: string | null;
  firstAuthor?: string | null;
  citation?: string | null;
  journal?: string | null;
  publicationYear?: number | null;
  doi?: string | null;
  pmcid?: string | null;
  nihmsId?: string | null;
  createDate?: string | Date | null;
}

export async function importArticles(projectId: string, articles: ImportArticleData[]) {
  // 1. Authorize: Check if user is a project OWNER
  await requireProjectOwner(projectId);

  try {
    // 2. Wrap writes and duplicate checks inside a database transaction
    //    with increased timeout for large imports (up to 120s)
    const BATCH_SIZE = 1000;

    const result = await prisma.$transaction(async (tx) => {
      // Get all existing PMIDs in the project to check for duplicates
      const existingArticles = await tx.article.findMany({
        where: {
          projectId,
          pmid: { not: null },
        },
        select: { pmid: true },
      });

      const dbPmids = new Set(
        existingArticles.map((a) => a.pmid?.trim()).filter(Boolean)
      );

      const toInsert: any[] = [];
      const batchPmids = new Set<string>(); // O(1) lookup for dedup within import batch
      let skippedCount = 0;

      for (const article of articles) {
        const cleanPmid = article.pmid?.toString().trim() || null;

        // Skip duplicates (against existing DB records or within the import batch itself)
        if (cleanPmid && (dbPmids.has(cleanPmid) || batchPmids.has(cleanPmid))) {
          skippedCount++;
          continue;
        }

        if (cleanPmid) {
          batchPmids.add(cleanPmid);
        }

        let parsedCreateDate: Date | null = null;
        if (article.createDate) {
          const d = new Date(article.createDate);
          if (!isNaN(d.getTime())) {
            parsedCreateDate = d;
          }
        }

        toInsert.push({
          pmid: cleanPmid,
          title: article.title.trim(),
          authors: article.authors?.trim() || null,
          firstAuthor: article.firstAuthor?.trim() || null,
          citation: article.citation?.trim() || null,
          journal: article.journal?.trim() || null,
          publicationYear: article.publicationYear || null,
          doi: article.doi?.trim() || null,
          pmcid: article.pmcid?.trim() || null,
          nihmsId: article.nihmsId?.trim() || null,
          createDate: parsedCreateDate,
          status: ArticleStatus.PENDING,
          priority: Priority.MEDIUM,
          projectId,
        });
      }

      // Insert in batches of BATCH_SIZE to avoid overwhelming PostgreSQL
      let createdCount = 0;
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const chunk = toInsert.slice(i, i + BATCH_SIZE);
        const batch = await tx.article.createMany({
          data: chunk,
        });
        createdCount += batch.count;
      }

      return {
        createdCount,
        skippedCount,
      };
    }, {
      maxWait: 10000,  // Max time to acquire a connection from pool (10s)
      timeout: 120000, // Max transaction lifetime (120s) for large imports
    });

    revalidatePath('/dashboard/articles');
    revalidatePath('/dashboard');

    return {
      success: true,
      totalParsed: articles.length,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount,
      failedCount: articles.length - result.createdCount - result.skippedCount,
    };
  } catch (error: any) {
    console.error('Prisma Transaction Import Error:', error);
    throw new Error(error.message || 'Failed to save articles to the database.');
  }
}
