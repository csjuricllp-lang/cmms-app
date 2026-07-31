const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const part = await prisma.part.findFirst({
        where: { name: { contains: 'Deep Groove Ball' } },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });
    console.log(JSON.stringify(part, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
