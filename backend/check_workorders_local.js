const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking work orders for invalid date fields...");
    const workOrders = await prisma.workOrder.findMany({
        select: {
            id: true,
            title: true,
            dueDate: true,
            startDate: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
            resolutionTimeTarget: true
        }
    });

    console.log(`Found ${workOrders.length} work orders.`);

    let invalidCount = 0;
    for (const wo of workOrders) {
        const dateFields = ['dueDate', 'startDate', 'createdAt', 'updatedAt', 'completedAt', 'resolutionTimeTarget'];
        for (const field of dateFields) {
            const val = wo[field];
            if (val !== null && val !== undefined) {
                const d = new Date(val);
                if (isNaN(d.getTime())) {
                    console.log(`[INVALID DATE] WO id: ${wo.id}, title: "${wo.title}", field: "${field}", value: "${val}"`);
                    invalidCount++;
                }
            }
        }
    }

    if (invalidCount === 0) {
        console.log("All date fields are valid.");
    } else {
        console.log(`Found ${invalidCount} invalid date fields.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
