import * as XLSX from 'xlsx';

export interface RawParsedRow {
  pmid?: string;
  title?: string;
  authors?: string;
  firstAuthor?: string;
  citation?: string;
  journal?: string;
  publicationYear?: any;
  doi?: string;
  notes?: string;
  pmcid?: string;
  nihmsId?: string;
  createDate?: string;
}

// Map common header patterns to exact Prisma schema keys
const HEADER_MAPPINGS: { keys: string[]; target: keyof RawParsedRow }[] = [
  { keys: ['pmid', 'pubmedid', 'pubmed'], target: 'pmid' },
  { keys: ['title', 'articletitle', 'documenttitle'], target: 'title' },
  { keys: ['authors', 'author'], target: 'authors' },
  { keys: ['firstauthor', '1stauthor'], target: 'firstAuthor' },
  { keys: ['citation', 'citations'], target: 'citation' },
  { keys: ['journal/book', 'journal', 'book', 'source'], target: 'journal' },
  { keys: ['publicationyear', 'year', 'pubyear'], target: 'publicationYear' },
  { keys: ['createdate', 'createddate', 'date'], target: 'createDate' },
  { keys: ['pmcid', 'pmc'], target: 'pmcid' },
  { keys: ['nihmsid', 'nihms'], target: 'nihmsId' },
  { keys: ['doi'], target: 'doi' },
];

/**
 * Normalizes keys based on header mappings case-insensitively
 */
function normalizeRow(rawRow: Record<string, any>): RawParsedRow {
  const normalized: RawParsedRow = {};
  const rawKeys = Object.keys(rawRow);

  for (const mapping of HEADER_MAPPINGS) {
    const matchedKey = rawKeys.find(key => {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
      return mapping.keys.includes(cleanKey);
    });

    if (matchedKey !== undefined) {
      const val = rawRow[matchedKey];
      // Convert to string and trim, keeping empty or undefined values
      if (val !== undefined && val !== null) {
        normalized[mapping.target] = String(val).trim();
      }
    }
  }

  return normalized;
}

/**
 * Parses an Excel (.xlsx or .xls) file from an ArrayBuffer into normalized JSON rows
 */
export function parseExcel(fileBuffer: ArrayBuffer): RawParsedRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Parse rows as raw objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  return rawRows
    .map(row => normalizeRow(row))
    .filter(row => {
      // Ignore completely empty rows
      const values = Object.values(row).map(v => String(v).trim());
      return values.some(v => v !== '');
    });
}
