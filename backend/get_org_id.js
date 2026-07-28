const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    if (org.name === 'Juric LLP') {
      console.log('YOUR NEW ORGANIZATION ID:', org.id);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
