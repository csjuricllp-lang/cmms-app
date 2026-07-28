import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.findFirst();
    const userOrg = await prisma.userOrganization.findFirst({
        include: { user: true }
    });

    if (!org || !userOrg) {
        console.error('Missing organization or user association. Please run basic setup seeds first.');
        return;
    }

    const orgId = org.id;
    const userOrgId = userOrg.id;
    const userName = userOrg.user.name;
    const location = await prisma.location.findFirst();
    const locationId = location?.id;

    console.log(`Using Org: ${orgId}, User: ${userName}, Location: ${location?.name || 'None'}`);

    console.log('Clearing old sample analytics data...');
    // Only delete work orders for this user/org to avoid wiping real data if any
    await prisma.workOrder.deleteMany({
        where: {
            organizationId: orgId,
            title: { startsWith: '[Analytics Seed]' }
        }
    });

    const now = new Date();
    const months = [
        new Date(now.getFullYear(), now.getMonth(), 5),
        new Date(now.getFullYear(), now.getMonth() - 1, 10),
        new Date(now.getFullYear(), now.getMonth() - 2, 15),
    ];

    console.log('Seeding 10 diverse work orders for analytics visualizations...');

    const data = [
        // Monthly trend data
        { title: '[Analytics Seed] Annual HVAC Inspection', type: 'PREVENTIVE', priority: 'MEDIUM', status: 'COMPLETED', date: months[2] },
        { title: '[Analytics Seed] Emergency Pipe Repair', type: 'REACTIVE', priority: 'HIGH', status: 'COMPLETED', date: months[2] },
        { title: '[Analytics Seed] Belt Replacement - Line A', type: 'PREVENTIVE', priority: 'LOW', status: 'COMPLETED', date: months[1] },
        { title: '[Analytics Seed] Forklift Battery Service', type: 'PREVENTIVE', priority: 'MEDIUM', status: 'COMPLETED', date: months[1] },
        { title: '[Analytics Seed] Roof Leak Investigation', type: 'REACTIVE', priority: 'MEDIUM', status: 'COMPLETED', date: months[1] },
        { title: '[Analytics Seed] Conveyor Lube Service', type: 'PREVENTIVE', priority: 'LOW', status: 'COMPLETED', date: months[0] },
        
        // Backlog data (Open/In Progress)
        { title: '[Analytics Seed] PLC Warning Light Fix', type: 'REACTIVE', priority: 'HIGH', status: 'OPEN', date: now },
        { title: '[Analytics Seed] Monthly Safety Drill', type: 'PREVENTIVE', priority: 'MEDIUM', status: 'IN_PROGRESS', date: now },
        { title: '[Analytics Seed] Spare Parts Inventory Audit', type: 'PREVENTIVE', priority: 'LOW', status: 'OPEN', date: now },
        { title: '[Analytics Seed] Generator Load Test', type: 'PREVENTIVE', priority: 'MEDIUM', status: 'COMPLETED', date: now },
    ];

    for (const item of data) {
        const createdAt = item.date;
        const completedAt = item.status === 'COMPLETED' ? new Date(createdAt.getTime() + (Math.random() * 5 + 2) * 3600000) : null;

        await prisma.workOrder.create({
            data: {
                title: item.title,
                description: 'Generated data point for analytical visualization.',
                maintenanceType: item.type as any,
                priority: item.priority as any,
                status: item.status as any,
                organizationId: orgId,
                assignedToId: userOrgId,
                locationId: locationId,
                createdAt: createdAt,
                completedAt: completedAt,
                laborCost: Math.random() * 200 + 50,
                partsCost: Math.random() * 100 + 20,
                totalCost: 0, // Calculated field usually, but we'll leave it or set it
            }
        });
    }

    console.log('Successfully seeded 10 work orders for Analytics!');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
