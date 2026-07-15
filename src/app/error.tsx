'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Unhandled app-level error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border-red-500/20 bg-white dark:bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-650 dark:text-red-400 mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Something went wrong!
          </CardTitle>
          <CardDescription className="text-slate-550 dark:text-slate-400 text-sm mt-1">
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-xs text-slate-550 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 w-full overflow-x-auto max-h-32">
            {error.message || 'Unknown internal error'}
          </p>
          <Button
            onClick={reset}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
