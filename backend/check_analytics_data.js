const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log('--- Work Order Statistics (Last 30 Days) ---');

  const orgs = await prisma.organization.findMany();
  
  for (const org of orgs) {
    console.log(`\nOrganization: ${org.name} (${org.id})`);
    
    // Total WOs
    const total = await prisma.workOrder.count({ where: { organizationId: org.id } });
    console.log(`  Total WOs: ${total}`);

    // Completed WOs in last 30 days
    const completed = await prisma.workOrder.count({
      where: {
        organizationId: org.id,
        status: 'COMPLETED',
        completedAt: { gte: thirtyDaysAgo }
      }
    });
    console.log(`  Completed (30d): ${completed}`);

    // PM WOs in last 30 days
    const pms = await prisma.workOrder.count({
      where: {
        organizationId: org.id,
        maintenanceType: 'PREVENTIVE',
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    console.log(`  Preventive (30d): ${pms}`);

    // LOTO WOs in last 30 days
    const loto = await prisma.workOrder.count({
      where: {
        organizationId: org.id,
        requiresLOTO: true,
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    console.log(`  LOTO Required (30d): ${loto}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
