import { PrismaClient, ProjectRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@easyslr.com';
  const adminPassword = 'adminpassword123';
  const reviewerEmail = 'reviewer@easyslr.com';
  const reviewerPassword = 'password123';
  
  console.log('Cleaning up database (except users)...');
  
  // Clean database except users
  await prisma.projectMember.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.organization.deleteMany({});
  // Note: user.deleteMany({}) has been removed to keep all users intact!

  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'EasySLR',
    },
  });
  console.log(`Created Organization: ${org.name} (${org.id})`);

  // 2. Retrieve or Create Users
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        password: hashedPassword,
      },
    });
    console.log(`Created User: ${adminUser.email}`);
  } else {
    console.log(`User already exists, keeping intact: ${adminUser.email}`);
  }

  let reviewerUser = await prisma.user.findUnique({
    where: { email: reviewerEmail },
  });

  if (!reviewerUser) {
    const hashedPassword = await bcrypt.hash(reviewerPassword, 10);
    reviewerUser = await prisma.user.create({
      data: {
        email: reviewerEmail,
        name: 'Clinical Reviewer',
        password: hashedPassword,
      },
    });
    console.log(`Created User: ${reviewerUser.email}`);
  } else {
    console.log(`User already exists, keeping intact: ${reviewerUser.email}`);
  }

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'COVID Review',
      description: 'Systematic review of COVID-19 transmission models and clinical outcomes.',
      organizationId: org.id,
    },
  });
  console.log(`Created Project: ${project1.name}`);

  const project2 = await prisma.project.create({
    data: {
      name: 'Heart Disease Review',
      description: 'Review of machine learning algorithms for coronary heart disease forecasting.',
      organizationId: org.id,
    },
  });
  console.log(`Created Project: ${project2.name}`);

  // 4. Create Project Members (with roles)
  await prisma.projectMember.create({
    data: {
      role: ProjectRole.OWNER,
      userId: adminUser.id,
      projectId: project1.id,
    },
  });
  console.log(`Assigned User ${adminUser.email} as OWNER of Project: ${project1.name}`);

  await prisma.projectMember.create({
    data: {
      role: ProjectRole.OWNER,
      userId: adminUser.id,
      projectId: project2.id,
    },
  });
  console.log(`Assigned User ${adminUser.email} as OWNER of Project: ${project2.name}`);

  // Assign Reviewer
  await prisma.projectMember.create({
    data: {
      role: ProjectRole.REVIEWER,
      userId: reviewerUser.id,
      projectId: project1.id,
    },
  });
  console.log(`Assigned User ${reviewerUser.email} as REVIEWER of Project: ${project1.name}`);

  await prisma.projectMember.create({
    data: {
      role: ProjectRole.REVIEWER,
      userId: reviewerUser.id,
      projectId: project2.id,
    },
  });
  console.log(`Assigned User ${reviewerUser.email} as REVIEWER of Project: ${project2.name}`);

  console.log('\nSeeding completed successfully!');
  console.log(`----------------------------------------`);
  console.log(`Login Email:    ${adminEmail}`);
  console.log(`Login Password: ${adminPassword}`);
  console.log(`----------------------------------------`);
  console.log(`Login Email:    ${reviewerEmail}`);
  console.log(`Login Password: ${reviewerPassword}`);
  console.log(`----------------------------------------`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
