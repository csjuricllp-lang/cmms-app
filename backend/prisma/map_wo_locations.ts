import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';
    
    // Get the first few locations we just created
    const locations = await prisma.location.findMany({
        where: { organizationId: orgId }
    });

    if (locations.length === 0) return;

    // Get work orders
    const workOrders = await prisma.workOrder.findMany({
        where: { organizationId: orgId }
    });

    console.log(`Updating ${Math.min(workOrders.length, 5)} work orders with location mapping...`);

    for (let i = 0; i < Math.min(workOrders.length, 5); i++) {
        const loc = locations[i % locations.length];
        await prisma.workOrder.update({
            where: { id: workOrders[i].id },
            data: { locationId: loc.id }
        });
    }

    console.log('Work order mapping updated!');
}

main().finally(async () => await prisma.$disconnect());
