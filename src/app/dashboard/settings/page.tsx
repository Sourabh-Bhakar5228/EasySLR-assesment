import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Manage workspace settings, user permissions, and integrations.
        </p>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-500" />
            Workspace Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your profiles, theme preferences, and credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Settings}
            title="Settings Dashboard"
            description="System and profile customization features will be added in Day 5."
            className="py-12"
          />
        </CardContent>
      </Card>
    </div>
  );
}
