import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgs = await prisma.organization.findMany({
        include: {
            members: {
                include: {
                    user: { select: { email: true, name: true } }
                }
            },
            _count: {
                select: { workOrders: true }
            }
        }
    });

    for (const org of orgs) {
        console.log(`\n===========================================`);
        console.log(`Org Name: ${org.name}`);
        console.log(`Org ID: ${org.id}`);
        console.log(`Total Work Orders: ${org._count.workOrders}`);
        console.log(`Members:`);
        for (const member of org.members) {
            console.log(`  - ${member.user.name} (${member.user.email})`);
        }
    }
}

main().finally(async () => await prisma.$disconnect());
