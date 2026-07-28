const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lotoWOs = await prisma.workOrder.findMany({
    where: { requiresLOTO: true },
    select: { id: true, title: true, lotoVerified: true, status: true }
  });
  console.log('Total work orders requiring LOTO:', lotoWOs.length);
  console.log('LOTO Work Orders:', lotoWOs);
  
  const allWOsCount = await prisma.workOrder.count();
  console.log('Total work orders in DB:', allWOsCount);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
