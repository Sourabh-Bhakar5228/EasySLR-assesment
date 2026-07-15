import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FolderKanban, FileText, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Organizations',
      value: '1',
      description: 'EasySLR (Active)',
      icon: Building2,
      color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/5',
      href: '#',
    },
    {
      title: 'Active Projects',
      value: '2',
      description: 'COVID & Heart Disease reviews',
      icon: FolderKanban,
      color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/5',
      href: '#',
    },
    {
      title: 'Articles',
      value: '0',
      description: 'Pending upload & review',
      icon: FileText,
      color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5',
      href: '#',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Welcome to the EasySLR Article Review Workspace. Here is an overview of your active resources.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="relative group overflow-hidden border-slate-200 bg-white hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/40 transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{stat.description}</span>
                  <span className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 cursor-pointer">
                    View <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base">System Information</CardTitle>
            <CardDescription className="text-xs">Day 1 Setup Foundation overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Database Connector
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                PRISMA + PGSQL
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Authentication
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                NEXTAUTH / JWT
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                CSS Styling
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                TAILWIND CSS
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base">Day 1 Targets Achieved</CardTitle>
            <CardDescription className="text-xs">Functional scope completed in Day 1</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Prisma Schemas & Seeding
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Initialized User, Org, Project, ProjectMember, and Article models successfully.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  NextAuth Credentials Guard
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Secured workspace routes using middleware and bcrypt credentials matching.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
