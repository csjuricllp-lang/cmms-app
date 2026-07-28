
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const userOrgs = await prisma.userOrganization.findMany({ 
    include: { 
      user: { select: { email: true, name: true } },
      organization: { select: { name: true } }
    } 
  });
  console.log('User Organizations:', JSON.stringify(userOrgs, null, 2));
}
main().finally(() => prisma.$disconnect());
