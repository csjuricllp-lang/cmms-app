import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeSecurityFix() {
  console.log('🗝️  Deploying Master Key Security Fix...');

  // 1. Get all permission keys from the Enum/Database
  const permissions = await prisma.permission.findMany();
  
  // 2. Target all Admin/Owner roles
  const roles = await prisma.role.findMany({
    where: {
      name: { in: ['Admin', 'ADMIN', 'OWNER'] }
    }
  });

  if (roles.length === 0) {
    console.error('❌ No Admin roles found to update.');
    return;
  }

  for (const role of roles) {
    console.log(`📡 Granting all permissions to role: ${role.name}`);
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: permissions.map(p => ({ id: p.id }))
        }
      }
    });
  }

  console.log('✅ Master Key Deployed! All modules are now unlocked for Admins.');
}

completeSecurityFix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
