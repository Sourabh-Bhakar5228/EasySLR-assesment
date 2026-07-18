import { z } from 'zod';

export const articleValidationSchema = z.object({
  pmid: z.string().min(1, 'PMID should be present'),
  title: z.string().min(1, 'Title is required'),
  authors: z.string().nullable().optional(),
  citation: z.string().nullable().optional(),
  firstAuthor: z.string().nullable().optional(),
  journal: z.string().nullable().optional(),
  publicationYear: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number({ invalid_type_error: 'Publication Year must be numeric' })),
  doi: z.string().nullable().optional(),
  pmcid: z.string().nullable().optional(),
  nihmsId: z.string().nullable().optional(),
  createDate: z.string().nullable().optional(),
});

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  data: {
    pmid?: string | null;
    title: string;
    authors?: string | null;
    firstAuthor?: string | null;
    citation?: string | null;
    journal?: string | null;
    publicationYear?: number | null;
    doi?: string | null;
    notes?: string | null;
    pmcid?: string | null;
    nihmsId?: string | null;
    createDate?: string | null;
  } | null;
}

/**
 * Validates a single Excel row matching standard assignment columns
 */
export function validateArticle(
  rowNumber: number,
  rawData: any,
  seenPmids: Set<string>
): RowValidationResult {
  const errors: string[] = [];
  
  // 1. Check if completely empty row
  const values = Object.values(rawData).map(v => (v === null || v === undefined) ? '' : String(v).trim());
  const isEmpty = values.every(v => v === '');
  if (isEmpty) {
    return {
      rowNumber,
      isValid: false,
      isDuplicate: false,
      errors: ['Row is completely empty'],
      data: null,
    };
  }

  // 2. Prepare clean and trimmed data
  const pmid = rawData.pmid !== undefined && rawData.pmid !== null ? String(rawData.pmid).trim() : '';
  const title = rawData.title !== undefined && rawData.title !== null ? String(rawData.title).trim() : '';
  const authors = rawData.authors !== undefined && rawData.authors !== null ? String(rawData.authors).trim() : null;
  const citation = rawData.citation !== undefined && rawData.citation !== null ? String(rawData.citation).trim() : null;
  const firstAuthor = rawData.firstAuthor !== undefined && rawData.firstAuthor !== null ? String(rawData.firstAuthor).trim() : null;
  const journal = rawData.journal !== undefined && rawData.journal !== null ? String(rawData.journal).trim() : null;
  const doi = rawData.doi !== undefined && rawData.doi !== null ? String(rawData.doi).trim() : null;
  const pmcid = rawData.pmcid !== undefined && rawData.pmcid !== null ? String(rawData.pmcid).trim() : null;
  const nihmsId = rawData.nihmsId !== undefined && rawData.nihmsId !== null ? String(rawData.nihmsId).trim() : null;
  const createDate = rawData.createDate !== undefined && rawData.createDate !== null ? String(rawData.createDate).trim() : null;
  
  const publicationYearRaw = rawData.publicationYear;

  // Manual & Schema validations
  if (!title) {
    errors.push('Title is required');
  }

  if (!pmid) {
    errors.push('PMID should be present');
  }

  let publicationYearParsed: number | null = null;
  if (publicationYearRaw !== undefined && publicationYearRaw !== null && String(publicationYearRaw).trim() !== '') {
    const yearNum = Number(publicationYearRaw);
    if (isNaN(yearNum) || !Number.isInteger(yearNum)) {
      errors.push('Publication Year must be numeric');
    } else {
      publicationYearParsed = yearNum;
    }
  }

  // Check duplicate PMID in the current parse batch
  let isDuplicate = false;
  if (pmid && seenPmids.has(pmid)) {
    isDuplicate = true;
    errors.push(`Duplicate PMID: ${pmid} is already in this import batch or database`);
  }

  const isValid = errors.length === 0;

  return {
    rowNumber,
    isValid,
    isDuplicate,
    errors,
    data: isValid
      ? {
          pmid,
          title,
          authors,
          firstAuthor,
          citation,
          journal,
          publicationYear: publicationYearParsed,
          doi,
          pmcid,
          nihmsId,
          createDate,
        }
      : null,
  };
}
