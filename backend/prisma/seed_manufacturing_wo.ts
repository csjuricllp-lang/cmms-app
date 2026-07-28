import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';

    const locations = await prisma.location.findMany({
        where: { organizationId: orgId }
    });

    const fabShop = locations.find(l => l.name === 'Fabrication Shop');
    const weldingStation = locations.find(l => l.name === 'Welding Station 01');
    const assemblyLine = locations.find(l => l.name === 'Assembly Line A (Chassis)');

    console.log('Adding sample manufacturing work orders...');

    await prisma.workOrder.createMany({
        data: [
            {
                title: 'Repair Hydraulic Leak on Press #4',
                description: 'Minor oil leakage detected at the main cylinder seal.',
                status: 'OPEN',
                priority: 'HIGH',
                locationId: fabShop?.id,
                organizationId: orgId,
            },
            {
                title: 'Calibration of Welding Robot Alpha',
                description: 'Routine quarterly calibration for precision welding.',
                status: 'IN_PROGRESS',
                priority: 'MEDIUM',
                locationId: weldingStation?.id,
                organizationId: orgId,
            },
            {
                title: 'Emergency: Conveyor Motor Overheat',
                description: 'Motor temp reaching 95C. Immediate inspection needed.',
                status: 'OPEN',
                priority: 'CRITICAL',
                locationId: assemblyLine?.id,
                organizationId: orgId,
            },
            {
                title: 'Safety Inspection - CNC Sector',
                description: 'Check all emergency stop buttons and light curtains.',
                status: 'COMPLETED',
                priority: 'LOW',
                locationId: fabShop?.id,
                organizationId: orgId,
            }
        ]
    });

    console.log('Sample work orders added!');
}

main().finally(async () => await prisma.$disconnect());
