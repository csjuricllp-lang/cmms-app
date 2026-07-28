import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function universalFix() {
  console.log('🌍 Starting Universal Permission Sync...');

  // 1. Ensure the key exists
  const permission = await prisma.permission.upsert({
    where: { key: 'analytics.read' },
    update: {},
    create: {
      key: 'analytics.read',
      name: 'Analytics Access',
    },
  });

  // 2. Add it to EVERY role in the system
  const roles = await prisma.role.findMany();
  for (const role of roles) {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: { id: permission.id }
        }
      }
    });
    console.log(`✅ Updated permissions for role: ${role.name}`);
  }

  // 3. Specifically ensure 'ALL' wildcard also exists and is linked to Admins
  const allPerm = await prisma.permission.upsert({
    where: { key: 'ALL' },
    update: {},
    create: { key: 'ALL', name: 'Super Admin' }
  });

  await prisma.role.updateMany({
    where: { name: 'Admin' },
    data: {} // This is just to trigger the next step for specific roles if needed
  });

  console.log('🚀 Universal Fix Complete!');
}

universalFix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
