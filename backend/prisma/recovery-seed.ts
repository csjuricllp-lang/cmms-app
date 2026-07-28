import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Running Recovery Seed with corrected types...');
    const orgId = '00000000-0000-0000-0000-000000000000';
    
    // 1. Ensure Location
    const location = await prisma.location.upsert({
        where: { id: 'default-loc' },
        update: {},
        create: {
            id: 'default-loc',
            name: 'Main Facility',
            organizationId: orgId,
            type: 'SITE'
        }
    });

    // 2. Create Assets
    const assets = [
        { name: 'Centrifugal Pump P-101', category: 'Pumps' },
        { name: 'HVAC Unit AC-05', category: 'HVAC' },
        { name: 'Conveyor Motor M-202', category: 'Motors' },
    ];

    const createdAssets: any[] = [];
    for (const a of assets) {
        const asset = await (prisma.asset as any).create({
            data: {
                name: a.name,
                category: a.category,
                locationId: location.id,
                organizationId: orgId,
                status: 'OPERATIONAL'
            }
        });
        createdAssets.push(asset);
        
        // Create a meter for each asset
        await (prisma.meter as any).create({
            data: {
                name: 'Run Hours',
                unit: 'HOURS',
                currentValue: 1250,
                assetId: asset.id
            }
        });
    }

    // 3. Create Sample PM Schedules
    await (prisma.pMSchedule as any).create({
        data: {
            name: 'Quarterly Pump Inspection',
            description: 'Check seals and vibration',
            frequencyType: 'MONTHS',
            frequencyValue: 3,
            assetId: createdAssets[0].id,
            organizationId: orgId,
            isActive: true,
            priority: 'HIGH',
            nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    console.log('Recovery finished. Assets and PMs restored.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
