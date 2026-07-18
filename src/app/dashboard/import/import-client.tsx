'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Database } from 'lucide-react';

// Modular Services, Validators & Actions
import { parseExcel } from '@/services/excel';
import { validateArticle, RowValidationResult } from '@/validators/article';
import { importArticles } from '@/actions/article-import';

// Modular UI Components
import FileUploader from '@/components/import/FileUploader';
import ImportPreview from '@/components/import/ImportPreview';
import ImportSummary from '@/components/import/ImportSummary';

interface Project {
  id: string;
  name: string;
  orgName: string;
}

interface ImportClientProps {
  projects: Project[];
}

interface SummaryData {
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export default function ImportClient({ projects }: ImportClientProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string>('');
  
  const [isParsing, setIsParsing] = React.useState<boolean>(false);
  const [isImporting, setIsImporting] = React.useState<boolean>(false);
  
  const [validationResults, setValidationResults] = React.useState<RowValidationResult[]>([]);
  const [summary, setSummary] = React.useState<SummaryData | null>(null);

  // Set default project if only one exists
  React.useEffect(() => {
    if (projects.length === 1) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const resetState = () => {
    setFileName('');
    setValidationResults([]);
    setSummary(null);
  };

  const selectedProject = React.useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const handleFileSelected = async (file: File) => {
    if (!selectedProjectId) {
      toast.error('Please select a target Project first.');
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    const toastId = toast.loading('Parsing Excel columns...');

    try {
      const buffer = await file.arrayBuffer();
      const rawRows = parseExcel(buffer);

      if (rawRows.length === 0) {
        toast.error('The uploaded Excel sheet contains no readable rows.', { id: toastId });
        resetState();
        return;
      }

      // Validate rows
      const seenPmids = new Set<string>();
      const results: RowValidationResult[] = [];

      rawRows.forEach((row, index) => {
        const rowNum = index + 2; // Row number in sheet (1-based index + header offset)
        const validation = validateArticle(rowNum, row, seenPmids);
        
        // Add to seen PMIDs if valid and exists
        if (validation.isValid && validation.data?.pmid) {
          seenPmids.add(validation.data.pmid);
        }
        
        results.push(validation);
      });

      setValidationResults(results);

      const validCount = results.filter(r => r.isValid && !r.isDuplicate).length;
      if (validCount === 0) {
        toast.warning(`Found 0 valid articles out of ${results.length} rows.`, { id: toastId });
      } else {
        toast.success(`Parsed ${results.length} rows successfully. Found ${validCount} valid articles.`, { id: toastId });
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      toast.error('Failed to parse Excel file. Ensure file is not corrupted.', { id: toastId });
      resetState();
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a target Project.');
      return;
    }

    // Extract only valid rows (which are not duplicate inside the sheet)
    const validArticles = validationResults
      .filter(r => r.isValid && !r.isDuplicate)
      .map(r => r.data!);

    if (validArticles.length === 0) {
      toast.error('No valid articles to import.');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Saving articles to PostgreSQL...');

    try {
      const response = await importArticles(selectedProjectId, validArticles);

      if (response.success) {
        // Calculate final metrics counts
        const sheetDuplicates = validationResults.filter(r => r.isDuplicate).length;
        const sheetInvalids = validationResults.filter(r => !r.isValid && !r.isDuplicate).length;

        // Total duplicate count is sheet-level duplicates + database duplicates
        const totalDuplicate = sheetDuplicates + response.skippedCount;

        setSummary({
          totalRows: validationResults.length,
          importedCount: response.createdCount,
          duplicateCount: totalDuplicate,
          invalidCount: sheetInvalids,
        });

        toast.success(`Import complete! ${response.createdCount} articles saved to database.`, { id: toastId });
      }
    } catch (err: any) {
      console.error('Database write error:', err);
      toast.error(err.message || 'Failed to save articles to the database.', { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  // 1. Success Summary Dashboard View
  if (summary) {
    return (
      <ImportSummary
        totalRows={summary.totalRows}
        importedCount={summary.importedCount}
        duplicateCount={summary.duplicateCount}
        invalidCount={summary.invalidCount}
        projectName={selectedProject?.name || ''}
        onReset={resetState}
      />
    );
  }

  // 2. Select Project, Upload & Preview Grid View
  return (
    <div className="grid gap-6 md:grid-cols-3 items-start">
      {/* Target Project Selection & File Uploader */}
      <div className="space-y-6 md:col-span-1">
        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base">1. Select Target Project</CardTitle>
            <CardDescription className="text-xs">
              Select which literature review project these articles belong to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-slate-500">
                  No projects available for import. Only project OWNERs can import articles.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    resetState();
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
                >
                  <option value="">-- Choose a Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.orgName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProjectId && (
          <FileUploader
            selectedProjectName={selectedProject?.name || ''}
            onFileSelected={handleFileSelected}
            onReset={resetState}
            fileName={fileName}
          />
        )}
      </div>

      {/* Import Preview Component */}
      <div className="md:col-span-2">
        {isParsing ? (
          <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 h-64 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="inline-block border-2 border-primary-500 border-t-transparent animate-spin rounded-full h-8 w-8" />
              <p className="text-sm font-medium text-slate-500">Parsing spreadsheet columns using SheetJS...</p>
            </div>
          </Card>
        ) : fileName && validationResults.length > 0 ? (
          <ImportPreview
            rows={validationResults}
            onImport={handleImport}
            isImporting={isImporting}
            validCount={validationResults.filter(r => r.isValid && !r.isDuplicate).length}
          />
        ) : (
          <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 py-20 text-center text-slate-400 dark:text-slate-500">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <Database className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
              <CardTitle className="text-sm font-semibold">Pre-Import Data Analyzer</CardTitle>
              <CardDescription className="text-xs mt-1">
                Select a target review project and upload your Excel sheet to analyze and preview article validation status.
              </CardDescription>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
