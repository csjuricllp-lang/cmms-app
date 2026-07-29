const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      organizations: {
        include: {
          role: true
        }
      }
    }
  });
  
  const owners = users.filter(u => u.organizations.some(o => o.role && o.role.name === 'OWNER'));
  console.log("OWNERS IN DATABASE:");
  owners.forEach(o => {
    console.log(`Name: ${o.name}`);
    console.log(`Email: ${o.email}`);
    console.log(`Active: ${o.isActive}`);
    console.log('---');
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
