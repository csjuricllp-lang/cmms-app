const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dueDateStart = "2026-06-21T18:30:00.000Z";
  const dueDateEnd = "2026-06-21T18:30:00.000Z";
  
  const where = {};
  
  if (dueDateStart || dueDateEnd) {
    const condition = {};
    if (dueDateStart) condition.gte = new Date(dueDateStart);
    if (dueDateEnd) {
      const end = new Date(dueDateEnd);
      if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      condition.lte = end;
    }
    where.dueDate = condition;
  }
  
  console.log("Constructed where:", JSON.stringify(where, null, 2));
  
  const items = await prisma.workOrder.findMany({
    where,
    select: {
      id: true,
      title: true,
      dueDate: true,
    }
  });
  
  console.log(`Found ${items.length} items:`, items);
}

run().catch(console.error).finally(() => prisma.$disconnect());
