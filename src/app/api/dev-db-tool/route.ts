import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProjectRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action !== 'clean-and-seed') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    console.log('API Tool: Cleaning database...');

    // 1. Delete in order of foreign key dependencies
    await prisma.article.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.organization.deleteMany({});

    console.log('API Tool: Database cleaned successfully (Users preserved).');

    // 2. Find the existing users
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@easyslr.com' },
    });

    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin user (admin@easyslr.com) not found. Run standard DB seed first.' 
      }, { status: 404 });
    }

    const reviewerUser = await prisma.user.findUnique({
      where: { email: 'reviewer@easyslr.com' },
    });

    if (!reviewerUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reviewer user (reviewer@easyslr.com) not found. Run standard DB seed first.' 
      }, { status: 404 });
    }

    // 3. Reseed Organization
    const org = await prisma.organization.create({
      data: { name: 'EasySLR' },
    });

    // 4. Reseed Projects
    const project1 = await prisma.project.create({
      data: {
        name: 'COVID Review',
        description: 'Systematic review of COVID-19 transmission models and clinical outcomes.',
        organizationId: org.id,
      },
    });

    const project2 = await prisma.project.create({
      data: {
        name: 'Heart Disease Review',
        description: 'Review of machine learning algorithms for coronary heart disease forecasting.',
        organizationId: org.id,
      },
    });

    // 5. Assign admin as OWNER, and reviewer as REVIEWER of both projects
    await prisma.projectMember.createMany({
      data: [
        {
          role: ProjectRole.OWNER,
          userId: adminUser.id,
          projectId: project1.id,
        },
        {
          role: ProjectRole.OWNER,
          userId: adminUser.id,
          projectId: project2.id,
        },
        {
          role: ProjectRole.REVIEWER,
          userId: reviewerUser.id,
          projectId: project1.id,
        },
        {
          role: ProjectRole.REVIEWER,
          userId: reviewerUser.id,
          projectId: project2.id,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Database cleared and test data successfully reseeded.',
      organization: org,
      projects: [project1, project2],
    });
  } catch (error: any) {
    console.error('API Tool Seed Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action !== 'verify-db' && action !== 'clean-and-seed') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'clean-and-seed') {
      // 1. Delete in order of foreign key dependencies
      await prisma.article.deleteMany({});
      await prisma.projectMember.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.organization.deleteMany({});

      // 2. Find the existing users
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@easyslr.com' },
      });

      if (!adminUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Admin user (admin@easyslr.com) not found. Run standard DB seed first.' 
        }, { status: 404 });
      }

      const reviewerUser = await prisma.user.findUnique({
        where: { email: 'reviewer@easyslr.com' },
      });

      if (!reviewerUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Reviewer user (reviewer@easyslr.com) not found. Run standard DB seed first.' 
        }, { status: 404 });
      }

      // 3. Reseed Organization
      const org = await prisma.organization.create({
        data: { name: 'EasySLR' },
      });

      // 4. Reseed Projects
      const project1 = await prisma.project.create({
        data: {
          name: 'COVID Review',
          description: 'Systematic review of COVID-19 transmission models and clinical outcomes.',
          organizationId: org.id,
        },
      });

      const project2 = await prisma.project.create({
        data: {
          name: 'Heart Disease Review',
          description: 'Review of machine learning algorithms for coronary heart disease forecasting.',
          organizationId: org.id,
        },
      });

      // 5. Assign admin as OWNER, and reviewer as REVIEWER
      await prisma.projectMember.createMany({
        data: [
          {
            role: ProjectRole.OWNER,
            userId: adminUser.id,
            projectId: project1.id,
          },
          {
            role: ProjectRole.OWNER,
            userId: adminUser.id,
            projectId: project2.id,
          },
          {
            role: ProjectRole.REVIEWER,
            userId: reviewerUser.id,
            projectId: project1.id,
          },
          {
            role: ProjectRole.REVIEWER,
            userId: reviewerUser.id,
            projectId: project2.id,
          },
        ],
      });

      return NextResponse.json({
        success: true,
        message: 'Database cleared and test data successfully reseeded.',
        organization: org,
        projects: [project1, project2],
      });
    }

    // Perform database health audits
    const orgs = await prisma.organization.findMany();
    const projects = await prisma.project.findMany();
    const members = await prisma.projectMember.findMany();
    const articles = await prisma.article.findMany();
    const users = await prisma.user.findMany();

    const auditResults: string[] = [];

    // Duplicate Check: Organizations
    const orgNames = orgs.map(o => o.name);
    const uniqueOrgNames = new Set(orgNames);
    if (orgNames.length !== uniqueOrgNames.size) {
      auditResults.push('CRITICAL: Duplicate organizations found in database.');
    }

    // Duplicate Check: Projects per Org
    const projectKeys = projects.map(p => `${p.organizationId}-${p.name}`);
    const uniqueProjectKeys = new Set(projectKeys);
    if (projectKeys.length !== uniqueProjectKeys.size) {
      auditResults.push('CRITICAL: Duplicate project names found within an organization.');
    }

    // Duplicate Check: Memberships
    const membershipKeys = members.map(m => `${m.userId}-${m.projectId}`);
    const uniqueMembershipKeys = new Set(membershipKeys);
    if (members.length !== uniqueMembershipKeys.size) {
      auditResults.push('CRITICAL: Duplicate user-project memberships found.');
    }

    // Duplicate Check: PMID per Project
    const pmidKeys = articles
      .filter(a => a.pmid)
      .map(a => `${a.projectId}-${a.pmid}`);
    const uniquePmidKeys = new Set(pmidKeys);
    if (pmidKeys.length !== uniquePmidKeys.size) {
      auditResults.push('CRITICAL: Duplicate PMIDs detected within a project index.');
    }

    // Cascade Delete Verification Check:
    // Create a temporary project, add a member and article, delete the project, and check if cascade delete worked.
    let cascadeCheckPassed = true;
    try {
      if (orgs.length > 0 && users.length > 0) {
        const testProj = await prisma.project.create({
          data: {
            name: 'TEMP_CASCADE_TEST',
            organizationId: orgs[0].id,
          },
        });

        const testMember = await prisma.projectMember.create({
          data: {
            role: ProjectRole.OWNER,
            userId: users[0].id,
            projectId: testProj.id,
          },
        });

        const testArticle = await prisma.article.create({
          data: {
            title: 'TEMP_CASCADE_ARTICLE',
            projectId: testProj.id,
          },
        });

        // Delete test project
        await prisma.project.delete({
          where: { id: testProj.id },
        });

        // Check if member and article were cascade deleted
        const checkMember = await prisma.projectMember.findUnique({
          where: { id: testMember.id },
        });
        const checkArticle = await prisma.article.findUnique({
          where: { id: testArticle.id },
        });

        if (checkMember || checkArticle) {
          cascadeCheckPassed = false;
          auditResults.push('WARNING: Cascade delete check failed. Orphaning detected.');
        }
      }
    } catch (err: any) {
      cascadeCheckPassed = false;
      auditResults.push(`WARNING: Cascade delete check error: ${err.message}`);
    }

    return NextResponse.json({
      success: true,
      auditResults: auditResults.length === 0 ? ['Database health checks: ALL PASSED'] : auditResults,
      databaseCounts: {
        organizations: orgs.length,
        projects: projects.length,
        projectMembers: members.length,
        articles: articles.length,
        users: users.length,
      },
      cascadeCheckPassed,
    });
  } catch (error: any) {
    console.error('API Tool Verify Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
