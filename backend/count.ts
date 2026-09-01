import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pmCount = await prisma.pMSchedule.count();
  const woCount = await prisma.workOrder.count();
  
  console.log('PMSchedule count:', pmCount);
  console.log('WorkOrder count:', woCount);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
