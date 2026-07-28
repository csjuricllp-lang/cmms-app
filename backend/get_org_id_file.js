const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    if (org.name === 'Juric LLP') {
      fs.writeFileSync('./org_id_output.txt', org.id);
      break;
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
