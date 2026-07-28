const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  const users = await prisma.user.findMany({ select: { email: true, name: true } });
  console.log('--- ORGANIZATIONS ---');
  console.log(JSON.stringify(orgs, null, 2));
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
