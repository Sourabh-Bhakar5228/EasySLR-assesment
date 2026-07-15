import { PrismaClient, ProjectRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@easyslr.com';
  const adminPassword = 'adminpassword123';
  
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

  // 2. Retrieve or Create User
  let user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        password: hashedPassword,
      },
    });
    console.log(`Created User: ${user.email}`);
  } else {
    console.log(`User already exists, keeping intact: ${user.email}`);
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

  // 4. Create Project Members (with role OWNER)
  await prisma.projectMember.create({
    data: {
      role: ProjectRole.OWNER,
      userId: user.id,
      projectId: project1.id,
    },
  });
  console.log(`Assigned User ${user.email} as OWNER of Project: ${project1.name}`);

  await prisma.projectMember.create({
    data: {
      role: ProjectRole.OWNER,
      userId: user.id,
      projectId: project2.id,
    },
  });
  console.log(`Assigned User ${user.email} as OWNER of Project: ${project2.name}`);

  console.log('\nSeeding completed successfully!');
  console.log(`----------------------------------------`);
  console.log(`Login Email:    ${adminEmail}`);
  console.log(`Login Password: ${adminPassword}`);
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
