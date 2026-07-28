import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const missingPermissions = [
    { key: 'vendors.create', name: 'Create Vendors' },
    { key: 'vendors.update', name: 'Update Vendors' },
    { key: 'vendors.delete', name: 'Delete Vendors' },
    { key: 'customers.create', name: 'Create Customers' },
    { key: 'customers.update', name: 'Update Customers' },
    { key: 'customers.delete', name: 'Delete Customers' },
    { key: 'users.manage', name: 'Manage Users' },
    { key: 'roles.manage', name: 'Manage Roles' }
  ];

  for (const perm of missingPermissions) {
      await prisma.permission.upsert({
          where: { key: perm.key },
          update: {},
          create: {
              key: perm.key,
              name: perm.name
          }
      });
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: 'nkdev26@gmail.com' },
    include: {
      organizations: {
        include: {
          role: true
        }
      }
    }
  });

  const role = adminUser?.organizations[0]?.role;
  
  if (!role || role.name !== 'Maintenance Manager') {
      console.log('User is not a Maintenance Manager or role not found.', role?.name);
      return;
  }

  const permissionsToAdd = await prisma.permission.findMany({
      where: {
          key: {
              in: missingPermissions.map(p => p.key)
          }
      }
  });

  console.log(`Found ${permissionsToAdd.length} permissions to add.`);

  await prisma.role.update({
      where: { id: role.id },
      data: {
          permissions: {
              connect: permissionsToAdd.map(p => ({ id: p.id }))
          }
      }
  });

  console.log('Successfully created and attached missing permissions to the Maintenance Manager role!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
