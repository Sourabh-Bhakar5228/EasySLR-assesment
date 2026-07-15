import { UploadCloud } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Import</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Import new medical articles from Excel or bibliography files.
        </p>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary-500" />
            Excel Document Upload
          </CardTitle>
          <CardDescription className="text-xs">
            Upload XLSX files containing article citations, journals, and abstract contents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={UploadCloud}
            title="Excel Import Deferred"
            description="Excel parsing (using XLSX package) is configured in dependencies and will be fully integrated in Day 2."
            className="py-12"
          />
        </CardContent>
      </Card>
    </div>
  );
}
