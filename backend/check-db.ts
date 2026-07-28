import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        const users = await prisma.userOrganization.findMany({ include: { user: true } });
        const locations = await prisma.location.findMany();
        const assets = await prisma.asset.findMany();
        const categories = await prisma.category.findMany();
        const meters = await prisma.meter.findMany();

        console.log({
            usersCount: users.length,
            locationsCount: locations.length,
            assetsCount: assets.length,
            categoriesCount: categories.length,
            metersCount: meters.length,
            sampleUser: users[0]?.user?.name,
            sampleLocation: locations[0]?.name
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
