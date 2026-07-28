import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function masterFix() {
  console.log('🛡️ Starting Master Security Fix...');

  // 1. Ensure the required Permissions exist in the global table
  const permissionsToCreate = [
    { key: 'ALL', name: 'Super Admin Wildcard' },
    { key: 'analytics.read', name: 'View Analytics Dashboard' },
    { key: 'ACCESS_DASHBOARD', name: 'Basic Dashboard Access' }
  ];

  for (const p of permissionsToCreate) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name },
      create: p,
    });
  }

  // 2. Find the Admin Role (assuming your org exists)
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Please run your main seed first.');
    return;
  }

  const adminRole = await prisma.role.upsert({
    where: { name_organizationId: { name: 'Admin', organizationId: org.id } },
    update: {},
    create: {
      name: 'Admin',
      organizationId: org.id,
      isSystem: true,
    },
  });

  // 3. Link Permissions to the Admin Role
  for (const p of permissionsToCreate) {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: {
          connect: { key: p.key }
        }
      }
    });
  }

  // 4. Ensure YOUR current user is linked to this role
  // (We'll update based on the email provided in your seed)
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'example.com' } } // Adjust this to your actual email if needed
  });

  if (user) {
    await prisma.userOrganization.upsert({
      where: { 
        userId_organizationId: { 
          userId: user.id, 
          organizationId: org.id 
        } 
      },
      update: { roleId: adminRole.id },
      create: {
        userId: user.id,
        organizationId: org.id,
        roleId: adminRole.id,
      }
    });
    console.log(`✅ User ${user.email} promoted to Admin with full permissions.`);
  }

  console.log('🚀 Security Repair Complete. Restart your server and Log Out/In one last time.');
}

masterFix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
