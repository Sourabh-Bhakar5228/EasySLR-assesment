import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function Loader({ className, size = 'md', fullPage = false }: LoaderProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <Loader2
      className={cn('animate-spin text-primary-600 dark:text-primary-400', sizes[size], className)}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/20 backdrop-blur-md dark:bg-slate-950/20">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse-subtle">
            Loading EasySLR...
          </p>
        </div>
      </div>
    );
  }

  return spinner;
}
