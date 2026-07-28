import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await (prisma as any).user.findUnique({
        where: { email: 'nkdev26@gamail.com' }
    });
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
