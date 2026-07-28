import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assetCount = await prisma.asset.count();
    const locationCount = await prisma.location.count();
    const userCount = await prisma.user.count();
    const teamCount = await prisma.team.count();
    const workOrderCount = await prisma.workOrder.count();

    console.log(`Assets: ${assetCount}`);
    console.log(`Locations: ${locationCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Teams: ${teamCount}`);
    console.log(`Work Orders: ${workOrderCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
