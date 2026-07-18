import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/85', className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 p-6 space-y-4 dark:border-slate-800 bg-white dark:bg-slate-900/30">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-slate-100 dark:border-slate-800/40">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1 rounded-lg border border-slate-100 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900/10">
      <div className="flex items-center justify-between py-3.5 px-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
        <Skeleton className="h-5 w-1/5" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/6" />
        <Skeleton className="h-5 w-10" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
