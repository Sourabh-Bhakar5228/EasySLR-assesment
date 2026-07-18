'use client';

import * as React from 'react';
import { CheckCircle2, RefreshCw, Database, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface ImportSummaryProps {
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  projectName: string;
  onReset: () => void;
}

export default function ImportSummary({
  totalRows,
  importedCount,
  duplicateCount,
  invalidCount,
  projectName,
  onReset,
}: ImportSummaryProps) {
  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 max-w-xl mx-auto shadow-md animate-slide-up">
      <CardHeader className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450 mb-3 animate-pulse-subtle">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Import Summary Completed</CardTitle>
        <CardDescription className="text-sm">
          Excel parsing and database insertion complete for project <span className="font-semibold text-slate-800 dark:text-slate-200">&ldquo;{projectName}&rdquo;</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total Rows</span>
            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{totalRows}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Imported</span>
            <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-450">{importedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">Duplicate</span>
            <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-450">{duplicateCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-red-600">Invalid</span>
            <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-450">{invalidCount}</p>
          </div>
        </div>

        {/* Informational Alert Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 p-4 text-xs flex items-start gap-2.5">
          <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-blue-700 dark:text-blue-400 space-y-1">
            <p className="font-semibold">Import Log Highlights:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>{importedCount} articles were successfully validated and written directly to PostgreSQL.</li>
              {duplicateCount > 0 && (
                <li>{duplicateCount} duplicate PMIDs were skipped to maintain unique indexes within this project scope.</li>
              )}
              {invalidCount > 0 && (
                <li>{invalidCount} rows failed schema checks (missing titles or non-numeric publication years) and were excluded.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            variant="outline"
            className="flex-1 justify-center border-slate-200 dark:border-slate-800"
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Import Another Sheet
          </Button>
          <Link href="/dashboard/articles" className="flex-1">
            <Button className="w-full justify-center gap-2">
              <Database className="h-4 w-4" />
              Go to Articles List
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
