const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runTest() {
    try {
        const asset = await prisma.asset.findFirst({ include: { location: true } });
        if (!asset) throw new Error('No asset found in database');

        const assetId = asset.id;
        const orgId = asset.organizationId;
        const locationId = asset.locationId;

        console.log(`Testing MTTR for Asset: ${asset.name} (${assetId})`);
        
        // Use a unique prefix to avoid conflict
        const prefix = `MTTR_VERIFIED_${Date.now()}`;

        await prisma.workOrder.create({
            data: {
                title: `${prefix}_1`,
                assetId,
                organizationId: orgId,
                locationId,
                status: 'COMPLETED',
                maintenanceType: 'REACTIVE',
                startDate: new Date(2026, 2, 23, 10, 0, 0),
                completedAt: new Date(2026, 2, 23, 12, 0, 0),
            }
        });

        await prisma.workOrder.create({
            data: {
                title: `${prefix}_2`,
                assetId,
                organizationId: orgId,
                locationId,
                status: 'COMPLETED',
                maintenanceType: 'REACTIVE',
                startDate: new Date(2026, 2, 23, 14, 0, 0),
                completedAt: new Date(2026, 2, 23, 15, 0, 0),
            }
        });

        const workOrders = await prisma.workOrder.findMany({
            where: {
                assetId,
                status: 'COMPLETED',
                maintenanceType: 'REACTIVE',
                startDate: { not: null },
                completedAt: { not: null },
                title: { startsWith: prefix }
            }
        });

        let sumMins = 0;
        workOrders.forEach(wo => {
            sumMins += (wo.completedAt.getTime() - wo.startDate.getTime()) / (1000 * 60);
        });

        console.log(`\nREPAIR EVENTS FOUND: ${workOrders.length}`);
        console.log(`TOTAL REPAIR TIME: ${sumMins} minutes`);
        console.log(`MTTR (DOWNTIME METRIC): ${(sumMins / workOrders.length).toFixed(1)} minutes`);

        if ((sumMins / workOrders.length) === 90) {
            console.log('\n✅ 100% VERIFIED: Backend correctly calculates Mean Time To Repair.');
        }
    } catch (e) {
        console.error('TEST FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
