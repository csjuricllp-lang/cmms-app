const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teams = await prisma.team.findMany();
    console.log('Teams:', teams.map(c => ({id: c.id, name: c.name})));
    
    const vendors = await prisma.vendor.findMany();
    console.log('Vendors:', vendors.map(c => ({id: c.id, name: c.name})));

    const users = await prisma.user.findMany();
    console.log('Users:', users.map(c => ({id: c.id, name: c.name})));
}

main().catch(console.error).finally(() => prisma.$disconnect());
