import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';

    console.log('Adding manufacturing locations...');

    // 1. Main Plant
    const mainPlant = await prisma.location.create({
        data: {
            name: 'Detroit High-Value Plant',
            description: 'Main manufacturing facility for heavy machinery',
            address: '123 Factory Way, Detroit, MI',
            type: 'SITE',
            organizationId: orgId,
        }
    });

    // 1.1 Assembly Line A
    const assemblyLineA = await prisma.location.create({
        data: {
            name: 'Assembly Line A (Chassis)',
            description: 'Main chassis assembly and welding line',
            type: 'BUILDING',
            parentId: mainPlant.id,
            organizationId: orgId,
        }
    });

    await prisma.location.createMany({
        data: [
            {
                name: 'Welding Station 01',
                type: 'AREA',
                parentId: assemblyLineA.id,
                organizationId: orgId,
            },
            {
                name: 'Painting Booth 04',
                type: 'AREA',
                parentId: assemblyLineA.id,
                organizationId: orgId,
            },
        ]
    });

    // 1.2 Fabrication Shop
    const fabShop = await prisma.location.create({
        data: {
            name: 'Fabrication Shop',
            description: 'Metal cutting and bending department',
            type: 'BUILDING',
            parentId: mainPlant.id,
            organizationId: orgId,
        }
    });

    await prisma.location.createMany({
        data: [
            {
                name: 'CNC Milling Section',
                type: 'AREA',
                parentId: fabShop.id,
                organizationId: orgId,
            },
            {
                name: 'Laser Cutting Bay',
                type: 'AREA',
                parentId: fabShop.id,
                organizationId: orgId,
            },
        ]
    });

    // 1.3 Warehouse & Logistics
    const warehouse = await prisma.location.create({
        data: {
            name: 'Logistics Hub',
            description: 'Storage for raw materials and finished units',
            type: 'BUILDING',
            parentId: mainPlant.id,
            organizationId: orgId,
        }
    });

    await prisma.location.createMany({
        data: [
            {
                name: 'Cold Storage Room 01',
                type: 'ROOM',
                parentId: warehouse.id,
                organizationId: orgId,
            },
            {
                name: 'Finished Goods Bay',
                type: 'AREA',
                parentId: warehouse.id,
                organizationId: orgId,
            },
        ]
    });

    // 2. Secondary Research Facility
    const rndCenter = await prisma.location.create({
        data: {
            name: 'R&D Innovation Center',
            type: 'SITE',
            organizationId: orgId,
        }
    });

    await prisma.location.create({
        data: {
            name: 'Prototype Lab 3',
            type: 'ROOM',
            parentId: rndCenter.id,
            organizationId: orgId,
        }
    });

    console.log('Location seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
