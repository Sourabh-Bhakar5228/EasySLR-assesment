import { Settings, User, Mail, Shield, Building2, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Restrict to project OWNERs only
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
  });
  const isOwner = memberships.length === 0 || memberships.some((m) => m.role === 'OWNER');

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">403</h1>
        <p className="text-lg font-semibold text-slate-650 dark:text-slate-400">Forbidden: Access Denied</p>
        <p className="text-sm text-slate-500 max-w-md">You do not have the required permissions (OWNER) to access the settings workspace.</p>
      </div>
    );
  }

  // Fetch user stats
  const [projectCount, orgCount] = await Promise.all([
    prisma.projectMember.count({ where: { userId: session.user.id } }),
    // Quick trick: getting unique orgs user belongs to via project members
    prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { project: { select: { organizationId: true } } },
      distinct: ['projectId'] 
    }).then(res => {
      const orgs = new Set(res.map(r => r.project.organizationId));
      return orgs.size;
    })
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Manage your account profile, preferences, and view system statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2 border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Account Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Your personal information and identity within the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-2xl border-2 border-primary-200 dark:border-primary-800">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{session.user.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {session.user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
                  {session.user.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
                  {session.user.email}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 italic">
              * To change your profile details, please contact your system administrator.
            </p>
          </CardContent>
        </Card>

        {/* System Details Card */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</p>
                  <p className="text-xs text-slate-500">Updated securely</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-500" />
                Workspace Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Organizations</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{orgCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Active Projects</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{projectCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
