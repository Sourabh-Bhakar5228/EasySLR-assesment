import { describe, it, expect, beforeEach } from 'vitest';
import { validateArticle } from './article';

describe('validateArticle', () => {
  let seenPmids: Set<string>;

  beforeEach(() => {
    seenPmids = new Set<string>();
  });

  it('should validate a correct article row successfully', () => {
    const rawData = {
      pmid: '12345678',
      title: 'A highly optimized deep learning model for clinical research',
      authors: 'Doe J, Smith A',
      firstAuthor: 'Doe J',
      citation: 'J Clin Oncol. 2026;12:34-45',
      journal: 'Journal of Clinical Oncology',
      publicationYear: '2026',
      doi: '10.1234/jco.2026.0123',
    };

    const result = validateArticle(2, rawData, seenPmids);

    expect(result.isValid).toBe(true);
    expect(result.isDuplicate).toBe(false);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toEqual({
      pmid: '12345678',
      title: 'A highly optimized deep learning model for clinical research',
      authors: 'Doe J, Smith A',
      firstAuthor: 'Doe J',
      citation: 'J Clin Oncol. 2026;12:34-45',
      journal: 'Journal of Clinical Oncology',
      publicationYear: 2026,
      doi: '10.1234/jco.2026.0123',
      pmcid: null,
      nihmsId: null,
      createDate: null,
    });
  });

  it('should fail validation if Title is missing', () => {
    const rawData = {
      pmid: '12345678',
      title: '', // Missing title
      authors: 'Doe J',
    };

    const result = validateArticle(3, rawData, seenPmids);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title is required');
    expect(result.data).toBeNull();
  });

  it('should fail validation if PMID is missing', () => {
    const rawData = {
      pmid: '', // Missing PMID
      title: 'An analysis of coronary disease',
      authors: 'Smith A',
    };

    const result = validateArticle(4, rawData, seenPmids);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('PMID should be present');
    expect(result.data).toBeNull();
  });

  it('should validate successfully when Publication Year is empty or missing', () => {
    const rawData = {
      pmid: '87654321',
      title: 'Empty Publication Year Test',
      publicationYear: '  ', // empty string
    };

    const result = validateArticle(5, rawData, seenPmids);

    expect(result.isValid).toBe(true);
    expect(result.data?.publicationYear).toBeNull();
  });

  it('should fail validation if Publication Year is non-numeric', () => {
    const rawData = {
      pmid: '87654321',
      title: 'Invalid Year Test',
      publicationYear: 'Two Thousand and Twenty-Six',
    };

    const result = validateArticle(6, rawData, seenPmids);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Publication Year must be numeric');
    expect(result.data).toBeNull();
  });

  it('should identify a duplicate PMID within the current batch set', () => {
    seenPmids.add('99998888');

    const rawData = {
      pmid: '99998888',
      title: 'Duplicate PMID Test',
    };

    const result = validateArticle(7, rawData, seenPmids);

    expect(result.isValid).toBe(false);
    expect(result.isDuplicate).toBe(true);
    expect(result.errors[0]).toContain('Duplicate PMID');
    expect(result.data).toBeNull();
  });

  it('should fail if row is completely empty', () => {
    const rawData = {
      pmid: '',
      title: '',
      authors: '   ',
      journal: null,
    };

    const result = validateArticle(8, rawData, seenPmids);

    expect(result.isValid).toBe(false);
    expect(result.isDuplicate).toBe(false);
    expect(result.errors).toContain('Row is completely empty');
    expect(result.data).toBeNull();
  });
});
