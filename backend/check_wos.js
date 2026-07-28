const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const woCount = await prisma.workOrder.count();
  console.log(`Total Work Orders in DB: ${woCount}`);

  const wosByOrg = await prisma.workOrder.groupBy({
    by: ['organizationId'],
    _count: true,
  });
  console.log('Work Orders by Organization:');
  console.log(JSON.stringify(wosByOrg, null, 2));

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });
  console.log('Organizations in DB:');
  console.log(JSON.stringify(orgs, null, 2));

  const users = await prisma.user.findMany({
    include: {
      organizations: {
        include: {
          organization: true
        }
      }
    }
  });
  console.log('Users and their Organizations:');
  users.forEach(u => {
    console.log(`User: ${u.email}`);
    u.organizations.forEach(uo => {
      console.log(`  Org: ${uo.organization.name} (ID: ${uo.organizationId})`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
