const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wo = await prisma.workOrder.findFirst({
    orderBy: { updatedAt: 'desc' },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } }
    }
  });
  console.log(JSON.stringify(wo, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
