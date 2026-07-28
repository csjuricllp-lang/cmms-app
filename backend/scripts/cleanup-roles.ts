import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up duplicate roles...');
    // We'll just delete all roles to be safe and let the push/seed recreate them
    await prisma.role.deleteMany({});
    console.log('Roles deleted.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
