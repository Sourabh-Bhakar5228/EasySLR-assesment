import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <HelpCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
