import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { email: 'nkdev26@gmail.com' },
    include: {
      organizations: {
        include: {
          role: {
            include: {
                permissions: true
            }
          }
        }
      }
    }
  });
  console.log("User Role:", adminUser?.organizations[0]?.role?.name);
  console.log("User Permissions:", adminUser?.organizations[0]?.role?.permissions?.map((p: any) => p.key));
}

main().catch(console.error).finally(() => prisma.$disconnect());
