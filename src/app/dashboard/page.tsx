import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FolderKanban, FileText, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  console.log('[Dashboard] getServerSession result:', session);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Live queries using Prisma
  const orgCount = await prisma.organization.count();

  const projectCount = await prisma.project.count({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  const articleCount = await prisma.article.count({
    where: {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
  });

  const recentProjects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const stats = [
    {
      title: 'Organizations',
      value: orgCount.toString(),
      description: 'Active workspaces',
      icon: Building2,
      color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/5',
      href: '/dashboard/organizations',
    },
    {
      title: 'My Projects',
      value: projectCount.toString(),
      description: 'Assigned reviews',
      icon: FolderKanban,
      color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/5',
      href: '/dashboard/projects',
    },
    {
      title: 'Articles',
      value: articleCount.toString(),
      description: 'Pending screening',
      icon: FileText,
      color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5',
      href: '/dashboard/articles',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {session.user.name || 'User'}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Overview of literature review workspaces, active projects, and reviewer tasks.
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
                  <Link
                    href={stat.href}
                    className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5"
                  >
                    Manage <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Info Blocks */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Recent Projects Panel */}
        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 md:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              <CardTitle className="text-base">Recent Projects</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Your 3 most recently created or assigned workspace reviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No active projects found. Create a project to start literature screening.
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800/40"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {proj.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {proj.description || 'No description provided.'}
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500">
                        Organization: <span className="font-medium">{proj.organization.name}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-550 shrink-0">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Configuration Info */}
        <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick Statistics</CardTitle>
            <CardDescription className="text-xs">
              Day 2 CRUD capabilities active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-650 dark:text-slate-405 font-medium">
                Authorization Checks
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-650 dark:text-slate-405 font-medium">
                Role Mapping
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                OWNER MAPPED
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/45">
              <span className="text-sm text-slate-650 dark:text-slate-405 font-medium">
                Mutations Type
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                SERVER ACTIONS
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
