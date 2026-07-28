const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Work Orders Status & Assignee Inspect ---');
    const workOrders = await prisma.workOrder.findMany({
        select: {
            id: true,
            status: true,
            assignedTo: {
                select: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Total Work Orders in DB: ${workOrders.length}`);
    const statusCounts = {};
    const assigneeCounts = {};

    for (const wo of workOrders) {
        const status = wo.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        const assignee = wo.assignedTo?.user?.name || 'Unassigned';
        if (!assigneeCounts[assignee]) assigneeCounts[assignee] = {};
        assigneeCounts[assignee][status] = (assigneeCounts[assignee][status] || 0) + 1;
    }

    console.log('\nStatus Counts in DB:');
    console.log(JSON.stringify(statusCounts, null, 2));

    console.log('\nAssignee Status Counts:');
    console.log(JSON.stringify(assigneeCounts, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
