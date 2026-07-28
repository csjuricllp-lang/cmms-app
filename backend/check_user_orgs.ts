import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userOrgs = await (prisma as any).userOrganization.findMany({
        include: {
            user: true,
            organization: true,
            role: true
        }
    });
    console.log(JSON.stringify(userOrgs, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
