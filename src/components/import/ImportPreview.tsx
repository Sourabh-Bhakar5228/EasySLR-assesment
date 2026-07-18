'use client';

import * as React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RowValidationResult } from '@/validators/article';
import { Loader } from '@/components/ui/loader';

interface ImportPreviewProps {
  rows: RowValidationResult[];
  onImport: () => void;
  isImporting: boolean;
  validCount: number;
}

type TabType = 'all' | 'valid' | 'invalid' | 'duplicate';

export default function ImportPreview({
  rows,
  onImport,
  isImporting,
  validCount,
}: ImportPreviewProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('all');

  // Filter rows based on active tab
  const filteredRows = React.useMemo(() => {
    switch (activeTab) {
      case 'valid':
        return rows.filter(r => r.isValid && !r.isDuplicate);
      case 'invalid':
        return rows.filter(r => !r.isValid && !r.isDuplicate);
      case 'duplicate':
        return rows.filter(r => r.isDuplicate);
      default:
        return rows;
    }
  }, [rows, activeTab]);

  const stats = React.useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let duplicate = 0;

    rows.forEach(r => {
      if (r.isDuplicate) duplicate++;
      else if (r.isValid) valid++;
      else invalid++;
    });

    return { total: rows.length, valid, invalid, duplicate };
  }, [rows]);

  const renderStatusBadge = (row: RowValidationResult) => {
    if (row.isDuplicate) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          Duplicate
        </span>
      );
    }
    if (row.isValid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-405 dark:border-emerald-900/30">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Valid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
        <AlertCircle className="h-3 w-3 text-red-500" />
        Invalid
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-[450px] border border-slate-200 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden animate-fade-in">
      {/* Header section with title and submit action */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-primary-500" />
            3. Preview Rows ({stats.total})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-405 mt-0.5">
            Review spreadsheet parsing results before importing to PostgreSQL.
          </p>
        </div>

        {validCount > 0 && (
          <Button
            onClick={onImport}
            disabled={isImporting}
            className="w-full sm:w-auto shadow-sm shadow-primary-500/10 hover:shadow-md transition-shadow font-semibold"
          >
            {isImporting ? (
              <>
                <Loader size="sm" className="mr-2 text-current" />
                Importing...
              </>
            ) : (
              <>
                Import {validCount} Valid Rows
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 px-4 text-xs select-none">
        {(['all', 'valid', 'invalid', 'duplicate'] as TabType[]).map((tab) => {
          const count = 
            tab === 'all' ? stats.total :
            tab === 'valid' ? stats.valid :
            tab === 'invalid' ? stats.invalid :
            stats.duplicate;
            
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 py-3 px-4.5 border-b-2 font-semibold transition-all capitalize ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
              <span className={`px-1.5 py-0.25 text-[10px] font-bold rounded-full ${
                isActive
                  ? 'bg-primary-100 text-primary-750 dark:bg-primary-950/50 dark:text-primary-350'
                  : 'bg-slate-200/85 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview Table */}
      <div className="flex-1 overflow-auto max-h-[380px]">
        {filteredRows.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 dark:text-slate-505">
            No rows match the selected filter.
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
              <TableRow>
                <TableHead className="w-[70px]">Row</TableHead>
                <TableHead className="w-[120px]">PMID</TableHead>
                <TableHead className="max-w-xs">Title</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[200px]">Validation Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.slice(0, 100).map((row, idx) => (
                <TableRow 
                  key={idx}
                  className={
                    row.isDuplicate 
                      ? 'bg-amber-500/5 hover:bg-amber-500/10'
                      : !row.isValid
                      ? 'bg-red-500/5 hover:bg-red-500/10'
                      : ''
                  }
                >
                  <TableCell className="font-mono text-xs text-slate-500">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-750 dark:text-slate-350">
                    {row.data?.pmid || row.errors.join('').includes('PMID') ? row.data?.pmid || 'N/A' : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs">
                    {row.data?.title || (row.isValid ? 'N/A' : '(Field Invalid)')}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(row)}
                  </TableCell>
                  <TableCell className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {row.errors.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {row.errors.map((err, eIdx) => (
                          <li key={eIdx}>{err}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 text-[11px] text-slate-450 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
        <span>
          Showing {Math.min(filteredRows.length, 100)} of {filteredRows.length} rows.
        </span>
        {filteredRows.length > 100 && (
          <span>Only the first 100 preview rows are shown.</span>
        )}
      </div>
    </div>
  );
}
